var parseUrl = require("url").parse;
var assign = require("lodash").assign;

function isSecure (secure, xfpHeader, trustXFPHeader) {
    xfpHeader = xfpHeader ? xfpHeader.toString().toLowerCase() : "";
    if (secure) {
        return true;
    }

    return trustXFPHeader && xfpHeader === "https";
}

function shouldRedirect (redirectsEnabled, method) {
    if (!redirectsEnabled) {
        return false;
    }

    return method === "GET";
}

module.exports = function(req, res, next){
    var redirect;
    var secure;
    var xfpHeader = req.get("X-Forwarded-Proto");
    var localHttpsPort;
    var httpsPort;
    var fullUrl;
    var redirectUrl;

    var options = {
        trustXFPHeader: false,
        enable301Redirects: true,
        httpsPort: false,
        sslRequiredMessage: "SSL Required."
    };

    var expressOptions = req.app.get("forceSSLOptions") || {};
    var localOptions = res.locals.forceSSLOptions || {};
    localHttpsPort = localOptions.httpsPort;
    assign(options, expressOptions, localOptions);

    secure = isSecure(req.secure, xfpHeader, options.trustXFPHeader);
    redirect = shouldRedirect(options.enable301Redirects, req.method);

    if (!secure) {
        if (redirect) {
          
            httpsPort = localHttpsPort || options.httpsPort || 443;
            fullUrl = parseUrl(req.protocol + "://" + req.header("Host") + req.originalUrl);

            //intentionally allow coercion of https port
            redirectUrl = "https://" + fullUrl.hostname + (httpsPort == 443 ? "" : (":" + httpsPort)) + req.originalUrl;

            res.redirect(301, redirectUrl);
        } else {
            res.status(403).send(options.sslRequiredMessage);
        }
    } else {
        delete res.locals.forceSSLOptions;
        next();
    }
};