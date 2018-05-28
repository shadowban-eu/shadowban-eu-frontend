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

  static iSearch(query, maxPosition, qf) {
    const url = `/iSearch.php?q=${encodeURIComponent(query)}&max_position=${maxPosition}${qf ? '' : '&noqf=1'}`;
    return fetch(url)
      .then(TwitterProxy.checkSuccess)
      .then(res => res.json().then((body) => {
        const twpResponse = new TWPResponse(res);
        twpResponse.bodyText = body.items_html;
        twpResponse.json = body;
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
  static checkHandheldFriendly(twpResponse) {
    /* eslint-disable no-param-reassign */
    twpResponse.isHandheldFriendly = twpResponse.dom.getElementsByName('HandheldFriendly').length > 0;
    return twpResponse;
  }
  static parseDOMString = (twpResponse) => {
    const parser = new DOMParser();
    twpResponse.dom = parser.parseFromString(twpResponse.bodyText, 'text/html');
    return twpResponse;
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
