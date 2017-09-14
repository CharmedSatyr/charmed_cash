/*** PACKAGES ***/
import CompressionPlugin from 'compression-webpack-plugin'
import dotenv from 'dotenv'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import HTMLWebpackPlugin from 'html-webpack-plugin'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'

/*** TOOLS ***/
dotenv.load()
const PROD = process.env.NODE_ENV === 'production'

/*** COMMON CONFIGURATIONS ***/
const nodeConfig = {
  //console: false,
  //global: false,
  //process: false,
  //Buffer: false,
  //  __filename: false,
  //__dirname: false,
  /* I don't know what this is, but it prevents some errors, *
   * e.g. "Cannot resolve module 'fs'..."                    */
  fs: 'empty'
}

const defineConfig = new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    //    PORT: JSON.stringify(process.env.PORT),
    APP_URL: JSON.stringify(process.env.APP_URL),
    API_KEY: JSON.stringify(process.env.API_KEY),
    PRIVATE_KEY: JSON.stringify(process.env.PRIVATE_KEY),
    MONGO_URI: JSON.stringify(process.env.MONGO_URI)
  }
})

const compConfig = new CompressionPlugin({
  asset: '[path].gz[query]',
  test: /\.(js|html|css|json|ico|eot|otf|ttf)$/, //Defaults to all plugins, but using this: https://www.fastly.com/blog/new-gzip-settings-and-deciding-what-compress/
  algorithm: 'gzip',
  threshold: 10240,
  minRatio: 0.8,
  deleteOriginalAssets: false
})

const uglyConfig = new webpack.optimize.UglifyJsPlugin()

/*** CLIENT CONFIG ***/
const client = {
  entry: ['babel-polyfill', __dirname + '/client/index.jsx'],
  devtool: PROD ? false : 'source-map',
  module: {
    rules: [
      {
        test: /\.e?jsx?$/i,
        include: __dirname + '/client',
        exclude: [/node_modules/, /server/],
        loader: 'babel-loader',
        options: {
          presets: ['env', 'react']
        }
      },
      {
        test: /\.(css|sass|scss)$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          publicPath: '../', //The Plugin assumes css is in the same directory as the html by default (?) and redoes paths!
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: PROD ? true : false
              }
            },
            {
              loader: 'sass-loader',
              options: {
                minimize: PROD ? true : false
              }
            }
          ]
        })
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        loader: 'url-loader',
        options: {
          limit: 10000, //limit =< 10000 ? Data URL : fallback to file-loader
          name: 'img/[sha256:hash:5].[ext]' //If using file-loader, emit to img/ as a 10 digit sha256 has with the proper extension.
        }
      },
      {
        test: /\.ico$/i,
        loader: 'file-loader',
        options: {
          name: 'img/[name].[ext]'
        }
      },
      {
        test: /\.(eot|ttf|svg|woff|woff2)$/i,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/font-woff',
          name: 'fonts/[sha256:hash:5].[ext]' //must use full output path
        }
      }
    ]
  },
  output: {
    path: __dirname + '/dist',
    filename: PROD ? 'js/client.bundle.min.js' : 'js/client.bundle.js'
  },
  target: 'web',
  node: nodeConfig,
  plugins: PROD
    ? [
        new HTMLWebpackPlugin({
          title: 'Charmed Cash',
          template: __dirname + '/client/' + 'index.html',
          filename: __dirname + '/dist/' + 'index.html',
          inject: 'body'
        }),
        new ExtractTextPlugin({
          filename: 'styles/[name]+[sha256:contenthash:base64:5].min.css'
        }),
        defineConfig,
        uglyConfig,
        compConfig
      ]
    : [
        new HTMLWebpackPlugin({
          title: 'Charmed Cash',
          template: __dirname + '/client/' + 'index.html',
          filename: __dirname + '/dist/' + 'index.html',
          inject: 'body'
        }),
        new ExtractTextPlugin({
          filename: 'styles/[name]+[sha256:contenthash:base64:5].css'
        }),
        defineConfig
      ]
}

/*** SERVER CONFIG ***/
const server = {
  entry: ['babel-polyfill', __dirname + '/server/server.js'],
  output: {
    path: __dirname + '/dist',
    filename: PROD ? 'server.bundle.min.js' : 'server.bundle.js'
  },
  devtool: PROD ? false : 'source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/i,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['env']
        }
      }
    ]
  },
  target: 'node',
  //  node: nodeConfig,
  externals: [nodeExternals()],
  plugins: PROD ? [defineConfig, compConfig, uglyConfig] : [defineConfig]
}

export default [client, server]
