/*
** Twitter Shadowban Checker
** 2018 @Netzdenunziant (research), @raphaelbeerlin (implementation)
*/

import UI from './ui';
import TwitterProxy from './twProxy';

const qfBanTest = async (screenName) => {
  const forImagesResponse = await TwitterProxy.search(`from:${screenName} filter:images`);
  const imageAnchor = forImagesResponse.dom.querySelector('.tweet-text a.u-hidden');
  if (!imageAnchor) {
    window.ui.updateTask({
      id: 'getRefTweet',
      status: 'ban',
      msg: `@${screenName} has not tweeted any images!\nThis test requires the user to have tweeted at least one image; sorry.`
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
      msg: `Reference tweet not found.\n@${screenName} IS SHADOWBANNED!`
    });
    return;
  }
  // tweet found - no shadowban
  window.ui.updateTask({
    id: 'checkRefTweet',
    status: 'ok',
    msg: `Reference tweet found.\n@${screenName} is not shadowbanned.`
  });
};

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
    const isUser = await TwitterProxy.user(screenName);
    if (!isUser) {
      return window.ui.updateTask({
        id: 'checkUser',
        status: 'ban',
        msg: `User @${screenName} does not exist.`
      });
    }
    window.ui.updateTask({
      id: 'checkUser',
      status: 'ok',
      msg: `Found @${screenName}.`
    }, {
      id: 'checkConventional',
      status: 'running',
      msg: 'Testing conventional shadowban...'
    });

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
    return qfBanTest(screenName);
  });
});
