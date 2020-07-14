const ejs = require('ejs');
const {readdir, readFile, writeFile} = require('fs');
const fs = require('fs');
const { promisify } = require('util');
// Command param
const filePath = process.argv[2] || null;
// Async FS functions
const readDirectories = promisify(readdir);
const readTemplate = promisify(readFile);
const writeOutputFile = promisify(writeFile);
const defaultConfigs = {};
// Application specific

const buildConfig = async() => {
  // Check if file exists
  let config = defaultConfigs;

  if(!fs.existsSync('config.json')) {
    return defaultConfigs;
  }

  return {
    ...config,
    ...JSON.parse((await readTemplate('config.json')).toString())
  }
}

const main = async() => {
  if(!filePath) {
    throw new Error('Please provide a path to the directory to generate sass from');
  }
  try {
    // Setup config
    const config = await buildConfig();

    let fontFiles = (await readDirectories(filePath)).filter(directory => /\.(ttf|otf)$/.test(directory));

    if(Object.hasOwnProperty('fontFaces')) {
      const fontFaces = config.fontFaces;
      fontFiles = fontFiles.filter(ff => fontFaces.contains(ff.split('-')[0]))
    }

    const templateFile = (await readTemplate('template.scss.ejs')).toString();

    const output = ejs.render(templateFile, {
      fontFiles: fontFiles.map(ff => ({
        file: ff,
        fileName: ff.split('.')[0],
        fileType: (() => {
          switch (ff.split('.')[1]) {
            case 'ttf':
              return 'truetype'
            case 'otf':
              return 'opentype'
          }
        })(),
        weightAndStyle: ff.split('.')[0].split('-')[1]
      }))
    });

    await writeOutputFile('_fonts.scss', output);
  } catch(err) {
    console.error(err);
    process.exit();
  }
}
try {
  main();
} catch(err) {
  console.error(err);
  process.exit();
}
