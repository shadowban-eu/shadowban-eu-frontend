/*
** Simple Twitter Shadowban Checker - js
** 2016 @xho
*/
import UI from './ui';
import TSBv2 from './tsbv2';
import TSBTest from './tsbtest';

document.addEventListener('DOMContentLoaded', () => {
  const ui = window.ui = new UI((screenName) => {
    const testCase = new TSBTest(screenName);
    TSBv2.searchFrom(testCase)
      .then((fromSearchResponse) => {
        if (testCase.findTweetElements(fromSearchResponse).results.hasTweets === false) {
          return ui.updateTask({
            id: 'getTweets',
            status: 'ban',
            msg: `${testCase.screenName} has a conventional shadow ban`
          }, {
            id: 'checkQF',
            status: 'ban',
            msg: 'N/A, due to conventional shadow ban'
          });
        }
        testCase.results.hasTweets = testCase.tweetElements.length > 0;
        testCase.filterHashTweets(fromSearchResponse);

        const qfTestTweet = testCase.tweets[0];
        ui.updateTask({
          id: 'getTweets',
          status: 'ok',
          msg: `Found ${testCase.tweets.length} tweets with #tags. \\o/`
        }, {
          id: 'checkQF',
          status: 'running',
          msg: `Testing visibility for #${qfTestTweet.tags[0]}`
        });
        return testCase;
      })
      .then(TSBv2.testQF(testCase))
      .then((tagSearchResponse) => {
        console.dir(tagSearchResponse);
      });
  });
  // M.AutoInit();
});
