/*
** Simple Twitter Shadowban Checker - js
** 2016 @xho
*/
import TSBv2 from './shadowban';
import UI from './ui';

document.addEventListener('DOMContentLoaded', () => {
  const test = (screenName) => {
    console.log(`testing ${screenName}`);
  };
  const ui = new UI(test);
});
