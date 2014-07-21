/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	localPlayer,	// Local player
	remotePlayers,	// Remote players
	socket,
	points = 0;			// Socket connection


/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	
	var person = prompt("Please select your player", "<Certain IL Employees>");
	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var bgImage = new Image;
	bgImage.src = "images/field.jpg";
	ctx.drawImage(bgImage, 0, 0, window.innerWidth, window.innerHeight);
	
	// Initialise keyboard controls
	keys = new Keys();

	// Calculate a random start position for the local player
	// The minus 5 (half a player size) stops the player being
	// placed right on the egde of the screen
	var startX = Math.round(Math.random()*(canvas.width-500)),
	startY = Math.round(Math.random()*(canvas.height-500));

	// Initialise the local player
	localPlayer = new Player(startX, startY, canvas.width - 10, canvas.height - 10, findName(person));

	// Initialise socket connection
	socket = io("http://dewey-2014a:8000/");

	// Initialise remote players array
	remotePlayers = [];

	// Start listening for events
	setEventHandlers();
};

function findName(person)
{
	var path = "";
	
	if(person == "Lane Johnson" || person == "Lane" || person == "lane" || person == "lane johnson")
	{
		return path + "laneJohnson.jpg";
	}
	else if(person == "Jon Bell" || person == "jon bell" || person == "Jon" || person == "jon")
	{
		return path + "jonBell.jpg"
	}
	else if(person == "Joe Swenson" || person == "joe swenson" || person == "joe" || person == "Joe")
	{
		return path + "joeSwenson.jpg"
	}
	else if(person == "Joseph" || person == "Joseph Park" || person == "joseph" || person == "joseph park")
	{
		return path + "joePark.jpg"
	}
	else if(person == "Dewey")
	{
		return path + "frozen_jonBell.jpg"
	}
	else if(person == "Max")
	{
		return path + "frozen_joeSwenson.jpg"
	}
	else if(person == "Adam")
	{
		return path + "frozen_joePark.jpg"
	}
	else if(person == "Corey")
	{
		return path + "frozen_laneJohnson.jpg"
	}
	else if(person == "Dan")
	{
		return path + "frozen_player.png"
	}
	else if(person == "Nick") 
	{
		return path + "nickC.png";
	}
	else
	{
		return path + "player.png";
	}
};

/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Keyboard
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);

	// Window resize
	window.addEventListener("resize", onResize, false);

	// Socket connection successful
	socket.on("connect", onSocketConnected);

	// Socket disconnection
	socket.on("disconnect", onSocketDisconnect);

	// New player message received
	socket.on("new player", onNewPlayer);

	// Player move message received
	socket.on("move player", onMovePlayer);

	// Player removed message received
	socket.on("remove player", onRemovePlayer);
	
//	socket.on("frozen", onFrozen);
	
//	socket.on("tagged", onTagged);
};

function onTagged(data) {
	points = data.points;
	
	var tagger = playerById(data.taggerId);
	tagger.setX(data.X);
	tagger.setY(data.Y);
	
	if(data.taggerId == localPlayer.id) {
		localPlayer.setX(data.X);
		localPlayer.setY(data.Y);
	}
};

// Keyboard key down
function onKeydown(e) {
	if (localPlayer) {
		keys.onKeyDown(e);
	};
};

// Keyboard key up
function onKeyup(e) {
	if (localPlayer) {
		keys.onKeyUp(e);
	};
};

// Browser window resize
function onResize(e) {
	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
};

// Socket connected
function onSocketConnected() {
	console.log("Connected to socket server");

	// Send local player data to the game server
	socket.emit("new player", {name: localPlayer.getName(), x: localPlayer.getX(), y: localPlayer.getY()});
};

// Socket disconnected
function onSocketDisconnect() {
	console.log("Disconnected from socket server");
};

// New player
function onNewPlayer(data) {
	console.log("New player connected: "+data.id);

	// Initialise the new player
	var newPlayer = new Player(data.x, data.y, canvas.width - 10, canvas.height - 10, data.name);
	newPlayer.id = data.id;

	// Add new player to the remote players array
	remotePlayers.push(newPlayer);
};

// Move player
function onMovePlayer(data) {
	console.log("moving other players")
	
	var movePlayer = playerById(data.id);

	// Player not found
	if (!movePlayer) {
		console.log("Player not found: "+data.id);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
	
	points = data.points;
};

// Remove player
function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);

	// Player not found
	if (!removePlayer) {
		console.log("Player not found: "+data.id);
		return;
	};

	// Remove player from array
	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
};

function contains(a, obj) {
    var i = a.length;
    while (i--) {
       if (a[i] == obj) {
           return true;
       }
    }
    return false;
}

function onFrozen(data) {
	console.log("onfrozen");
	for(var i = 0; i < remotePlayers.length; i++) {
		var player = remotePlayers[i];
		var id = player.id;
		var isFrozen = contains(data.frozen, id);
		
		player.setFrozen(isFrozen);
	}
	
	localPlayer.setFrozen(contains(data.frozen, localPlayer.id));
	console.log("onfrozen end");
}
/**************************************************
** GAME ANIMATION LOOP
**************************************************/
function animate() {
	update();
	draw();

	// Request a new animation frame using Paul Irish's shim
	window.requestAnimFrame(animate);
};


/**************************************************
** GAME UPDATE
**************************************************/
function update() {
	// Update local player and check for change
	if (localPlayer.update(keys)) {
		// Send local player data to the game server
		console.log("moving myself");
		
		socket.emit("move player", {x: localPlayer.getX(), y: localPlayer.getY()});
	};
};


/**************************************************
** GAME DRAW
**************************************************/
function draw() {
	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Points " + points, 32, 32);
	
	
	// Draw the remote players
	var i;
	for (i = 0; i < remotePlayers.length; i++) {
		remotePlayers[i].draw(ctx);
	};
	
	// Draw the local player
	localPlayer.draw(ctx);
};


/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].id == id)
			return remotePlayers[i];
	};
	
	return false;
};