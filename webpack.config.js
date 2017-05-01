const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const config = {
  context: path.join(__dirname, 'app'),
  entry: ['./index.jsx', './style.css'],

  resolve: {
    modules: ['node_modules', 'src'],
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
          use: 'css-loader?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]!less-loader',
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
    new webpack.DefinePlugin({
      'process.env.API_HOST': JSON.stringify(process.env.API_HOST || 'docker-api.vibioh.fr'),
    }),
  ],

  output: {
    filename: 'app.js',
    path: path.join(__dirname, 'dist/static'),
  },
};

if (process.env.PRODUCTION) {
  const production = new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
    },
  });
  config.plugins.push(production);

  const uglify = new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
    },
  });
  config.plugins.push(uglify);
}

module.exports = config;
