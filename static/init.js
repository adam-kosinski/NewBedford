//Function to load the game display for the first time. Only called once (from client.js) usually.
//Most often called at game start, but also can be called mid-game (for reconnections etc.)

function init_game_display(players, game){	
	console.log("Initting game display");
	console.log(players, game);
	
	//cycle the list of players so that my player board is shown first (at the top), but the order is still right
	let ordered_game_players = game.players.slice();
	if(ordered_game_players.includes(my_name)){
		while(ordered_game_players[0] != my_name){
			ordered_game_players.push(ordered_game_players.splice(0,1));
		}
	}
	
	console.log("ordered",ordered_game_players);
	
	//create player boards
	for(let p=0; p<ordered_game_players.length; p++){
		let name = ordered_game_players[p];
		let first_player = game.players[0] == name;
		let player_board = new PlayerBoard(name, players[name].color, first_player);
		player_boards[name] = player_board;
	}
	
	
	
	town.style.top = (window.innerHeight-400)/2 + "px";
	town.style.top = "500px";
	home_screen.style.display = "none";
	game_div.style.display = "block";
}



class PlayerBoard {
	constructor(name, color, first_player){
		this.name = name;
		
		this.div = document.createElement("div");
		this.div.className = "player_board";
		if(name == my_name){this.div.id = "my_player_board";}
		
		this.name_display = document.createElement("p");
		this.name_display.textContent = name;
		this.name_display.className = "name_display";
		this.div.appendChild(this.name_display);
		
		this.image = document.createElement("img");
		this.image.src = "/static/images/player_board.png";
		this.image.className = "player_board_img";
		this.div.appendChild(this.image);
		
		this.misc_items = document.createElement("div");
		this.misc_items.className = "misc_items";
		let color_map = {
			yellow: "#ffff99",
			orange: "#ffdb99",
			blue: "#9999ff",
			green: "#99ff99"
		};
		this.misc_items.style.backgroundColor = color_map[color];
		this.div.appendChild(this.misc_items);
		
		
		//center locations - w/ respect to top left of player board aka the main image
		if(name == my_name){
			this.location = {
				food: {x: 20, y: 33},
				wood: {x: 60, y: 33},
				brick: {x: 100, y: 33},
				money: {x: 140, y: 33},
				right_whale: {x: 28, y: 164},
				bowhead_whale: {x: 72, y: 164},
				sperm_whale: {x: 116, y: 164},
				small_ship: {
					right_whale: {x: 182, y: 50},
					bowhead_whale: {x: 228, y: 50},
					sperm_whale: {x: 274, y: 50}
				},
				big_ship: {
					right_whale: {x: 182, y: 160},
					bowhead_whale: {x: 228, y: 160},
					sperm_whale: {x: 274, y: 160}
				}
			};
		}
		else {
			this.location = {
				food: {x: 12, y: 21},
				wood: {x: 37, y: 21},
				brick: {x: 62, y: 21},
				money: {x: 87, y: 21},
				right_whale: {x: 17, y: 101},
				bowhead_whale: {x: 45, y: 101},
				sperm_whale: {x: 72, y: 101},
				small_ship: {
					right_whale: {x: 113, y: 30},
					bowhead_whale: {x: 142, y: 30},
					sperm_whale: {x: 171, y: 30}
				},
				big_ship: {
					right_whale: {x: 113, y: 99},
					bowhead_whale: {x: 142, y: 99},
					sperm_whale: {x: 171, y: 99}
				}
			};
		};
		
		
		//workers and ships

		this.worker_1 = document.createElement("img");
		this.worker_1.src = "/static/images/" + color + "_worker.png";
		this.worker_1.className = "worker";
		this.worker_1.storageOffset = "5px";
		this.worker_1.style.left = this.worker_1.storageOffset;
		this.misc_items.appendChild(this.worker_1);
		
		this.worker_2 = document.createElement("img");
		this.worker_2.src = "/static/images/" + color + "_worker.png";
		this.worker_2.className = "worker";
		this.worker_2.storageOffset = "45px";
		this.worker_2.style.left = this.worker_2.storageOffset;
		this.misc_items.appendChild(this.worker_2);
		
		this.small_ship = document.createElement("img");
		this.small_ship.src = "/static/images/" + color + "_small_ship.png";
		this.small_ship.className = "small_ship";
		this.small_ship.storageOffset = "85px";
		this.small_ship.style.left = this.small_ship.storageOffset;
		this.misc_items.appendChild(this.small_ship);
		
		this.big_ship = document.createElement("img");
		this.big_ship.src = "/static/images/" + color + "_big_ship.png";
		this.big_ship.className = "big_ship";
		this.big_ship.storageOffset = "125px";
		this.big_ship.style.left = this.big_ship.storageOffset;
		this.misc_items.appendChild(this.big_ship);
		
		
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
		let counter_names = ["food_counter", "wood_counter", "brick_counter", "money_counter"];
		for(let i=0; i<4; i++){
			let td = document.createElement("td");
			td.className = "resource";
			let p = document.createElement("p");
			p.className = "resource";
			p.textContent = "0";
			this[counter_names[i]] = p;
			
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
		if(name == my_name){
			player_board_container.insertBefore(this.div, player_board_container.firstElementChild);
		}
		else {
			player_board_container.appendChild(this.div);
		}
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