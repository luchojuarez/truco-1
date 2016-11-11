
module.exports = function(io) {

    //Init common resources
    var express = require('express');
    var passport = require('passport');
    var playSpace = io.of('/play');
    var User = require('../models/user');
    var router = express.Router();

    var Game = require("../models/game").game;
    var Player = require("../models/player").player;



    //Epxress middleware
    function mustBeLogged(req, res, next) {
        if (!req.user) {return res.redirect('/login')};
        next();
    }

    function parseGame(req, res, next) {
        gameId = req.query.gameId;
        Game.load(gameId, function(err, game) {
            if (err) next(err);
            var p, board, player;
            if (req.user._id.toString() === game.player2.user.toString()) {
                p = game.player2;
                player = "player2";
                board = [game.currentRound.board[1], game.currentRound.board[0]];
            } else {
                player = "player1";
                p = game.player1;
                board = game.currentRound.board;
            }
            console.log("<>>>>>>>>>>>>>><<<<<<<<<<>>>><<<>>>><<<>>><<<<>>",game.currentRound.score);
            var objectGame = {
                game: game,
                score:game.currentRound.score,
                board: board,
                cartas: p.cards,
                nickname: p.nickname,
                player: player,
                user: req.user,
                score: game.score,
                plays: game.currentRound.fsm.transitions()
            }
            req.game = objectGame;
            next();
        })
    }



    //Functions


    /**
     * Aplicar la funcion f en el juego cargado con el id pasado
     * en el callback se retorna el juego guardado y el resutlado de la funcion
     * @param  {[objectId]}   id [id del juego a cargar]
     * @param  {[function]}   f  [function que toma como parametro un]
     * @param  {Function} cb [callback de los resultados]
     */
    function apply(id,f,cb){
        Game.load(id, function(err,game) {
            if (err)
                return cb(err)
            try {
                var res = f(game);
                game.save(function(err, game) {
                    if (err) {
                        return cb(err);
                    }
                    return cb(err, game, res);
                })
            }
            catch(e) {
                return cb(e,game,res);
            }
        })
    };

    //Router middle ware setup
    router.use(mustBeLogged);



    //Socket connection handler
    playSpace.on('connection', function(socket) {

        //Common resources
        var gameId = socket.handshake.query.gameId;
        var playroom = 'play-' + gameId;

        //Socket setup
        socket.join(playroom);


        //Events
        socket.on('cardClicked', function(data) {
            //console.log("se clickeo la carta ",data);
        })

        //Evento de envido querido (o no quiero)
        socket.on('quiero',function(data){
            function quieroHandler(game) {
                console.log(data.player,data.jugada);
                return game.play(data.player,data.jugada);
            }
            apply(gameId,quieroHandler,function (err,game,res) {
                if (err) {
                    switch (err.name) {
                        case 'gameAborted':
                            //Handler para decirle que el juego esta cancelado
                            break;
                        case 'invalidMove':
                            //Handler para decirle que al cliente que realizo una movida invalida
                            //playSpace.to(socket.id).emit('invalidMove'); //Del lado del cliente podria tirar un alert
                            break;
                        case 'invalidTurn':
                            playSpace.to(socket.id).emit('invalidTurn');
                            break;
                        default:
                            console.error(err);
                    }
                }else {
                    socket.broadcast.to(playroom).emit('update after quiero',{score:0});
                }
            })
        })


        socket.on('test',function(data){
            Game.load(gameId,function (err,g){
                if (err)
                    console.log(err);
                console.log("Board:");
                console.log(g.currentRound.board);
                console.log("Current state");
                console.log(g.currentRound.currentState);
                console.log("Turno");
                console.log(g.currentRound.currentTurn);
                console.log(g.player1);
                console.log(g.player2);
                console.log("Score");
                console.log(g.score);
            })
        });

        socket.on('update cards',function(data){

            function updateCardsHandler(game) {
                var x = {
                    board:game.currentRound.board,
                    player1:game.player1,
                    player2:game.player2,
                    score:game.currentRound.score
                }
                return x;
            }
            apply(gameId,updateCardsHandler,function (err,game,res) {
                if (err) {
                    console.error(err);
                }else {
                    socket.emit('update cards done',res);
                }
            })
        })

        //Evento de carta jugada
        socket.on('playCard', function(data) {
            //Que hace con el game y que retorna?
            function playCardHandler(game){
                let cardIndex = data.index;
                let player = data.player;
                //podria devolver la carta jugada
                var carta = game[player].cards[cardIndex];
                game.play(player,'playCard',game[player].cards[cardIndex]);
                return carta;
            }

            apply(gameId,playCardHandler,function (err,game,res) {
                if (err) {
                    switch (err.name) {
                        case 'gameAborted':
                            //Handler para decirle que el juego esta cancelado
                            break;
                        case 'invalidMove':
                            //Handler para decirle que al cliente que realizo una movida invalida
                            //playSpace.to(socket.id).emit('invalidMove'); //Del lado del cliente podria tirar un alert
                            break;
                        case 'invalidTurn':
                            playSpace.to(socket.id).emit('invalidTurn');
                            break;
                        default:
                            console.error(err);
                    }
                }
                else {
                    var objeto = {
                        newBoard:game.currentRound.board,
                        score:game.currentRound.score,
                        player1:game.player1,
                        player2:game.player2
                    }
                    socket.emit('cartaJugada',{index:data.index});
                    playSpace.to(playroom).emit('cartaJugada',objeto);
                }

            })
        })


        //Evento de cantar jugada
        socket.on('jugada',function(data) {


            function playHandler(game) {
                let player = data.player;
                let play = data.play;

                return game.play(player,play);
            }

            apply(gameId,playHandler,function (err,game,res) {
                if (err) {
                    switch (err.name) {
                        case 'gameAborted':
                            //Handler para decirle que el juego esta cancelado
                            break;
                        case 'invalidMove':
                            console.log(err.name);
                            //Handler para decirle que al cliente que realizo una movida invalida
                            //playSpace.to(socket.id).emit('invalidMove'); //Del lado del cliente podria tirar un alert
                            break;
                        case 'invalidTurn':
                            socket.emit('invalidTurn');
                            break;
                        default:
                            console.error(err);
                    }
                } else {
                //Enviar mensaje a todos los de la room excepto al que lo envia
                    socket.broadcast.to(playroom).emit('cantaron',{jugada:data.play,player:data.player});
                }
            })
        })


        //Disconnect handler
        socket.on('disconenct', function() {
            socket.leave(playroom);
        });
    })



    //Router verbs

    router.get('/', parseGame, function(req, res, next) {
        res.render('play', {
            game: req.game
        })
    })

    return router;
};
