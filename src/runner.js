const { run } = require('jscodeshift/src/Runner');
const path = require('path');

// path for transform file, files to transform, and jscodeshift runner optionsr
const transformPath = path.resolve('src/transform.js');
const paths = ['test_files'];

console.log(transformPath);
console.log(paths);

const options = {
    verbose: 2,
    dry: false,
    print: false,
    runInBand: false,
    silent: false,
    failOnError: true,
    stdin: false,
    ignorePattern: [],
    ignoreConfig: [],
    gitignore: '.gitignore',
    // babel: true,
    // parser: 'babel',
    // extensions: 'cjs, mjs, js, jsx, ts, tsx',
};

run(transformPath, paths, options).then(console.log).catch(console.error);