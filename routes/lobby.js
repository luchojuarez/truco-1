/*TODO
    NewGame: Prepare a game with the current user and save it
    ListGame: Pass saved games in a list to the lobby view
    Join: register another user in the game and redirect to play
RESTRICTIONS:
    Make sure someone is logged when redirecting to this route, else redirect to login
*/

var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var router = express.Router();

var Game = require("../models/game").game;
var Player = require("../models/player").player;




function mustBeLogged(req,res,next) {
    if(!req.user) return res.redirect('/login');
    next();
}

function prepareGameList(req,res,next) {
    gameList = [];
    Game.find({},function (err,gameArray) {
        if (err) return next(err);
        for (i in gameArray) {
            gameList.push({
                gameId : gameArray[i]._id,
                name : gameArray[i].name,
                player1 : gameArray[i].player1,
                player2 : gameArray[i].player2
            })
        }
        req.gameList = gameList;
        next();
    })
}

function addPlayer(req,res,next) {
    var gameId = req.query.gameId;
    var usuario = req.user;
    Game.load(gameId,function (err,game) {
        if (err) {
            res.render('error',err);
        }
        game.player2.user = req.user;
        game.player2.nickname = req.user.username;
        game.save(function (err,game){
            if (err) next(err);
            console.log("Jugador ",game.player2.nickname,"agregado");
            next();
        })
    })
}

function wait(req,res,next) {
    Game.load(req.query.gameId,function (err,game) {
        if (err) next(err)
        if (!game.player2.user) {
            res.render('waitroom',{})
        }
        next();
    })
}

router.use(mustBeLogged);

router.get('/', prepareGameList ,function(req, res, next) {
        res.render('lobby',{ user : req.user,
                             gameList : req.gameList});
});

router.get('/room',wait,function (req,res,next) {
    res.redirect("/play?gameId="+req.query.gameId)
})

router.get('/newgame',function (req,res,next){
    var username = req.user.username;
    var user = req.user;
    game = new Game({name : "Nuevo juego de " + username, score : [0,0] });
    game.player1 = new Player({ nickname: username, user: user});
    game.player2 = new Player({ nickname: "insertUser", user: null });
    game.newRound({game : game, currentTurn : game.currentHand });
    game.save(function (err, savedgame){
        if (err) {
            console.log("Error saving in routes/lobby",err)
            return res.redirect('/lobby');
        }
        console.log("Game created succefully ",savedgame._id);
        res.redirect('/lobby/room?gameId='+savedgame._id);
    })
});

router.post('/join',addPlayer,function (req,res,next) {
    res.redirect("/play?gameId="+req.query.gameId)
})

module.exports = router;
