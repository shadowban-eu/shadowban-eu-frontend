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
  static testQF(testCase) {
    return (twpResponse) => {
      if (twpResponse.isHandheldFriendly) {
        console.warn('HHF response for QF test');
      } else {
        const testTweet = testCase.tweets[0];
        const hashTag = testTweet.tags[0];
        const date = new Date(testTweet.timestamp);
        const since = date.toISOString().replace(/T.*/, '');
        date.setDate(date.getDate() + 1);
        const until = date.toISOString().replace(/T.*/, '');
        return TwitterProxy.search(`#${hashTag} since:${since} until:${until}`);
      }
    };
  }
}
