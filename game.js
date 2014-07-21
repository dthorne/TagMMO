/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var util = require("util"),					// Utility resources (logging, object inspection, etc)
	io = require("socket.io")(8000),		// Socket.IO
	express = require('express'),
	_ = require("underscore"),
	Player = require("./Player").Player;	// Player class



/**************************************************
** GAME VARIABLES
**************************************************/
var socket,		// Socket controller
	players,
	currentTaggerId,
	points = 0;	// Array of connected players


/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Create an empty array to store players
	players = [];

	// Start listening for events
	setEventHandlers();
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Socket.IO
	io.sockets.on("connection", onSocketConnection);
};

// New socket connection
function onSocketConnection(client) {
	util.log("New player has connected: " + client.id);

	// Listen for client disconnected
	client.on("disconnect", onClientDisconnect);

	// Listen for new player message
	client.on("new player", onNewPlayer);

	// Listen for move player message
	client.on("move player", onMovePlayer);
};

// Socket client has disconnected
function onClientDisconnect() {
	util.log("Player has disconnected: " + this.id);

	var removePlayer = playerById(this.id);

	// Player not found
	if (!removePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Remove player from players array
	players.splice(players.indexOf(removePlayer), 1);
	
	//If the tagger quits assign new tagger or null
	if(this.id == currentTaggerId) {
		currentTaggerId = players.length ? players[0].id : null;
		points = 0;
	}

	// Broadcast removed player to connected socket clients
	this.broadcast.emit("remove player", {id: this.id});
};

// New player has joined
function onNewPlayer(data) {
	currentTaggerId = (currentTaggerId || this.id);
	
	// Create a new player
	var newPlayer = new Player(data.x, data.y);
	newPlayer.id = this.id;
	newPlayer.name = data.name;
	newPlayer.setTaggerId(currentTaggerId);

	// Broadcast new player to connected socket clients
	this.broadcast.emit("new player", {name: newPlayer.name, id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), taggerId: currentTaggerId});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {name: existingPlayer.name, id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY(), taggerId: currentTaggerId});
	};
		
	// Add new player to the players array
	players.push(newPlayer);
};

//A player has moved
function onMovePlayer(data) {
	// Find player in array
	var movePlayer = playerById(this.id);

	// Player not found
	if (!movePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);

	var client = this;
	
	_(players).forEach(function(player) {
		if(player.id != movePlayer.id) {
			if(isCollide(player, movePlayer)) {
				if(player.id == currentTaggerId) {
					movePlayer.isFrozen = true;
					points++;
				} else if(movePlayer.id == currentTaggerId){
					player.isFrozen = true;
					points++;
				} else {
					player.isFrozen = false;
				}

				client.broadcast.emit("tagged", {points: points, taggerId: currentTaggerId, X: 100, Y: 100});
			}
		}
	});
	
	
	this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY(), points: points});
};


/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
function isCollide(a, b) { 

	 if (a.getX() <= (b.getX() + 100) && b.getX() <= (a.getX() + 100)&& a.getY() <= (b.getY() + 100)&& b.getY() <= (a.getY() + 100)) 
	 {
		 return true;
	 }	
	 return false
}

// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	};
	
	return false;
};


/**************************************************
** RUN THE GAME
**************************************************/
init();
var moduleApp = express();
moduleApp.use(express.static('node_modules/socket.io-client/'));
moduleApp.listen(3001);

var app = express();
app.use(express.static('public'));
app.listen(3000);

