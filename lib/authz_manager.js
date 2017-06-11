// Wrapper around CognitoIdentityCredentials to add synchronisation

const AWS = require('aws-sdk');
const AsyncLock = require('async-lock');
const moment = require('moment');

var lock = new AsyncLock();

const SYNC_KEY = 'CREDENTIALS_REFRESH';

var SynchronizedCognitoIdentityCredentials = AWS.util.inherit(AWS.CognitoIdentityCredentials, {

    constructor: function SynchronizedCognitoIdentityCredentials(params, log) {
        this._log = log;
        AWS.CognitoIdentityCredentials.call(this, params);
    },
    
    refresh: function (cb) {
        let self = this;
        // Call base class, locking 
        lock.acquire(SYNC_KEY, () => {
            return new Promise((resolve, reject) => {
                try {
                    AWS.CognitoIdentityCredentials.prototype.refresh.call(this, (err) => {
                        cb(err);
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                        
                    });
                } 
                catch(err) {
                    self.log.error(err);
                    reject(err);
                }
            });
        });
    }
});

class AuthorizationManager {

    constructor(issuer, oidc_opts, aws_opts, log) {
        this.oidc_opts = oidc_opts;
        this.aws_opts = aws_opts;
        this.log = log;

        this.oidcTokenSet = null;

        this.oidc_client = new issuer.Client({
            client_id: oidc_opts.clientId,
            client_secret: oidc_opts.clientSecret
        });
    }

    authorizationUrl() {
        return this.oidc_client.authorizationUrl(
            {
                redirect_uri: this.oidc_opts.callbackUri,
                scope: 'openid email profile',
                response_type: 'code'
            });
    }

    authorizationCallback(query) {
        var self = this;

        return lock.acquire(SYNC_KEY, () => {
            return this.oidc_client.authorizationCallback(this.oidc_opts.callbackUri, query) // => Promise
                .then(function (tokenSet) {
                    self.log.debug('received and validated tokens %j', tokenSet);
                    self.log.debug('validated id_token claims %j', tokenSet.claims);

                    self._setOidcToken(tokenSet);

                    return tokenSet;
                })
                .catch(err => {
                    self.log.error('Unable to get OIDC auth token', err);
                    return Promise.reject(err);
                });
        })
        .then((tokenSet) => {
            // Lock is now released
            if (tokenSet) {
                return self._makeCognitoRequest(tokenSet.id_token);
            } else {
                return Promise.reject('Error getting OIDC token');
            }
        });
    }

    _makeCognitoRequest(id_token) {
        var self = this;

        const provider_url = this.oidc_opts.providerUrl; 
        var logins = {};
        logins[provider_url] = id_token;
        
        var pool_id = this.aws_opts.identityPoolId;
        
        // Parameters required for CognitoIdentityCredentials
        var params = {
            IdentityPoolId: pool_id,
            Logins: logins
        };

        // Amazon Cognito region
        AWS.config.region = this.aws_opts.region;

        // Initialize CognitoIdentityCredentials
        AWS.config.credentials = new SynchronizedCognitoIdentityCredentials(params, self.log);

        return new Promise((resolve, reject) => {
            self.log.debug('Getting AWS credentials')
            AWS.config.credentials.get(function (err) {
                if (err) {  // an error occurred
                    reject(err);
                }
                else {
                    self._setupAwsRefresh();
                    resolve();
                }
            });
        });   
    }

    _setOidcToken(tokenSet) {
        let self = this;
        this.oidcTokenSet = tokenSet;

        // Update the AWS params, if they are already set up
        if (AWS.config.credentials && AWS.config.credentials.params && AWS.config.credentials.params.Logins) {
            AWS.config.credentials.params.Logins[this.oidc_opts.providerUrl] = tokenSet.id_token;
        }

        let refreshIn = self._nextRefresh(moment.unix(tokenSet.expires_at));

        let r = moment().add(refreshIn, 'ms');
        self.log.debug('Next refresh of OIDC token at ' + r.format());

        setTimeout(() => {
            self._refreshOidcToken();
        }, refreshIn);
    }

    _refreshOidcToken() {
        let self = this;
        self.oidc_client.refresh(self.oidcTokenSet)
            .then((tokenSet) => {
                self._setOidcToken(tokenSet);
            });
    }

    _setupAwsRefresh() {
        let refreshIn = this._nextRefresh(moment(AWS.config.credentials.expireTime));

        let r = moment().add(refreshIn, 'ms');
        this.log.debug('Next refresh of AWS credentials at ' + r.format());

        setTimeout(() => {
            this._refreshAwsCredentials();
        }, refreshIn);
    }

    _refreshAwsCredentials() {
        let self = this;
        AWS.config.credentials.refresh((err) => {
            if (err) {
                self.log.error('Error refreshing AWS credentials', err);
            } else {
                self._setupAwsRefresh();
            }
        });
    }

    _nextRefresh(expires_at) {
        if (!moment.isMoment(expires_at)) {
            throw new Error('Invalid argument');
        }

        let expires_in = Math.max(expires_at.diff(moment()), 0);
        return Math.round(expires_in - expires_in / 10);
    }
}

module.exports = {
    AuthorizationManager: AuthorizationManager
};

