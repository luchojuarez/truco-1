var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var cardModel = require("../models/card.js");
var Card = cardModel.card;

/*
 * Player Schema
 */
var PlayerSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  nickname: {
    type: String,
    required: true,
    unique: true,
  },
  cards : {
    type: Array , default: []
  },
  envidoPoints : Number,
});

var Player = mongoose.model('Player', PlayerSchema);


/*
 * Add cards to user and calculate the user points
 */
Player.prototype.setCards = function(cards) {
  this.cards = cards;
  this.envidoPoints = this.points();
}

/*
 * Returns the user envido points
 */
Player.prototype.points = function() {
  var pairs = [
    [this.cards[0], this.cards[1]],
    [this.cards[0], this.cards[2]],
    [this.cards[1], this.cards[2]],
  ];

  var pairValues = _.map(pairs, function(pair) { 
    return pair[0].envido(pair[1]);
  });
  return _.max(pairValues);
};

//Recrea las cartas del jugador
Player.prototype.recreate = function() {
  var aux;

  for (var i=0; i<= this.cards.length-1; i++){
    aux = this.cards[i];
    console.log(aux);
    this.cards[i] = new Card(aux.number,aux.suit);
  };
}

module.exports.player = Player;
