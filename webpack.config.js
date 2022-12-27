const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");

const IS_DEV_MODE = process.env.NODE_ENV === "development";

module.exports = {
  devtool: IS_DEV_MODE && "cheap-source-map",
  mode: process.env.NODE_ENV,
  entry: {
    index: "./src/index.js",
    background: "./src/background.js",
    popup: "./src/popup.js"
  },
  watch: IS_DEV_MODE,
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false
      })
    ]
  },
  module: {
    rules: [{
      test: /\.vue$/,
      loader: "vue-loader"
    }, {
      test: /\.scss$/,
      use: [
        "style-loader",
        { loader: "css-loader", options: { sourceMap: IS_DEV_MODE } },
        { loader: "sass-loader", options: { sourceMap: IS_DEV_MODE } }
      ]
    }, {
      resourceQuery: /raw/,
      type: "asset/source"
    }]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/manifest.json" },
        { from: "src/index.html" },
        { from: "src/popup.html" }
      ]
    }),
    new VueLoaderPlugin()
  ]
}