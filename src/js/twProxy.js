import TWPResponse from './twpResponse';

export default class TwitterProxy {
  static search(query, qf = true) {
    const url = `/search.php?q=${encodeURIComponent(query)}${qf ? '' : '&noqf=1'}`;
    return fetch(url)
      .then(TwitterProxy.checkSuccess)
      .then(TwitterProxy.parseDOMString)
      .catch(TwitterProxy.handleError);
  }

  static user(screenName) {
    const url = `/search.php?screenName=${screenName}`;
    return fetch(url)
      .then(TwitterProxy.checkSuccess)
      .then(TwitterProxy.parseDOMString)
      .catch(TwitterProxy.handleError);
  }

  static checkSuccess(res) {
    // res.ok === (res.status in the range 200-299)
    if (!res.ok) {
      throw res; // throwing response object to make it available to catch()
    }
    return res;
  }

  /* eslint-disable no-param-reassign */
  static parseDOMString = async (res) => {
    const body = await res.text();
    const parser = new DOMParser();
    const twpResponse = new TWPResponse(res);
    twpResponse.bodyText = body;
    twpResponse.dom = parser.parseFromString(twpResponse.bodyText, 'text/html');
    return twpResponse;
  }
  /* eslint-enable no-param-reassign */

  /* eslint-disable no-console */
  static handleError(err) {
    switch (err.status) {
      case 404:
        console.warn(`[TwitterProxy|search] ${err.statusText}`);
        // ui.resetOrSo()...
        break;
      case 500:
        console.warn(`[TwitterProxy|search] ${err.statusText}`);
        break;
      default:
        console.warn('[TwitterProxy|search] Network error');
        break;
    }
    window.ui.unhandledError();
    throw err;
  }
}
