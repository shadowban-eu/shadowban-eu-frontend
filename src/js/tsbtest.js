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
    if (this.res.isHandheldFriendly) {
      // ...
    } else {
      this.tweetElements = Array.from(this.res.dom.querySelectorAll('.stream-container .tweet'));
    }
    return this;
  }

  filterHashTweets() {
    this.tweets = this.tweetElements.map((element) => {
      try {
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
      } catch (err) {
        return null;
      }
    }).filter(tweet => (tweet !== null) && tweet.tags.length > 0);
  }
}
