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
		this.color = undefined; //defined at game start
		
		this.first_player = false; //if you're first player this round
		this.current_player = false; //if it's your turn
		
		this.ships = [new Ship(), new Ship()];
		this.workers_left = 2;
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
		this.distance = -1; //how far out to sea it is, -1 is not out at sea, 0 is returning
		this.priority = 1; //1, 2, or 3
		this.right_whales = 0;
		this.bowhead_whales = 0;
		this.sperm_whales = 0;
	}
}

class Building {
	constructor(name, in_town, first, normal=function(){}){ //in_town is a bool, first and normal are functions to run when workers are placed here
		this.name = name;
		this.in_town = name;
		this.first = first;
		this.normal = normal;
		this.workers = 0;
		this.owner = undefined;
	}
	placeWorker(name){
		this.workers++;
		if(this.workers == 1){
			this.first();
		}
		else {
			this.normal();
		}
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
	draw_tokens(n_tokens){
		
	}
}

class Game {
	constructor(players){ //players is an array of player names
		this.players = players; //first player for the round is the first in this list
		this.current_player = 0; //whose turn it currently is, index referencing this.players
		this.round = 1;
		
		this.ocean = new Ocean(this.players.length);
		this.whaling_result = [];
		
		this.buildings = []; //contains town and player Building objects. TODO: add town buildings
		this.unbuilt = []; //unbuilt Building objects
	}
	nextTurn(){ //called from the end_turn event below
		
	}
	movementPhase(show_banner=true){
		//tell sockets to animate the banner indicating the movement phase
		//set timeout to wait for that to finish
		//do ships at distance 1 one at a time based on priority
			//to move ship - change vars here, tell sockets to animate certain ships
			//return if necessary - more complications here
		//do ships at distance 2+ all at once
	}
	whalingPhase(){
		
	}
	nextRound(){
		//remember to clear workers from buildings
	}
	returnAllShips(){
		//do movement phase a bunch - w/o movement phase banner though
	}
}

//STORAGE ------------------------------------------------------

let players = {}; //holds Player objects, keys are player names (not socket ids)
let id_to_name = {}; //maps socket ids to names. If a name isn't in here, player is disconnected

let game = undefined; //defined in the start_game event below
let buildings = {}; //holds Building objects, keys are building names. Populated in a separate module when app starts

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
			players[name].connected = true;
			callback(true); //successful
		}
		io.sockets.emit("player_connection", players);
	});
	
	//mark player as disconnected when they leave
	socket.on("disconnect", function(){
		if(id_to_name.hasOwnProperty(socket.id)){
			console.log(id_to_name[socket.id]+" disconnected (id: " + socket.id + ")");
			let player = players[id_to_name[socket.id]];
			player.connected = false;
			delete id_to_name[socket.id];
		}
		io.sockets.emit("player_connection", players);
	});
	
	//remove player from memory if player says to
	socket.on("remove_player", function(){
		if(id_to_name.hasOwnProperty(socket.id)){
			console.log(id_to_name[socket.id]+" was removed from the player list (id: " + socket.id + ")");
			delete players[id_to_name[socket.id]];
			delete id_to_name[socket.id];
		}
	});
	
	socket.on("start_game", function(){
		//consider putting players in a room? - prob. not, I'll have spectator players for now
		//consider having a moderator who advances through the phases?
		//check for the required 2-4 players
		console.log("starting game");
		
		let game_players = Object.keys(players);
		if(game_players.length > 4){game_players.splice(4);} //double check 4 players max
		game = new Game(game_players);
		
		io.sockets.emit("start_game", players, game);
	});
	
	socket.on("initial_resources", function(){
		
	});
	
	socket.on("place_worker", function(place){ //place is a string
		
	});
	
	socket.on("build", function(building){ //building is a string
		
	});
	
	socket.on("choose_whale", function(whale, ship){ //whale: int, ship: 0|1
		
	});
	
	socket.on("end_turn", function(){
		
	});
});


function clearGame(){
	
}


game = new Game(["fluffet","penguin"]);

/*
Notes
Consider putting the Game class in a separate module?
Put building definitions in a separate module

*/