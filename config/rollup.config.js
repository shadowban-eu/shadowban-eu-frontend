import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import commonjs from 'rollup-plugin-commonjs';

import pkg from '../package.json';

const plugins = [
  resolve({
    jsnext: true,
    browser: true,
    preferBuiltins: false
  }),
  commonjs({
    include: 'node_modules/**',
    sourceMap: false
  }),
  babel({
    runtimeHelpers: true,
    babelrc: false, // ignore babel config from package.json (used for node/gulp)
    exclude: 'node_modules/**', // only transpile our source code
    presets: [
      [
        'env',
        {
          targets: {
            browsers: 'last 2 versions'
          },
          modules: false,
          loose: true,
          runtimeHelpers: true
        }
      ]
    ],
    plugins: [
      [
        'transform-runtime',
        {
          polyfill: false,
          regenerator: true
        }
      ],
      'transform-class-properties',
      'transform-object-rest-spread',
      'external-helpers'
    ]
  })
];

if (process.env.NODE_ENV === 'production') {
  // append hex of package version + timestamp
  const pkgVersion = pkg.version.replace(/\./g, '');
  process.env.bundleVersion = (parseInt(pkgVersion, 10) + Date.now()).toString(16);

  // uglify production bundle
  plugins.push(uglify());
} else {
  // append version-{env}
  process.env.bundleVersion = `${pkg.version}-${process.env.NODE_ENV}`;
}

export default {
  input: 'src/js/main.js',
  output: {
    file: `dist/js/main.bundle-${process.env.bundleVersion}.js`,
    format: 'iife',
    sourcemap: true
  },
  plugins
};
