var fs = require('fs');
var {set} = require('lodash');

const readFile = (filePath) => {
    const file = JSON.parse(fs.readFileSync(filePath));

    return file;
};

const writeActualFile = (filePath, setPath, value) => {
    const currentFile = readFile(filePath);
    fs.writeFileSync(filePath, JSON.stringify(set(currentFile, setPath, value)));
};

module.exports = {writeActualFile, readFile};
