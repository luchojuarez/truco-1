var express = require('express');
var app = express();
var router = express.Router();
var passport = require('passport');
var User = require('../game/models/user');

router.get('/', function(req, res) {
    res.render('register', {} );
});

router.post('/', function(req, res) {
    User.register(new User({ username : req.body.username }), req.body.password, function(err, user) {
        if (err) {
            return res.redirect('/register');
        }
        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

module.exports = router;
