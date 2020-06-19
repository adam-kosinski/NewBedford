//SETUP ---------------------------------------------------

let socket = io();
let id; //id of the socket

//CONNECTION TO SERVER -----------------------------------

//send a new player message to the server, and pick name
function registerName(){
	//my_name declared in globals.js
	my_name = prompt("Please enter a name (< 11 characters or display problems happen):"); //TODO: make this a GUI thing not a prompt
	if(my_name===""){
		registerName();
		return;
	}
	if(!my_name){
		throw new Error("Name entry canceled, leaving webpage blank");
	}
	
	socket.emit("new player", my_name, function(success){
		console.log("Name registration success:",success);
		if(!success){
			alert("'"+my_name+"' is taken. Please choose another");
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
	for(let name in players){
		if(players[name].connected){
			let div = document.createElement("div");
			div.id = name + "_home_screen";
			div.textContent = name;
			player_display.appendChild(div);
		}
	}
	
	//indicate disconnected in game GUI if game active
	if(game_active){
		for(let name in players){
			if(player_boards.hasOwnProperty(name)){
				if(players[name].connected){
					player_boards[name].disconnected_div.style.display = "none";
				}
				else {
					player_boards[name].disconnected_div.style.display = "block";
				}
			}
		}
	}
});

socket.on("start_game", function(players, game){
	game_active = true;
	init_game_display(players, game); //see init.js
});


socket.on("state", function(players, game){
	console.log(players, game);
});



//events requiring "done" emit when finished

socket.on("move_worker", function(name, where){
	moveWorker(name, where); //see update.js
});

socket.on("move_ship", function(name, which_ship, where, priority){
	moveShip(name, which_ship, where, priority); //see update.js
});

socket.on("give", function(name, data, from){
	give(name, data, from); //see update.js
});

socket.on("build", function(name, building){
	document.getElementById(building + "-back").remove();
	building_areas[name].build(building);
});

socket.on("set_turn", function(name){
	setTurn(name); //see update.js
});

socket.on("banner", function(message){
	banner.textContent = message;
	banner.style.display = "block";
	fadeAnimate(banner, 0, 1, 1500, function(){
		setTimeout(function(){
			fadeAnimate(banner, 1, 0, 1000, function(){
				banner.style.display = "none";
				socket.emit("done");
			});
		}, 3500);
	});
});