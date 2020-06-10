// Dependencies
var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");

//app stuff
var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set("port", 5000);
app.use("/static", express.static(__dirname + "/static"));

// Routing
app.get("/", function(request, response) {
  response.sendFile(path.join(__dirname, "index.html"));
});

// Starts the server.
let port = process.env.PORT;
if(port == null || port == ""){
	port = 5000;
}
server.listen(port, function() {
  console.log("Starting server on port "+port);
});


//CLASSES -----------------------------------------------------
class Player {
	constructor(name){
		this.name = name;
		this.connected = true;
		
		this.ships = [new Ship(), new Ship()];
		this.food = 0;
		this.wood = 0;
		this.bricks = 0;
		this.money = 0;
		
		this.right_whales = 0;
		this.bowhead_whales = 0;
		this.sperm_whales = 0;
	}
}

class Ship {
	constructor(){
		this.prepared = false; //if prepared and on the dock
		this.distance = 0; //how far out to sea it is
		this.right_whales = 0;
		this.bowhead_whales = 0;
		this.sperm_whales = 0;
	}
}

class Ocean { //TODO: fix counts
	//0=water, 1=right, 2=bowhead, 3=sperm
	constructor(n_players){
		if(n_players == 2){
			this.bag = [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3];
		}
		else if(n_players == 3){
			this.bag = [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3];
		}
		else if(n_players == 4){
			this.bag = [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3];
		}
		else {
			console.log("Invalid number of players ("+n_players+") for initializing the ocean");
		}
	}
	draw = function(n){ //n is number of tokens to draw. Returns an array of whale names / "water"
		
	}
}

class Game {
	constructor(players){ //players is an array of player names
		this.players = players; //first player for the round is the first in this list
		this.current_player = 0; //whose turn it currently is, index referencing this.players
		this.round = 1;
		
		this.ocean = new Ocean(this.players.length);
		this.whaling_result = [];
	}
	nextTurn = function(){ //called from the end_turn socket below
		
	}
	movementPhase = function(){
		
	}
	whalingPhase = function(){
		
	}
	nextRound = function(){
		
	}
}

//STORAGE ------------------------------------------------------

let players = {}; //holds Player objects, keys are player names (not socket ids)
let id_to_name = {}; //maps socket ids to names. If a name isn't in here, player is disconnected

let game = undefined; //defined in the start_game event below


// Add the WebSocket handlers
io.on("connection", function(socket) {
	
	//when a new player joins, check if player exists. If they don't, create new player. If they do, only allow join if that player was disconnected
	socket.on("new player", function(name, callback){
		if(!players.hasOwnProperty(name)){
			//new player
			console.log("New player: " + name + " (id: " + socket.id + ")");
			players[name] = new Player(name);
			id_to_name[socket.id] = name;
			callback(true); //successful
		}
		else if(players[name].connected){
			console.log(name + " is a duplicate name - asking them to try another");
			callback(false); //duplicate name, tell the client it's invalid
		}
		else {
			console.log(name + " reconnected (id: " + socket.id + ")");
			id_to_name[socket.id] = name; //add the new mapping
			callback(true); //successful
		}
	});
	
	//remove player when they leave
	socket.on("disconnect", function(){
		if(id_to_name.hasOwnProperty(socket.id)){
			console.log(player.name+" disconnected (id: " + socket.id + ")");
			let player = players[id_to_name[socket.id]];
			player.connected = false;
			delete id_to_name[socket.id];
		}
	});
	
	socket.on("remove_player", function(){
		if(id_to_name.hasOwnProperty(socket.id)){
			console.log(id_to_name[socket.id]+" was removed from the player list (id: " + socket.id + ")");
			delete players[id_to_name[socket.id]];
			delete id_to_name[socket.id];
		}
	}
	
	socket.on("start_game", function(){
		//consider putting players in a room?
		//consider having a moderator who advances through the phases?
		//all connected players are entered into the game - have a check for the required 2-4 players
		
	});
	
	socket.on("place_worker", function(place){ //place is a string
		
	});
	
	socket.on("choose_whale", function(whale, ship){ //whale: int, ship: 0|1
		
	});
	
	socket.on("end_turn", function(){
		
	});
});



/*
Notes
Consider putting the Game class in a separate module?


*/