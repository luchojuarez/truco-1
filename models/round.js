/*
 *
 * Represents a game's round
 *
 * @param gmae [Object]: game where the round belongs
 *
 */

var _ = require('lodash');
var StateMachine = require("../node_modules/javascript-state-machine/state-machine.js");
var deckModel = require("./deck");
var Deck  = deckModel.deck;

function asignarPuntos(jugador,puntos,instanciaRonda) {
    jugador==="player1" ? instanciaRonda.score[0] += puntos : instanciaRonda.score[1] += puntos;
    return instanciaRonda.score;
}


function newTrucoFSM(){
  var fsm = StateMachine.create({
  initial: 'init',
  events: [
    { name: 'playCard',     from: 'init',                           to: 'primerCarta' },
    { name: 'cantoEnvido',       from: ['init', 'primerCarta'],         to: 'envido' },
    { name: 'cantoTruco',        from: ['init', 'playedCard'],          to: 'truco'  },
    { name: 'playCard',from: ['quiero', 'no-quiero','primerCarta', 'playedCard','juegoTruco'],  to: 'playedCard' },
    { name: 'envidoQuerido',from: 'envido',                     to: 'juegoEnvido'  },
    { name: 'trucoQuerido', from: 'truco',                      to: 'juegoTruco'  },
    { name: 'no-quiero', from: ['envido', 'truco'],              to: 'no-quiero' }
],
  callbacks: {
      onplayCard: function (event, from, to, carta,instanciaRonda) {
          if (instanciaRonda.currentTurn==="player1") {
              instanciaRonda.board[0].push(carta);
          }else {
              instanciaRonda.board[1].push(carta);
          }
          var primera=calculaRonda(instanciaRonda.board,0);
          var segunda=calculaRonda(instanciaRonda.board,1);

          if (primera==segunda&&primera!=undefined) {
              asignarPuntos(primera,2,instanciaRonda);
              return primera;
          }

          var tercera=calculaRonda(instanciaRonda.board,2);
      },
      onjuegoTruco: function(event, from, to, carta){
        console.log("SE JUGO AL TRUCO");
      },
      onjuegoEnvido: function(event, from, to, carta) {
          console.log("SE JUGO AL ENVIDO");
      }
  }
});



  return fsm;
}

//dado un tablero y un numero de ronda tetorna el player que gano
function calculaRonda(board, mano) {
    var quienAgano;
    if (board[0][mano]!= undefined && board[1][mano] != undefined) {
        if (this.currentTurn === "player1") {
            board[0][mano].confront(board[1][mano])>1 ? quienAgano="player1" : quienAgano="player2";
        }else {
            board[0][mano].confront(board[1][mano])<1 ? quienAgano="player2" : quienAgano="player1";
        }
    }
    return quienAgano;
}


function Round(game, turn){
  /*Game*/
  this.game = game;

  /* next turn*/
  this.currentTurn = turn;

  /*here is a FSM to perform user's actions*/
  this.fsm = newTrucoFSM();

  this.status = 'running';

  /* Round' score*/
  this.score = [0, 0];

  this.board= [[],[]];
}


/*
 * Generate a new deck mixed and gives to players the correspondent cards
 */
Round.prototype.deal = function(){
  var deck = new Deck().mix();

  this.game.player1.setCards(_.pullAt(deck, 0, 2, 4));
  this.game.player2.setCards(_.pullAt(deck, 1, 3, 5));
};

/*
 * Calculates who is the next player to play.
 *
 * + if action is 'quiero' or 'no-quiero' and it's playing 'envido' the next
 * player to play is who start to chant
 *
 * + if action is 'quiero' or 'no-quiero' and it's playing 'envido' the next
 * player to play is who start to chant
 *
 * ToDo
 */
Round.prototype.changeTurn = function(){
   return this.currentTurn = switchPlayer(this.currentTurn);
}

/*
 * returns the oposite player
 */
function switchPlayer(player) {
  return "player1" === player ? "player2" : "player1";
};

/*
 * ToDo: Calculate the real score
 */
Round.prototype.calculateScore = function(action){
  if(action == "quiero" || action == "no-quiero"){
    //this.score = [0, 2];
    this.game.score[0] += this.score[0];
    this.game.score[1] += this.score[1];
  }

  return this.score;
}

/*
 * Let's Play :)
 */
Round.prototype.play = function(action, value) {
  // move to the next state
  //this.board[0].push(value);
  this.fsm[action](value,this);


  // Change player's turn
  return this.changeTurn();
};

module.exports.round = Round;
