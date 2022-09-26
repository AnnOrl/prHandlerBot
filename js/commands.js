var {trim, forIn} = require('lodash');
var axios = require('axios');

var {writeActualFile, readFile} = require('./utils');
var {replyMessageForChat} = require('./tgApi');
var {emoji, headers, getRandomInt} = require('./consts');
var config = require('../config.json');

const startEvent = (messages) => {
    const userNames = readFile('data/usernames.json');

    for (let i = 0; i < messages.length; i++) {
        console.log('SEND привет', messages[i].message.chat.id);
        const mess =
            userNames[messages[i].message.from.id] && userNames[messages[i].message.from.id].name
                ? `Привет, ${userNames[messages[i].message.from.id].name}!`
                : `Привет! Что бы задать свое имя используйте команду /myname UserName`;

        replyMessageForChat(mess, messages[i].message);
        writeActualFile('data/commands/start.json', messages[i].update_id, messages[i]);
    }
};
const myNameEvent = (messages) => {
    for (let i = 0; i < messages.length; i++) {
        const username =
            messages[i].message &&
            messages[i].message.text &&
            trim(messages[i].message.text.replace(`/myname${config.telegram.botName}`, '').replace('/myname', ''));

        const mess = username ? `Имя изменено на "${username}"` : `Ошибка определения имени, укажите ваше имя в виде /myname UserName`;

        replyMessageForChat(mess, messages[i].message);

        if (username) {
            writeActualFile('data/usernames.json', [messages[i].message.from.id, 'name'], username);
        }
    }
};

const prSearch = (message, role = 'AUTHOR') => {
    const userNames = readFile('data/usernames.json');
    const userId = userNames[message.from.id] && userNames[message.from.id].bb_id;

    if (!userId) {
        replyMessageForChat('Я вас не знаю, напишите Ане', message);
    } else {
        replyMessageForChat('Ищу...', message);

        for (let k = 0; k < config.projects.length; k++) {
            const {project_id, repos_id} = config.projects[k];
            const base = config.apiBB.base.replace(':PROJECT_ID', project_id).replace(':REPOS_ID', repos_id);

            axios({
                method: 'get',
                url: `${base}${config.apiBB.pullRequests}?state=OPEN&role.1=${role}&username.1=${userId}`,
                headers,
            }).then(async function ({data}) {
                console.log(data);
                let myPRMessage = '';

                const items = data.values;

                for (let j = 0; j < items.length; j++) {
                    const {links, title, reviewers, properties, id} = items[j];
                    let prev = '';
                    let aft = '';

                    if (role === 'AUTHOR') {
                        // Добавить лейблы?
                        let failed = 0;

                        try {
                            const buildSummaries = await axios({
                                method: 'get',
                                url: config.apiBB.buildSummaries
                                    .replace(':PROJECT_ID', project_id)
                                    .replace(':REPOS_ID', repos_id)
                                    .replace(':PR_ID', id),
                                headers,
                            });

                            forIn(buildSummaries.data, ({failed}) => {
                                if (failed) {
                                    failed++;
                                }
                            });
                            const prHandlerBase = config.apiBB.prHandler
                                .replace(':PROJECT_ID', project_id)
                                .replace(':REPOS_ID', repos_id)
                                .replace(':PR_ID', id);

                            const labels = await axios({
                                method: 'get',
                                url: prHandlerBase + config.apiBB.labels,
                                headers,
                            });

                            aft = labels.data.reduce((acc, {name, successful}) => acc + `\n${successful ? '✅ ' : '⬜️ '}${name}`, '');
                        } catch (e) {}

                        prev = `<i>${properties.commentCount} 💬 ${properties.openTaskCount} ☑️ ${failed ? `${failed} 📛 ` : ''}</i>`;
                    } else {
                        prev = (reviewers.find(({user}) => user.name == userId) || {}).approved ? '✅ ' : '⬜️ ';
                    }

                    myPRMessage = myPRMessage + `\n\n${prev}<a href="${links.self[0].href}">${title}</a>${aft}`;
                }

                const spoiler = '\n' + emoji[getRandomInt(0, emoji.length)];

                replyMessageForChat(
                    myPRMessage
                        ? `В репозитории ${repos_id} найдены следующие ПР:` + myPRMessage + spoiler
                        : `В репозитории ${repos_id} ПР не найдены` + spoiler,
                    message
                );
            });
        }
    }
};

const myPREvent = (messages) => {
    for (let i = 0; i < messages.length; i++) {
        prSearch(messages[i].message, 'AUTHOR');
        writeActualFile('data/commands/mypr.json', [messages[i].update_id], messages[i]);
    }
};
const myReviewEvent = (messages) => {
    for (let i = 0; i < messages.length; i++) {
        prSearch(messages[i].message, 'REVIEWER');
        writeActualFile('data/commands/myreview.json', [messages[i].update_id], messages[i]);
    }
};

const subscriptionEvent = (messages) => {
    const userNames = readFile('data/usernames.json');

    for (let i = 0; i < messages.length; i++) {
        const userId = userNames[messages[i].message.from.id] && userNames[messages[i].message.from.id].bb_id;

        if (!userId) {
            replyMessageForChat('Я вас не знаю, напишите Ане', messages[i].message);
        } else {
            const toggle =
                messages[i].message &&
                messages[i].message.text &&
                trim(messages[i].message.text.replace(`/subscription${config.telegram.botName}`, '').replace('/subscription', ''));

            if (toggle && (toggle === 'on' || toggle === 'off')) {
                writeActualFile('data/commands/subscription.json', messages[i].message.from.id, toggle === 'on');
            } else {
                replyMessageForChat(
                    `Ошибка, формат команды <code>/subscription on</code> или <code>/subscription off</code>`,
                    messages[i].message
                );
            }
        }
    }
};

const commands = [
    {id: '/start', event: startEvent},
    {id: '/mypr', event: myPREvent},
    {id: '/myreview', event: myReviewEvent},
    {id: '/myname', event: myNameEvent},
    {id: '/subscription', event: subscriptionEvent},
];

module.exports = {commands};
