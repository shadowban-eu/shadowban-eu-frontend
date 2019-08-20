# Twitter Shadowban Tests

#### One-page web app, testing Twitter users for various shadowbans.

[![Maintainability](https://api.codeclimate.com/v1/badges/6986eb7e8da272eb9d1f/maintainability)](https://codeclimate.com/github/shadowban-eu/TwitterShadowBanV2/maintainability)

## NOTE

You are in shadowban-eu/TwitterShadowBanV2! No worries. :)

We are currently performing a major overhaul of the site.
This includes finally having a proper backend.  
To keep things nice and clean, we therefore split the now distinct back- and frontend code.

Frontend (former TwitterShadowBanV2; history preserved):  
[shadowban-eu/shadowban-eu-frontend](https://github.com/shadowban-eu/shadowban-eu-frontend.git)

Backend:  
[shadowban-eu/shadowban-eu-backend](https://github.com/shadowban-eu/shadowban-eu-backend.git)

**Everything below is outdated with v > 1.3.3**

## Setup

Browser compatibility needs transpiling. Nothing fancy, just the usual babel magic.

```bash
git clone https://github.com/shadowban-eu/TwitterShadowBanV2 && cd TwitterShadowBanV2
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
