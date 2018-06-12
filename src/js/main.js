/*
** Twitter Shadowban Checker
** 2018 @Netzdenunziant (research), @raphaelbeerlin (implementation)
*/

import UI from './ui';
import TwitterProxy from './twProxy';

document.addEventListener('DOMContentLoaded', () => {
  const ui = window.ui = new UI(async (screenName) => {
    const forImagesResponse = await TwitterProxy.search(`from:${screenName} filter:images`);
    const imageAnchor = forImagesResponse.dom.querySelector('.tweet-text a.u-hidden');
    if (!imageAnchor) {
      ui.updateTask({
        id: 'getRefTweet',
        status: 'ban',
        msg: `@${screenName} has not tweeted any images!\nTo be able to test the v2 shadowban, a user has to have tweeted at least one image; sorry.`
      });
      return;
    }

    ui.updateTask({
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

      ui.updateTask({
        id: 'checkRefTweet',
        status: 'ban',
        msg: `Reference tweet not found.\n@${screenName} IS SHADOWBANNED!`
      });
      return;
    }
    // tweet found - no shadowban
    ui.updateTask({
      id: 'checkRefTweet',
      status: 'ok',
      msg: `Reference tweet found.\n@${screenName} is not shadowbanned.`
    });
  });
});
