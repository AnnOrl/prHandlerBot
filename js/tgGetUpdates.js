var http = require('request');

var config = require('../config.json');
var {commands} = require('./commands');
var {writeActualFile, readFile} = require('./utils');

const getUpdates = () => {
    let log = readFile('data/commands/main.json');

    http.post(
        {
            url: encodeURI(`${config.apiTG}${config.telegram.token}/getUpdates`),
            formData: {
                ...(log.offset ? {offset: log.offset} : {}),
            },
        },
        function (error, response, body) {
            // console.log('error:', error);
            // console.log('statusCode:', response && response.statusCode);
            // console.log('body:', body);

            if (response && response.statusCode === 200) {
                const result = JSON.parse(body).result;

                if (result.length > 0) {
                    for (let i = 0; i < commands.length; i++) {
                        commands[i].event(
                            result.filter(({message}) => message && message.text && message.text.indexOf(commands[i].id) !== -1)
                        );
                    }

                    writeActualFile('data/commands/main.json', 'offset', result[result.length - 1].update_id + 1);
                }
            }
        }
    );
};

module.exports = {getUpdates};