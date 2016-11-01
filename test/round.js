var utils = require('./utils');
var expect = require("chai").expect;
var card_model   = require("../app/game/models/card");
var player_model = require("../app/game/models/player");
var game_model   = require("../app/game/models/game");
var round_model   = require("../app/game/models/round");

var Game  = game_model.game;
var Round = round_model.round;
var Player = player_model.player;

describe('Round', function(){
 var game;

  beforeEach(function(){
    game = new Game();
    game.player1 = new Player({nickname: 'D'});
    game.player2 = new Player({nickname: 'E'});
    game.newRound();
  });

  describe("#deal", function(){
    it("should populate player1 cards", function(){
      var round = game.currentRound;
      round.deal();

      expect(game.player1.cards.length).to.be.equal(3);
    });

    it("should populate player2 cards", function(){
      var round = game.currentRound;
      round.deal();

      expect(game.player2.cards.length).to.be.equal(3);
    });
  });

});
