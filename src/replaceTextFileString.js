const fs = require('fs')

module.exports = (baseFileDir, value) => {
    if ( typeof(value) !== 'object' ) {
        return value
    }

    let filePath = baseFileDir + '/' + value.file
    let fileContent = fs.readFileSync(filePath, 'utf-8')

    return value.text
        ? value.text.replace('$FILE', fileContent)
        : fileContent
}
