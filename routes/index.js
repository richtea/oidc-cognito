
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, _next) {
    
    let x = req.app.locals.authzManager.authorizationUrl();

    return res.render('index', 
        { 
            title: 'Express',
            loginUri: x
        });
});

module.exports = router;
