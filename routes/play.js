/*TODO:
    + query the game id
    + Load it with Game.load(gameId,callback)
    + Identify the current user with the player in the game
    + Parse the needed data to render the view (current player cards, current turn, board, points, etc)
    + Render the view
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

function parseGame(req,res,next){
    gameId = req.query.gameId;
    Game.load(gameId,function (err,game) {
        if (err) next(err);
        var player;
        var board;
        if (req.user._id.toString() === game.player2.user.toString()) {
            player = game.player2
            board = [game.currentRound.board[1],game.currentRound.board[0]]
        }
        else {
            player = game.player1
            board = game.currentRound.board
        }
        console.log(player,board);
        var objectGame = {
            game:game,
            board:board,
            cartas:player.cards,
            nickname:player.nickname,
            user:req.user,
            score:game.score,
            plays:game.currentRound.fsm.transitions()
        }

        req.game = objectGame;
        next();
    })
}

router.use(mustBeLogged);

router.get('/',parseGame, function(req,res,next) {
    res.render('play',req.game)
})

module.exports = router;
