/*
** Twitter QFD Shadowban Checker
** 2018-2020 @Netzdenunziant, @raphaelbeerlin
*/
import 'materialize-css';
import 'materialize-css/sass/materialize.scss';

import UI from './ui';
import TechInfo from './ui/TechInfo';
import I18N from './i18n';

import '../scss/style.scss';

let ui;

const fullTest = async (screenName) => {
  let response;
  try {
    response = await fetch(`.api/${screenName}`);
  } catch (err) {
    ui.updateTask({
      id: 'checkUser',
      status: 'warn',
      msg: 'You are offline.'
    });
    return;
  }
  if (response.status === 429) {
    ui.updateTask({
      id: 'checkUser',
      status: 'warn',
      msg: 'Rate limit exceeded. Please try again in a minute!'
    });
    return;
  }
  if (!response.ok) {
    ui.updateTask({
      id: 'checkUser',
      status: 'warn',
      msg: 'Server error. Please try again later.'
    });
    return;
  }
  const result = await response.json();
  // Convert case
  const _screenName = result.profile.screen_name;
  const userLink = `<a href="https://twitter.com/${_screenName}" rel="noopener noreferrer">@${_screenName}</a>`;

  let failReason;
  if (!result.profile.exists) {
    failReason = 'does not exist';
  } else if (result.profile.protected) {
    failReason = 'is protected';
  } else if (result.profile.suspended) {
    failReason = 'has been suspended';
  } else if (!result.profile.has_tweets) {
    failReason = 'has no tweets';
  }

  if (failReason) {
    ui.updateTask({
      id: 'checkUser',
      status: 'warn',
      msg: `${userLink} ${failReason}.`
    });
    return;
  }

  ui.updateTask({
    id: 'checkUser',
    status: 'ok',
    msg: `${userLink} exists.`
  });

  const resultsDefault = ['warn', 'We were unable to test for technical reasons.'];

  let typeaheadResult = resultsDefault;
  if (result.tests.typeahead === true) {
    typeaheadResult = ['ok', 'No search suggestion ban.'];
  }
  if (result.tests.typeahead === false) {
    typeaheadResult = ['ban', 'Search suggestion ban.'];
  }
  ui.updateTask({
    id: 'checkSuggest',
    status: typeaheadResult[0],
    msg: typeaheadResult[1]
  });

  let searchResult = resultsDefault;
  if (result.tests.search) {
    searchResult = ['ok', 'No search ban.'];
  }
  if (result.tests.search === false) {
    searchResult = ['ban', 'Search ban.'];
  }
  ui.updateTask({
    id: 'checkSearch',
    status: searchResult[0],
    msg: searchResult[1]
  });
  TechInfo.updateSearch(result);

  let threadResult = resultsDefault;
  if (result.tests.ghost.ban === false) {
    threadResult = ['ok', 'No ghost ban.'];
  } else if (result.tests.ghost.ban === true) {
    threadResult = ['ban', 'Ghost ban.'];
  }
  ui.updateTask({
    id: 'checkConventional',
    status: threadResult[0],
    msg: threadResult[1]
  });
  TechInfo.updateThread(result);

  let barrierResult = resultsDefault;
  if (result.tests.more_replies) {
    if (result.tests.more_replies.error === 'ENOREPLIES') {
      barrierResult = ['warn', `${screenName} has not made any reply tweets.`];
    } else if (result.tests.more_replies.ban === false) {
      barrierResult = ['ok', 'No reply deboosting detected.'];
    } else if (result.tests.more_replies.ban === true) {
      const offensive = result.tests.more_replies.stage <= 0
        ? ''
        : ' The tweet we found was in the section for offensive tweets.';
      barrierResult = ['ban', `Reply deboosting detected.${offensive}`];
    }
  }
  if ('more_replies' in result.tests) {
    ui.updateTask({
      id: 'checkBarrier',
      status: barrierResult[0],
      msg: barrierResult[1]
    });
    TechInfo.updateBarrier(result);
  }
};

/* eslint-disable no-console */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('worker.js')
    .then(() => console.log('Service worker registered.'))
    .catch(err => console.log('Service worker not registered. This happened:', err));
}

// window.addEventListener('beforeinstallprompt', (e) => {
//   console.log('beforeinstallprompt');
//   e.prompt();
// });

/* eslint-enable no-console */

I18N.init().then(() => {
  ui = new UI();
  ui.test = fullTest;
  // init test by /?screenName
  ui.initFromLocation(window.location);
});
