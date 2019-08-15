/*
** Twitter QFD Shadowban Checker
** 2018 @Netzdenunziant (research), @raphaelbeerlin (implementation)
*/
import 'materialize-css';
import 'materialize-css/sass/materialize.scss';

import UI from './ui';
import TechInfo from './ui/TechInfo';

import '../scss/style.scss';

const fullTest = async (screenName) => {
  let response;
  try {
    response = await fetch(`.api/${screenName}`);
  } catch (err) {
    window.ui.updateTask({
      id: 'checkUser',
      status: 'warn',
      msg: 'You are offline.'
    });
    return;
  }
  if (!response.ok) {
    window.ui.updateTask({
      id: 'checkUser',
      status: 'warn',
      msg: 'Server error. Please try again later.'
    });
    return;
  }
  const result = await response.json();
  // Convert case
  screenName = result.profile.screen_name;
  const userLink = `<a href="https://twitter.com/${screenName}">@${screenName}</a>`;

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
    window.ui.updateTask({
      id: 'checkUser',
      status: 'warn',
      msg: `${userLink} ${failReason}.`
    });
    return;
  }

  window.ui.updateTask({
    id: 'checkUser',
    status: 'ok',
    msg: `${userLink} exists.`
  });

  let typeaheadResult = ['warn', 'Search suggestion ban test failed.'];
  if (result.tests.typeahead === true) {
    typeaheadResult = ['ok', 'No search suggestion ban.'];
  }
  if (result.tests.typeahead === false) {
    typeaheadResult = ['ban', 'Search suggestion ban.'];
  }
  window.ui.updateTask({
    id: 'checkSuggest',
    status: typeaheadResult[0],
    msg: typeaheadResult[1]
  });

  let searchResult = ['warn', 'Search ban test failed.'];
  if (result.tests.search) {
    searchResult = ['ok', 'No search ban.'];
  }
  if (result.tests.search === false) {
    searchResult = ['ban', 'Search ban.'];
  }
  window.ui.updateTask({
    id: 'checkSearch',
    status: searchResult[0],
    msg: searchResult[1]
  });
  TechInfo.updateSearch(result);

  let threadResult = ['warn', 'Ghost ban test failed.'];
  if (result.tests.ghost.ban === false) {
    threadResult = ['ok', 'No ghost ban.'];
  } else if (result.tests.ghost.ban === true) {
    threadResult = ['ban', 'Ghost ban.'];
  }
  window.ui.updateTask({
    id: 'checkConventional',
    status: threadResult[0],
    msg: threadResult[1]
  });
  TechInfo.updateThread(result);

  let barrierResult = ['warn', 'Reply deboosting test failed.'];
  if (result.tests.more_replies) {
    if (result.tests.more_replies.ban === false) {
      barrierResult = ['ok', 'No reply deboosting detected.'];
    } else if (result.tests.more_replies.ban === true) {
      const offensive = result.tests.more_replies.stage <= 0
        ? ''
        : ' The tweet we found was in the section for offensive tweets.';
      barrierResult = ['ban', `Reply deboosting detected.${offensive}`];
    }
  }
  if ('more_replies' in result.tests) {
    window.ui.updateTask({
      id: 'checkBarrier',
      status: barrierResult[0],
      msg: barrierResult[1]
    });
    TechInfo.updateBarrier(result);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.ui = new UI(fullTest);
  window.fullTest = fullTest;
  // init test by /?screenName
  window.ui.initFromLocation(window.location);
});
