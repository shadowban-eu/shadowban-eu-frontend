/* eslint-disable no-console */
const path = require('path');
const autoPrefixer = require('autoprefixer');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageMinPlugin = require('imagemin-webpack-plugin').default;

const packageVersion = require('./package.json').version;

const ENV = process.env.NODE_ENV;
if (!ENV || (ENV !== 'development' && ENV !== 'production')) {
  console.error('You must set NODE_ENV to either development or production!');
  console.error(`Your NODE_ENV value is: ${ENV}`);
  process.exit(1);
}

const devServerConfig = {
  contentBase: path.join(__dirname, 'dist'),
  compress: true,
  port: 9000,
  host: '127.0.0.1',
  publicPath: '/'
};

const buildVersion = `${packageVersion}-dev`;


const copies = [{
  from: path.resolve(__dirname, 'src', 'img'),
  to: path.resolve(__dirname, 'dist', 'img'),
  toType: 'dir',
}];

// include /src/.api/ in development builds
// i.e. include API response mocks
// Files in /src/.api/ will be served as
// responses to test requests, according to the file's
// name.
// When you test e.g. a username `ghost`, the contents of
// /src/.api/ghost will be served.
if (ENV === 'development') {
  copies.push({
    from: path.resolve(__dirname, 'src', '.api'),
    to: path.resolve(__dirname, 'dist', '.api'),
    toType: 'dir',
  });
}

const config = {
  mode: ENV,
  entry: {
    app: './src/js/main.js',
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: ''
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
            presets: ['@babel/preset-env'],
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
        // loader: 'babel-loader'
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
    // new BrowserSyncPlugin({
    //   proxy: localServer.path,
    //   port: localServer.port,
    //   files: [],
    //   ghostMode: {
    //     clicks: false,
    //     location: false,
    //     forms: false,
    //     scroll: false,
    //   },
    //   injectChanges: true,
    //   logFileChanges: true,
    //   logLevel: 'debug',
    //   logPrefix: 'wepback',
    //   notify: true,
    //   reloadDelay: 0,
    // }),
    new HtmlWebpackPlugin({
      inject: true,
      hash: false,
      filename: 'index.html',
      template: path.resolve(__dirname, 'src', 'index.html'),
      favicon: path.resolve(__dirname, 'src', 'favicon.png'),
      baseHref: ENV === 'production'
        ? 'https://shadowban.eu/'
        : `http://${devServerConfig.host}:${devServerConfig.port}${devServerConfig.publicPath}`,
      devTag: ENV === 'production'
        ? ''
        : `<div>${buildVersion}</div>`
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
    new ImageMinPlugin({ test: /\.(jpg|jpeg|png|gif|svg)$/i }),
    new CleanWebpackPlugin({
      /**
       * Some plugins used do not correctly save to webpack's asset list.
       * Disable automatic asset cleaning until resolved
       */
      cleanStaleWebpackAssets: false,
      // Alternative:
      // cleanAfterEveryBuildPatterns: [
      // copy-webpackPlugin:
      //   '!images/content/**/*',
      // url-loader fonts:
      //   '!**/*.+(eot|svg|ttf|woff|woff2)',
      // url-loader images:
      //   '!**/*.+(jpg|jpeg|png|gif|svg)',
      // ],
      verbose: true,
    }),
    new CopyWebpackPlugin(copies),
  ],
};

if (ENV === 'development') {
  config.devServer = devServerConfig;
}
module.exports = config;
