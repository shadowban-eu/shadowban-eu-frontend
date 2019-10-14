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

---

## Setup

```bash
# Clone
git clone https://github.com/shadowban-eu/shadowban-eu-frontend.git && cd shadowban-eu-frontend

# Install
npm i

#Start development
npm start
# or npm run dev

# Build (to ./dist/)
npm run build
```

Some values, like the HTML base href, are hard-coded in `webpack.config.js`.

## Notes
#### Base href
The `<base href>` is set on build, depending on the `NODE_ENV`:

  - production: https://shadowban.eu/
  - development: http://127.0.0.1:9000/

The development value is taken from the `devServerConfig` object in `webpack.config.js`, including `basePath`.  
Be aware that setting `<base href>` to `http://127.0.0.1:9000/`, but then visiting the site via `http://localhost:9000/` will work at first, but the browser will deny setting the URL to http://localhost:9000/testedName, when running a test.
 
#### .api mocks
During development, /src/.api/ is included to have the webpack-dev-server serve API responses.

```
./src/.api/
├── deboost
├── ghost
├── invalid
├── notweets
├── protected
└── typeahead
```

All these files hold one response object in JSON notation.
These files are served, whenever you test their respective name.
