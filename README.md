# Twitter Shadowban Checker v2

Twitter introduced a new shadow ban based on the quality filter for
searches (QFD). This is an updated version of @xho's Simple-Twitter-Shadowban-Checker
(https://github.com/xho/Simple-Twitter-Shadowban-Checker), checking for both
types of shadow ban. (And, of course ^_^, I couldn't resist to update code ES6/7 and design)

## Setup

Browser compatibility needs transpiling. Nothing fancy, just the usual babel magic.

```bash
git clone https://github.com/rbeer/TwitterShadowBanV2 && cd TwitterShadowBanV2
npm install
```

Since we are using a php backend for request proxying, you will also need PHP.
The gulp script uses php-cli's webserver.

[Debian]
```bash
apt-get install php7.2-cli
```

Finally, use the `default` gulp task to start the php-cli webserver and
watching for file changes.

```bash
npm start
```

## Deploy
Just copy `dist/`'s content to your server_root. (run `npm start` at least once to create it!)

## Misc

Checking for running server (the PID differs, of course)
```bash
pgrep php -f
> 20748 php -S localhost:8080 -t ./dist/
```

If you need to run the php-cli webserver on another port, you will have to
change it manually in `gulpfile.babel.js`, somewhere around line 72.

```js
  const args = ['-S', 'localhost:8080', '-t', './dist/'];
```
