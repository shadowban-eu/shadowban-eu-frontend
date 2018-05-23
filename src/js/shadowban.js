/*
** Simple Twitter Shadowban Checker - v2
** 2018 @Netzdenunziant (research, algorithm)
*/
import TwitterText from 'twitter-text';
import TwitterProxy from './twproxy';

// target tweet by its ID
/*
https://twitter.com/i/search/timeline?
  f=tweets&
  vertical=default&
  q=%23{TAG}%20since%3A{TAG_TWEETS_YYYY-MM-DD}%20until%3A{TAG_TWEETS_YYYY-MM-DD+1}&
  src=typd&
  qf={QF_ON_OFF}&
  include_available_features=1&
  include_entities=1&
  max_position={qSelector('#timeline .stream-container[>>data-max-position<<]')}&
  reset_error_state=false
*/

export default class TSBv2 {
  static searchFrom(testCase) {
    return TwitterProxy.search(`from:${testCase.screenName}`, testCase.qf);
  }
  static filterHashTweets(tweetElements) {
    return tweetElements.map((element) => {
      try {
        const tweet = [
          'tweetId', 'isReplyTo', 'userId',
        ].reduce((acc, key) => ({
          ...acc,
          [key]: element.dataset[key]
        }), {});
        const content = element.querySelector('.content .js-tweet-text-container').innerText;
        tweet.tags = TwitterText.extractHashtags(content);
        tweet.timestamp = element.querySelector('.tweet-timestamp [data-time-ms]').dataset.timeMs;
        return tweet;
      } catch (err) {
        return null;
      }
    }).filter(tweet => (tweet !== null) && tweet.tags.length > 0);
  }
  static testQF(testCase) {
    return TwitterProxy.search(`#${testCase.tweets[0].tags[0]}`)
      .then((body) => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(body, 'text/html');
        return dom;
      });
  }
}
