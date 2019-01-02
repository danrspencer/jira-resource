const fs = require('fs');

module.exports = (baseFileDir, value) => {
  /*
  1. value (string): "some string"
  2. value (object): {text: "some string", file: "file_path"}
  3. value (object): {text: "some string"}
  3. value (object): {file: "file_path"}
  */
  if (typeof value !== 'object') {
    return value;
  } else if (!value.file) {
    return value.text;
  }

  let filePath = baseFileDir + '/' + value.file;
  let fileContent = fs.readFileSync(filePath, 'utf-8').trim();

  return value.text ? value.text.replace('$FILE', fileContent) : fileContent;
};
