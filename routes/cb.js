
var express = require('express');
var router = express.Router();

/* GET health listing. */
router.get('/', function(req, res, next) {

    return req.app.locals.authzManager.authorizationCallback(req.query) // => Promise
        .then(() => {
            var rd = req.protocol + '://' + req.get('host') + '/products';
            return res.redirect(302, rd);
        })
        .catch(err => {
            req.log.error('Unable to get auth token', err);
            next(err);
        });
});

module.exports = router;