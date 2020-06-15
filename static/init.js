//Function to load the game display for the first time. Only called once (from client.js) usually.
//Most often called at game start, but also can be called mid-game (for reconnections etc.)

function init_game_display(players, game){	
	console.log("Initting game display");
	console.log(players, game);
	
	//add town image
	let town_image= document.createElement("img");
	town_image.src = "/static/images/town.png";
	town_image.id = "town_image";
	town.appendChild(town_image);
	
	
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
		new PlayerBoard(name, players[name], first_player);
	}
	
	//create building areas - everyone has the same order for these
	for(let i=0; i<game.players.length; i++){
		new BuildingArea(game.players[i]);
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
	warehouse.addWorkerSlot(9, 35);
	warehouse.addWorkerSlot(55, 35);
	warehouse.addWorkerSlot(9, 73);
	warehouse.addWorkerSlot(55, 73);
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
	
	
	//build any buildings already built
	for(let b=0; b<game.buildings.length; b++){
		let building = game.buildings[b];
		building_areas[building.owner].build(building.type);
	}
	
	//move any moved workers to appropriate building
	for(p=0; p<game.players.length; p++){
		let player = players[game.players[p]];
		console.log(player);
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
	
	//set the correct player's turn
	console.log(game);
	console.log(game.players[game.current_player])
	setTurn(game.players[game.current_player]); //will update selectable buildings for us (in case some aren't b/c of workers getting initialized on buildings)
		
	
	home_screen.style.display = "none";
	game_div.style.display = "block";
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
		
		let img = document.createElement("img");
		img.src = "/static/images/player_board.png";
		img.className = "player_board_img";
		this.div.appendChild(img);
		
		this.disconnected_div = document.createElement("div"); //div shown if a player disconnects
		this.disconnected_div.className = "disconnected";
		this.disconnected_div.textContent = "Disconnected";
		this.div.appendChild(this.disconnected_div);
		
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
				small_ship_right_whale: {x: 182, y: 50},
				small_ship_bowhead_whale: {x: 228, y: 50},
				small_ship_sperm_whale: {x: 274, y: 50},
				big_ship_right_whale: {x: 182, y: 160},
				big_ship_bowhead_whale: {x: 228, y: 160},
				big_ship_sperm_whale: {x: 274, y: 160},
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
				small_ship_right_whale: {x: 113, y: 30},
				small_ship_bowhead_whale: {x: 142, y: 30},
				small_ship_sperm_whale: {x: 171, y: 30},
				right_whale: {x: 113, y: 99},
				bowhead_whale: {x: 142, y: 99},
				sperm_whale: {x: 171, y: 99},
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
		this.small_ship.className = "small_ship";
		this.small_ship.style.left = this.location.small_ship_storage.x + "px";
		this.small_ship.style.top = this.location.small_ship_storage.y + "px";
		this.div.appendChild(this.small_ship);
		
		this.big_ship = document.createElement("img");
		this.big_ship.src = "/static/images/" + this.color + "_big_ship.png";
		this.big_ship.className = "big_ship";
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
	div.className = "whale_counter";
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
	
	player_board.div.appendChild(table);
}