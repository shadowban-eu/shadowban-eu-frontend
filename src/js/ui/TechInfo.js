export default class TechInfo {
  static isMobile = !!(("ontouchstart" in window) || window.navigator && window.navigator.msPointerEnabled && window.MSGesture || window.DocumentTouch && document instanceof DocumentTouch);
  static makeSearchLink(query, qf, text) {
    const href = `https://${TechInfo.isMobile ? 'mobile.' : ''}twitter.com/search?f=${TechInfo.isMobile ? 'live' : 'tweets'}&src=typd&vertical=default&lang=en&q=${encodeURIComponent(query)}&qf=${qf ? 'on' : 'off'}`;
    return `<a href="${href}">${text || query}</a>`;
  }

  static updateSearch(results) {
    document.querySelector('#searchFAQ').classList.remove('hide');
    const contentElement = document.querySelector('#searchFAQ .techContent');
    const searchLink = TechInfo.makeSearchLink(`from:@${results.canonicalName}`);
    contentElement.innerHTML = `We ${results.hasSearchBan ? 'did not find' : 'found'} a tweet by searching for ${searchLink}.`;
  }

  static updateThread(results) {
    document.querySelector('#threadFAQ').classList.remove('hide');
    const contentElement = document.querySelector('#threadFAQ .techContent');
    if (results.thread.isBanned === undefined || !results.thread.tweet || !results.thread.reply) {
      return;
    }
    contentElement.innerHTML = `We found <a href="https://twitter.com/${results.canonicalName}/status/${results.thread.tweet}">a tweet
    with at least one reply</a> on the user's profile. A <a href="https://twitter.com/_/status/${results.thread.reply}">reply tweet</a>
    is ${results.thread.isBanned ? '' : 'not '}detached.`;
  }

  static updateQFD(results) {
    document.querySelector('#qfdFAQ .techInfo').classList.remove('hide');
    const contentElement = document.querySelector('#qfdFAQ .techContent');
    if (results.QFD.isBanned !== undefined) {
      const searchForLink = TechInfo.makeSearchLink(`from:@${results.canonicalName} filter:${results.QFD.method}s`);
      const qfOffLink = TechInfo.makeSearchLink(results.QFD.query, false, 'turned off');
      const qfOnLink = TechInfo.makeSearchLink(results.QFD.query, true, 'turned on');
      contentElement.innerHTML = `We found <a href="https://twitter.com/${results.canonicalName}/status/${results.QFD.tweetId}">this
        reference tweet</a> by searching for ${searchForLink} and
        extracted the shortlink <a href="${results.QFD.query}">${results.QFD.query}</a> from this tweet. We found this
        tweet with the quality filter ${qfOffLink} ${results.QFD.isBanned ? 'but we did not find' : 'and we found'}
        it with the quality filter ${qfOnLink}.`;
        if (results.QFD.login) {
          contentElement.innerHTML += ` We did not find the reference tweet without being logged into Twitter.`;
        }
    }
  }

  static reset() {
    document.querySelectorAll('#searchFAQ, #threadFAQ, #qfdFAQ .techInfo')
      .forEach(element => element.classList.add('hide'));
  }
}

window.TechInfo = TechInfo;
