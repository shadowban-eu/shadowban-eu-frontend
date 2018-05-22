/* global TSBv2 */
/*
** Simple Twitter Shadowban Checker - js
** 2016 @xho
*/

var TSB = {

  searchBaseUrl: 'https://twitter.com/search?f=tweets&vertical=default&q=from%3A%40',

  init: function() {
    $('input').keypress(function(e) {
      if (e.which === 13) {
        TSB.testHandle();
        return false;
      }
    });

    $('button').click(TSB.testHandle);
  },

  testHandle: function() {
    var u = TSB.getUser();
    var validTwitterHandle = /^(?:@)?([A-Za-z0-9_]){1,15}$/g;
    var isValidTwitterHandle = u.match(validTwitterHandle);
    if (u && isValidTwitterHandle && isValidTwitterHandle != null) {
      TSB.searchUser(u);
    } else {
      TSB.isNotValidUserName();
    }
  },

  getUser: function() {
    $('.results ul').empty();
    $('.results div').empty();

    var u = $('input').val().trim();
    if (!u) {
      $('header span').text('@user').removeClass('on');
      $('.results').slideUp().removeClass('searching accent');
      return false;
    }

    if (u.lastIndexOf('@', 0) === 0) {
      u = u.substring(1);
    }

    return u;
  },

  searchUser: function(u) {
    $('header span').text('@' + u).addClass('on');
    $('.results')
      .slideDown()
      .removeClass('accent')
      .addClass('searching');

    function updateUI(liMessage, pMessage) {
      $.each(liMessage, function(index, value) {
        $('.results ul').append('<li>' + value + '</li>');
      });

      $.each(pMessage, function(index, value) {
        $('.results div').append('<p>' + value + '</p>');
      });
      $('.results').removeClass('searching');
    }

    TSBv2.test(u).then(function(data) {
      const liMessage = [];
      const pMessage = [];

      if (data.hasTweets) {
        liMessage.push(`at least one tweet made by @${u} was found`);
        if (data.isQualityFiltered) {
          pMessage.push(`@${u} is shadowbanned by the quality filter`);
        } else {
          pMessage.push('Apparently @' + u + ' is <u>not shadowbanned</u>');
        }
      } else {
        liMessage.push('no tweets made by @' + u + ' were found');
        pMessage.push('Apparently @' + u + ' <u>is shadowbanned</u>.');
        pMessage.push('First make sure the user exists, then you may also visit this <a target="_blank" href=\"' + TSB.searchBaseUrl + u + '\">link to a search on Twitter</a>. If you can\'t see any tweet made by @' + u + ', this user is most likely shadowbanned.');
      }
      $('.results').addClass('accent');
      updateUI(liMessage, pMessage);
    }).catch((data) => {
      updateUI([
        `at least one tweet made by @${u} was found`,
        '<i>quality filter test failed!</i>'
      ], [
        `@${u} is visible, but might be affected by the search quality filter`
      ]);
    });
  },

  isNotValidUserName: function() {
    /*Warn User*/
    $('header span').text('Who?').addClass('on');
    console.log('bad username');

    var pMessage = [];
    pMessage.push('What you entered is not a twitter handle...');
    $.each(pMessage, function(index, value) {
      $('.results div').append('<p>' + value + '</p>');
    });
  }

};

$(document).ready(function() {
  TSB.init();
});
