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
    game.currentRound.deal();
    saveGame(game,function (err,savedgame) {
        if (err){
            console.error(err);
            res.render('error',err);
        }
        res.redirect('/play?gameID='+savedgame._id);
    })
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
    loadGameById(req.query.gameID,function (err,game) {
        if (err)
            console.error(err);
        res.render('play',{
            gameID:game._id,
            user:req.user,
            guest:guest,
            currentTurn:game.currentRound.currentTurn,

        })
    })

})
router.post('/play',function (req,res) {

})

function saveGame(gameObject,cb) {
    gameObject.currentRound.save(function(err, savedround) {
        if (err)
            cb(err);
        gameObject.save(function(err, savedgame) {
            if (err) {
                cb(err);
            }
            cb(err,savedgame);
        });
    });
}
function loadGameById(gameId,cb) {
Game
    .findOne({_id : gameId })
    .populate("currentRound")
    .exec(function (err,tgame) {
        if (err)
            cb(err,undefined);

        console.log("GAME LOADED: ",tgame._id);
        cb(err,tgame);
});
}


module.exports = router;
