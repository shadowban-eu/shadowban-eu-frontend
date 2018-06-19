/*
** Twitter QFD Shadowban Checker
** 2018 @Netzdenunziant (research), @raphaelbeerlin (implementation)
*/

import UI from './ui';
import TwitterProxy from './twProxy';

const findUserTweet = async (query, name, qf, ua = 0) => {
  const testResponse = await TwitterProxy.search(query, qf, ua);
  const tweets = Array.from(testResponse.dom.querySelectorAll('.tweet'));
  const usersTweets = tweets.filter(el =>
    el.dataset.screenName.toLowerCase() === name.toLowerCase()
  );
  return usersTweets.length > 0;
}

// Test with multiple user agents
const multiTest = async (query, qf, success, prefUA = 0) => {
  const prefResponse = await TwitterProxy.search(query, qf, prefUA);
  const prefResult = success(prefResponse);
  if(prefResult) {
    return [prefUA, prefResult];
  }
  for(let ua = 0; ua < 5; ua++) {
    if(ua == prefUA) {
      continue;
    }
    const response = await TwitterProxy.search(query, qf, ua);
    const result = success(response);
	if(result) {
      return [ua, result];
    }
  }
  return [-1, false];
}

const searchTimeline = async (user, success, pages = 10) => {
  let lastTweet;
  for(let i = 0; i < pages; i++) {
    const response = await TwitterProxy.timelinePage(user, lastTweet);
    lastTweet = response.pos;
    const result = await success(response);
    if(result) {
      return result;
    }
    if(!response.more) {
      return false;
    }
  }
  return false;
}

// Tests quality filter (v2) shadowban
const qfBanTest = async (screenName, prefUA = 0) => {
  const linkTest = r => r.dom.querySelector(
    '.tweet-text a[href^="https://t.co/"],.tweet-text a[href^="http://t.co/"]'
  );
  const linkQuery = `from:${screenName} filter:links`;
  const [linkUA, linkAnchor] = await multiTest(linkQuery, true, linkTest, prefUA);
  if (!linkAnchor) {
    window.ui.updateTask({
      id: ['checkRefTweet', 'getRefTweet'],
      status: 'ban',
      msg: `The QFD test needs least one tweet containing a link or an image.<br/>` +
        `Such a tweet <a href="https://twitter.com/search?q={encodeURIComponent(linkQuery)}">could not be found</a> for ${screenName}.`
    });
    return;
  }
  const linkRefId = linkAnchor.closest('.tweet').dataset.tweetId;

  window.ui.updateTask({
    id: 'getRefTweet',
    status: 'ok',
    msg: `Getting <a href="https://twitter.com/${screenName}/status/${linkRefId}">reference tweet</a>... OK!`
  }, {
    id: 'checkRefTweet',
    status: 'running',
    msg: `Trying to find <a href="https://twitter.com/${screenName}/status/${linkRefId}">reference tweet</a>...`
  });

  const linkFoundNoQf = await findUserTweet(linkAnchor.href, screenName, false, linkUA);
  if(linkFoundNoQf) {
    const linkFoundQf = await findUserTweet(linkAnchor.href, screenName, true, linkUA);
    if(!linkFoundQf) {
      // tweet not fount - shadowban

      window.ui.updateTask({
        id: 'checkRefTweet',
        status: 'ban',
        msg: `<a href="https://twitter.com/${screenName}/status/${linkRefId}">Reference tweet</a> found <a href="https://twitter.com/search?f=tweets&vertical=default&q=${encodeURIComponent(linkAnchor.href)}&qf=off">without</a> ` +
          `but not found <a href="https://twitter.com/search?f=tweets&vertical=default&q=${encodeURIComponent(linkAnchor.href)}&qf=on">with</a> quality filter.<br />@${screenName} has a QFD shadowban!`
      });
      return;
    }
    // tweet found - no shadowban
    window.ui.updateTask({
      id: 'checkRefTweet',
      status: 'ok',
        msg: `<a href="https://twitter.com/${screenName}/status/${linkRefId}">Reference tweet</a> found without ` +
          `as well as with quality filter.<br />@${screenName} is not shadowbanned!`
    });
	return;
  }
  
  const imageTest = r => r.dom.querySelector('.tweet-text a.u-hidden');
  const [imageUA, imageAnchor] = await multiTest(`from:${screenName} filter:images`, true, imageTest, linkUA);
  if(!imageAnchor) {
    window.ui.updateTask({
      id: 'checkRefTweet',
      status: 'warn',
      msg: `Link and image tests failed.<br />@${screenName} could not be tested for QFD.`
    });
	return;
  }

  const imageRefId = imageAnchor.closest('.tweet').dataset.tweetId;
  const imageFoundNoQf = await findUserTweet(imageAnchor.innerText, screenName, false, imageUA);
  if(imageFoundNoQf) {
    const imageFoundQf = await findUserTweet(imageAnchor.innerText, screenName, true, imageUA);
    if(!imageFoundQf) {
      // tweet not fount - shadowban

      window.ui.updateTask({
        id: 'checkRefTweet',
        status: 'ban',
        msg: `<a href="https://twitter.com/${screenName}/status/${imageRefId}">Reference tweet</a> found <a href="https://twitter.com/search?f=tweets&vertical=default&q=${encodeURIComponent(imageAnchor.href)}&qf=off">without</a> ` +
          `but not found <a href="https://twitter.com/search?f=tweets&vertical=default&q=${encodeURIComponent(imageAnchor.href)}&qf=on">with</a> quality filter.<br />@${screenName} has a QFD shadowban!`
      });
      return;
    }
    // tweet found - no shadowban
    window.ui.updateTask({
      id: 'checkRefTweet',
      status: 'ok',
        msg: `<a href="https://twitter.com/${screenName}/status/${imageRefId}">Reference tweet</a> found <a href="https://twitter.com/search?f=tweets&vertical=default&q=${encodeURIComponent(imageAnchor.href)}&qf=off">without</a> ` +
          `as well as with quality filter.<br />@${screenName} is not shadowbanned!`
    });
	return;
  }

  window.ui.updateTask({
    id: 'checkRefTweet',
    status: 'warn',
    msg: `QFD tests failed.<br />@${screenName} could not be tested for QFD.`
  });
};

// Tests conventional (v1) shadowban
const searchBanTest = async (screenName) => {
  const tweetTest = r => r.dom.querySelector('.tweet');
  const [userUA, tweet] = await multiTest(`from:${screenName}`, false, tweetTest);
  return [userUA, !tweet];
};

const bannedInThread = async (screenName, id) => {
  const response = await TwitterProxy.status(id);
  const tweets = response.dom.querySelectorAll(
    '.permalink-inner .tweet:not([data-tweet-id="' + id + '"])');
  if(tweets.length == 0) {
    return [-1, null];
  }
  const replyId = tweets[0].dataset.tweetId;
  const replyResponse = await TwitterProxy.status(replyId);
  return [!replyResponse.dom.querySelector('.permalink-inner .tweet[data-tweet-id="' + id + '"]'),
    replyId];
}

const conventionalBanTest = async (screenName) => {
  const findRepliedTweet = async r => {
    const tweets = r.dom.querySelectorAll('.tweet');
    for(let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      const count = tweet.querySelector('.ProfileTweet-actionCountForPresentation');
      if(count && parseInt(count.textContent.trim()) > 0) {
        const tweetId = tweet.dataset.tweetId;
        const [banned, replyId] = await bannedInThread(screenName, tweetId);
        if(banned === -1) {
          continue;
        }
        return [banned, tweetId, replyId];
      }
    }
    return false;
  };
  const response = await searchTimeline(screenName, findRepliedTweet);
  if(response === false) {
    return [-1, null, null];
  }
  return [response[0] | 0, response[1], response[2]];
}

document.addEventListener('DOMContentLoaded', () => {
  window.ui = new UI(async (screenName) => {
    window.ui.updateTask({
      id: 'checkUser',
      status: 'running',
      msg: `Looking up @${screenName}`
    });

    // Check whether user exists at all
    const userResponse = await TwitterProxy.user(screenName);
    if (!userResponse.dom.querySelector(".ProfileHeaderCard")) {
      // user not found
      return window.ui.updateTask({
        id: ['checkUser', 'checkSearch', 'checkConventional', 'getRefTweet', 'checkRefTweet'],
        status: 'ban',
        msg: `User <a href="https://twitter.com/${screenName}">@${screenName}</a> does not exist.`
      });
    }

    const tweet = userResponse.dom.querySelector('.tweet');
    // user found, but has no tweets
    if (!tweet) {
      return window.ui.updateTask({
        id: ['checkSearch', 'checkConventional', 'getRefTweet', 'checkRefTweet'],
        status: 'ban',
        msg: `<a href="https://twitter.com/${screenName}">@${screenName}</a> hasn't made any tweets!<br />This test needs at least one tweet.`
      });
    }

    // user found and has tweets
    window.ui.updateTask({
      id: 'checkUser',
      status: 'ok',
      msg: `Found <a href="https://twitter.com/${screenName}">@${screenName}</a>.`
    }, {
      id: 'checkSearch',
      status: 'running',
      msg: 'Testing search ban...'
    });

    // Check whether user is v1 banned; no need to test v2, if so
    const [userUA, isSearchBanned] = await searchBanTest(screenName);
    if (isSearchBanned) {
      window.ui.updateTask({
        id: ['checkSearch', 'getRefTweet', 'checkRefTweet'],
        status: 'ban',
        msg: `${screenName} has a 
          <a href="https://twitter.com/search/?f=tweets&vertical=default&q=` +
          `${encodeURIComponent('from:' + screenName)}">search ban</a>!`
      }, {
        id: 'checkConventional',
        status: 'running',
        msg: 'Testing conventional shadowban...'
      });

      const [isConventionalBanned, convTweet, convReply] = await conventionalBanTest(screenName);
      if(isConventionalBanned == 0) {
        window.ui.updateTask({
          id: 'checkConventional',
          status: 'ok',
          msg: `${screenName} doesn't have a conventional shadowban.`
        });
      } else if(isConventionalBanned == 1) {
        window.ui.updateTask({
          id: 'checkConventional',
          status: 'ban',
          msg: `${screenName} has a conventional shadowban! Have a look at ` +
            `<a href="https://twitter.com/${screenName}/status/${convReply}">this tweet</a> ` +
            `within <a href="https://twitter.com/${screenName}/status/${convTweet}">this thread</a>.`
        });
      } else {
        window.ui.updateTask({
          id: 'checkConventional',
          status: 'warn',
          msg: `${screenName} couldn't be tested for a conventional shadowban.`
        });
      }
      return;
    }

    window.ui.updateTask({
      id: 'checkSearch',
      status: 'ok',
      msg: `${screenName} doesn't have a search ban.`
    }, {
      id: 'getRefTweet',
      status: 'running',
      msg: 'Getting reference tweet for quality filter shadowban...'
    }, {
      id: 'checkConventional',
      status: 'ok',
      msg: `${screenName} doesn't have a conventional shadowban.`
    });

    // Check v2 shadowban; UI updates inside (POLA violation, I know :P)
    return qfBanTest(screenName, userUA);
  });
});
