/* eslint-disable no-console */
const path = require('path');
const { readdirSync } = require('fs');
const autoPrefixer = require('autoprefixer');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const I18nextVersioningPlugin = require('i18next-versioning-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageMinPlugin = require('imagemin-webpack-plugin').default;
const { DefinePlugin } = require('webpack');

const packageVersion = require('./package.json').version;
const getClientEnvironment = require('./config/env');

const env = getClientEnvironment();
const production = env.raw.NODE_ENV === 'production';
const useDevServer = !production && process.env.WEBPACK_DEV_SERVER === 'true';

const buildVersion = `${packageVersion}-dev`;

const devServerUrl = new URL(env.raw.BASE_HREF || 'http://127.0.0.1:9000');
const devServerConfig = {
  contentBase: path.join(__dirname, 'dist'),
  compress: true,
  port: devServerUrl.port,
  host: devServerUrl.hostname,
  publicPath: devServerUrl.pathname
};

const copies = [{
  from: path.resolve(__dirname, 'src', 'manifest.json'),
  to: path.resolve(__dirname, 'dist', 'manifest.json'),
}, {
  from: path.resolve(__dirname, 'src', 'img'),
  to: path.resolve(__dirname, 'dist', 'img'),
  toType: 'dir',
}, {
  from: path.resolve(__dirname, 'src', 'favicon'),
  to: path.resolve(__dirname, 'dist', 'favicon'),
  toType: 'dir',
}, {
  from: path.resolve(__dirname, 'src', 'i18n'),
  to: path.resolve(__dirname, 'dist', 'i18n'),
  toType: 'dir',
}];

// include /src/.api/ in development builds; i.e. include API response mocks
// Files in /src/.api/ will be served as responses to test requests,
// according to the file's name.
// When you test e.g. a username `ghost`, the contents of
// /src/.api/ghost will be served.
if (!production) {
  copies.push({
    from: path.resolve(__dirname, 'src', '.api'),
    to: path.resolve(__dirname, 'dist', '.api'),
    toType: 'dir',
  });
}

const config = {
  mode: env.raw.NODE_ENV,
  entry: {
    app: './src/js/main.js',
    worker: './src/js/worker.js'
  },
  output: {
    filename: (chunkData) => {
      return chunkData.chunk.name === 'app' ? 'js/[name].[hash:7].js' : './[name].js';
    },
    path: path.resolve(__dirname, 'dist'),
    publicPath: ''
  },
  infrastructureLogging: {
    level: 'info'
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          MiniCssExtractPlugin.loader,
          'css-loader',
          { loader: 'postcss-loader', options: { plugins: [autoPrefixer] } },
          'sass-loader'
        ],
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: 'last 2 versions'
                  }
                }
              ]
            ],
            plugins: [
              [
                '@babel/plugin-transform-runtime',
                {
                  regenerator: true
                }
              ],
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-object-rest-spread'
            ]
          }
        }
      },
      {
        test: /\.(png|gif|jpg|jpeg)$/,
        use: [
          {
            loader: 'url-loader',
            options: { name: 'images/design/[name].[hash:6].[ext]', publicPath: '../', limit: 8192 },
          },
        ],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'url-loader',
            options: { name: 'fonts/[name].[hash:6].[ext]', publicPath: '../', limit: 8192 },
          },
        ],
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
      new OptimizeCssAssetsPlugin({}),
    ],
  },
  plugins: [
    new I18nextVersioningPlugin({
      langsRoot: './src/i18n',
      hashFileName: './i18nVersionHashes.json'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      hash: production,
      filename: 'index.html',
      template: path.resolve(__dirname, 'src', 'index.html'),
      favicon: path.resolve(__dirname, 'src', 'img', 'favicon.png'),
      templateParameters: {
        baseHref: useDevServer
          ? `http://${devServerConfig.host}:${devServerConfig.port}${devServerConfig.publicPath}`
          : env.raw.BASE_HREF,
        production,
        buildVersion,
        testUsers: !production ? readdirSync('./src/.api').join(', ') : undefined
      },
      minify: production ? {
        collapseWhitespace: true,
        removeComments: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      } : false
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[hash:7].css',
    }),
    new ImageMinPlugin({ test: /\.(jpg|jpeg|png|gif|svg)$/i }),
    new CleanWebpackPlugin({
      /**
       * Some plugins used do not correctly save to webpack's asset list.
       * Disable automatic asset cleaning until resolved
       */
      cleanStaleWebpackAssets: false,
      verbose: true,
    }),
    new CopyWebpackPlugin(copies),
    new DefinePlugin({
      ...env.stringified,
      // i18nVersions - added by I18nextVersioningPlugin
    })
  ],
};

if (useDevServer) {
  config.devServer = devServerConfig;
}

console.log(`Mode: ${config.mode}`);
console.log(`useDevServer: ${useDevServer}`);
module.exports = config;
