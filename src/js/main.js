/*
** Twitter QFD Shadowban Checker
** 2018 @Netzdenunziant (research), @raphaelbeerlin (implementation)
*/

import UI from './ui';
import TwitterProxy from './twProxy';

// Tests quality filter (v2) shadowban
const qfBanTest = async (screenName) => {
  const forImagesResponse = await TwitterProxy.search(`from:${screenName} filter:images`);
  const imageAnchor = forImagesResponse.dom.querySelector('.tweet-text a.u-hidden');
  if (!imageAnchor) {
    window.ui.updateTask({
      id: 'getRefTweet',
      status: 'ban',
      msg: `@${screenName} has not tweeted any images!`
    }, {
      id: 'checkRefTweet',
      status: 'ban',
      msg: 'The QFD test needs least one image tweet.'
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

  const testResponse = await TwitterProxy.search(imageAnchor.innerText);
  const tweets = Array.from(testResponse.dom.querySelectorAll('.tweet'));
  const usersTweets = tweets.filter(el =>
    el.dataset.screenName.toLowerCase() === screenName.toLowerCase()
  );
  if (!usersTweets.length) {
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
};

// Tests conventional (v1) shadowban
const conventionalBanTest = async (screenName) => {
  const fromResponse = await TwitterProxy.search(`from:${screenName}`);
  return fromResponse.dom.querySelector('.tweet') === null;
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
    if (!userResponse.bodyText) {
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
        msg: `@${screenName} has not tweeted any images!<br />The QFD test requires the user to have tweeted at least one image.`
      }, {
        id: 'checkRefTweet',
        status: 'ban',
        msg: 'The QFD test needs at least one image tweet.'
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
    const isConvBanned = await conventionalBanTest(screenName);
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
    return qfBanTest(screenName);
  });
});
