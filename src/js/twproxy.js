export class TWPResponse {
  constructor(fetchResponse) {
    this._fetchResponse = fetchResponse;
    this.bodyText = '';
    this.dom = null;
    this.isHandheldFriendly = false;
  }
}

export default class TwitterProxy {
  static search(query, qf) {
    const url = `/parsepage.php?q=${encodeURIComponent(query)}${qf ? '' : '&noqf=1'}`;
    return fetch(url)
      .then(TwitterProxy.checkSuccess)
      .then(res => res.text().then((body) => {
        const twpResponse = new TWPResponse(res);
        twpResponse.bodyText = body;
        return twpResponse;
      }))
      .then(TwitterProxy.parseDOMString)
      .then(TwitterProxy.checkHandheldFriendly)
      .catch(TwitterProxy.handleError);
  }
  static checkSuccess(res) {
    // res.ok === (res.status in the range 200-299)
    if (!res.ok) {
      throw res; // throwing response object to make it available to catch()
    }
    return res;
  }
  static checkHandheldFriendly(twpRes) {
    /* eslint-disable no-param-reassign */
    twpRes.isHandheldFriendly = twpRes.dom.getElementsByName('HandheldFriendly').length > 0;
    return twpRes;
  }
  static parseDOMString = (twpRes) => {
    const parser = new DOMParser();
    twpRes.dom = parser.parseFromString(twpRes.bodyText, 'text/html');
    return twpRes;
    /* eslint-enable no-param-reassign */
  }
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
