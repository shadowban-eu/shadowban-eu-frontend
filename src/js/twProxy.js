import TWPResponse from './twpResponse';

export default class TwitterProxy {
  static search(query) {
    const url = `/parsepage.php?q=${encodeURIComponent(query)}`;
    return fetch(url)
      .then(TwitterProxy.checkSuccess)
      .then(res => res.text().then((body) => {
        const twpResponse = new TWPResponse(res);
        twpResponse.bodyText = body;
        return twpResponse;
      }))
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
  static parseDOMString = (twpResponse) => {
    const parser = new DOMParser();
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
        err.json().then(jsonBody => console.error(jsonBody.error));
        break;
      default:
        console.warn('[TwitterProxy|search] Network error');
        console.error(err);
        break;
    }
  }
}
