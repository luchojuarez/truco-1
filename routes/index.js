var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var router = express.Router();




/* GET home page. */
router.get('/', function(req, res) {
        res.io.on('connection', function(socket) {
            if (req.user)console.log("user connected as",req.user.username)
            socket.on('disconnect', function() {
                console.log('user disconnected');
            });    
        });
        res.render('index', {
                    user: req.user
                });    
        });



router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
