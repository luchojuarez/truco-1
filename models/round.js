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


function Round(game, turn){
	/*
	* Game
    */
   this.game = game;
 
   /*
    * next turn 
	* turn could be "player1" or "player2"
    */
   this.currentTurn = turn;

   this.quienJuega = turn;
 
   /*
    *
    */
   this.status = 'running';
 
   /*
    * Puntos del truco acumulados hasta el momento
    */
   this.puntosTruco = 1;

   /*
	* envidoStack se trata como una pila donde se apila el puntaje cada vez que se canta envido/realenvido/faltaenvido
   */
   this.envidoStack = [];
   /*
    * here is a FSM to perform user's actions
    */
   this.fsm = newTrucoFSM();

/*incializacion de los callbacks:
 * Cuando se acepta truco/retruco/valecuatro (Ver *AceptandoTruco/Retruco/Valecuatro)
 * sumar 1 punto al acumulador puntosTruco (no son asignados hasta que se termine la ronda)
 *
 * Cuando se entra al estado envido, apilar 2 puntos a la pila que guarda los diferentes cantos de envido (@envidoStack)
 *
 * Cuando se juega una carta (event play-card) cambiar el turno de quienJuega al jugador correspondiente
 *
 * Antes de que se realize la transicion a quiero/no-quiero (onbeforequiero/no-quiero), calcular los puntos de lo que se estaba cantando (estado from)
 *  
 * Cada vez que se entra al estado played_card evaluar si es fin de ronda
  *
*/
/* *AceptandoTruco/Retruco/Valecuatro: Evaluado en onbeforequiero, si no vino @from ningun estado de envido acumula 1 punto de lo que se haya cantado
 	el truco/retruco/valecuatro acumulan puntos de la misma forma, no es necesario distinguirlos
*/
    var tround = this; //Guardar la referencia a la ronda
	this.fsm.onafterplay_card=		function(event, from, to) {} //TODO: Cambiar al jugador correspondiente(depende del resultado de los duelos)
	this.fsm.onenterplayed_card=	function(event, from, to) {if (tround.hasEnded()) {tround.fsm[finronda]};}//TODO: Cambiar al estado finronda si la ronda temrino 
	this.fsm.onenterenvido=			function(event, from, to) {tround.pushEnvidoPlay(to);};//Si se canto envido, suma 2 a la pila de puntos 
	this.fsm.onbeforequiero=		function(event, from, to) {valueOf[from]? tround.sumarPuntosDeEnvidoCon(true) : tround.puntosTruco++;};
															  //Si vino de envido calcula los puntos con quiero, sino suma puntos al truco
	this.fsm.onbeforeno_quiero=		function(event, from, to) {valueOf[from]? tround.sumarPuntosDeEnvidoCon(false) : tround.endRound();};
															  //Si vino de envido calcula los puntos con no quiero, sino termina la ronda
	this.fsm.onfinronda=			function(event, from, to) {tround.asignarPuntosAlGanador()}; //TODO: actualizar los puntos del juego });
}

//Puntos que dan el envido/realenvido/faltaenvido
var valueOf = {
	'envido': 2,
	'realenvido': 3,
	'faltaenvido': -1 //Caso especial, necesita ser calculado
	};

function newTrucoFSM(){
  var fsm = StateMachine.create({
  initial: 'init',
  final : 'finronda',
  events: [
    { name: 'play card', from: 'init',                           to: 'primer carta' },
    { name: 'envido',    from: ['init', 'primer_carta'],         to: 'envido' },
    { name: 'truco',     from: ['init', 'played_card'],          to: 'truco'  },
    { name: 'play_card', from: ['quiero', 'no_quiero',
                                'primer_carta', 'played_card'],  to: 'played card' },
    { name: 'quiero',    from: ['envido', 'truco'],              to: 'quiero'  },
    { name: 'no_quiero', from: 'envido',						 to: 'no_quiero' },
	{ name: 'no_quiero', from: 'truco',							 to: 'finronda' },
	{ name: 'finronda',  from: 'played_card',					 to: 'finronda' },
  ],
  });

  return fsm;
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
 *
 * ToDo
 */
Round.prototype.changeTurn = function(evento){
	if (evento == 'quiero' || evento == 'no_quiero') {
		return this.currentTurn = this.quienJuega;
	}
	else {
		return this.currentTurn = switchPlayer(this.currentTurn);
	}
};

/*
 *Retorna true si la ronda termino
 *Una ronda termina cuando: 
 *  -Se jugaron las 6 cartas
 *  -Primer duelo = empate, Segundo duelo != empate (gana el que gano este duelo)
 *  -Primer duelo != empate, Segundo duelo = empate (gana el que gano el primer duelo)

*/
Round.prototype.hasEnded = function() {
}

/*
 *Retorna "player1" si gano this.player1, "player2" si gano this.player2
 *De acuerdo al resultado de los duelos se puede obtener el ganador:
 *ganador del duelo 1 
*/
Round.prototype.ganadorDelTruco = function() {
	return "ElGanador"
}
/*
 * returns the oposite player
 */
function switchPlayer(player) {
  return "player1" === player ? "player2" : "player1";
};


Round.prototype.sumarPuntosDeEnvidoCon = function (quiero) {
	if (quiero == true) {
		var puntosConQuiero = this.calculateEnvidoScore(quiero);
		var comparePoints = this.game.player1.envidoPoints - this.game.player2.envidoPoints;
		switch (true) {
			case (comparePoints > 0): //Gano player1 
				this.game.score[0]+= puntosConQuiero; break;
			case (comparePoints < 0): //Gano player2
				this.game.score[1]+= puntosConQuiero; break;
			case (comparePoints = 0)://Empate, puntos van para la mano
				this.game.currentHand === "player1"? this.game.score[0] = puntosConQuiero : this.game.score[1] = puntosConQuiero;
				break;
			};
		}
	else { //quiero == false
		var puntosNoQuiero = this.calculateEnvidoScore(quiero);
		//Si el que dijo no quiero es el jugador 1 se le dan los puntos al jugador 2
		this.currentTurn === "player1"? this.game.score[1] = puntosNoQuiero : this.game.score[0] = puntosNoQuiero;
	}
}
		
/* ************************************************************************************************** */
/* De acuerdo a lo que se canto, suma puntos a la pila de envido/realenvido/faltaenvido */
Round.prototype.pushEnvidoPlay = function (tipodejugada) {
	if (valueOf[tipodejugada]<0) {
		var puntosQueFaltan = this.game.maxScore - _.max(this.game.score) - _.sum(this.envidoStack);
		this.envidoStack.push(puntosQueFaltan);
	}
	else {
		this.envidoStack.push(valueOf[tipodejugada]);
	}
}

/***************************************************************************************************** 
 * calculateEnvidoScore utiliza el stack de las jugadas de envido cantadas para calcular los puntos
 * las diferentes variantes son: 
 *		envido+envido [2,2]
 *		envido+envido+faltaenvido[2,2,*]
 *		envido+envido+realenvido [2,2,3]
 *		envido+envido+realenvido+faltaenvido [2,2,3,*]
 *		envido+realenvido [2,3]
 *		envido+realenvido+faltaenvido [2,3,*]
 *		realenvido [3]
 *		realenvido+faltaenvido [3,*]
 *		envido [2]
 *		envido+faltaenvido [2,*]
 *		faltaenvido[*]
 * Donde * = MaxPuntajeParaGanar - puntos del que va ganando - puntos acumulados en envidoStack
 * cuando un jugador quiere el envido/realenvido/faltaenvido se hace la sumatoria del arreglo
 * cuando un jugador no quiere el envido/realenvido/faltaenvido
   se saca el tope y se hace la sumatoria de la pila
   |___CASO ESPECIAL: Si al sacar el tope la pila queda vacia entonces se retorna 1 punto
*/
Round.prototype.calculateEnvidoScore = function (quiso) {
	var puntosAcumuladosEnvido = _.sum(this.envidoStack);

		if (quiso) {
			return puntosAcumuladosEnvido;
		}
		else { //no quiso
			var puntosNegados = this.envidoStack.pop();
			if (this.envidoStack.length >0) {
				return puntosAcumuladosEnvido - puntosNegados ;
			}
			else {
				return 1;
			}
		}
	}


/******************************************************************************************************/

/*
 * Let's Play :)
 */
Round.prototype.play = function(action, value) {
  // move to the next state
  this.fsm[action](this,value);

	return this.changeTurn(action);
};

module.exports.round = Round;
