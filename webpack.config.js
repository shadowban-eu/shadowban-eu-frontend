/* eslint-disable no-console */
const path = require('path');
const autoPrefixer = require('autoprefixer');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageMinPlugin = require('imagemin-webpack-plugin').default;

const packageVersion = require('./package.json').version;
const getClientEnvironment = require('./config/env');

const { raw: env } = getClientEnvironment();
const production = env.NODE_ENV === 'production';
const buildVersion = `${packageVersion}-dev`;
const devServerConfig = {
  contentBase: path.join(__dirname, 'dist'),
  compress: true,
  port: 9000,
  host: '127.0.0.1',
  publicPath: '/'
};
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
if (!production) {
  copies.push({
    from: path.resolve(__dirname, 'src', '.api'),
    to: path.resolve(__dirname, 'dist', '.api'),
    toType: 'dir',
  });
}

const config = {
  mode: env.NODE_ENV,
  entry: {
    app: './src/js/main.js',
  },
  output: {
    filename: 'js/[name].[hash].js',
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
    new HtmlWebpackPlugin({
      inject: true,
      hash: production,
      filename: 'index.html',
      template: path.resolve(__dirname, 'src', 'index.html'),
      favicon: path.resolve(__dirname, 'src', 'favicon.png'),
      baseHref: production
        ? env.BASE_HREF
        : `http://${devServerConfig.host}:${devServerConfig.port}${devServerConfig.publicPath}`,
      devTag: production
        ? ''
        : `<div>${buildVersion}</div>`,
      minify: production ? {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      } : false
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[hash].css',
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
  ],
};

if (!production) {
  config.devServer = devServerConfig;
}

console.log(`Mode: ${config.mode}`);
module.exports = config;
