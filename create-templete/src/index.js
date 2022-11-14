const items = require('./items');
const { generateTemplateFiles } = require('generate-template-files');
// Note: In your file it will be like this:
// const {generateTemplateFiles} = require('generate-template-files');

generateTemplateFiles(items);
