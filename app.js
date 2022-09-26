var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var axios = require('axios');
var https = require('https');

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});
axios.defaults.httpsAgent = httpsAgent;

// var indexRouter = require('./routes/index');
var webhookRouter = require('./routes/webhook');

const moment = require('moment');

var config = require('./config.json');
var {getUpdates} = require('./js/tgGetUpdates');
var {getNewPR} = require('./js/prReminder');
var {prSearchSubscription} = require('./js/subscriptions');

var app = express();

moment.locale('ru');

const timeoutPRReminde = 60000; //1m
const timeoutUpdates = 6000; //10s

getNewPR();
setInterval(getNewPR, timeoutPRReminde);

getUpdates();
setInterval(getUpdates, timeoutUpdates);

prSearchSubscription();
setInterval(prSearchSubscription, timeoutPRReminde);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
app.use('/webhook/' + config.telegram.token, webhookRouter);

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//     next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//     // set locals, only providing error in development
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development' ? err : {};

//     // render the error page
//     res.status(err.status || 500);
//     res.render('error');
// });

module.exports = app;
