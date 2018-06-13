export default class TWPResponse {
  constructor(fetchResponse) {
    // original fetch() response
    this._fetchResponse = fetchResponse;
    // body String from ._fetchResponse.text()
    this.bodyText = '';
    // DOM Object, parsed from .bodyText
    this.dom = null;
  }
}
