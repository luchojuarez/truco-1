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
  nickname: String,
  cards : {
    type: Array , default: []
  },
  envidoPoints : Number,
});


PlayerSchema.statics.loadByUsername= function(name,cb){
//Player.prototype.loadByUsername= function(name){
    return this.findOne({nickname : name })
        .exec(function (err,tgame) {
        if (err){
            cb(err);
            console.error("GAME NOT LOADED: ",err);
        }
    });
}

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


Player.prototype.getAll =function() {
    Player.find()
    .exec(function() {
        return
    })
}


module.exports.player = Player;
