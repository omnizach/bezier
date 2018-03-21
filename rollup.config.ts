import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import uglify from 'rollup-plugin-uglify';

const pkg = require('./package.json');

export default {
  input: 'src/index.ts',
  output: [
    { file: pkg.main, name: 'bezier', format: 'umd', sourcemap: true }
  ],
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [
    typescript({ useTsconfigDeclarationDir: true }),
    commonjs(),
    sourceMaps(),
    uglify()
  ],
};