import TwitterText from 'twitter-text';

export default class TSBTest {
  constructor(screenName, qf = true) {
    this.screenName = screenName;
    this.qf = qf;
    this.tweetElements = null;
    this.tweets = [];
    this.results = {
      hasTweets: null,
      isQualityFiltered: null
    };
  }

  findTweetElements(twpResponse) {
    // reset tweets
    this.tweets = [];
    this.tweetElements = null;

    // HHF response?
    const tweetSelector = twpResponse.isHandheldFriendly ?
      '#main_content .timeline .tweet' :
      '.stream-container .tweet';

    //
    this.tweetElements = Array.from(twpResponse.dom.querySelectorAll(tweetSelector));
    return this;
  }

  filterHashTweets(twpResponse) {
    const _buildObject = (element) => {
      const tweet = [
        'tweetId', 'isReplyTo', 'userId',
      ].reduce((acc, key) => ({
        ...acc,
        [key]: element.dataset[key]
      }), {});
      const content = element.querySelector('.content .js-tweet-text-container').innerText;
      tweet.tags = TwitterText.extractHashtags(content);
      tweet.timestamp = parseInt(element.querySelector('.tweet-timestamp [data-time-ms]').dataset.timeMs, 10);
      return tweet;
    };

    const _buildObjectHHF = (element) => {
      const tweet = {};
      const contentElement = element.querySelector('.tweet-container .tweet-content');
      const textElement = contentElement.querySelector('.tweet-text');
      tweet.tweetId = textElement.dataset.id;
      tweet.tags = TwitterText.extractHashtags(contentElement.innerText);
      return tweet;
    };

    this.tweets = this.tweetElements
      .map(element => (
        twpResponse.isHandheldFriendly ? _buildObjectHHF(element) : _buildObject(element)
      ))
      .filter(tweet => (tweet !== null) && tweet.tags.length > 0);
  }
}
