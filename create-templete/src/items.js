const filename = require('file-name');
const insertLine = require('insert-line');

const config = require('../package.json');

const items = [
  {
    option: 'Mobx store',
    defaultCase: '(pascalCase)',
    entry: {
      folderPath: './templates/mobx',
    },
    stringReplacers: [
      { question: 'Insert page name', slot: '__page__' },
      { question: 'Insert less module name', slot: '__module__' },
    ],
    output: {
      path: './__page__(kebabCase)',
      pathAndFileNameDefaultCase: '(kebabCase)',
      overwrite: false,
    },
    onComplete: async results => {
      // console.log(`results`, results);
    },
  },
];

/*
 * NOTE: there is many ways you can do this. This is just an example on how you might approach it.
 */
async function importVuexStore(results) {
  const files = results.output.files;

  const fullPaths = files
    .map(folderPath => folderPath.replace('src/', '')) // remove 'src' from path
    .map(path => `import ${filename(path)} from '${path}'`) // create import statement
    .join('\n'); // put all imports on there own line

  try {
    await insertLine('src/import-test.ts').append(fullPaths);
  } catch (error) {
    console.log(``, error);
  }
}

module.exports = items;
