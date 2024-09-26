import {run} from 'jscodeshift/src/Runner.js';
import path from 'path';

// path for transform file, files to transform, and jscodeshift runner optionsr
const transformPath = path.resolve('src/transform.mjs');
const paths = ['test_files'];

const options = {
    verbose: 2,
    dry: true,
    print: true,
    babel: true,
    extensions: 'cjs, mjs, js, jsx, ts, tsx',
    ignorePattern: [],
    ignoreConfig: [],
    gitignore: '.gitignore',
    runInBand: false,
    silent: false,
    parser: 'babel',
    failOnError: true,
    stdin: false
};

await run(transformPath, paths, options);