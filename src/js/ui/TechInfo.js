import I18N from '../i18n';

/* global DocumentTouch */
export default class TechInfo {
  static isMobile = !!(('ontouchstart' in window) || (window.navigator && window.navigator.msPointerEnabled && window.MSGesture) || (window.DocumentTouch && document instanceof DocumentTouch));

  static makeSearchLink(query, qf, text) {
    const href = `https://${TechInfo.isMobile ? 'mobile.' : ''}twitter.com/search?f=${TechInfo.isMobile ? 'live' : 'tweets'}&src=typd&vertical=default&lang=en&q=${encodeURIComponent(query)}&qf=${qf ? 'on' : 'off'}`;
    return `<a href="${href}" rel=\"noopener noreferrer\">${text || query}</a>`;
  }

  static updateSearch(results) {
    if (!results.tests.search && results.tests.search !== false) {
      return;
    }
    document.querySelector('#searchFAQ').classList.remove('hide');
    const contentElement = document.querySelector('#searchFAQ .techContent');
    const searchLink = TechInfo.makeSearchLink(`from:@${results.profile.screen_name}`);
    contentElement.innerHTML = I18N.getSingleValue('techinfo:search.text', {
      foundOrNot: I18N.getSingleValue(
        results.tests.search
          ? 'techinfo:search.found'
          : 'techinfo:search.notFound',
        { tweetId: results.tests.search, interpolation: { escapeValue: true } }
      ),
      searchLink,
      interpolation: { escapeValue: false }
    });
  }

  static updateBarrier(results) {
    if (!results.tests.more_replies) {
      return;
    }
    document.querySelector('#barrierFAQ').classList.remove('hide');
    const contentElement = document.querySelector('#barrierFAQ .techContent');

    let explanation;
    if (!results.tests.more_replies.ban) {
      explanation = I18N.getSingleValue('techinfo:barrier.highQuality');
    } else {
      explanation = I18N.getSingleValue('techinfo:barrier.lowQuality', {
        abuse: results.tests.more_replies.stage === 1
          ? I18N.getSingleValue('techinfo:barrier.abuseQuality')
          : ''
      });
    }
    contentElement.innerHTML = I18N.getSingleValue('techinfo:barrier.text', {
      replyToId: results.tests.more_replies.in_reply_to,
      tweetId: results.tests.more_replies.tweet,
      explanation
    });
  }

  static updateThread(results) {
    if (!results.tests.ghost) {
      return;
    }
    document.querySelector('#threadFAQ').classList.remove('hide');
    const contentElement = document.querySelector('#threadFAQ .techContent');
    if (results.tests.search) {
      contentElement.innerHTML = I18N.getSingleValue('techinfo:thread.searchBanned');
      return;
    }
    contentElement.innerHTML = I18N.getSingleValue('techinfo:thread.text', {
      tweetId: results.tests.ghost.tweet,
      replyId: results.tests.ghost.reply,
      detached: results.tests.ghost.ban ? '' : 'not'
    });
  }

  static reset() {
    document.querySelectorAll('#threadFAQ, #searchFAQ, #barrierFAQ')
      .forEach(element => element.classList.add('hide'));
  }
}

window.TechInfo = TechInfo;
