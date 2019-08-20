import aiohttp
import argparse
import asyncio
import json
import re
import traceback
import urllib.parse
import sys
import time
from aiohttp import web
from bs4 import BeautifulSoup
from db import connect

routes = web.RouteTableDef()

def get_nested(obj, path, default=None):
    for p in path:
        if obj is None or not p in obj:
            return default
        obj = obj[p]
    return obj

account_sessions = []
account_index = 0
log_file = None
debug_file = None

class TwitterSession:
    _auth = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"
    _user_url = "https://api.twitter.com/graphql/SEn6Mq-OakvVOT1CJqUO2A/UserByScreenName?variables="
    def __init__(self):
        self._headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36"
        }
        # without token, shit be broken; or something
        self._guest_token = None
        self._csrf_token = None

        # aiohttp ClientSession
        self._session = None

        # rate limit monitoring
        self.limit = -1
        self.remaining = -1
        self.reset = -1
        self.overshot = -1

        # session user's @username
        # this stays `None` for guest sessions
        self.username = None

    def set_csrf_header(self):
        cookies = self._session.cookie_jar.filter_cookies('https://twitter.com/')
        for key, cookie in cookies.items():
            if cookie.key == 'ct0':
                self._headers['X-Csrf-Token'] = cookie.value

    async def login(self, username = None, password = None, email = None):
        self._session = aiohttp.ClientSession()

        if password is not None:
            async with self._session.get("https://twitter.com/login", headers=self._headers) as r:
                login_page = await r.text()
            form_data = {}
            soup = BeautifulSoup(login_page, 'html.parser')
            form_data["authenticity_token"] = soup.find('input', {'name': 'authenticity_token'}).get('value')
            form_data["session[username_or_email]"] = email
            form_data["session[password]"] = password
            form_data["remember_me"] = "1"
            async with self._session.post('https://twitter.com/sessions', data=form_data, headers=self._headers) as r:
                await r.text()
                if str(r.url) == "https://twitter.com/":
                    print("Login of %s successful" % username)
                else:
                    print("Error logging in %s" % username)
            self.set_csrf_header()
            self.username = username
        else:
            self._headers['Authorization'] = 'Bearer ' + self._auth
            async with self._session.post("https://api.twitter.com/1.1/guest/activate.json", headers=self._headers) as r:
                guest_token = await r.json()
            self._guest_token = guest_token["guest_token"]
            self._headers['X-Guest-Token'] = self._guest_token

        self._headers['Authorization'] = 'Bearer ' + self._auth

    async def search_raw(self, query, live=True):
        additional_query = ""
        if live:
            additional_query = "&tweet_search_mode=live"
        async with self._session.get("https://api.twitter.com/2/search/adaptive.json?include_profile_interstitial_type=1&include_blocking=1&include_blocked_by=1&include_followed_by=1&include_want_retweets=1&include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&skip_status=1&cards_platform=Web-12&include_cards=1&include_composer_source=true&include_ext_alt_text=true&include_reply_count=1&tweet_mode=extended&include_entities=true&include_user_entities=true&include_ext_media_color=true&include_ext_media_availability=true&send_error_codes=true&q="+urllib.parse.quote(query)+"&qf_abuse=false&count=20&query_source=typed_query&pc=1&spelling_corrections=0&ext=mediaStats%2ChighlightedLabel%2CcameraMoment" + additional_query, headers=self._headers) as r:
            return await r.json()

    async def typeahead_raw(self, query):
        async with self._session.get("https://api.twitter.com/1.1/search/typeahead.json?src=search_box&result_type=users&q=" + urllib.parse.quote(query), headers=self._headers) as r:
            return await r.json()

    async def profile_raw(self, username):
        obj = json.dumps({"screen_name": username, "withHighlightedLabel": True})
        async with self._session.get(self._user_url + urllib.parse.quote(obj), headers=self._headers) as r:
            return await r.json()

    async def get_profile_tweets_raw(self, user_id):
        async with self._session.get("https://api.twitter.com/2/timeline/profile/" + str(user_id) +".json?include_tweet_replies=1&include_want_retweets=0&include_reply_count=1&count=1000", headers=self._headers) as r:
            return await r.json()

    async def test_detached_tweets():
        pass

    async def tweet_raw(self, tweet_id, count=20, cursor=None, retry_csrf=True):
        if cursor is None:
            cursor = ""
        else:
            cursor = "&cursor=" + urllib.parse.quote(cursor)
        async with self._session.get("https://api.twitter.com/2/timeline/conversation/" + tweet_id + ".json?include_reply_count=1&send_error_codes=true&count="+str(count)+ cursor, headers=self._headers) as r:
            result = await r.json()
            # debug('Tweet request ' + tweet_id + ':\n' + str(r) + '\n\n' + json.dumps(result) + '\n\n\n')
            self.set_csrf_header()
            if self.screen_name is not None:
                self.monitor_rate_limit(r.headers)
            if retry_csrf and isinstance(result.get("errors", None), list) and len([x for x in result["errors"] if x.get("code", None) == 353]):
                return await self.tweet_raw(tweet_id, count, cursor, False)
            return result

    def monitor_rate_limit(self, headers):
        # store last remaining count for reset detection
        last_remaining = self.remaining

        self.limit = int(headers.get('x-rate-limit-limit', -1))
        self.remaining = int(headers.get('x-rate-limit-remaining', -1))
        self.reset = int(headers.get('x-rate-limit-reset', -1))

        # rate limit reset
        if last_remaining < self.remaining and self.overshot > 0:
            log('[rate-limit] Reset detected for ' + self.screen_name + '. Saving overshoot count...')
            db.write_rate_limit({ 'screen_name': self.screen_name, 'overshot': self.overshot })
            self.overshot = 0

        # count the requests that failed because of rate limiting
        if self.remaining is 0:
            log('[rate-limit] Limit hit by ' + self.screen_name + '.')
            self.overshot += 1

    @classmethod
    def flatten_timeline(cls, timeline_items):
        result = []
        for item in timeline_items:
            if get_nested(item, ["content", "item", "content", "tweet", "id"]) is not None:
                result.append(item["content"]["item"]["content"]["tweet"]["id"])
            elif get_nested(item, ["content", "timelineModule", "items"]) is not None:
                timeline_items = item["content"]["timelineModule"]["items"]
                titems = [get_nested(x, ["item", "content", "tweet", "id"]) for x in timeline_items]
                result += [x for x in titems if x is not None]
        return result

    @classmethod
    def get_ordered_tweet_ids(cls, obj, filtered=True):
        try:
            entries = [x for x in obj["timeline"]["instructions"] if "addEntries" in x][0]["addEntries"]["entries"]
        except (IndexError, KeyError):
            return []
        entries.sort(key=lambda x: -int(x["sortIndex"]))
        flat = cls.flatten_timeline(entries)
        return [x for x in flat if not filtered or x in obj["globalObjects"]["tweets"]]

    async def test_ghost_ban(self, user_id):
        try:
            tweets_replies = await self.get_profile_tweets_raw(user_id)
            tweet_ids = self.get_ordered_tweet_ids(tweets_replies)
            replied_ids = []
            for tid in tweet_ids:
                if tweets_replies["globalObjects"]["tweets"][tid]["reply_count"] > 0 and tweets_replies["globalObjects"]["tweets"][tid]["user_id_str"] == user_id:
                    replied_ids.append(tid)

            for tid in replied_ids:
                tweet = await self.tweet_raw(tid)
                for reply_id, reply_obj in tweet["globalObjects"]["tweets"].items():
                    if reply_id == tid or reply_obj.get("in_reply_to_status_id_str", None) != tid:
                        continue
                    reply_tweet = await self.tweet_raw(reply_id)
                    if reply_id not in reply_tweet["globalObjects"]["tweets"]:
                        continue
                    obj = {"tweet": tid, "reply": reply_id}
                    if tid in reply_tweet["globalObjects"]["tweets"]:
                        obj["ban"] = False
                    else:
                        obj["ban"] = True
                    return obj
        except:
            print(traceback.format_exc())

    async def test_barrier(self, user_id):
        try:
            tweets_replies = await self.get_profile_tweets_raw(user_id)
            tweet_ids = self.get_ordered_tweet_ids(tweets_replies)

            filtered_ids = []

            for tid in tweet_ids:
                if "in_reply_to_status_id_str" not in tweets_replies["globalObjects"]["tweets"][tid] or tweets_replies["globalObjects"]["tweets"][tid]["user_id_str"] != user_id:
                    continue
                tweet = tweets_replies["globalObjects"]["tweets"][tid]
                conversation_tweet = get_nested(tweets_replies, ["globalObjects", "tweets", tweet["conversation_id_str"]])
                if conversation_tweet is not None and conversation_tweet.get("user_id_str") == user_id:
                    continue
                filtered_ids.append(tid)

            # debug('Filtered ids for user ' + user_id + ': ' +  str(filtered_ids) + '\n\n\n')

            for tid in filtered_ids:
                replied_to_id = tweets_replies["globalObjects"]["tweets"][tid].get("in_reply_to_status_id_str", None)
                if replied_to_id is None:
                    continue
                replied_tweet_obj = await self.tweet_raw(replied_to_id, 50)
                if "globalObjects" not in replied_tweet_obj:
                    continue
                if replied_to_id not in replied_tweet_obj["globalObjects"]["tweets"]:
                    continue
                replied_tweet = replied_tweet_obj["globalObjects"]["tweets"][replied_to_id]
                if not replied_tweet["conversation_id_str"] in replied_tweet_obj["globalObjects"]["tweets"]:
                    continue
                conversation_tweet = replied_tweet_obj["globalObjects"]["tweets"][replied_tweet["conversation_id_str"]]
                if conversation_tweet["user_id_str"] == user_id:
                    continue
                if replied_tweet["reply_count"] > 500:
                    continue

                debug('Tban: ')
                debug('Found:' + tid + '\n')
                debug('In reply to:' + replied_to_id + '\n')

                global account_sessions
                global account_index
                reference_session = account_sessions[account_index % len(account_sessions)]
                account_index += 1

                before_barrier = await reference_session.tweet_raw(replied_to_id, 1000)
                if get_nested(before_barrier, ["globalObjects", "tweets"]) is None:
                    debug('notweets\n')
                    return

                if tid in self.get_ordered_tweet_ids(before_barrier):
                    return {"ban": False, "tweet": tid, "in_reply_to": replied_to_id}

                cursors = ["ShowMoreThreads", "ShowMoreThreadsPrompt"]
                last_result = before_barrier

                for stage in range(0, 2):
                    entries = [x for x in last_result["timeline"]["instructions"] if "addEntries" in x][0]["addEntries"]["entries"]

                    try:
                        cursor = [x["content"]["operation"]["cursor"]["value"] for x in entries if get_nested(x, ["content", "operation", "cursor", "cursorType"]) == cursors[stage]][0]
                    except (KeyError, IndexError):
                        continue

                    after_barrier = await reference_session.tweet_raw(replied_to_id, 1000, cursor=cursor)

                    if get_nested(after_barrier, ["globalObjects", "tweets"]) is None:
                        debug('retinloop\n')
                        return
                    ids_after_barrier = self.get_ordered_tweet_ids(after_barrier)
                    if tid in self.get_ordered_tweet_ids(after_barrier):
                        return {"ban": True, "tweet": tid, "stage": stage, "in_reply_to": replied_to_id}
                    last_result = after_barrier

                # happens when replied_to_id tweet has been deleted
                debug('outer loop return\n')
                return
        except:
            debug('Unexpected Exception in test_barrier:\n')
            debug(traceback.format_exc())

    async def test(self, username, more_replies_test=True):
        await self.login()
        result = {"timestamp": time.time()}
        profile = {}
        profile_raw = await self.profile_raw(username)

        try:
            user_id = str(profile_raw["data"]["user"]["rest_id"])
        except KeyError:
            user_id = None

        try:
            profile["screen_name"] = profile_raw["data"]["user"]["legacy"]["screen_name"]
        except KeyError:
            profile["screen_name"] = username
        try:
            profile["restriction"] = profile_raw["data"]["user"]["legacy"]["profile_interstitial_type"]
        except KeyError:
            pass
        if profile.get("restriction", None) == "":
            del profile["restriction"]
        try:
            profile["protected"] = profile_raw["data"]["user"]["legacy"]["protected"]
        except KeyError:
            pass
        try:
            profile["exists"] = len([1 for error in profile_raw["errors"] if error["code"] == 50]) == 0
        except KeyError:
            profile["exists"] = True
        try:
            profile["suspended"] = len([1 for error in profile_raw["errors"] if error["code"] == 63]) > 0
        except KeyError:
            pass
        try:
            profile["has_tweets"] = int(profile_raw["data"]["user"]["legacy"]["statuses_count"]) > 0
        except KeyError:
            profile["has_tweets"] = False

        result["profile"] = profile

        if not profile["exists"] or profile.get("suspended", False) or profile.get("protected", False) or not profile.get('has_tweets'):
            return result

        result["tests"] = {}

        search_raw = await self.search_raw("from:@" + username)

        result["tests"]["search"] = False
        try:
            tweets = search_raw["globalObjects"]["tweets"]
            for tweet_id, tweet in sorted(tweets.items(), key=lambda t: t[1]["id"], reverse=True):
                result["tests"]["search"] = str(tweet_id)
                break

        except (KeyError, IndexError):
            pass

        typeahead_raw = await self.typeahead_raw("@" + username)
        result["tests"]["typeahead"] = False
        try:
            result["tests"]["typeahead"] = len([1 for user in typeahead_raw["users"] if user["screen_name"].lower() == username.lower()]) > 0
        except KeyError:
            pass

        if "search" in result["tests"] and result["tests"]["search"] == False:
            result["tests"]["ghost"] = await self.test_ghost_ban(user_id)
        else:
            result["tests"]["ghost"] = {"ban": False}

        if more_replies_test and not get_nested(result, ["tests", "ghost", "ban"], False):
            result["tests"]["more_replies"] = await self.test_barrier(user_id)

        debug('Writing result for ' + result['profile']['screen_name'] + ' to DB');
        global db
        db.write_result(result)
        return result


    async def close(self):
        await self._session.close()

def debug(message):
    global debug_file
    if message.endswith('\n') is False:
        message = message + '\n'

    if debug_file is not None:
        debug_file.write(message)
        debug_file.flush()
    else:
        print(message)

def log(message):
    global log_file
    # ensure newline
    if message.endswith('\n') is False:
         message = message + '\n'

    if log_file is not None:
        log_file.write(message)
        log_file.flush()
    else:
        print(message)

@routes.get('/{screen_name}')
async def hello(request):
    screen_name = request.match_info['screen_name']
    if screen_name == '.stats':
        text = "Limit Remaining Reset"
        for session in account_sessions:
            text += "\n%5d %9d %5d" % (session.limit, session.remaining, session.reset - int(time.time()))
        return web.Response(text=text)
    session = TwitterSession()
    result = await session.test(screen_name)
    log(json.dumps(result) + '\n')
    await session.close()
    return web.json_response(result)

async def login_accounts(accounts):
    coroutines = []
    for acc in accounts:
        session = TwitterSession()
        coroutines.append(session.login(*acc))
        account_sessions.append(session)
    await asyncio.gather(*coroutines)


parser = argparse.ArgumentParser(description='Twitter Shadowban Tester')
parser.add_argument('--account-file', type=str, default='.htaccounts', help='json file with reference account credentials')
parser.add_argument('--log', type=str, default=None, help='log file where test results are written to')
parser.add_argument('--debug', type=str, default=None, help='debug log file')
parser.add_argument('--port', type=int, default=8080, help='port which to listen on')
parser.add_argument('--mongo-host', type=str, default='localhost', help='hostname or IP of mongoDB service to connect to')
parser.add_argument('--mongo-port', type=int, default=27017, help='port of mongoDB service to connect to')
parser.add_argument('--mongo-db', type=str, default='tester', help='name of mongo database to use')
parser.add_argument('--mongo-collection', type=str, default='results', help='name of collection to save test results to')
args = parser.parse_args()

db = connect(host=args.mongo_host, port=args.mongo_port)

with open(args.account_file, "r") as f:
    accounts = json.loads(f.read())

if args.log is not None:
    print("Logging test results to %s", args.log)
    log_file = open(args.log, "a")

if args.debug is not None:
    print("Logging debug output to %s", args.debug)
    debug_file = open(args.debug, "a")


loop = asyncio.get_event_loop()
loop.run_until_complete(login_accounts(accounts))
app = web.Application()
app.add_routes(routes)
web.run_app(app, host='127.0.0.1', port=args.port)
