var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var forceSsl = require('./middlewares/force-ssl');
var bunyan = require('bunyan');
var uuid = require('uuid/v4');

// Routes
var index = require('./routes/index');
var products = require('./routes/products');
var health = require('./routes/health');
var cb = require('./routes/cb');

var app = express();

var log = bunyan.createLogger({
    name: 'testapp',
    stream: process.stdout,
    level: 'debug'
});

app.locals.globalLog = log;

app.use(function (req, res, next) {
    req.log = log.child({
        reqId: uuid()
    });
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());

// add the health router before forceSsl middleware, as we don't require SSL for this
// route ONLY
app.use('/health', health);
app.use(forceSsl);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/products', products);
app.use('/cb', cb);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, _next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;