const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const config = {
  context: path.join(__dirname, 'app'),
  entry: ['babel-polyfill', './index.jsx', './index.css'],

  resolve: {
    modules: ['node_modules', 'app'],
    extensions: ['.js', '.jsx'],
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: 'eslint-loader',
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          use:
            'css-loader?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]!less-loader',
        }),
      },
    ],
  },

  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new ExtractTextPlugin({
      filename: 'app.css',
      allChunks: true,
    }),
  ],

  output: {
    filename: 'app.js',
    path: path.join(__dirname, 'dist/static'),
  },

  devServer: {
    setup: (app) => {
      app.get('/env', (req, res) => {
        res.json({
          API_URL: process.env.API_URL,
          WS_URL: process.env.WS_URL,
          AUTH_URL: process.env.AUTH_URL,
          BASIC_AUTH_ENABLED: process.env.BASIC_AUTH_ENABLED,
          GITHUB_AUTH_ENABLED: process.env.GITHUB_AUTH_ENABLED,
        });
      });
    },
  },
};

module.exports = config;
