/* eslint-disable no-console */
/*
** Simple Twitter Shadowban Checker - v2
** 2018 @Netzdenunziant (research, algorithm)
*/
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
    return TwitterProxy.search(`from:${testCase.screenName} filter:hashtags`, testCase.qf);
  }

  static async testQF(testCase, twpResponse) {
    if (twpResponse.isHandheldFriendly) {
      console.warn('HHF response for QF test');
    } else {
      const qfCase = testCase;
      // query data
      const hashTag = qfCase.testTweet.tags[0];
      const date = new Date(qfCase.testTweet.timestamp);
      const since = date.toISOString().replace(/T.*/, '');
      date.setDate(date.getDate() + 1);
      const until = date.toISOString().replace(/T.*/, '');

      const query = `#${hashTag} since:${since} until:${until}`;

      // request #tag search results (1st page)
      const searchResponse = await TwitterProxy.search(query);
      qfCase.findTweetElements(searchResponse);
      qfCase.filterHashTweets(searchResponse);

      // searchFrom (html/text) responses carry the max_position in DOM
      let maxPosition = searchResponse.dom
        .querySelector('#timeline .stream-container[data-max-position]')
        .dataset.maxPosition;

      let found = qfCase.test();
      // loop until tweet is found
      while (!found) {
        // request data
        const pageResponse = await TwitterProxy.iSearch(query, maxPosition, qfCase.qf);

        // update tweets
        qfCase.findTweetElements(searchResponse);
        qfCase.filterHashTweets(searchResponse);

        // tweet found; happy \o/
        if (qfCase.test()) {
          qfCase.results.isQualityFiltered = false;
          return qfCase;
        }

        // not found;
        if (pageResponse.json.has_more_items === false) {
          // no more tweets in this search timeline
          qfCase.results.isQualityFiltered = true;
          return qfCase;
        }
        // continue with next page
        maxPosition = pageResponse.json.min_position;
      }
      // tweet found on first page; süper 'appy! \o\ \o/ \o\ /o/
      qfCase.results.isQualityFiltered = false;
      return qfCase;
    }
  }
}
