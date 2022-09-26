const axios = require('axios');
const config = require('../config.json');
var {headers} = require('./consts');

const getBaseUrl = ({project_id, repos_id}) => {
    return config.apiBB.base.replace(':PROJECT_ID', project_id).replace(':REPOS_ID', repos_id);
};

const getOpenPRInRepo = ({project_id, repos_id, filterText}) => {
    const base = getBaseUrl({project_id, repos_id});

    return axios({
        method: 'get',
        url: `${base}${config.apiBB.pullRequests}?state=OPEN${filterText ? `&filterText=${filterText}` : ''}`,
        headers,
    });
};

const getActivities = ({project_id, repos_id, pr_id}) => {
    const base = getBaseUrl({project_id, repos_id});

    return axios({
        method: 'get',
        url: `${base}${config.apiBB.activities.replace(':PR_ID', pr_id)}`,
        headers,
    });
};

module.exports = {getOpenPRInRepo, getActivities};
