var webpack             = require('webpack');
var path                = require('path');

var rootPath            = path.resolve(__dirname);
var nodeModulesPath     = path.resolve(rootPath, 'node_modules');
var srcPath             = path.resolve(rootPath, './src/react-chronicle-router.js');
var distPath            = path.resolve(rootPath, 'dist');

module.exports = {
  entry : {
    application         : [srcPath]
  },
  externals : {
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react'
    },
    url		: 'url'
  },
  output: {
    path                : distPath,
    filename            : 'react-chronicle-router.js',
    library		: 'react-chronicle-router',
    libraryTarget	: 'umd'
  },
  resolve: {
    extensions          : ['', '.js', '.jsx', '.json']
  },
  module: {
    loaders: [
      {
        test            : /src\/.+.(js|jsx)$/,
        exclude         : [nodeModulesPath],
        loaders         : ["babel"]
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]
};
