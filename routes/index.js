module.exports = function(io) {
    var express = require('express');
    var router = express.Router();
    /* GET home page. */
    router.get('/', function(req, res) {

        res.render('index', {
            user: req.user
        });
    });



    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    return router;
};
