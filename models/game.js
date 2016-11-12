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
var cardModel = require("./card.js");
var Card = cardModel.card;
var Player = playerModel.player;
var Round  = roundModel.round;
var Schema = mongoose.Schema;

var state = {
  UNSTARTED : "unstarted",
  PLAYING : "Init" ,
  ENDED : "ended",
  ABORTED : "abort",
  NEWROUND: "newRound"
};

/*
 * Game Schema
 */
var GameSchema = new Schema({
  name:         String,
  player1:      { type: Schema.Types.ObjectId, ref: 'Player' },
  player2:      { type: Schema.Types.ObjectId, ref: 'Player' },
  currentHand:  { type: String },
  currentRound: { type: Schema.Types.ObjectId , ref: 'Round' },
  rounds:       { type : Array , default : [] },
  maxScore:		  { type : Number , default : 30},
  score:        { type: Array , default : [0, 0] },
  status:       { type :String , default : state.UNSTARTED },
  const:        { type: Object, default : state }
});

//Given an object instance and a sub doc name string that is a subschema of the object
//it will try to save that subdocument if it exists

function saveSubdoc(instance, subDocName) {


  return new Promise(function(resolve, reject) {
      if (instance[subDocName]) {
        instance[subDocName].save(function(err, object) {
          if (err) { return reject(err); }
          return resolve(object);
        });
      } else {
        return resolve(null);
      }
  });
}



GameSchema.pre('save', function (next) {
  this.markModified('rounds');
  this.markModified('score');
  this.markModified('status');
  this.markModified('const');
   var game = this;
   Promise.all([saveSubdoc(game,"currentRound"),saveSubdoc(game,"player1"),saveSubdoc(game,"player2")])
    .then(function(values) {
      //Maybe do something with the data if necesary
      next();
    },error => {
      next(error);
    });
});


//Populate non null fields
GameSchema.statics.load = function (gameId,cb) {
  var gameId = arguments[0], fields, cb;
  this.findById(gameId, function(err, tgame) {
    if (err) {
      cb(err,false);
      console.error("GAME NOT LOADED: ", err);
    }
    var fields = ["currentRound","player1","player2"];
    _.remove(fields,function (prop) {
      return (tgame[prop] == null);
    });
    Game.populate(tgame,fields.join(" "),function(err,populatedGame) {
      if (err) cb(err);
      populatedGame.recreate();
      cb(err,populatedGame);
    });
  });
};



var Game = mongoose.model('Game', GameSchema);

Game.prototype.setup = function (opts) {
  this.name = opts.name || this.name ||"Partida de truco";
  this.player1 = opts.player1 || this.player1;
  this.player2 = opts.player2 || this.player2;
  this.score = opts.score || this.score || [0,0];
  this.maxScore = opts.maxScore || this.maxScore;
  this.status = opts.status || this.status || state.UNSTARTED;
};


Game.prototype.start = function () {
  if (gameIsRunable && this.status == this.const.UNSTARTED) {
    if (this.currentRound)
      this.currentRound = null;
    this.currentHand= 'player1';
    var round = new Round({game :this, currentTurn : this.currentHand});
    round.resetValues();
    round.deal();
    this.currentRound = round;
    this.rounds.push(round);
    this.status = this.const.PLAYING;
    return true;
  } else {return false;}
};

Game.prototype.abort = function () {
  this.status = this.const.ABORTED;
}

/*
 * Check if it's valid move and play in the current round
 */
Game.prototype.play = function(player, action, value){
  if(this.status == this.const.ABORTED) {
    err = new Error("[ERROR] GAME ABORTED...");
    err.name = 'gameAborted';
    throw err;
   }

  if(this.currentRound.currentTurn !== player) {
    err = new Error("[ERROR] INVALID TURN...");
        err.name = 'invalidTurn';
    throw err;
  }

  if(this.currentRound.fsm.cannot(action)) {
    err = new Error("[ERROR] INVALID MOVE...");
    err.name = 'invalidMove';
    throw err;
  }


  this.currentRound.play(action, value);
  if (this.const.NEWROUND != this.status) {
    this.const.PLAYING = this.currentRound.currentState;
    this.status = this.const.PLAYING;
  }

  if (this.hasEnded()) {
    //finaliza el juego y retorna el jugador que gano
    return this.endGame();
  };

};

/*
 * Create and return a new Round to this game
 */
Game.prototype.newRound = function(){
  this.currentRound = null;
  this.currentHand === undefined? this.currentHand= 'player1' : this.currentHand = switchPlayer(this.currentHand);
  var round = new Round({game :this, currentTurn : this.currentHand});
  round.resetValues();
  if (this.status == this.const.PLAYING) {round.deal();}
  this.const.PLAYING = this.const.NEWROUND;
  this.status = this.const.NEWROUND;
  this.currentRound = round;
  this.rounds.push(round);
}

//

//borra la ronda corriente y devuelve el jugador ganador
Game.prototype.endGame = function () {
  this.currentRound = null;
  var ganador;
  this.score[0] >= this.maxScore ? ganador=this.player1 : ganador=this.player2;
  this.status = this.const.ENDED;
  return ganador;
};



//Recrea los atributos del juego con los mismos valores
Game.prototype.recreate = function () {
  if (this.player1) {
    this.player1.cards = recreateCards(this.player1.cards);
  }
  if (this.player2) {
    this.player2.cards = recreateCards(this.player2.cards);
  }
  if (this.currentRound) {
    this.currentRound.board = _.map(this.currentRound.board,recreateCards);
    this.currentRound.recreate();
    this.currentRound.game = this;
  }

};

Game.prototype.hasEnded = function () {
  return (this.score[0] >= this.maxScore || this.score[1] >= this.maxScore);
};
/*
 * returns the oposite player
 */
function switchPlayer(player) {
  return "player1" === player ? "player2" : "player1";
}

function recreateCards (cardarray) {
  return _.map(cardarray, function (card) {
    return new Card(card.number,card.suit);
  });
}

function gameIsRunable () {
  return (this.payer1 !== null && this.player2 !== null);
}
module.exports.game = Game;
