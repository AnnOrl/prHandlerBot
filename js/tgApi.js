var axios = require('axios');

var config = require('../config.json');

const sendMessage = (text, chat_id = config.telegram.chat_id, reply_to_message_id = null) => {
    // return console.log('sendMessage', text);
    axios({
        method: 'post',
        url:  encodeURI(`${config.apiTG}${config.telegram.token}/sendMessage`),
        data: {
            chat_id,
            parse_mode: 'HTML',
            text,
            ...(reply_to_message_id ? {reply_to_message_id}: {})
        }
    }).then(()=>{
        console.log('send message', text.slice(0,13)+'...');
    })
};

const replyMessageForChat = (text, message) => {
    sendMessage(
        text,
        message.chat.id,
        message.chat.id !== message.from.id && message.message_id
    );
}
module.exports = {sendMessage, replyMessageForChat};