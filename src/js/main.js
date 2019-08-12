/*
** Twitter QFD Shadowban Checker
** 2018 @Netzdenunziant (research), @raphaelbeerlin (implementation)
*/

import UI from './ui';
import TechInfo from './ui/TechInfo.js';
import TwitterProxy from './twProxy';

const enableDummyAccount = true;
const userAgentCount = 7; // Number of user agents defined in search.php

const tweetSearchSel = '.tweet.js-stream-tweet';

// Test with multiple user agents
const multiTest = async (query, qf, success, prefUA = 0) => {
  const prefResponse = await TwitterProxy.search(query, qf, prefUA);
  const prefResult = success(prefResponse);
  if (prefResult) {
    return [prefUA, prefResult];
  }
  for (let ua = 0; ua < userAgentCount; ua += 1) {
    if (ua === prefUA) {
      continue;
    }
    const response = await TwitterProxy.search(query, qf, ua);
    const result = success(response);
    if (result) {
      return [ua, result];
    }
  }
  return [0, false];
};

const searchTimeline = async (user, success, pages = 10) => {
  let lastTweet;
  for (let i = 0; i < pages; i += 1) {
    const response = await TwitterProxy.timelinePage(user, lastTweet);
    lastTweet = response.pos;
    const result = await success(response);
    if (result) {
      return result;
    }
    if (!response.more) {
      return false;
    }
  }
  return false;
};

// Tests conventional (v1) shadowban
const searchBanTest = async (screenName) => {
  const tweetTest = r => r.dom.querySelector(`${tweetSearchSel}[data-screen-name="${screenName}"]`);
  const [userUA, tweet] = await multiTest(`from:@${screenName}`, false, tweetTest);
  return [userUA, !tweet];
};

const bannedInThread = async (screenName, id) => {
  const response = await TwitterProxy.status(id, screenName);
  const tweets = Array.from(response.dom.querySelectorAll('.permalink-inner .tweet'));
  const tweetIds = tweets.map(t => [t.dataset.tweetId, t.dataset.screenName]);
  for (let i = 0; i < tweetIds.length; i += 1) {
    if (tweetIds[i][0] === id) {
      if (i >= tweetIds.length - 1) {
        break;
      }
      const replyId = tweetIds[i + 1][0];
      const replyResponse = await TwitterProxy.status(replyId, tweetIds[i + 1][1]);
      return [
        replyResponse.dom.querySelector(`.permalink-inner .tweet[data-tweet-id="${id}"]`) ? 0 : 1,
        replyId
      ];
    }
  }
  return [-1, null];
};

const conventionalBanTest = async (screenName) => {
  const findRepliedTweet = async (r) => {
    const tweets = r.dom.querySelectorAll(`.tweet[data-screen-name="${screenName}"]`);
    for (let i = 0; i < tweets.length; i += 1) {
      const tweet = tweets[i];
      const count = tweet.querySelector('.ProfileTweet-actionCountForPresentation');
      if (count && parseInt(count.textContent.trim(), 10) > 0) {
        const tweetId = tweet.dataset.tweetId;
        const [banned, replyId] = await bannedInThread(screenName, tweetId);
        if (banned === -1) {
          continue;
        }
        return [banned, tweetId, replyId];
      }
    }
    return false;
  };
  const response = await searchTimeline(screenName, findRepliedTweet);
  if (response === false) {
    return [-1, null, null];
  }
  return [response[0] || 0, response[1], response[2]];
};

const suggestionTest = async (screenName) => {
  const response = await TwitterProxy.suggestions(screenName);
  const users = response.json.users.filter(x => x.screen_name.toLowerCase() == screenName.toLowerCase());
  return users.length > 0;
};

const fullTest = async (screenName) => {
	const allTasks = ['checkUser', 'checkSearch', 'checkConventional', 'checkSuggest'];
	let userLink = `<a href="https://twitter.com/${screenName}">@${screenName}</a>`;
	window.ui.updateTask({
		id: 'checkUser',
		status: 'running',
		msg: `Testing @${screenName}`
	});
	const response = await fetch('/.api/' + screenName);
	if(!response.ok) {
		window.ui.updateTask({
			id: 'checkUser',
			status: 'warn',
			msg: `Server error. Please try again later.`
		});
		return;
	}
	const result = await response.json();
	screenName = result.profile.screen_name;
	userLink = `<a href="https://twitter.com/${screenName}">@${screenName}</a>`;
	let failReason = null;
	if(!result.profile.exists) {
		failReason = "does not exist";
	} else if(result.profile.protected) {
		failReason = "is protected";
	} else if(result.profile.suspended) {
		failReason = "has been suspended";
	}
	if(failReason) {
		window.ui.updateTask({
			id: 'checkUser',
			status: 'warn',
			msg: `${userLink} ${failReason}.`
		});
		return;
	}
	window.ui.updateTask({
		id: 'checkUser',
		status: 'ok',
		msg: `${userLink} exists.`
	});
	
	let typeaheadResult = ['warn', `Search suggestion ban test failed.`];
	if(result.tests.typeahead === true) {
		typeaheadResult = ['ok', `No search suggestion ban.`];
	}
	if(result.tests.typeahead === false) {
		typeaheadResult = ['ban', `Search suggestion ban.`];
	}
	window.ui.updateTask({
		id: 'checkSuggest',
		status: typeaheadResult[0],
		msg: typeaheadResult[1]
	});
	
	
	let searchResult = ['warn', `Search ban test failed.`];
	if(result.tests.search) {
		searchResult = ['ok', `No search ban.`];
	}
	if(result.tests.search === false) {
		searchResult = ['ban', `Search ban.`];
	}
	window.ui.updateTask({
		id: 'checkSearch',
		status: searchResult[0],
		msg: searchResult[1]
	});
	TechInfo.updateSearch(result);
	
	if(!result.tests.ghost) {
		var threadResult = ['warn', `Thread ban test failed.`];
	}
	else if(result.tests.ghost.ban == false) {
		threadResult = ['ok', `No thread ban.`];
	}
	else if(result.tests.ghost.ban === true) {
		threadResult = ['ban', `Thread ban.`];
	}
	window.ui.updateTask({
		id: 'checkConventional',
		status: threadResult[0],
		msg: threadResult[1]
	});
	TechInfo.updateThread(result);

	if(!result.tests.more_replies) {
		var barrierResult = ['warn', `Reply deboosting test failed.`];
	}
	else if(result.tests.more_replies.ban == false) {
		barrierResult = ['ok', `No reply deboosting detected.`];
	}
	else if(result.tests.more_replies.ban === true) {
		let offensive = '';
		if(result.tests.more_replies.stage > 0) {
			offensive = ' Tweets are rated as potentially offensive.';
		}
		barrierResult = ['ban', `Reply deboosting detected.`+offensive];
	}
	window.ui.updateTask({
		id: 'checkBarrier',
		status: barrierResult[0],
		msg: barrierResult[1]
	});
	TechInfo.updateBarrier(result);
};
/*
  // Check whether user exists at all
  const userResponse = await TwitterProxy.user(screenName);
  const nameEl = userResponse.dom.querySelector('.ProfileHeaderCard .username .u-linkComplex-target');
  const canonicalLink = userResponse.dom.querySelector('link[rel="canonical"]');
  const suspended = canonicalLink && canonicalLink.href == 'https://twitter.com/account/suspended';
  result.exists = !!nameEl;
  if (!nameEl) {
    // user not found
    window.ui.updateTask({
      id: ['checkUser', 'checkSearch', 'checkConventional', 'checkSuggest'],
      status: 'ban',
      msg: `<a href="https://twitter.com/${screenName}">@${screenName}</a> ${suspended ? "has been suspended" : "does not exist"}.`
    });
    return result;
  }
  screenName = nameEl.textContent; // Ensure correct case
  if (userResponse.dom.querySelector('.ProfileHeaderCard .Icon--protected')) {
    window.ui.updateTask({
      id: ['checkUser', 'checkSearch', 'checkConventional', 'checkSuggest'],
      status: 'ban',
      msg: `<a href="https://twitter.com/${screenName}">@${screenName}</a>'s tweets are protected. We cannot test protected accounts.`
    });
    return result;
  }

  const tweet = userResponse.dom.querySelector(tweetSearchSel);
  result.hasTweets = !!tweet;
  result.canonicalName = screenName;
  window.ui.updateTask({
    id: 'checkUser',
    status: 'ok',
    msg: `Found <a href="https://twitter.com/${screenName}">@${screenName}</a>.`
  });

  // user found, but has no tweets
  if (!tweet) {
    window.ui.updateTask({
      id: ['checkSearch', 'checkConventional', 'checkSuggest'],
      status: 'ban',
      msg: `<a href="https://twitter.com/${screenName}">@${screenName}</a> hasn't made any tweets!<br />This test needs at least one tweet.`
    });
    return result;
  }

  // user found and has tweets
  window.ui.updateTask({
    id: 'checkSuggest',
    status: 'running',
    msg: 'Testing search suggestion ban...'
  });
  
  const foundSuggestion = await suggestionTest(screenName);
  
  if(foundSuggestion) {
    window.ui.updateTask({
      id: 'checkSuggest',
      status: 'ok',
      msg: 'No Search Suggestion Ban'
    });
  } else {
    window.ui.updateTask({
      id: 'checkSuggest',
      status: 'ban',
      msg: 'Search Suggestion Ban!'
    });
  }

  window.ui.updateTask({
    id: 'checkSearch',
    status: 'running',
    msg: 'Testing search ban...'
  });

  // Check whether user is v1 banned; no need to test v2, if so
  const [userUA, isSearchBanned] = await searchBanTest(screenName);
  result.hasSearchBan = isSearchBanned;
  TechInfo.updateSearch(result);
  if (isSearchBanned) {
    window.ui.updateTask({
      id: ['checkSearch'],
      status: 'ban',
      msg: 'Search Ban!'
    }, {
      id: 'checkConventional',
      status: 'running',
      msg: 'Testing Thread Ban...'
    });

    const [isConventionalBanned, convTweet, convReply] = await conventionalBanTest(screenName);
    result.thread = {};
    if (isConventionalBanned === 0) {
      window.ui.updateTask({
        id: 'checkConventional',
        status: 'ok',
        msg: 'No Thread Ban.'
      });
      result.thread.isBanned = false;
      result.thread.tweet = convTweet;
      result.thread.reply = convReply;
    } else if (isConventionalBanned === 1) {
      window.ui.updateTask({
        id: 'checkConventional',
        status: 'ban',
        msg: 'Thread Ban!'
      });
      result.thread.isBanned = true;
      result.thread.tweet = convTweet;
      result.thread.reply = convReply;
    } else {
      window.ui.updateTask({
        id: 'checkConventional',
        status: 'warn',
        msg: `${screenName} couldn't be tested for a thread shadowban.`
      });
    }
    TechInfo.updateThread(result);
    return result;
  }

  result.thread = {
    isBanned: false
  };
  window.ui.updateTask({
    id: 'checkSearch',
    status: 'ok',
    msg: 'No Search Ban'
  }, {
    id: 'checkConventional',
    status: 'ok',
    msg: 'No Thread Ban'
  });
  
  return result;
};*/

document.addEventListener('DOMContentLoaded', () => {
  window.ui = new UI(fullTest);
  window.fullTest = fullTest;
  // init test by /?screenName
  window.ui.initFromLocation(window.location);
});
