'use strict'

const fs = require('fs');

module.exports = (baseFileDir, value) => {
    if (typeof(value) != 'object') {
        return value;
    }

    let filePath = baseFileDir + '/' + value.file;
    let fileContent;

    //try {
    fileContent = fs.readFileSync(filePath, 'utf-8');
    //} catch(error) {
    //    fileContent = '--Error loading file--';
    //}

    return value.text
        ? value.text.replace('$FILE', fileContent)
        : fileContent;
};