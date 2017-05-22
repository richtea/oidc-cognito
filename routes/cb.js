const config = require('../config/config.json');

var express = require('express');
var router = express.Router();

const AWS = require('aws-sdk');

/* GET health listing. */
router.get('/', function(req, res, next) {
    const client = new req.app.locals.oidc.issuer.Client({
        client_id: req.app.locals.oidc.clientId,
        client_secret: req.app.locals.oidc.clientSecret
    });

    return client.authorizationCallback(req.app.locals.oidc.callbackUri, req.query) // => Promise
        .then(function (tokenSet) {
            req.log.debug('received and validated tokens %j', tokenSet);
            req.log.debug('validated id_token claims %j', tokenSet.claims);

            return makeCognitoRequest(tokenSet.id_token);
        })
        .then(() => {
            var rd = req.protocol + '://' + req.get('host') + '/products';
            return res.redirect(302, rd);
        })
        .catch(err => {
            req.log.error('Unable to get auth token', err);
            next(err);
        });
});

function makeCognitoRequest(id_token) {
    const provider_url = config.oidc.providerUrl; 
    var logins = {};
    logins[provider_url] = id_token;
    
    var pool_id = config.aws.identityPoolId;
    
    // Parameters required for CognitoIdentityCredentials
    var params = {
        IdentityPoolId: pool_id,
        Logins: logins
    };

    // Amazon Cognito region
    AWS.config.region = config.aws.region;

    // Initialize CognitoIdentityCredentials
    AWS.config.credentials = new AWS.CognitoIdentityCredentials(params);

    return new Promise((resolve, reject) => {
        AWS.config.credentials.get(function (err) {
            if (err) {  // an error occurred
                reject(err);
            }
            else {
                resolve();
            }
        });
    });   
}

module.exports = router;