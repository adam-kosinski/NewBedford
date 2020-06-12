//SETUP ---------------------------------------------------

let socket = io();
let id; //id of the socket


//CONNECTION TO SERVER -----------------------------------

//send a new player message to the server, and pick name
function registerName(){
	let name = prompt("Please enter a name:"); //TODO: make this a GUI thing not a prompt
	if(!name || name===""){
		registerName();
		return;
	}
	
	socket.emit("new player", name, function(success){
		console.log("Name registration success:",success);
		if(!success){
			alert("'"+name+"' is taken. Please choose another");
			registerName();
		}
	});
}

registerName();

//store the id of the connection
socket.on("connect", function(){
	console.log("My ID: "+socket.id);
	id = socket.id;
});


//check if a game is going on
socket.emit("get_state", function(players, game){
	if(game){
		game_active = true;
		init_game_display(players, game); //see init.js
	}
	else {
		home_screen.style.display = "block";
	}
});


//socket event handlers

socket.on("player_connection", function(players){
	//update player display on home screen
	player_display.innerHTML = "";
	for(name in players){
		if(players[name].connected){
			let div = document.createElement("div");
			div.id = name + "_home_screen";
			div.textContent = name;
			player_display.appendChild(div);
		}
	}
	
	//TODO: indicate on game screen if disconnected
	if(game_active){
		
	}
});

socket.on("start_game", function(players, game){
	game_active = true;
	init_game_display(players, game); //see init.js
});	


socket.on("state", function(players, game){
	console.log(players, game);
});



socket.on("banner", function(message){
	
});

