var express = require('express');
var router = express.Router();

/* GET health listing. */
router.get('/', function(req, res, _next) {
    res.status(200).send('OK');
});

module.exports = router;