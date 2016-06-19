var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var router = express.Router();

var Game = require("../models/game").game;
var Player = require("../models/player").player;
var Round = require("../models/round").round;
var guest;

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { user : req.user , guest : guest});
});

router.get('/register', function(req, res) {
    res.render('register', { });
});

router.post('/register', function(req, res) {
    User.register(new User({ username : req.body.username }), req.body.password, function(err, user) {
        if (err) {
            return res.render('register', { user : user });
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

router.get('/loginGuest',function (req,res) {
    res.render('loginGuest')
})

router.post('/loginGuest',function (req,res) {
    guest= new User( {username : req.body.username , password : 'spiderman'});
    var p1 = new Player({user:req.user,nickname:req.user.username});
    var p2 = new Player({user:guest , nickname:guest.username});
    var game = new Game({
        name:p1.username+ ' VS '+p2.username,
        player1:p1,
        player2:p2,
    });
    game.newRound();
    console.log(p1);
    console.log('______________________________________________________________________');
    game.currentRound.deal();
    console.log(p1);
    //game.save
    res.redirect('/')
})

router.get('/login', function(req, res) {
    res.render('login', { user : req.user});
});

router.post('/login', passport.authenticate('local'), function(req, res) {
    res.redirect('/');
});


router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


router.get('/play',function (req,res) {
    res.render('play',{user:req.user,guest:guest})
})
router.post('/play',function (req,res) {

})

module.exports = router;
