export default class TechInfo {
  static isMobile = !!(('ontouchstart' in window) || (window.navigator && window.navigator.msPointerEnabled && window.MSGesture) || (window.DocumentTouch && document instanceof DocumentTouch));
  static makeSearchLink(query, qf, text) {
    const href = `https://${TechInfo.isMobile ? 'mobile.' : ''}twitter.com/search?f=${TechInfo.isMobile ? 'live' : 'tweets'}&src=typd&vertical=default&lang=en&q=${encodeURIComponent(query)}&qf=${qf ? 'on' : 'off'}`;
    return `<a href="${href}">${text || query}</a>`;
  }

  static updateSearch(results) {
    if (!results.tests.search && results.tests.search !== false) {
      return;
    }
    document.querySelector('#searchFAQ').classList.remove('hide');
    const contentElement = document.querySelector('#searchFAQ .techContent');
    const searchLink = TechInfo.makeSearchLink(`from:@${results.profile.screen_name}`);
    contentElement.innerHTML = `We ${results.tests.search === false ? 'did not find a tweet' : `found <a href="https://twitter.com/i/status/${results.tests.search}">a tweet</a>`} by searching for ${searchLink}.`;
  }

  static updateBarrier(results) {
    if (!results.tests.more_replies) {
      return;
    }
    document.querySelector('#barrierFAQ').classList.remove('hide');
    const contentElement = document.querySelector('#barrierFAQ .techContent');
    let explanation;
    if (!results.tests.more_replies.ban) {
      explanation = 'The tweet was not hidden.';
    } else {
      explanation = 'We had to click "Show more replies" to view it';
      if (results.tests.more_replies.stage === 1) {
        explanation += ' and we had to click a second time because the account is rated as potentially offensive';
      }
      explanation += '.';
    }
    contentElement.innerHTML = `We found <a href="https://twitter.com/i/status/${results.tests.more_replies.in_reply_to}">a tweet</a> which the user <a href="https://twitter.com/i/status/${results.tests.more_replies.tweet}">replied to</a>. ${explanation}`;
  }

  static updateThread(results) {
    if (!results.tests.ghost) {
      return;
    }
    document.querySelector('#threadFAQ').classList.remove('hide');
    const contentElement = document.querySelector('#threadFAQ .techContent');
    if (results.tests.search) {
      contentElement.innerHTML = 'A ghost ban implies a search ban. Since the account is not search banned, it cannot be ghost banned.';
      return;
    }
    contentElement.innerHTML = `We found <a href="https://twitter.com/i/status/${results.tests.ghost.tweet}">a tweet
    with at least one reply</a> on the user's profile. A <a href="https://twitter.com/i/status/${results.tests.ghost.reply}">reply tweet</a>
    is ${results.tests.ghost.ban ? '' : 'not '}detached.`;
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
    document.querySelectorAll('#threadFAQ, #searchFAQ, #barrierFAQ, #qfdFAQ .techInfo')
      .forEach(element => element.classList.add('hide'));
  }
}

window.TechInfo = TechInfo;
