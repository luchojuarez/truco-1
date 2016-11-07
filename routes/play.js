/*TODO:
    + query the game id
    + Load it with Game.load(gameId,callback)
    + Identify the current user with the player in the game
    + Parse the needed data to render the view (current player cards, current turn, board, points, etc)
    + Render the view
*/
module.exports = function (io){
var express = require('express');
var passport = require('passport');
var playSpace = io.of('/play');
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

//Manejar los sockets conectados al namespace /play
playSpace.on('connection',function(socket) {

    //TODO: obtener el id del juego
    
    //Meter usuario en la room del juego
    //  socket.join('play-gameId');

    socket.on('disconenct', function(){
        //abandonar la sala, creo que se hace solo.
        //  socket.leave('play-gameId');
    });
})

//Enviar mensajes a una room especifica
// playSpace.to('play-gameId').emit('Algun evento');
    

router.get('/',parseGame, function(req,res,next) {
    //console.log(req.game.cartas,">>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<");
    res.render('play',{game:req.game})
})

    return router;
};
