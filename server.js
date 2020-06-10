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


//storage stuff
let players = {}; //holds Player objects, keys are player names (not socket ids)
let id_to_name = {}; //maps socket ids to names. If a name isn't in here, player is disconnected

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


// Add the WebSocket handlers
io.on("connection", function(socket) {
	
	//when a new player joins, check if player exists. If they don't, create new player. If they do, only allow join if that player was disconnected
	socket.on("new player", function(name, callback){
		if(!players.hasOwnProperty(name)){
			//new player
			players[name] = new Player(name);
			id_to_name[socket.id] = name;
			console.log("New player: " + name + " (id: " + socket.id + ")");
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
			player = players[id_to_name[socket.id]];
			player.connected = false;
			delete id_to_name[socket.id];
			console.log(player.name+" disconnected (id: " + socket.id + ")");
		}
	});
	
	
	socket.on("place_worker", function(place){ //place is a string
		
	});
	
	socket.on("choose_whale", function(whale, ship){ //whale: int, ship: 0|1
		
	});
});



/*
Notes
Track players by name, not socket id, so if disconnect then reconnect can associate with same player



*/