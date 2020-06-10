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
let players = {}; //holds Player objects





// Add the WebSocket handlers
io.on("connection", function(socket) {
	
	//when a new player joins, create a player object with the correct data
	socket.on("new player", function(name){
		players[socket.id] = name; //temp
		console.log("New player: " + name + " (id: " + socket.id + ")");
	});
	
	//remove player when they leave
	socket.on("disconnect", function(){
		if(players[socket.id]){
			console.log("Player disconnected (id: " + socket.id + ")");
			delete players[socket.id];
		}
	});
	
});