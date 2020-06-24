//Function to load the game display for the first time. Only called once (from client.js) usually.
//Most often called at game start, but also can be called mid-game (for reconnections etc.)

function init_game_display(players, game){	
	console.log("Initting game display");
	console.log(players, game);
	
	home_screen.style.display = "none";
	game_div.style.display = "block";
	
	
	//add town and ocean images
	let town_image = document.createElement("img");
	town_image.src = "/static/images/town.png";
	town_image.id = "town_image";
	town.appendChild(town_image);
		
	let ocean_image = document.createElement("img");
	ocean_image.src = "/static/images/ocean.png";
	ocean_image.id = "ocean_image";
	ocean.appendChild(ocean_image);
	
	//add ship highlighter
	ship_highlighter = document.createElement("div");
	ship_highlighter.id = "ship_highlighter";
	ocean.appendChild(ship_highlighter);
	
	//add round counter whale and put it in correct place
	round_counter_whale = document.createElement("img");
	round_counter_whale.src = "/static/images/round_counter_whale.png";
	round_counter_whale.id = "round_counter_whale";
	ocean.appendChild(round_counter_whale);
	round = game.round;
	moveRoundCounterWhale(false);
	
	//position menus correctly
	document.getElementById("menus").style.left = game.players.includes(my_name) ? "370px" : "250px";
	
	
	//cycle the list of players so that my player board is shown first (at the top), but the order is still right
	let ordered_game_players = game.players.slice();
	if(ordered_game_players.includes(my_name)){
		while(ordered_game_players[0] != my_name){
			ordered_game_players.push(ordered_game_players.splice(0,1));
		}
	}
	
	//create player boards
	for(let p=0; p<ordered_game_players.length; p++){
		let name = ordered_game_players[p];
		let first_player = game.players[0] == name;
		let player_board = new PlayerBoard(name, players[name], first_player);
		
		//display whales sitting on that player's ships
		player_board.small_ship_right_whale_counter.set(players[name].small_ship.right_whales);
		player_board.small_ship_bowhead_whale_counter.set(players[name].small_ship.bowhead_whales);
		player_board.small_ship_sperm_whale_counter.set(players[name].small_ship.sperm_whales);
		player_board.big_ship_right_whale_counter.set(players[name].big_ship.right_whales);
		player_board.big_ship_bowhead_whale_counter.set(players[name].big_ship.bowhead_whales);
		player_board.big_ship_sperm_whale_counter.set(players[name].big_ship.sperm_whales);
		
		//display returned whales
		player_board.right_whale_counter.set(players[name].right_whales);
		player_board.bowhead_whale_counter.set(players[name].bowhead_whales);
		player_board.sperm_whale_counter.set(players[name].sperm_whales);
	}
	
	//display whales sitting on ships
	for(let p=0; p<game.players.length; p++){
		let name = game.players[p];
	}
	
	//create building areas - everyone should have the same order for these, so use order from the server's players object (game order cycles based on round)
	for(let name in players){
		if(game.players.includes(name)){
			new BuildingArea(name);
		}
	}
	
	
	//set up town and ocean with Building objects
	
	let general_store = new Building("general_store", 90, 120);
	general_store.setPosition(104, 5);
	general_store.addWorkerSlot(9, 35);
	general_store.addWorkerSlot(55, 35);
	general_store.addWorkerSlot(9, 73);
	general_store.addWorkerSlot(55, 73);
	town.appendChild(general_store.div);
	
	let warehouse = new Building("warehouse", 90, 120);
	warehouse.setPosition(200, 275);
	warehouse.addWorkerSlot(9, 20);
	warehouse.addWorkerSlot(55, 20);
	warehouse.addWorkerSlot(9, 57);
	warehouse.addWorkerSlot(55, 57);
	town.appendChild(warehouse.div);
	
	let forest = new Building("forest", 120, 90);
	forest.setPosition(6, 205);
	forest.addWorkerSlot(46, 45);
	forest.addWorkerSlot(6, 45);
	forest.addWorkerSlot(86, 45);
	forest.addWorkerSlot(66, 10);
	town.appendChild(forest.div);
	
	let farm = new Building("farm", 120, 90);
	farm.setPosition(276, 105);
	farm.addWorkerSlot(46, 45);
	farm.addWorkerSlot(6, 45);
	farm.addWorkerSlot(86, 45);
	farm.addWorkerSlot(26, 10);
	town.appendChild(farm.div);
	
	let town_hall = new Building("town_hall", 90, 120);
	town_hall.setPosition(155, 140);
	town_hall.addWorkerSlot(9, 35);
	town_hall.addWorkerSlot(55, 35);
	town_hall.addWorkerSlot(9, 73);
	town_hall.addWorkerSlot(55, 73);
	town.appendChild(town_hall.div);
	
	let dockyard = new Building("dockyard", 125, 90);
	dockyard.addWorkerSlot(30, 37);
	dockyard.addWorkerSlot(65, 37);
	dockyard.addWorkerSlot(3, 52);
	dockyard.addWorkerSlot(93, 52);
	ocean.appendChild(dockyard.div);
	
	let city_pier = new Building("city_pier", 125, 90);
	city_pier.setPosition(125, 0);
	city_pier.addWorkerSlot(30, 37);
	city_pier.addWorkerSlot(64, 37);
	city_pier.addWorkerSlot(3, 52);
	city_pier.addWorkerSlot(93, 52);
	ocean.appendChild(city_pier.div);
	
	
	//add dock slots - first added get preference when placing a ship on the dock
	//First set is going up the dock w/ space in between. Second set fills in the gaps, third set gets the ones overlapping the worker tiles
	newDockSlot(ocean_center_x, 143, 17);
	newDockSlot(ocean_center_x, 97, 15);
	
	newDockSlot(ocean_center_x, 166, 18);
	newDockSlot(ocean_center_x, 120, 16);
	newDockSlot(ocean_center_x, 74, 14);
	
	newDockSlot(ocean_center_x, 51, 13);	
	newDockSlot(ocean_center_x, 28, 12);
	newDockSlot(ocean_center_x, 5, 11);
	
	
	
	//build any buildings already built
	for(let b=0; b<game.buildings.length; b++){
		let building = game.buildings[b];
		if(building.owner){
			building_areas[building.owner].build(building.type, false); //false - don't animate
			document.getElementById(building.type + "-back").remove(); //remove from build menu
		}
	}
	
	//move any moved workers to appropriate building
	for(p=0; p<game.players.length; p++){
		let player = players[game.players[p]];
		for(w=0; w<player.workers_at.length; w++){
			
			let worker_location = player.workers_at[w];
			if(worker_location != "player_board"){
				//move worker to the building
				let worker = player_boards[player.name].div.getElementsByClassName("worker")[0];
				let worker_slot = buildings[worker_location].getOpenWorkerSlot();
				worker.style.top = "0";
				worker.style.left = "0";
				worker_slot.appendChild(worker);
			}
			
		}
	}
	
	//put ships in correct places
	updateShipPriorityAndDistance(); //see update.js
	for(let name in player_boards){
		let small_ship_dist = players[name].small_ship.distance;
		let big_ship_dist = players[name].big_ship.distance;

		//do checks to see if we need to move the ships from storage
		//small ship
		if(small_ship_dist != undefined){
			let ship = player_boards[name].small_ship;
			let priority = players[name].small_ship.priority;
			ship.style.left = whaling_track_origin.x + (priority-1)*whaling_priority_offset - 0.5*ship.width + "px";
			ship.style.top = whaling_track_origin.y + (small_ship_dist+1)*whaling_row_offset - 0.6*ship.height + "px";
			ship.style.zIndex = 4 - priority;
			ocean.appendChild(ship);
		}
		else if(players[name].small_ship.prepared){
			let ship = player_boards[name].small_ship;
			let dock_slot = getOpenDockSlot();
			ship.style.left = -0.5*ship.width + "px";
			ship.style.top = "0px";
			
			dock_slot.appendChild(ship);
		}
		
		//big ship
		if(big_ship_dist != undefined){
			let ship = player_boards[name].big_ship;
			let priority = players[name].big_ship.priority;
			ship.style.left = whaling_track_origin.x + (priority-1)*whaling_priority_offset - 0.5*ship.width + "px";
			ship.style.top = whaling_track_origin.y + (big_ship_dist+1)*whaling_row_offset - 0.6*ship.height + "px";
			ship.style.zIndex = 4 - priority;
			ocean.appendChild(ship);
		}
		else if(players[name].big_ship.prepared){
			let ship = player_boards[name].big_ship;
			let dock_slot = getOpenDockSlot();
			
			ship.style.left = -0.5*ship.width + "px";
			ship.style.top = "0px";
			
			dock_slot.appendChild(ship);
		}
	}
	
	//display any drawn whales
	for(let i=0; i<game.ocean.whaling_result.length; i++){
		let whale_type = game.ocean.whaling_result[i]; //"empty_sea","right_whale","bowhead_whale", "sperm_whale", or undefined if it was taken
		if(whale_type == undefined){
			continue;
		}
		
		let whale = document.createElement("img");
		whale.src = "/static/images/" + whale_type + ".png";
		whale.id = "whale_" + i;
		whale.className = "whale";
		if(whale_type == "empty_sea"){whale.classList.add("empty_sea");}
		
		whale.style.left = whale_storage_origin.x + "px";
		whale.style.top = whale_storage_origin.y + i*whale_storage_offset_y + "px";
		
		ocean.appendChild(whale);
	}
	
	//get correct whale chooser
	if(game.ocean.whale_choose_idx != undefined){
		let choosing_ship = game.ocean.whale_choose_queue[game.ocean.whale_choose_idx];
		setWhaleChooser(choosing_ship.owner, choosing_ship.type); //whaling.js
	}
	
	//show returning ship if a ship is returning right now
	if(game.return_queue.length > 0){
		let ship = game.return_queue[0];
		startReturn(ship.owner, ship.type, false);
	}
	
	//show sell_whale_popup if a whale is currently being sold
	if(game.selling){ //game.selling is either undefined or an object
		whale_seller = game.selling.seller;
		whale_to_sell = game.selling.whale_type;
		whale_buyer = game.current_buyer;
		openPopup("sell_whale_popup");
	}
	
	
	
	town_bounding_box = getTownBoundingBox();
	updateGameDivSize();
	
	//set the correct player's turn
	setTurn(game.players[game.current_player]); //will update selectable buildings for us (in case some aren't b/c of workers getting initialized on buildings)
}




class PlayerBoard {
	constructor(name, state, first_player){
		this.name = name;
		this.color = state.color;
		
		this.div = document.createElement("div");
		this.div.className = "player_board";
		if(name == my_name){this.div.id = "my_player_board";}
		
		let name_display = document.createElement("p");
		name_display.textContent = name;
		name_display.className = "name_display";
		this.div.appendChild(name_display);
		
		this.misc_items = document.createElement("div");
		this.misc_items.className = "misc_items";
		let color_map = {
			yellow: "#ffff99",
			orange: "#ffdb99",
			blue: "#9999ff",
			green: "#b3e6b3"
		};
		this.misc_items.style.backgroundColor = color_map[this.color];
		this.div.appendChild(this.misc_items);
		
		let img = document.createElement("img");
		img.src = "/static/images/player_board.png";
		img.className = "player_board_img";
		this.div.appendChild(img);
		
		this.disconnected_div = document.createElement("div"); //div shown if a player disconnects
		this.disconnected_div.className = "disconnected";
		this.disconnected_div.textContent = "Disconnected";
		this.div.appendChild(this.disconnected_div);
		
		//center locations - w/ respect to top left of player board aka the main image
		if(name == my_name){
			this.location = {
				food: {x: 26, y: 33},
				wood: {x: 59, y: 33},
				brick: {x: 92, y: 33},
				money: {x: 123, y: 33},
				right_whale: {x: 28, y: 164},
				bowhead_whale: {x: 72, y: 164},
				sperm_whale: {x: 116, y: 164},
				small_ship_right_whale: {x: 184, y: 50},
				small_ship_bowhead_whale: {x: 232, y: 50},
				small_ship_sperm_whale: {x: 279, y: 50},
				big_ship_right_whale: {x: 184, y: 160},
				big_ship_bowhead_whale: {x: 232, y: 160},
				big_ship_sperm_whale: {x: 279, y: 160},
				worker_1_storage: {x: 5, y: 210},
				worker_2_storage: {x: 45, y: 210},
				small_ship_storage: {x: 85, y: 213},
				big_ship_storage: {x: 125, y: 208}
			};
		}
		else {
			this.location = {
				food: {x: 12, y: 21},
				wood: {x: 34, y: 21},
				brick: {x: 55, y: 21},
				money: {x: 76, y: 21},
				right_whale: {x: 17, y: 101},
				bowhead_whale: {x: 45, y: 101},
				sperm_whale: {x: 72, y: 101},
				small_ship_right_whale: {x: 114, y: 30},
				small_ship_bowhead_whale: {x: 145, y: 30},
				small_ship_sperm_whale: {x: 174, y: 30},
				big_ship_right_whale: {x: 114, y: 99},
				big_ship_bowhead_whale: {x: 145, y: 99},
				big_ship_sperm_whale: {x: 174, y: 99},
				worker_1_storage: {x: 5, y: 135},
				worker_2_storage: {x: 45, y: 135},
				small_ship_storage: {x: 85, y: 138},
				big_ship_storage: {x: 125, y: 133}
			};
		};
		
		
		//workers and ships

		this.worker_1 = document.createElement("img");
		this.worker_1.src = "/static/images/" + this.color + "_worker.png";
		this.worker_1.className = "worker";
		this.worker_1.style.left = this.location.worker_1_storage.x + "px";
		this.worker_1.style.top = this.location.worker_1_storage.y + "px";
		this.div.appendChild(this.worker_1);
		
		this.worker_2 = document.createElement("img");
		this.worker_2.src = "/static/images/" + this.color + "_worker.png";
		this.worker_2.className = "worker";
		this.worker_2.style.left = this.location.worker_2_storage.x + "px";
		this.worker_2.style.top = this.location.worker_2_storage.y + "px";
		this.div.appendChild(this.worker_2);
		
		this.small_ship = document.createElement("img");
		this.small_ship.src = "/static/images/" + this.color + "_small_ship.png";
		this.small_ship.className = "small_ship ship";
		this.small_ship.style.left = this.location.small_ship_storage.x + "px";
		this.small_ship.style.top = this.location.small_ship_storage.y + "px";
		this.div.appendChild(this.small_ship);
		
		this.big_ship = document.createElement("img");
		this.big_ship.src = "/static/images/" + this.color + "_big_ship.png";
		this.big_ship.className = "big_ship ship";
		this.big_ship.style.left = this.location.big_ship_storage.x + "px";
		this.big_ship.style.top = this.location.big_ship_storage.y + "px";
		this.div.appendChild(this.big_ship);
		
		//first player token
		this.first_player_token_spot = document.createElement("div");
		this.first_player_token_spot.className = "first_player_token_spot";
		if(first_player){
			this.first_player_token_spot.appendChild(first_player_token);
		}
		this.div.appendChild(this.first_player_token_spot);
		
		
		//resources
		let resource_table = document.createElement("table");
		resource_table.className = "resource_table";
		let tbody = document.createElement("tbody");
		
		let tr = document.createElement("tr");
		let resource_src = ["food_3d.png", "wood_3d.png", "brick_3d.png", "small_coin_front.png"];
		for(let i=0; i<4; i++){
			let td = document.createElement("td");
			td.className = "resource";
			let img = document.createElement("img");
			img.src = "/static/images/" + resource_src[i];
			img.className = "resource";
			
			td.appendChild(img);
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
		
		tr = document.createElement("tr");
		let resources = ["food", "wood", "brick", "money"];
		for(let i=0; i<4; i++){
			let td = document.createElement("td");
			td.className = "resource";
			let p = document.createElement("p");
			p.className = "resource";
			p.textContent = state[resources[i]];
			this[resources[i] + "_counter"] = p;
			
			td.appendChild(p);
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
		resource_table.appendChild(tbody);
		this.div.appendChild(resource_table);
		
		
		//whale counters
		newWhaleCounterTable("returned_counters", "", this); //see below for function definition
		newWhaleCounterTable("small_ship_counters", "small_ship_", this);
		newWhaleCounterTable("big_ship_counters", "big_ship_", this);
		
		
		//add to DOM
		player_board_container.appendChild(this.div);
		
		//add to references
		player_boards[name] = this;
	}
}




function newWhaleCounter(type) { //used by the PlayerBoard constructor to avoid repeated code
	//type can be "right_whale" "bowhead_whale" or "sperm_whale"
	
	let div = document.createElement("div");
	div.classList.add("whale_counter");
	div.classList.add(type + "_counter");
	div.textContent = "0";
	
	div.set = function(n){
		div.textContent = n;
		if(n > 0){
			div.style.backgroundImage = "url('/static/images/" + type + ".png')";
		}
		else {
			div.style.backgroundImage = "none";
		}
	}
	
	div.addOne = function(){
		div.set(Number(div.textContent)+1);
	}
	
	div.subtractOne = function(){
		div.set(Number(div.textContent)-1);
	}
	
	return div;
}

function newWhaleCounterTable(className, prefix, player_board){
	let whales = ["right_whale","bowhead_whale","sperm_whale"];
	
	let table = document.createElement("table");
	table.className = className;
	tbody = document.createElement("tbody");
	tr = document.createElement("tr");
	for(let i=0; i<3; i++){
		let td = document.createElement("td");
		let counter = newWhaleCounter(whales[i]);
		player_board[prefix + whales[i] + "_counter"] = counter;
		td.appendChild(counter);
		tr.appendChild(td);
	}
	tbody.appendChild(tr);
	table.appendChild(tbody);
	
	player_board[prefix + "whale_counter_table"] = table;
	player_board.div.appendChild(table);
}








function newDockSlot(x, y, z_index){
	//x and y relative to the ocean div, and indicating the top-MIDDLE of the where the ship should go
	
	let slot = document.createElement("div");
	slot.className = "dock_slot";
	slot.style.left = x + "px";
	slot.style.top = y + "px";
	slot.style.zIndex = z_index;
	
	dock_slots.push(slot);
	ocean.appendChild(slot);
}


function getOpenDockSlot(){
	for(let i=0; i<dock_slots.length; i++){
		let slot = dock_slots[i];
		if(slot.children.length == 0){
			return slot;
		}
	}
	throw new Error("Couldn't find empty dock slot");
}