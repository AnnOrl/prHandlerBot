var axios = require('axios');
var moment = require('moment');

var config = require('../config.json');
var {set, isEmpty, forIn} = require('lodash');
var {sendMessage} = require('./tgApi');
var {writeActualFile, readFile} = require('./utils');
var {headers, getRandomInt} = require('./consts');
const {getNewPRText, getRemindText, getTeamReviewText} = require('./textUtils');
const {getOpenPRInRepo, getActivities} = require('./services');

let countPRRequest = 0;
let countActivitiesRequest = 0;

const getActualData = ({project_id, repos_id, pr_id}) => {
    const initialFile = readFile('data/prReminder.json');

    const project = initialFile[`${project_id}_${repos_id}`];

    const pullRequests = project ? project.pullRequests : {};

    return pr_id ? pullRequests[pr_id] : pullRequests;
};

const getNewPR = () => {
    for (let k = 0; k < config.projects.length; k++) {
        const {project_id, repos_id, filterText = '', approveCount} = config.projects[k];
        getOpenPRInRepo({project_id, repos_id, filterText}).then(function ({data}) {
            console.log('get PR', ++countPRRequest, project_id, repos_id);

            const items = data.values;
            let toSend = {};

            for (let i = 0; i < items.length; i++) {
                const {id, reviewers, links, title, description, toRef, createdDate, author} = items[i];
                console.log('PR', id);
                const currentResult = getActualData({project_id, repos_id, pr_id: `${id}`});
                let toSendReviewers = {};

                const isUpstream = description && description.indexOf('#upstream') !== -1;
                toSend[items[i].id] = {createdDate, reviewers: currentResult ? currentResult.reviewers : {}};

                let approvedAll = true;

                if (isUpstream) {
                    for (let r = 0; r < reviewers.length; r++) {
                        if (!reviewers[r].approved) {
                            approvedAll = false;
                            break;
                        }
                    }
                }

                isUpstream && approvedAll && console.log('BLOCKED', items[i].id);

                if (
                    (!currentResult || (isEmpty(currentResult.reviewers) && !isEmpty(reviewers))) &&
                    (!description || description.indexOf('#noreviewers') === -1) &&
                    (!isUpstream || !approvedAll)
                ) {
                    forIn(reviewers, (reviewer) => {
                        if (config.teams.indexOf(reviewer.user.name) !== -1) {
                            toSendReviewers[reviewer.user.name] = {
                                approved: reviewer.approved,
                                lastActivity: moment().valueOf(),
                            };
                        }
                    });
                    
                    if(!currentResult || (isEmpty(currentResult.reviewers) && !isEmpty(toSendReviewers))) {
                        sendMessage(
                            getNewPRText({
                                isUpstream,
                                prLink: links.self[0].href,
                                title,
                                user: author.user,
                                targetLink: toRef.repository.links.self[0].href,
                                targetDisplayId: toRef.displayId,
                                reviewers,
                            })
                        );
                    }

                    toSend[items[i].id] = {reviewers: toSendReviewers};
                } else if (!!currentResult) {
                    if (moment().isoWeekday() !== 6 && moment().isoWeekday() !== 7) {
                        if (!approveCount) {
                            for (let j = 0; j < reviewers.length; j++) {
                                const currentUser = currentResult.reviewers[reviewers[j].user.name];
                                const {approved, lastActivity} = currentUser || {};

                                const days = moment().diff(moment(lastActivity), 'days');

                                if (currentUser && !approved && days >= config.notifications.workingDays) {
                                    getActivities({project_id, repos_id, pr_id: id}).then(({data}) => {
                                        console.log('get activities', ++countActivitiesRequest, project_id, repos_id);

                                        const activities = data.values;

                                        let activitiesCount = 0;

                                        for (let l = 0; l < activities.length; l++) {
                                            if (activities[l].user.name === reviewers[j].user.name) {
                                                activitiesCount++;
                                            }
                                        }

                                        if (activitiesCount === 0) {
                                            sendMessage(
                                                getRemindText({
                                                    prLink: links.self[0].href,
                                                    title,
                                                    user: author.user,
                                                    targetLink: toRef.repository.links.self[0].href,
                                                    targetDisplayId: toRef.displayId,
                                                    reviewer: reviewers[j].user,
                                                    createdDate,
                                                })
                                            );

                                            writeActualFile(
                                                'data/prReminder.json',
                                                [
                                                    `${project_id}_${repos_id}`,
                                                    'pullRequests',
                                                    items[i].id,
                                                    'reviewers',
                                                    reviewers[j].user.name,
                                                    'lastActivity',
                                                ],
                                                moment().valueOf()
                                            );

                                            toSend[items[i].id].reviewers[reviewers[j].user.name] = {
                                                lastActivity: moment().valueOf(),
                                                approved: reviewers[j].approved,
                                            };
                                        }
                                    });
                                }
                            }
                        } else {
                            let count = 0;
                            let needNotify = true;
                            let reviewer;

                            let randomIdReview = getRandomInt(0, config.teams.length);
                            while (config.teams[randomIdReview] === author.user.name) {
                                randomIdReview = getRandomInt(0, config.teams.length);
                            }

                            for (let j = 0; j < reviewers.length; j++) {
                                const currentUser = currentResult.reviewers[reviewers[j].user.name];
                                const {lastActivity} = currentUser || {};

                                const days = moment().diff(moment(lastActivity || moment()), 'days');

                                if (currentUser && days < config.notifications.workingDays) {
                                    needNotify = false;
                                }

                                if (config.teams.indexOf(reviewers[j].user.name) !== -1) {
                                    console.log(randomIdReview, config.teams.indexOf(reviewers[j].user.name));
                                    if (config.teams.indexOf(reviewers[j].user.name) === randomIdReview) {
                                        reviewer = reviewers[j];
                                    }

                                    if (reviewers[j].approved) {
                                        count++;
                                    }
                                }
                            }

                            if (count === 0 && needNotify) {
                                sendMessage(
                                    getTeamReviewText({
                                        prLink: links.self[0].href,
                                        title,
                                        user: author.user,
                                        targetLink: toRef.repository.links.self[0].href,
                                        targetDisplayId: toRef.displayId,
                                        reviewer: reviewer.user,
                                        createdDate,
                                    })
                                );
                                for (let j = 0; j < reviewers.length; j++) {
                                    toSend[items[i].id].reviewers[reviewers[j].user.name] = {
                                        lastActivity: moment().valueOf(),
                                        approved: reviewers[j].approved,
                                    };
                                }
                            }
                        }
                    } else {
                    }
                }
            }

            writeActualFile('data/prReminder.json', `${project_id}_${repos_id}`, {
                project_id,
                repos_id,
                pullRequests: toSend,
            });
        });
    }
};

module.exports = {getNewPR};
