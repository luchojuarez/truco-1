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
    })
    req.gameList = gameList;
    next();
}

router.use(mustBeLogged);

router.get('/', prepareGameList ,function(req, res, next) {
        res.render('lobby',{ user : req.user,
                             gameList : req.gameList});
});

router.get('/newgame',function (req,res,next){
    user = req.user.username;
    game = new Game({name : "Nuevo juego de " + user, score : [0,0] });
    game.player1 = new Player({ nickname: user });
    game.player2 = new Player({ nickname: "insertUser" });
    game.newRound({game : game, currentTurn : game.currentHand });
    game.save(function (err, savedgame){
        if (err) {
            console.log("Error saving in routes/lobby",err)
            return res.redirect('/lobby');
        }
        console.log("Game created succefully");
        return res.redirect('/play?game='+savedgame._id);    
    })
});

module.exports = router;