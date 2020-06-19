/*
Notes

Change dialog windows to my own popups - I think leaving one open too long can mess with the socket connection
Make player boards the correct color (the ships on there are colored !!)
Currently easy to mistype your name when reentering, make that better - low priority
Why is 'name' in the global scope being assigned a player name? Why is 'name' even in the global scope? 

Remember when returning ships to remove their z-index property so the dock slots will work properly. ship.style.zIndex = ""; (default)

Fix it so that clicking on any of a buildings children will activate the building

FIX INCORRECT NUMBER OF BUILDING SLOTS FOR TOWN BUILDINGS - should be 8, not 4
*/


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
		
		this.workers_at = ["player_board", "player_board"]; //can contain "player_board" or building names
		this.small_ship = new Ship(name, "small");
		this.big_ship = new Ship(name, "big");
		this.food = 20;
		this.wood = 20;
		this.brick = 20;
		this.money = 20;
		
		this.right_whales = 0;
		this.bowhead_whales = 0;
		this.sperm_whales = 0;
	}
}

class Ship {
	constructor(owner, type){ //owner: a player name, type is "small" or "big"
		this.owner = owner;
		this.type = type;
		this.prepared = false; //if prepared and on the dock
		this.distance = undefined; //how far out to sea it is, -1 is returning, undefined is not at sea
		this.priority = 1; //1, 2, or 3
		this.right_whales = 0;
		this.bowhead_whales = 0;
		this.sperm_whales = 0;
	}
}

class Building {
	constructor(type, in_town, first_function, normal_function){ //in_town is a bool, first and normal are functions to run when workers are placed here. normal is optional, only if different from first
		this.type = type;
		this.in_town = in_town;
		this.first_function = first_function;
		this.normal_function = normal_function;
		this.workers = 0;
		this.owner = undefined;
		
		buildings[type] = this;
	}
	placeWorker(name, data){ //name: player name, data: optional object
		//tell player where their worker is going
		let worker_index = players[name].workers_at.indexOf("player_board");
		if(worker_index != -1){
			players[name].workers_at[worker_index] = this.type;
		}
		else {console.log("Couldn't find available worker in Player object");}
		
		
		//move worker
		this.workers++;
		let building_name = this.type; //can't reference 'this' in the queue
		queue.push(function(){
			io.sockets.emit("move_worker", name, building_name);
			console.log("queue emitting move_worker");
		});
		
		
		//pay owner if not a town building and don't own the building
		if(!this.in_town && name != this.owner){
			let owner = this.owner;
			queue.push(function(){
				io.sockets.emit("give", owner, {money: 1}, name);
				players[name].money -= 1;
				players[owner].money += 1;
				console.log("queue emitting pay building owner");
			});
		}
		
		
		//do the building action
		if(this.workers == 1 || this.normal_function === undefined){
			this.first_function(name, data);
		}
		else {
			this.normal_function(name, data);
		}
		
		game.nextTurn();
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
		this.worker_cycle = 0; //0 or 1, depending on if players are placing their first or second player
		this.round = 1;
		
		this.ocean = new Ocean(this.players.length);
		this.return_queue = []; //holds Ship objects needing to be returned (during movement phase). Index 0 returns first
		this.whaling_result = [];
		
		this.buildings = []; //contains town and player Building objects.
		this.unbuilt = []; //unbuilt Building objects
		initBuildings();
		
		for(let b in buildings){
			if(buildings[b].in_town){
				this.buildings.push(buildings[b]);
			}
			else {
				this.unbuilt.push(buildings[b]);
			}
		}
	}
	nextTurn(){
		this.current_player++;
		
		if(this.current_player >= this.players.length){
			if(this.worker_cycle == 0){
				console.log("Starting second worker cycle");
				this.worker_cycle = 1;
				this.current_player = 0;
				//then continue on to tell sockets to change player turn (below)
			}
			else {
				//set it to no one's turn, then do movement phase
				queue.push(function(){
					io.sockets.emit("set_turn", undefined);
					console.log("queue emitting set_turn for no one");
				});
				this.movementPhase();
				return;
			}
		}
		//tell sockets to change player turn
		let cur_player_name = this.players[this.current_player]; //can't use 'this' inside a queue push
		queue.push(function(){
			io.sockets.emit("set_turn", cur_player_name);
			console.log("queue emitting set_turn for "+cur_player_name);
		});
	}
	movementPhase(show_banner=true){ //optional arg so that this.returnAllShips() can use it w/o activating the banner
		//tell sockets to animate the banner indicating the movement phase
			//to move ship - change vars here, tell sockets to animate certain ships
			//return if necessary - more complications here
		//do ships at distance 2+ all at once
		
		if(show_banner){
			queue.push(function(){
				io.sockets.emit("banner","Movement Phase");
				console.log("queue emitting movement phase banner");
			});
		}
		
		//move all ships one unit towards land, simultaneously. Check if the ship needs to be returned in the process.
		queue.push(function(){
			for(let i=0; i<game.players.length; i++){
				let name = game.players[i];
				let small = players[name].small_ship;
				let big = players[name].big_ship;
				
				if(small.distance != undefined){
					small.distance -= 1;
					if(small.distance <= -1){
						game.return_queue.push(small);
					}
					io.sockets.emit("move_ship",name,"small","to_shore");
				}
				if(big.distance != undefined){
					big.distance -= 1;
					if(big.distance <= -1){
						game.return_queue.push(big);
					}
					io.sockets.emit("move_ship",name,"big","to_shore");
				}
			}
		});
		
		//start returning ships
		queue.push(function(){
			setTimeout(game.returnNextShip, 500); //setting a timeout so all the excess "done" events we receive from the ship movement don't spill over to later queue items
		});
	}
	returnNextShip(){
		//called by this.movementPhase(), and called whenever a ship finishes returning, until no ships left to return.
		console.log("return next ship");
	}
	whalingPhase(){
		
	}
	nextRound(){
		//remember to clear workers from buildings
		this.round++;
		if(this.round > 12){
			//end game somehow
		}
		
		this.worker_cycle = 0;
	}
	returnAllShips(){
		//do movement phase a bunch - w/o movement phase banner though
	}
}

//STORAGE ------------------------------------------------------

let players = {}; //holds Player objects, keys are player names (not socket ids)
let id_to_name = {}; //maps socket ids to names. If a name isn't in here, player is disconnected

let game = undefined; //undefined means no game currently going on
let buildings = {}; //holds Building objects, keys are building names. Function to define at bottom of this file, called in the Game constructor

// WEBSOCKET HANDLERS -------------------------------------------
io.on("connection", function(socket) {
	
	//when a new player joins, check if player exists. If they don't, create new player. If they do, only allow join if that player was disconnected
	socket.on("new player", function(name, callback){
		if(!players.hasOwnProperty(name)){
			if(game != undefined){return;} //don't count spectators as players. If the game ends, they can refresh and join as a player
			
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
			
			//remove from busy_clients if there
			let index = busy_clients.indexOf(player.name);
			if(index != -1){
				busy_clients.splice(index, 1);
			}
		}
		io.sockets.emit("player_connection", players);
	});
	
	socket.on("get_state", function(callback){
		callback(players, game); //if game is undefined, tells them no game currently happening
	});
	
	socket.on("start_game", function(){
		//consider putting players in a room? - prob. not, I'll have spectator players for now
		//consider having a moderator who advances through the phases?
		console.log("starting game");
		
		let game_players = Object.keys(players).filter(name => players[name].connected);
		if(game_players.length > 4){game_players.splice(4);} //double check 4 players max
		
		//give players colors
		let colors = ["green","orange","blue","yellow"];
		for(i in game_players){
			let name = game_players[i];
			players[name].color = colors.pop();
		}
		
		game = new Game(game_players);
		
		io.sockets.emit("start_game", players, game);
	});
	
	socket.on("initial_resources", function(){
		
	});
	
	socket.on("place_worker", function(building, data=undefined){ //building is a string, data is an optional object
		buildings[building].placeWorker(id_to_name[socket.id], data);
	});
	
	socket.on("build", function(building, build_type, cost){ //building is a string, build_type is "town_hall" or "courthouse", cost is an object: {food:int, wood:int, brick:int, money:int}
		buildings[building].owner = id_to_name[socket.id];
		
		//move from unbuilt buildings to built buildings
		let unbuilt_idx;
		for(let i=0; i<game.unbuilt.length; i++){
			if(game.unbuilt[i].type == building){
				unbuilt_idx = i;
				break;
			}
		}
		let obj = game.unbuilt.splice(unbuilt_idx, 1)[0];
		game.buildings.push(obj);
		
		//place worker, let the town_hall/courthouse handle the rest
		let data = {building_to_build: building, cost: cost}
		buildings[build_type].placeWorker(id_to_name[socket.id], data);
	});
	
	socket.on("choose_whale", function(whale, ship){ //whale: int, ship: 0|1
		
	});
	
	socket.on("done", function(){ //used for action queue, see below
		let name = id_to_name[socket.id];
		let index = busy_clients.indexOf(name);
		if(index != -1){
			busy_clients.splice(index, 1);
		}
	});
	
});


function clearGame(){
	
}



// ACTION QUEUE --------------------------------------------------

//Since we'll want to do multiple things in a row, but aren't sure how long the clients will take to complete them,
//have a queue of things to tell the clients what to do. Only do the next thing in the queue when all the clients
//have completed the previous thing.

let queue = []; //filled with action functions - just functions to run
//items with lower indices are processed first, so to add an action object to the queue, do queue.push(object)

let busy_clients = []; //filled with connected player names, when client finishes a task, name is removed. If empty, we can do the next task
//note - if a client disconnects, they're automatically removed - see above
function process_queue(){
		
	if(queue.length > 0 && busy_clients.length == 0){
		
		//fill up busy_clients
		for(let name in players){
			if(players[name].connected){
				busy_clients.push(name);
			}
		}
		
		//emit
		let action = queue.splice(0,1)[0];
		action();
	}
	
	setTimeout(process_queue, 100);
}
process_queue();



// BUILDINGS -----------------------------------------------------

function initBuildings(){
	
	buildings = {}; //clear any previous state

	//central town
	new Building("town_hall", true, function(name, data){
		let cost = data.cost;
		queue.push(function(){
			io.sockets.emit("give","town_hall",cost,name);
			players[name].food -= cost.food;
			players[name].wood -= cost.wood;
			players[name].brick -= cost.brick;
			players[name].money -= cost.money;
			console.log("emitted give to town hall");
		});
		queue.push(function(){
			io.sockets.emit("build", name, data.building_to_build);
			console.log("emitted build");
		});
	});

	new Building("general_store", true,
		function(name, data){ //data here is {resource: amount_sold, etc.}
			queue.push(function(){
				io.sockets.emit("give", "general_store", data, name);
				players[name].food -= data.food;
				players[name].wood -= data.wood;
				players[name].brick -= data.brick;
				console.log("queue emitting general_store sell");
			});
			queue.push(function(){
				let value = data.food + data.wood + 2*data.brick;
				io.sockets.emit("give", name, {money: value + 1}, "general_store");
				players[name].money += value + 1;
				console.log("first player");
			});
		},
		function(name, data){
			queue.push(function(){
				io.sockets.emit("give", "general_store", data, name);
				players[name].food -= data.food;
				players[name].wood -= data.wood;
				players[name].brick -= data.brick;
				console.log("queue emitting general_store sell");
			});
			queue.push(function(){
				let value = data.food + data.wood + 2*data.brick;
				io.sockets.emit("give", name, {money: value}, "general_store");
				players[name].money += value;
				console.log("later player");
			});
		}
	);

	new Building("forest", true,
		function(name){
			queue.push(function(){
				io.sockets.emit("give", name, {wood: 3}, "forest");
				players[name].wood += 3;
				console.log("queue emitting forest give");
			}); 
		},
		function(name){
			queue.push(function(){
				io.sockets.emit("give", name, {wood: 2}, "forest");
				players[name].wood += 2;
				console.log("queue emitting forest give");
			});
		}
	);

	new Building("farm", true,
		function(name){
			queue.push(function(){
				io.sockets.emit("give", name, {food: 3}, "farm");
				players[name].food += 3;
				console.log("queue emitting farm give");
			});
		},
		function(name){
			queue.push(function(){
				io.sockets.emit("give", name, {food: 2}, "farm");
				players[name].food += 2;
				console.log("queue emitting farm give");
			});
		}
	);

	new Building("warehouse", true,
		function(name, data){ //data in form of a give object {resource:amount, etc.}
			queue.push(function(){
				io.sockets.emit("give", name, data, "warehouse");
				for(resource in data){
					players[name][resource] += data[resource];
				}
				console.log("queue emitting warehouse give");
			});
		},
		function(name){
			queue.push(function(){
				io.sockets.emit("give", name, {brick: 1}, "warehouse");
				players[name].brick += 1;
				console.log("queue emitting warehouse give");
			});
		}
	);


	//town - docks

	new Building("dockyard", true,
		function(name, data){
			queue.push(function(){
				io.sockets.emit("give","dockyard",{wood: 1}, name);
				players[name].wood -= 1;
				console.log("emitting dockyard preparation");
			});
			queue.push(function(){
				players[name][data.which_ship+"_ship"].prepared = true;
				io.sockets.emit("move_ship", name, data.which_ship, "dock");
			});
		},
		function(name, data){
			queue.push(function(){
				io.sockets.emit("give","dockyard",{wood: 2}, name);
				players[name].wood -= 2;
				console.log("emitting dockyard preparation");
			});
			queue.push(function(){
				players[name][data.which_ship+"_ship"].prepared = true;
				io.sockets.emit("move_ship", name, data.which_ship, "dock");
			});
		}
	);

	new Building("city_pier", true, function(name, data){
		queue.push(function(){
			io.sockets.emit("give","city_pier",{food: data.cost},name);
			players[name].food -= data.cost;
			console.log("queue emitting city_pier launch");
		});
		queue.push(function(){
			launch_ship(name, data);
		});
	});


	//player buildings
	new Building("bakery", false, function(name){});

	new Building("bank", false, function(name){});

	new Building("brickyard", false, function(name){});

	new Building("chandlery", false, function(name){});

	new Building("cooperage", false, function(name){});

	new Building("counting_house", false, function(name){});

	new Building("courthouse", false, function(name, data){
		let cost = data.cost;
		queue.push(function(){
			io.sockets.emit("give","courthouse",cost,name);
			players[name].food -= cost.food;
			players[name].wood -= cost.wood;
			players[name].brick -= cost.brick;
			players[name].money -= cost.money;
			console.log("emitted give to town hall");
		});
		queue.push(function(){
			io.sockets.emit("build", name, data.building_to_build);
			console.log("emitted build");
		});
	});

	new Building("dry_dock", false, function(name, data){
		queue.push(function(){
			io.sockets.emit("give","dry_dock",{wood: 2, food: data.cost},name);
			players[name].wood -= 2;
			players[name].food -= data.cost;
			console.log("queue emitting dry_dock launch");
		});
		queue.push(function(){
			let which_ship = players[name].small_ship.distance == undefined ? "small" : "big";
			players[name][which_ship+"_ship"].prepared = true;
			io.sockets.emit("move_ship", name, which_ship, "dock");
		});
		queue.push(function(){
			launch_ship(name, data);
		});
	});

	new Building("inn", false, function(name){});

	new Building("lighthouse", false, function(name){});

	new Building("lumber_mill", false, function(name, data){
		queue.push(function(){
			io.sockets.emit("give", "lumber_mill", data, name);
			players[name].food -= data.food;
			players[name].wood -= data.wood;
			players[name].brick -= data.brick;
			console.log("queue emitting lumber_mill sell");
		});
		queue.push(function(){
			let value = 2*data.wood;
			io.sockets.emit("give", name, {money: value}, "lumber_mill");
			players[name].money += value;
		});
	});

	new Building("mansion", false, function(name){});

	new Building("market", false, function(name, data){
		queue.push(function(){
			io.sockets.emit("give", "market", data, name);
			players[name].food -= data.food;
			players[name].wood -= data.wood;
			players[name].brick -= data.brick;
			console.log("queue emitting market sell");
		});
		queue.push(function(){
			let value = (data.food>0? data.food+1 : 0) + (data.wood>0? data.wood+1 : 0) + 2*(data.brick>0? data.brick+1 : 0);
			io.sockets.emit("give", name, {money: value}, "market");
			players[name].money += value;
		});
	});

	new Building("municipal_office", false, function(name){});

	new Building("post_office", false, function(name){});

	new Building("schoolhouse", false, function(name){});

	new Building("seamens_bethel", false, function(name){});

	new Building("tavern", false, function(name){});

	new Building("tryworks", false, function(name){});

	new Building("wharf", false, function(name, data){
		queue.push(function(){
			io.sockets.emit("give","wharf",{food: data.cost},name);
			players[name].food -= data.cost;
			console.log("queue emitting wharf launch");
		});
		queue.push(function(){
			launch_ship(name, data);
		});
	});
}



//function to launch a ship, used by the city_pier, dry_dock, and wharf building actions
function launch_ship(name, data){
	//Launch ship. Need to determine which ship and priority first
	let which_ship = players[name].small_ship.prepared ? "small" : "big";
	players[name][which_ship+"_ship"].prepared = false; //not prepared anymore
	
	//iterate through all ships to figure out who's already at that distance
	let max_existing_priority = 0;
	for(let player_name in players){
		let small = players[player_name].small_ship;
		let big = players[player_name].small_ship;
		if(small.distance == data.distance){
			max_existing_priority = Math.max(small.priority, max_existing_priority);
		}
		if(big.distance == data.distance){
			max_existing_priority = Math.max(big.priority, max_existing_priority);
		}
	}
	
	let priority = max_existing_priority + 1;
	
	players[name][which_ship+"_ship"].priority = priority;
	players[name][which_ship+"_ship"].distance = data.distance;
	
	io.sockets.emit("move_ship", name, which_ship, data.distance, priority);
}