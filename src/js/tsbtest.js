export default class TSBTest {
  constructor(screenName, qf = true) {
    this.screenName = screenName;
    this.qf = qf;
    this.tweets = [];
    this.results = {
      hasTweets: null,
      isQualityFiltered: null
    };
  }
}
