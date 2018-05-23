import TwitterText from 'twitter-text';

export default class TSBTest {
  constructor(screenName, qf = true) {
    this.screenName = screenName;
    this.qf = qf;
    this.tweets = [];
    this.results = {
      hasTweets: null,
      isQualityFiltered: null
    };
    this.res = null;
  }

  findTweetElements() {
    const tweetSelector = this.res.isHandheldFriendly ?
      '#ma2in_content .timeline .tweet' :
      '.stream-container .tweet';

    this.tweetElements = Array.from(this.res.dom.querySelectorAll(tweetSelector));
    return this;
  }

  filterHashTweets() {
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
      const content = element.querySelector('.tweet-container .tweet-content').innerText;
      tweet.tags = TwitterText.extractHashtags(content);
      return tweet;
    };

    this.tweets = this.tweetElements
      .map(element => (
        this.res.isHandheldFriendly ? _buildObjectHHF(element) : _buildObject(element)
      ))
      .filter(tweet => (tweet !== null) && tweet.tags.length > 0);
  }
}
