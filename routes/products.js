var express = require('express');
var router = express.Router();

const AWS = require('aws-sdk');

const table_name = 'Products';

/* GET products listing. */
router.get('/', function(req, res, _next) {
    // DynamoDB client will automatically use the Cognito identity credentials provider
    var ddb = new AWS.DynamoDB();
    
    // Scan the table
    ddb.scan({TableName: table_name}, function (err, data) {
        if (err) {   // an error occurred
            req.log.error(err);   
        }
        else {      // successful response
            
            // Print the items
            var i, items = [];
            for (i = 0; i < data.Count; i++) {
                req.log.debug('%j', data.Items[i]);
                items.push(data.Items[i].name.S);
            }    
            
            res.render('products', { title: 'Products', items });
        }
    });
    
});

module.exports = router;
