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
		else {
			init(); //see init.js
		}
	});
}

registerName();

//store the id of the connection
socket.on("connect", function(){
	console.log("My ID: "+socket.id);
	id = socket.id;
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
	start_game(players, game); //see init.js
});	


socket.on("state", function(state){
	console.log(state);
});



socket.on("banner", function(message){
	
});

