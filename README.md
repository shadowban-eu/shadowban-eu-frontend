# Twitter Shadowban Tests

One-page web app, testing Twitter users for conventional and QFD shadowbans.

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
Run `npm start build`! This creates an uglified script bundle and uses minified versions of 3rd party scripts.
Then copy `dist/`'s content to your server_root.

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
