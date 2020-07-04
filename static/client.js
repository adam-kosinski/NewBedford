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
			my_name = undefined;
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
	round = 0;
	init_game_display(players, game); //see init.js
});



//Debugging functions for getting stuff from the server

function getState(){ //debugging only
	socket.emit("get_state",function(players,game){
		console.log(players,game);
	});
}
function getQueue(){ //debugging only
	socket.emit("get_queue",function(queue,busy_clients){
		console.log(queue, busy_clients);
	});
}




//events requiring "done" emit when finished

socket.on("move_worker", function(name, where, emit_done=true){
	moveWorker(name, where, emit_done); //see update.js
});

socket.on("move_ship", function(name, which_ship, where, priority){
	moveShip(name, which_ship, where, priority); //see update.js
});

socket.on("give", function(name, data, from){
	give(name, data, from); //see update.js
});

socket.on("build", function(name, building){
	document.getElementById(building + "-back").style.display = "none";
	building_areas[name].build(building);
});

socket.on("move_post_office", function(name){
	building_areas[name].movePostOfficeHere(); //buildings.js
});

socket.on("sell_empty_sea", function(n){
	sellEmptySea(n); //update.js
});

socket.on("show_ocean_bag", function(){
	showOceanBag(); //whaling.js
});

socket.on("hide_ocean_bag", function(){
	hideOceanBag(); //whaling.js
});

socket.on("clear_previous_whales", function(){
	clearPreviousWhales(); //whaling.js
});

socket.on("draw_whale", function(type, index){
	drawWhale(type, index); //whaling.js
});

socket.on("set_turn", function(name){
	setTurn(name); //see update.js
});

socket.on("set_whale_chooser", function(name, which_ship){
	setWhaleChooser(name, which_ship); //whaling.js
});

socket.on("choose_whale", function(name, which_ship, whale_type, idx){
	chooseWhale(name, which_ship, whale_type, idx); //whaling.js
});

socket.on("start_return", function(name, which_ship){
	startReturn(name, which_ship); //whaling.js
});

socket.on("pay_for_whale", function(name, which_ship, whale_type, buyer){
	payForWhale(name, which_ship, whale_type, buyer); //whaling.js
});

socket.on("pay_whale_seller", function(name, which_ship, whale_type){
	payWhaleSeller(name, which_ship, whale_type); //whaling.js
});

socket.on("sell_whale_popup", function(seller, whale_type, buyer){
	whale_bought_or_passed = false;
	
	whale_seller = seller;
	whale_to_sell = whale_type;
	whale_buyer = buyer;
	openPopup("sell_whale_popup");
	socket.emit("done");
});

socket.on("return_whale", function(name, which_ship, whale_type, buyer){
	returnWhale(name, which_ship, whale_type, buyer); //whaling.js
});

socket.on("trash_whale", function(name, which_ship, whale_type){
	trashWhale(name, which_ship, whale_type); //whaling.js
});

socket.on("finish_return", function(){
	finishReturn(); //whaling.js
});

socket.on("move_round_counter_whale", function(game_round){
	round = game_round;
	moveRoundCounterWhale(); //update.js
});

socket.on("move_first_player_token", function(name){
	moveFirstPlayerToken(name); //update.js
});

socket.on("start_inn_phase", function(inn_player){
	if(my_name == inn_player){
		alert("Place your workers again (because you used the inn). Only common town/whaling actions are allowed; you may not place a worker on a building owned by a player.");
	}
	inn_phase_active = true;
	socket.emit("done");
});

socket.on("end_inn_phase", function(){
	inn_phase_active = false;
	socket.emit("done");
});

socket.on("pay_for", function(name, resource, step){
	payFor(name, resource, step); //update.js
});

socket.on("banner", function(message){
	banner.textContent = message;
	banner.style.display = "block";
	fadeAnimate(banner, 0, 1, 1000, function(){
		setTimeout(function(){
			fadeAnimate(banner, 1, 0, 1000, function(){
				banner.style.display = "none";
				socket.emit("done");
			});
		}, 1000);
	});
});



//clear game
socket.on("clear_game", function(){
	//clear data
	opened_store = undefined;
	build_menu_select_mode = false;
	build_type = "town_hall";
	building_to_build = undefined;
	first_discount = undefined;
	second_discount = undefined;
	launch_type = "city_pier";
	whale_seller = undefined;
	whale_to_sell = undefined;
	whale_buyer = undefined;
	lighthouse_screen_open = false;
	
	player_boards = {};
	buildings = {};
	building_areas = {};
	dock_slots = [];
	
	game_active = false;
	inn_phase_active = false;
	round = 1;
	animation_in_progress = false; //click event handlers only run when this is false
	my_turn = false;
	returning_whale = false;
	whale_bought_or_passed = true;
	pay_for_used = false;

	town_bounding_box = { //initialize explicitly w/o the function b/c when loading the page sizes haven't been established yet
		x_min: 376,
		x_max: 766,
		y_min: 90,
		y_max: 480
	};

	
	//reset GUI
	closePopups();	
	
	game_div.appendChild(board); //in case any of these were being animated in animation_div at the time
	board.appendChild(town);
	board.appendChild(ocean);
	
	town.innerHTML = "";
	ocean.innerHTML = "";
	player_board_container.innerHTML = "";
	animation_div.innerHTML = "";
	
	let floating_whales = ocean_bag.getElementsByClassName("whale");
	for(let i=0; i<floating_whales.length; i++){
		floating_whales[i].remove();
	}
	
	let building_backs = document.getElementById("build_menu_buildings").getElementsByTagName("IMG");
	for(let i=0; i<building_backs.length; i++){
		building_backs[i].style.display = "block";
	}
	
	//reset to original style
	animation_div.style.zIndex = "";
	town.style.left = "";
	town.style.top = "";
	ocean.style.left = "";
	ocean.style.top = "";
	ocean.style.zIndex = "";
	ocean.style.cursor = "";
	board.style.left = "";
	board.style.top = "";
	ocean_bag.style.left = "";
	ocean_bag.style.top = "";
	game_div.style.width = "";
	game_div.style.height = "";
	
	banner.style.display = "none";
	choose_whale_sign.style.display = "none";
	ocean_mask.style.display = "none";
	ocean_mask_sign.style.display = "none";
	
	//show home screen
	game_div.style.display = "none";
	home_screen.style.display = "block";
});