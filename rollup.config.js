const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');

module.exports = {
  input: 'index.js',
  output: {
    file: 'painty.js',
    format: 'umd',
    name: 'painty',
    global: 'painty',
  },
  plugins: [
    resolve({
      module: true,
    }),
    commonjs()
  ]
}
