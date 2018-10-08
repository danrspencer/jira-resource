const fs = require('fs');

module.exports = (baseFileDir, value) => {
  if (typeof value !== 'object' || !value.file) {
    return value;
  }

  let filePath = baseFileDir + '/' + value.file;
  let fileContent = fs.readFileSync(filePath, 'utf-8');

  return value.text ? value.text.replace('$FILE', fileContent) : fileContent;
};
