const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const path = require('path');
const SOURCE_PATH = path.resolve(__dirname, '.');

module.exports = function () {
  
  const webpackConfig = {
    entry: ['./js/exam.js','./css/main.scss'],
    output: {
      path: SOURCE_PATH
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].css',
                outputPath: 'css/'
              }
            },
            {
              loader: 'extract-loader'
            },
            {
              loader: 'css-loader'
            },
            {
              loader: 'postcss-loader'
            },
            {
              loader: 'sass-loader'
            }
          ]
        }
      ]
    }
  };
  
  return webpackConfig;
};