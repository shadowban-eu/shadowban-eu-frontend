export default class TWPResponse {
  constructor(fetchResponse) {
    this._fetchResponse = fetchResponse;
    this.bodyText = '';
    this.dom = null;
  }
}
