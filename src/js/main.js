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
        return fromSearchResponse;
      })
      .then((fromSearchResponse) => {
        const qfTestCase = new TSBTest(screenName);
        qfTestCase.testTweet = testCase.tweets[0];
        qfTestCase.qf = true;
        TSBv2.testQF(qfTestCase, fromSearchResponse)
          .then((testCase) => {
            console.log(testCase);
            switch (testCase.results.isQualityFiltered) {
              case true:
                // QF banned
                ui.updateTask({
                  id: 'checkQF',
                  status: 'ban',
                  msg: 'Tweet not found. Account has a QualityFilter ban. :/'
                });
                break;
              case false:
                // no QF ban
                ui.updateTask({
                  id: 'checkQF',
                  status: 'ok',
                  msg: 'Tweet found. No QualityFilter ban. \\o/'
                });
                break;
              default:
                // not determined;
            }
          });
      });
  });
  // M.AutoInit();
});
