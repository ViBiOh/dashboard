const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const config = {
  context: path.join(__dirname, 'app'),
  entry: ['./index.jsx', './style.scss'],
  
  resolve: {
    modulesDirectories: ['node_modules', 'src'],
    extensions: ['', '.js', '.jsx'],
  },

  module: {
    preLoaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'eslint',
    }],

    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel',
    }, {
      test: /\.scss$/,
      loader: process.env.PRODUCTION ? ExtractTextPlugin.extract('style', 'css!sass') : 'style!css!sass',
    }, {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('css?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]!sass'),
    }],
  },

  plugins: [
    new ExtractTextPlugin('app.css', {
      allChunks: true,
    }),
  ],

  output: {
    filename: 'app.js',
    path: path.join(__dirname, 'dist/static'),
  },
};


if (process.env.PRODUCTION) {
  config.plugins.push(new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
    },
  }));
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
    },
  }));
}

module.exports = config;
