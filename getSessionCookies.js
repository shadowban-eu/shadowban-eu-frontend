#!/usr/bin/node
/* eslint-disable no-param-reassign, no-console */
const { JSDOM } = require('jsdom');
const https = require('https');
const { writeFile } = require('fs');

// read .env content into process.env
require('dotenv').config({ path: '.env' });

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36';

const cookiesToString = (cookies) => {
  let str = '';
  Object.keys(cookies).forEach((key) => {
    str += `${key}=${cookies[key]}; `;
  });

  if (str !== '') {
    str = str.substr(0, str.length - 2);
  }
  return str;
};

const getCookies = (headers) => {
  const lines = headers['set-cookie'];
  const cookies = {};
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^(.*?)=(.*?);/i);
    if (match) {
      cookies[match[1]] = match[2];
    }
  }
  return cookies;
};

const getTwitterPage = (path, cookie = null) =>
  new Promise((resolve) => {
    let data = '';
    const options = {
      hostname: 'twitter.com',
      port: 443,
      path,
      method: 'GET',
      headers: {
        'User-Agent': ua
      }
    };
    if (cookie) {
      options.headers.Cookie = cookie;
    }
    const req = https.request(options, (res) => {
      res.on('data', (d) => {
        data += d;
      });
      res.on('end', () => {
        resolve([res.headers, data.toString()]);
      });
    });
    req.end();
  });

const postTwitterForm = (path, formData, cookie = null) =>
  new Promise((resolve) => {
    if (typeof cookie === 'object') {
      cookie = cookiesToString(cookie);
    }
    let postBody = '';
    Object.keys(formData).forEach((key) => {
      postBody += `${encodeURIComponent(key)}=${encodeURIComponent(formData[key])}&`;
    });

    if (postBody.endsWith('&')) {
      postBody = postBody.substr(0, postBody.length - 1);
    }

    const options = {
      hostname: 'twitter.com',
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postBody.length,
        'User-Agent': ua,
        Cookie: cookie
      }
    };

    let responseBody = '';
    const req = https.request(options, (res) => {
      res.on('data', (d) => {
        responseBody += d;
      });

      res.on('end', () => {
        resolve([res.headers, responseBody.toString()]);
      });
    });
    req.write(postBody);
    req.end();
  });

const getTwitterCookies = (username, password, formData, cookies) =>
  new Promise((resolve) => {
    const callback = ([headers]) => {
      cookies = Object.assign(cookies, getCookies(headers));
      process.stderr.write(`Location: ${headers.location}\n`);
      resolve(cookies);
    };

    formData['session[username_or_email]'] = username;
    formData['session[password]'] = password;

    postTwitterForm('/sessions', formData, cookies).then(([loginHeaders, body]) => {
      const loc = loginHeaders.location;
      const match = loc.match(/^(https:\/\/twitter.com)?(\/account\/login_challenge?.*)$/);
      cookies = Object.assign(cookies, getCookies(loginHeaders));
      if (match) {
        if (!loc.match(/(&|\?)challenge_type=RetypeEmail(&|$)/)) {
          process.stderr.write('Unsupported challenge type.\n');
          process.exit(1);
        }
        getTwitterPage(match[2], cookies).then(([challengeHeaders, challengePage]) => {
          cookies = Object.assign(cookies, getCookies(loginHeaders));
          const { document } = (new JSDOM(challengePage)).window;
          const formElements = Array.from(document.querySelectorAll('#login-challenge-form input'));
          const challengeData = {};
          formElements.forEach((e) => {
            if (!e.name) {
              return;
            }
            let value = e.value || '';
            if (e.name === 'challenge_response') {
              value = process.argv[process.argv.length - 2];
            }
            challengeData[e.name] = value;
          });
          cookies = Object.assign(cookies, getCookies(challengeHeaders));
          postTwitterForm('/account/login_challenge', challengeData, cookies).then(callback);
        });
      } else {
        callback([loginHeaders, body]);
      }
    });
  });

getTwitterPage('/login').then(([headers, data]) => {
  const { document } = (new JSDOM(data)).window;
  const formData = {
    authenticity_token: document.querySelector('[name="authenticity_token"]').value,
    ui_metrics: document.querySelector('[name="ui_metrics"]').value,
  };
  const cookies = getCookies(headers);
  console.log(`Getting Cookie for ${process.env.SCREEN_NAME}...`);
  getTwitterCookies(
    process.env.SCREEN_NAME,
    process.env.SECRET,
    formData,
    cookies
  ).then((newCookies) => {
    Object.assign(cookies, newCookies);
    const cookieString = cookiesToString(cookies);
    writeFile('./.htsession', cookieString, () => {
      console.log('Cookie stored in .htsession');
      console.log('Done.');
    });
  });
});
