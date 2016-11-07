/*TODO
    NewGame: Prepare a game with the current user and save it
    ListGame: Pass saved games in a list to the lobby view
    Join: register another user in the game and redirect to play
RESTRICTIONS:
    Make sure someone is logged when redirecting to this route, else redirect to login
*/

module.exports = function (io){
    var express = require('express');
    var PubSub = require('pubsub-js');
    var passport = require('passport');
    var User = require('../models/user');
    var router = express.Router();

    var Game = require("../models/game").game;
    var Player = require("../models/player").player;

    var usersList=[];
    var gameList=[];

    io.on('connection', function(socket) {
        // Use socket to communicate with this particular client only, sending it it's own id
        socket.emit('load games successful',{list:gameList,id:socket.id});

    });

    io.on('load games',function (socket) {
        io.emit('load games successful',{list:gameList,id:socket.id});
    })

    function mustBeLogged(req,res,next) {
        if(!req.user) {
            io.emit('user logged');
            return res.redirect('/login');
        }
        next();
    }

    function addPlayer(req,res,next) {
        var gameId = req.query.gameId;
        var usuario = req.user;
        Game.load(gameId,function (err,game) {

            if (err) {
                res.render('error',err);
            }
            game.setup({player2: new Player({ nickname: req.user.username, user: req.user})})
            game.start();
            game.save(function (err,game){
                if (err) next(err);
                console.log("Jugador ",game.player2.nickname,"agregado");
                next();
            })
        })
    }


    router.use(mustBeLogged);


    router.get('/' ,function(req, res, next) {
        res.render('lobby',{
            user : req.user,
        });
        //next();
    });


    function wait(req,res,next) {
        Game.load(req.query.gameId,function (err,game) {
            if (err) next(err)
            if (!game.player2.user) {
                res.render('waitroom',{})
            }
            next();
        })
    }
    router.get('/room',function (req,res,next) {
        Game.load(req.query.gameId,function (err,game) {
            if (err) next(err)
            if (!game.player2.user) {
                res.render('waitroom',{})
            }else {
                res.redirect("/play?gameId="+req.query.gameId)
            }
            //next();
        })
    })


    router.get('/newgame',function (req,res,next){
        var username = req.user.username;
        var user = req.user;
        p1 = new Player({ nickname: username, user: user});
        var opts = {
            name : "New game by " + username,
            player1 : p1,
            maxScore : 30
        };
        game = new Game();
        game.setup(opts);
        game.save(function (err, savedgame){
            if (err) {
                console.log("Error saving in routes/lobby",err)
                return res.redirect('/lobby');
            }
            // creo un evento
            var nuevoCanal = function( msg, data ){
                console.log( msg, data );
            };
            var token = PubSub.subscribe( savedgame._id, nuevoCanal);
            var game = {
                id: savedgame._id,
                name:savedgame.name,
                token:token,
            }
            gameList.push(game);
            io.emit("load games successful",{game:game,list:gameList})
            res.redirect('/lobby/room?gameId='+savedgame._id);
        })
    });

    router.get('/join',addPlayer,function (req,res,next) {
        io.emit("gameId="+req.query.gameId);
        res.redirect("/play?gameId="+req.query.gameId)
    })
    return router;
}
