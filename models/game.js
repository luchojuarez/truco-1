/*
 *
 * Represents a game
 * @param player1.2 [String]: name of player 1
 * @param player2 [String]: name of player 2
 *
 */

var _ = require('lodash');
var playerModel = require("./player");
var roundModel = require("./round");
var mongoose = require('mongoose');

var Player = playerModel.player;
var Round  = roundModel.round;
var Schema = mongoose.Schema;

/*
 * Game Schema
 */
var GameSchema = new Schema({
  name:         String,
  player1:      Object,
  player2:      Object,
  currentHand:  { type: String },
  currentRound: { type: Schema.Types.ObjectId , ref: 'Round' },
  rounds:       { type : Array , default : [] },
  maxScore:		{ type : Number , default : 30},
  score:        { type : Array , default : [0, 0] },
});

var Game = mongoose.model('Game', GameSchema);

/*
 * Check if it's valid move and play in the current round
 */
Game.prototype.play = function(player, action, value){
  if(this.currentRound.currentTurn !== player)
    return new Error("[ERROR] INVALID TURN...");

  if(this.currentRound.fsm.cannot(action))
    return new Error("[ERROR] INVALID MOVE...");
 

  return this.currentRound.play(action, value);
};

/*
 * Create and return a new Round to this game
 */
Game.prototype.newRound = function(){
  console.log("Preparing round number ",this.rounds.length,"...");
  this.currentHand == undefined? this.currentHand= 'player1' : this.currentHand = switchPlayer(this.currentHand);
  var round = new Round({game :this, currentTurn : this.currentHand});
  round.resetValues();
  round.deal();
  this.currentRound = round;
  this.rounds.push(round);

  return this;
}

//

//borra la ronda corriente y devuelve el jugador ganador
Game.prototype.endGame = function () {
  this.currentRound = null;
  var ganador;
  this.score[0] >= this.maxScore ? ganador=this.player1 : ganador=this.player2;
  return ganador;
};

Game.prototype.hasEnded = function () {
  return (this.score[0] >= this.maxScore || this.score[1] >= this.maxScore);
}
/*
 * returns the oposite player
 */
function switchPlayer(player) {
  return "player1" === player ? "player2" : "player1";
};

module.exports.game = Game;
