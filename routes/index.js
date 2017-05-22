
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, _next) {
    const client = new req.app.locals.oidc.issuer.Client({
        client_id: req.app.locals.oidc.clientId,
        client_secret: req.app.locals.oidc.clientSecret
    });

    let x = client.authorizationUrl(
        {
            redirect_uri: req.app.locals.oidc.callbackUri,
            scope: 'openid email profile',
            response_type: 'code'
        });

    return res.render('index', 
        { 
            title: 'Express',
            loginUri: x
        });
});

module.exports = router;
