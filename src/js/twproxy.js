export default class TwitterProxy {
  static search(query, qf) {
    const url = encodeURI(`/parsepage.php?q=${encodeURIComponent(query)}${qf ? '' : '&noqf=1'}`);
    return fetch(url)
      .then(TwitterProxy.checkSuccess)
      .then(res => res.text())
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
  static parseDOMString = (body) => {
    const parser = new DOMParser();
    const dom = parser.parseFromString(body, 'text/html');
    return dom;
  }
}
