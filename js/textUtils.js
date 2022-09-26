const moment = require('moment');

const config = require('../config.json');
var {writeActualFile, readFile} = require('./utils');

const getUserText = ({displayName, name}) => {
    const tgUser = config.users[name];
    const userNames = readFile('data/usernames.json');
    const customDisplayName = (userNames[tgUser] && userNames[tgUser].name) || displayName;

    return tgUser ? `<a href="tg://user?id=${tgUser}">${customDisplayName}</a>` : `<i>${customDisplayName}</i>`;
};

const getPRLink = ({prLink, title}) => `<a href="${prLink}">${title}</a>`;

const getAutorText = ({user}) => `Автор: ${getUserText(user)}`;

const getCreatedText = ({createdDate}) => `Создан ${moment(createdDate).fromNow()}`;

const getTargetText = ({targetLink, targetDisplayId}) =>
    `Целевая ветка: <a href="${targetLink}?at=${targetDisplayId}">${targetDisplayId}</a>`;

const getReviewersText = (reviewers) => {
    return reviewers
        ? reviewers.reduce((acc, reviewer) => {
              if (config.teams.indexOf(reviewer.user.name) === -1) {
                  return acc;
              }
              return acc + '\n' + getUserText(reviewer.user);
          }, '')
        : '';
};

const getNewPRText = ({isUpstream, prLink, title, user, targetLink, targetDisplayId, reviewers}) =>
    `<b>${isUpstream ? 'Новое перелитие' : 'Новый Pull Request'}</b>` +
    `\n${getPRLink({prLink, title})}` +
    `\n${getAutorText({user})}` +
    `\n${getTargetText({targetLink, targetDisplayId})}` +
    `\n\nDefault Reviewers:${getReviewersText(reviewers) || ' Не назначены'}`;

const getRemindText = ({prLink, title, user, targetLink, targetDisplayId, createdDate, reviewer}) =>
    `${getUserText(reviewer)}, на вас назначен Pull Request` +
    `\n${getPRLink({prLink, title})}` +
    `\n${getAutorText({user})}` +
    `\n${getTargetText({targetLink, targetDisplayId})}` +
    `\n${getCreatedText({createdDate})}\n\n`;

const getTeamReviewText = ({prLink, title, user, targetLink, targetDisplayId, reviewer, createdDate}) =>
    `На команду назначен Pull Request` +
    `\n${getPRLink({prLink, title})}` +
    `\n${getAutorText({user})}` +
    `\n${getTargetText({targetLink, targetDisplayId})}` +
    `\n${getCreatedText({createdDate})}` +
    `${reviewer ? `\nСлучайным образом выбран на ревью: ${getUserText(reviewer)}` : ''}` +
    `\n\n`;

module.exports = {getNewPRText, getRemindText, getTeamReviewText};
