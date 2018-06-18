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

// Tests quality filter (v2) shadowban
const qfBanTest = async (screenName, prefUA = 0) => {
  const linkTest = r => r.dom.querySelector(
    '.tweet-text a[href^="https://t.co/"],.tweet-text a[href^="http://t.co/"]'
  );
  const [linkUA, linkAnchor] = await multiTest(`from:${screenName} filter:links`, true, linkTest, prefUA);
  if (!linkAnchor) {
    window.ui.updateTask({
      id: 'getRefTweet',
      status: 'ban',
      msg: `@${screenName} has not tweeted any links or images!`
    }, {
      id: 'checkRefTweet',
      status: 'ban',
      msg: 'The QFD test needs least one tweet containing a link or an image.'
    });
    return;
  }

  window.ui.updateTask({
    id: 'getRefTweet',
    status: 'ok',
    msg: 'Getting reference tweet... OK!'
  }, {
    id: 'checkRefTweet',
    status: 'running',
    msg: 'Trying to find reference tweet...'
  });

  const linkFoundNoQf = await findUserTweet(linkAnchor.href, screenName, false, linkUA);
  if(linkFoundNoQf) {
    const linkFoundQf = await findUserTweet(linkAnchor.href, screenName, true, linkUA);
    if(!linkFoundQf) {
      // tweet not fount - shadowban

      window.ui.updateTask({
        id: 'checkRefTweet',
        status: 'ban',
        msg: `Reference tweet not found.<br />@${screenName} has a QFD shadowban!`
      });
      return;
    }
    // tweet found - no shadowban
    window.ui.updateTask({
      id: 'checkRefTweet',
      status: 'ok',
      msg: `Reference tweet found.<br />@${screenName} is not shadowbanned.`
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

  const imageFoundNoQf = await findUserTweet(imageAnchor.innerText, screenName, false, imageUA);
  if(imageFoundNoQf) {
    const imageFoundQf = await findUserTweet(imageAnchor.innerText, screenName, true, imageUA);
    if(!imageFoundQf) {
      // tweet not fount - shadowban

      window.ui.updateTask({
        id: 'checkRefTweet',
        status: 'ban',
        msg: `Reference tweet not found.<br />@${screenName} has a QFD shadowban!`
      });
      return;
    }
    // tweet found - no shadowban
    window.ui.updateTask({
      id: 'checkRefTweet',
      status: 'ok',
      msg: `Reference tweet found.<br />@${screenName} is not shadowbanned.`
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
const conventionalBanTest = async (screenName) => {
  const tweetTest = r => r.dom.querySelector('.tweet');
  const [userUA, tweet] = await multiTest(`from:${screenName}`, false, tweetTest);
  return [userUA, !tweet];
};

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
        id: 'checkUser',
        status: 'ban',
        msg: `User @${screenName} does not exist.`
      }, {
        id: 'checkConventional',
        status: 'ban',
        msg: `User @${screenName} does not exist.`
      }, {
        id: 'getRefTweet',
        status: 'ban',
        msg: `User @${screenName} does not exist.`
      }, {
        id: 'checkRefTweet',
        status: 'ban',
        msg: `User @${screenName} does not exist.`
      });
    }

    const tweet = userResponse.dom.querySelector('.tweet');
    // user found, but has no tweets
    if (!tweet) {
      return window.ui.updateTask({
        id: 'checkUser',
        status: 'ok',
        msg: `Found @${screenName}.`
      }, {
        id: 'checkConventional',
        status: 'ban',
        msg: `@${screenName} hasn't made any tweets!<br />This test needs at least one tweet.`
      }, {
        id: 'getRefTweet',
        status: 'ban',
        msg: `@${screenName} has not tweeted any links or images!<br />The QFD test requires the user to have tweeted at least one link or image.`
      }, {
        id: 'checkRefTweet',
        status: 'ban',
        msg: 'The QFD test needs at least one link or image tweet.'
      });
    }

    // user found and has tweets
    window.ui.updateTask({
      id: 'checkUser',
      status: 'ok',
      msg: `Found @${screenName}.`
    }, {
      id: 'checkConventional',
      status: 'running',
      msg: 'Testing conventional shadowban...'
    });

    // Check whether user is v1 banned; no need to test v2, if so
    const [userUA, isConvBanned] = await conventionalBanTest(screenName);
    if (isConvBanned) {
      return window.ui.updateTask({
        id: 'checkConventional',
        status: 'ban',
        msg: `${screenName} has a conventional shadowban!`
      }, {
        id: 'getRefTweet',
        status: 'ban',
        msg: `${screenName} has a conventional shadowban!`
      }, {
        id: 'checkRefTweet',
        status: 'ban',
        msg: `${screenName} has a conventional shadowban!`
      });
    }

    window.ui.updateTask({
      id: 'checkConventional',
      status: 'ok',
      msg: `${screenName} doesn't have a conventional shadowban.`
    }, {
      id: 'getRefTweet',
      status: 'running',
      msg: 'Getting reference tweet for quality filter shadowban...'
    });

    // Check v2 shadowban; UI updates inside (POLA violation, I know :P)
    return qfBanTest(screenName, userUA);
  });
});
