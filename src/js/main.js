/*
** Simple Twitter Shadowban Checker - js
** 2016 @xho
*/
import UI from './ui';
import TSBv2 from './shadowban';
import TSBTest from './tsbtest';

document.addEventListener('DOMContentLoaded', () => {
  const ui = window.ui = new UI((screenName) => {
    const testCase = new TSBTest(screenName);
    TSBv2.searchFrom(testCase)
      .then((resultDOM) => {
        const tweetElements = Array.from(resultDOM.querySelectorAll('.stream-container .tweet'));
        testCase.tweets = TSBv2.filterHashTweets(tweetElements);
        ui.updateTask({
          id: 'getTweets',
          status: 'ok'
        }, `Found ${testCase.tweets.length} tweets with #tags. \\o/`);
      });
  });
  // M.AutoInit();
});
