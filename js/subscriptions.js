var {trim, forIn} = require('lodash');
var axios = require('axios');
var moment = require('moment');

var {writeActualFile, readFile} = require('./utils');
var {replyMessageForChat, sendMessage} = require('./tgApi');
var {emoji, headers, getRandomInt} = require('./consts');
var config = require('../config.json');

const prSearchSubscription = () => {
    const subscription = readFile('data/commands/subscription.json');
    const userNames = readFile('data/usernames.json');

    forIn(subscription, (active, fromId) => {
        if (active) {
            const userId = userNames[fromId] && userNames[fromId].bb_id;

            if (!userId) {
                replyMessageForChat('Я вас не знаю, напишите Ане', messages[i].message);
            } else {
                for (let k = 0; k < config.projects.length; k++) {
                    const {project_id, repos_id} = config.projects[k];
                    const base = config.apiBB.base.replace(':PROJECT_ID', project_id).replace(':REPOS_ID', repos_id);

                    axios({
                        method: 'get',
                        url: `${base}${config.apiBB.pullRequests}?state=OPEN&role.1=REVIEWER&username.1=${userId}`,
                        headers,
                    }).then(function ({data}) {
                        console.log('get PR for subscr');
                        const items = data.values;

                        for (let j = 0; j < items.length; j++) {
                            const {links, title, id} = items[j];
                            const prSubscription = readFile('data/prSubscription.json');
                            const currentPRs =
                                (prSubscription[userId] &&
                                    prSubscription[userId][`${project_id}_${repos_id}`] &&
                                    prSubscription[userId][`${project_id}_${repos_id}`].pullRequests) ||
                                {};

                            if (!currentPRs[id]) {
                                const spoiler = '\n' + emoji[getRandomInt(0, emoji.length)];
                                sendMessage(`На вас назначен ПР\n<a href="${links.self[0].href}">${title}</a>\n${spoiler}`, fromId);
                                writeActualFile('data/prSubscription.json', [userId, `${project_id}_${repos_id}`, 'pullRequests'], {
                                    ...currentPRs,
                                    [id]: moment().valueOf(),
                                });
                            } else {

                            }
                        }
                    });
                }
            }
        }
    });
};

module.exports = {prSearchSubscription};
