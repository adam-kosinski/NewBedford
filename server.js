/*
Notes

Change dialog windows to my own popups - I think leaving one open too long can mess with the socket connection
Make player boards the correct color (the ships on there are colored !!)
Currently easy to mistype your name when reentering, make that better - low priority
Why is 'name' in the global scope being assigned a player name? Why is 'name' even in the global scope? 
For 2 player game, don't include 3-4 player buildings
At one point, the 'pass' button on the choose whale sign disappeared for penguin. What?? Came back with page reload.

Remember when returning ships to remove their z-index property so the dock slots will work properly. ship.style.zIndex = ""; (default)

Fix it so that clicking on any of a buildings children will activate the building

Bug with dry dock

updateGameDivSize() isn't working when penguin builds a building (for vertical expansion), even if run from the console after the fact. Works upon reload though

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
		this.small_ship = new Ship(name, "small_ship");
		this.big_ship = new Ship(name, "big_ship");
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
	constructor(owner, type){ //owner: a player name, type is "small_ship" or "big_ship"
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
		queue.add(function(){
			io.sockets.emit("move_worker", name, building_name);
			console.log("queue emitting move_worker");
		});
		
		
		//pay owner if not a town building and don't own the building
		if(!this.in_town && name != this.owner){
			let owner = this.owner;
			queue.add(function(){
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
	constructor(n_players){
		if(n_players < 2 || n_players > 4){
			console.log("Invalid number of players ("+n_players+") for initializing the ocean");
		}
		
		let n_empty = 4 * n_players;
		let n_right = 9 * n_players;
		let n_bowhead = 5 * n_players;
		let n_sperm = 1 * n_players;
		
		this.bag = []; //contains "empty_sea","right_whale","bowhead_whale","sperm_whale" the correct number of times
		
		for(let i=0; i<n_empty; i++){
			this.bag.push("empty_sea");
		}
		for(let i=0; i<n_right; i++){
			this.bag.push("right_whale");
		}
		for(let i=0; i<n_bowhead; i++){
			this.bag.push("bowhead_whale");
		}
		for(let i=0; i<n_sperm; i++){
			this.bag.push("sperm_whale");
		}
		
		this.whaling_result = []; //stuff is taken out of this.bag and placed in here when we go whaling - see this.drawWhales()
		//when a whale is chosen, that index is set to undefined
		
		this.whale_choose_queue = []; //array of ships in the ocean, defined by this.initWhaleChooseQueue() below
		this.whale_choose_idx = undefined; //index in this.whale_choose_queue representing the current choosing ship. undefined if not choosing
	}
	getShips(){
		//returns an array of ships on the ocean in whale-choosing order (first by distance, then by priority)
		let out = [];
		for(let i=0; i<game.players.length; i++){
			let name = game.players[i];
			let small = players[name].small_ship;
			let big = players[name].big_ship;
			if(small.distance != undefined){
				out.push(small);
			}
			if(big.distance != undefined){
				out.push(big);
			}
		}
		out.sort(function(a,b){
			if(a.distance > b.distance){return -1;}
			if(a.distance < b.distance){return 1;}
			
			//so must be equal distance now
			if(a.priority < b.priority){return -1;} //lower priority number means higher priority
			if(a.priority > b.priority){return 1;}
			
			//if still didn't pass, something went very wrong
			console.log("TWO SHIPS HAVE THE SAME DISTANCE AND PRIORITY");
			return 0;
		});
		return out;
	}
	putWhalesBack(){
		//put whales not chosen last whaling phase back in the bag
		//function does everything except hide the ocean bag
		
		for(let i=0; i<this.whaling_result.length; i++){
			if(this.whaling_result[i] != undefined){
				this.bag.push(this.whaling_result[i]);
			}
		}
		this.whaling_result = [];
		
		queue.add(function(){
			io.sockets.emit("show_ocean_bag");
			console.log("queue emitting show_ocean_bag");
		});
		queue.add(function(){
			io.sockets.emit("clear_previous_whales");
			console.log("queue emitting clear_previous_whales");
		});
	}
	drawWhales(n_whales){
		//put whales not chosen last whaling phase back in the bag
		this.putWhalesBack();
		
		for(let i=0; i<n_whales; i++){
			let whale_idx = Math.floor(Math.random()*this.bag.length);
			let whale = this.bag.splice(whale_idx, 1)[0]; //take it out of the bag
			this.whaling_result.push(whale);
			queue.add(function(){
				io.sockets.emit("draw_whale", whale, i);
				console.log("queue emitting draw whale");
			});
		}
		queue.add(function(){
			io.sockets.emit("hide_ocean_bag");
			console.log("queue emitting hide_ocean_bag");
		});
	}
	initWhaleChooseQueue(){
		this.whale_choose_queue = this.getShips();
		this.whale_choose_idx = 0;
		
		//tell clients, instant execution by them so no need for "done" reply
		let first_ship = this.whale_choose_queue[0];
		queue.add(function(){
			io.sockets.emit("set_whale_chooser", first_ship.owner, first_ship.type);
			console.log("queue emitting set_whale_chooser");
		});
	}
}

class Game {
	constructor(players){ //players is an array of player names
		this.players = players; //first player for the round is the first in this list
		this.current_player = 0; //whose turn it currently is, index referencing this.players
		this.worker_cycle = 0; //0 or 1, depending on if players are placing their first or second player
		this.round = 1;
		
		this.ocean = new Ocean(this.players.length);
		this.return_queue = []; //holds Ship objects needing to be returned (during movement phase). Index 0 returns first. Ships spliced from index 0 as they're returned
		
		this.selling = undefined; //undefined means not currently selling a whale. If selling, it's an object {seller: (name of seller), which_ship: , whale_type: , cost: }
		this.current_buyer = undefined; //name of current buyer. undefined if currently not selling a whale
		
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
				queue.add(function(){
					io.sockets.emit("set_turn", undefined);
					console.log("queue emitting set_turn for no one");
				});
				queue.add(game.movementPhase, true);
				return;
			}
		}
		//tell sockets to change player turn
		let cur_player_name = this.players[this.current_player]; //can't use 'this' inside a queue push
		queue.add(function(){
			io.sockets.emit("set_turn", cur_player_name);
			console.log("queue emitting set_turn for "+cur_player_name);
		});
	}
	movementPhase(show_banner=true){ //optional arg so that this.returnAllShips() can use it w/o activating the banner
		//tell sockets to animate the banner indicating the movement phase
		
		console.log("Movement Phase Starting");
		
		if(show_banner){
			queue.add(function(){
				io.sockets.emit("banner","Movement Phase");
				console.log("queue emitting movement phase banner");
			});
		}
		
		let ships = game.ocean.getShips();
		console.log("ships",ships);
		
		if(ships.length > 0){
			//move all ships one unit towards land, simultaneously. Check if the ship needs to be returned in the process.
			queue.add(function(){
				for(let i=0; i<ships.length; i++){		
					ships[i].distance -= 1;
					if(ships[i].distance <= -1){
						game.return_queue.push(ships[i]);
					}
					io.sockets.emit("move_ship", ships[i].owner, ships[i].type, "to_shore");
				}
			});
		}
		
		//start returning ships
		queue.add(function(){
			//this will run when the FIRST ship finishes moving, not the last. However, since they all take the same time, it doesn't matter
			setTimeout(function(){
				game.returnNextShip();
			}, 500); //setting a timeout so all the excess "done" events we receive from the ship movement don't spill over to later queue items
		}, true);
	}
	returnNextShip(){
		//called by this.movementPhase(), and called whenever a ship finishes returning, until no ships left to return.
		console.log("return next ship, return queue:",game.return_queue);
		
		if(this.return_queue.length == 0){
			console.log("No more ships to return in the queue");
			if(this.round <= 12){
				this.whalingPhase();
			}
			else {
				//call this.movementPhase w/o banner if there are still ships out
				let ships = game.ocean.getShips();
				if(ships.length > 0){
					this.movementPhase(false);
				}
				else {
					//tell clients game is over
					queue.add(function(){
						io.sockets.emit("banner", "Game Over");
						console.log("queue emitting game over banner");
					});
				}
			}
			return; //don't move on to returning ships, there are none
		}
		
		//return the ship
		let ship = this.return_queue[0];
		
		if(ship.right_whales > 0 || ship.bowhead_whales > 0 || ship.sperm_whales > 0){
			queue.add(function(){
				io.sockets.emit("start_return", ship.owner, ship.type);
				console.log("queue emitting start_return");
			});
			
			//The player will now send "return_whale" or "sell_whale" events one at a time.
			//When they're done, the server will take the ship out of this.return_queue, and call this function again
		}
		else {
			//no whales to return, just move the ship back and reset state
			finishReturn(ship); //function defined right below the socket.on list
		}
	}
	whalingPhase(){
		console.log("Whaling Phase Starting");
		
		queue.add(function(){
			io.sockets.emit("banner","Whaling Phase");
			console.log("queue emitting whaling phase banner");
		});
		
		//If ships in ocean, draw whales and don't go to next round.
		//Otherwise, just put tiles back from last round if there are any, and go to next round
		
		let ocean_ships = this.ocean.getShips();
		if(ocean_ships.length > 0){
			this.ocean.drawWhales(ocean_ships.length + 1);
			this.ocean.initWhaleChooseQueue();
		}
		else {
			if(game.ocean.whaling_result.length > 0){
				//put whales not chosen back
				this.ocean.putWhalesBack();
				queue.add(function(){
					io.sockets.emit("hide_ocean_bag");
					console.log("queue emitting hide_ocean_bag");
				});
			}
			
			queue.add(function(){
				game.nextRound();
			}, true);
		}
	}
	nextRound(){
		console.log("Round " + (this.round+1) + " starting");
		
		//increment round, return ships if at game end
		this.round++;
		if(this.round > 12){
			//return all ships
			console.log("Game ending, returning all ships");
			queue.add(function(){
				io.sockets.emit("banner", "Returning All Ships");
				console.log("queue emitting return all ships");
			});
			queue.add(function(){
				game.movementPhase(false);
			}, true);
			
			return;
		}
		//otherwise, game not over, do next round
		
		//reset state data
		this.worker_cycle = 0;
		let old_first_player = this.players.splice(0,1)[0];
		this.players.push(old_first_player);
		this.current_player = 0;
		
		//banner for next round
		queue.add(function(){
			io.sockets.emit("banner","Round " + game.round + ": Action Phase");
			console.log("queue emitting next round banner");
		});
		
		//workers back to storage
		queue.add(function(){
			console.log("queue emitting workers back to storage");
			for(let i=0; i<game.players.length; i++){
				let name = game.players[i];
				players[name].workers_at = ["player_board","player_board"];
				io.sockets.emit("move_worker", name, "player_board", i >= game.players.length-1); //only emit done for the last pair of workers - not the same as farthest pair, but it's ok
			}
		});
		//tell buildings that workers left
		for(let b=0; b<game.buildings.length; b++){
			game.buildings[b].workers = 0;
		}
		
		//move whale round counter
		queue.add(function(){
			io.sockets.emit("move_round_counter_whale", game.round)
			console.log("queue emitting move_round_counter_whale");
		});
		
		//move first player token
		queue.add(function(){
			io.sockets.emit("move_first_player_token", game.players[0]);
			console.log("queue emitting move_first_player_token");
		});
		
		//set first player turn
		queue.add(function(){
			io.sockets.emit("set_turn", game.players[0]);
			console.log("queue emitting set turn for " + game.players[0] + " (first player this round)");
		});
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
	
	socket.on("get_queue", function(callback){
		callback(queue, busy_clients);
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
	
	socket.on("choose_whale", function(idx){ //idx: idx in game.ocean.whaling_result, or undefined if passing
		if(idx != undefined){
			//choose the whale
			
			let whale_type = game.ocean.whaling_result[idx];
			game.ocean.whaling_result[idx] = undefined;
			
			let ship = game.ocean.whale_choose_queue[game.ocean.whale_choose_idx];
			let which_ship = ship.type;
			
			ship[whale_type + "s"] += 1;
			
			queue.add(function(){
				io.sockets.emit("choose_whale", id_to_name[socket.id], which_ship, whale_type, idx);
				console.log("queue emitting choose_whale");
			});
			
		}
		
		//move on to the next person choosing a whale, if we're done then do next round
		game.ocean.whale_choose_idx++;
		if(game.ocean.whale_choose_idx < game.ocean.whale_choose_queue.length){
			//next person
			let next_ship = game.ocean.whale_choose_queue[game.ocean.whale_choose_idx];
			queue.add(function(){
				io.sockets.emit("set_whale_chooser", next_ship.owner, next_ship.type);
				console.log("queue emitting set_whale_chooser for next ship");
			});
		}
		else {
			//done choosing whales
			game.ocean.whale_choose_idx = undefined; //tell everyone we're not choosing whales
			queue.add(function(){
				io.sockets.emit("set_whale_chooser",undefined);
				console.log("queue emitting set_whale_chooser for no one");
			});
			queue.add(function(){
				game.nextRound();
			}, true);
		}
	});
	
	socket.on("return_whale", function(whale_type, cost){ //whale_type: "right_whale", "bowhead_whale", or "sperm_whale"
		
		let ship = game.return_queue[0];
		ship[whale_type + "s"] -= 1;
		players[ship.owner][whale_type + "s"] += 1;
		
		players[ship.owner].money -= cost;
		
		//pay money for whale
		queue.add(function(){
			io.sockets.emit("pay_for_whale", ship.owner, ship.type, whale_type);
			console.log("queue emitting pay_for_whale");
		});
		
		//move whale to returned slot
		queue.add(function(){
			io.sockets.emit("return_whale", ship.owner, ship.type, whale_type);
			console.log("queue emitting return_whale");
		});
		
		if(ship.right_whales == 0 && ship.bowhead_whales == 0 && ship.sperm_whales == 0){
			queue.add(function(){
				finishReturn(ship); //see below the socket.on list
			}, true);
		}
	});
	
	socket.on("sell_whale", function(whale_type, cost){ //"right_whale", "bowhead_whale", or "sperm_whale"
		let ship = game.return_queue[0];
		
		//set game state
		game.selling = {
			seller: ship.owner,
			which_ship: ship.type,
			whale_type: whale_type,
			cost: cost
		};
		let seller_idx = game.players.indexOf(ship.owner);
		let buyer_idx = (seller_idx + 1) % game.players.length;
		game.current_buyer = game.players[buyer_idx];
		
		//tell clients to open the popup
		queue.add(function(){
			io.sockets.emit("sell_whale_popup", ship.owner, whale_type, game.current_buyer);
			console.log("queue emitting sell_whale_popup open");
		});
	});
	
	socket.on("buy_whale", function(buy){ //buy can be true or false depending on whether the player bought it or just passed
		if(buy == true){
			
			let selling = game.selling; //alias
			
			//pay the seller
			players[selling.seller].money += (selling.cost / 2);
			queue.add(function(){
				io.sockets.emit("pay_whale_seller", selling.seller, selling.which_ship, selling.whale_type);
				console.log("queue emitting pay_whale_seller");
			});
			
			//make buyer pay for the whale
			let buyer_name = game.current_buyer;
			players[buyer_name].money -= selling.cost;
			queue.add(function(){
				io.sockets.emit("pay_for_whale", selling.seller, selling.which_ship, selling.whale_type, buyer_name);
				console.log("queue emitting buyer pay_for_whale");
			});
			
			//give the whale to the buyer
			let ship = game.return_queue[0];
			ship[selling.whale_type + "s"] -= 1;
			players[buyer_name][selling.whale_type + "s"] += 1;
			queue.add(function(){
				io.sockets.emit("return_whale", selling.seller, selling.which_ship, selling.whale_type, buyer_name);
				console.log("queue emitting buyer return_whale");
			});
			
			//clear selling state
			game.selling = undefined;
			game.current_buyer = undefined;
			
			//check if that finished the return
			if(ship.right_whales == 0 && ship.bowhead_whales == 0 && ship.sperm_whales == 0){
				queue.add(function(){
					finishReturn(ship); //see below the socket.on list
				}, true);
			}
		}
		else {
			//go onto the next player
			let buyer_idx = game.players.indexOf(game.current_buyer);
			buyer_idx = (buyer_idx + 1) % game.players.length;
			game.current_buyer = game.players[buyer_idx];
			
			if(game.current_buyer == game.selling.seller){
				//then we've made it around the circle and no one's bought it - pay the seller and get rid of the whale
				
				let selling = game.selling; //alias
				
				//pay the seller
				players[selling.seller].money += (selling.cost / 2);
				queue.add(function(){
					io.sockets.emit("pay_whale_seller", selling.seller, selling.which_ship, selling.whale_type);
					console.log("queue emitting pay_whale_seller");
				});
				
				//trash the whale
				let ship = game.return_queue[0];
				ship[selling.whale_type + "s"] -= 1;
				queue.add(function(){
					io.sockets.emit("trash_whale", selling.seller, selling.which_ship, selling.whale_type);
					console.log("queue emitting trash_whale");
				});
				
				//clear selling state
				game.selling = undefined;
				game.current_buyer = undefined;
				
				//check if that finished the return
				if(ship.right_whales == 0 && ship.bowhead_whales == 0 && ship.sperm_whales == 0){
					queue.add(function(){
						finishReturn(ship); //see below the socket.on list
					}, true);
				}
			
			
			}
			else {
				//update the popup
				queue.add(function(){
					io.sockets.emit("sell_whale_popup", game.selling.seller, game.selling.whale_type, game.current_buyer);
					console.log("queue emitting sell_whale_popup update");
				});
			}
		}
	});
	
	socket.on("clear_game", function(){
		
		game = undefined;
		queue.splice(0); //don't set it to a new array b/c the old one had the 'add' method attached to it
		busy_clients = [];
		
		//reset player data
		let reset_players = {};
		for(let name in players){
			if(players[name].connected){
				reset_players[name] = new Player(name);
			}
		}
		players = reset_players;
		
		buildings = {};
		
		
		io.sockets.emit("clear_game");
	});
	
	socket.on("done", function(){ //used for action queue, see below
		let name = id_to_name[socket.id];
		let index = busy_clients.indexOf(name);
		if(index != -1){
			busy_clients.splice(index, 1);
		}
		//console.log(name + " done");
	});
	
});


function finishReturn(ship){
	//done returning
	game.return_queue.splice(0,1);
	ship.distance = undefined; //indicates it's not in the sea
	
	queue.add(function(){
		io.sockets.emit("move_ship", ship.owner, ship.type, "player_board");
		console.log("queue emitting move_ship to player_board");
	});
	queue.add(function(){
		io.sockets.emit("finish_return");
		console.log("queue emitting finish return");
	});
	queue.add(function(){
		game.returnNextShip();
	}, true);
}





// ACTION QUEUE --------------------------------------------------

//Since we'll want to do multiple things in a row, but aren't sure how long the clients will take to complete them,
//have a queue of things to tell the clients what to do. Only do the next thing in the queue when all the clients
//have completed the previous thing.

let queue = []; //filled with action functions - just functions to run. If have the property done_not_required (set to true), won't wait for clients to respond before moving onto next one
//items with lower indices are processed first; to add an action object to the end of the queue, do queue.add(object, done_not_required=false)

queue.add = function(f, done_not_required=false){
	f.done_not_required = done_not_required;
	queue.push(f);
}

let busy_clients = []; //filled with connected player names, when client finishes a task, name is removed. If empty, we can do the next task
//note - if a client disconnects, they're automatically removed - see above
function process_queue(){
	
	if(queue.length > 0 && busy_clients.length == 0){
		
		let action = queue.splice(0,1)[0];
		
		//fill up busy_clients if we require a done event returned
		if(!action.done_not_required){
			for(let name in players){
				if(players[name].connected){
					busy_clients.push(name);
				}
			}
		}
		
		//emit
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
		queue.add(function(){
			io.sockets.emit("give","town_hall",cost,name);
			players[name].food -= cost.food;
			players[name].wood -= cost.wood;
			players[name].brick -= cost.brick;
			players[name].money -= cost.money;
			console.log("emitted give to town hall");
		});
		queue.add(function(){
			io.sockets.emit("build", name, data.building_to_build);
			console.log("emitted build");
		});
	});

	new Building("general_store", true,
		function(name, data){ //data here is {resource: amount_sold, etc.}
			queue.add(function(){
				io.sockets.emit("give", "general_store", data, name);
				players[name].food -= data.food;
				players[name].wood -= data.wood;
				players[name].brick -= data.brick;
				console.log("queue emitting general_store sell");
			});
			queue.add(function(){
				let value = data.food + data.wood + 2*data.brick;
				io.sockets.emit("give", name, {money: value + 1}, "general_store");
				players[name].money += value + 1;
				console.log("first player");
			});
		},
		function(name, data){
			queue.add(function(){
				io.sockets.emit("give", "general_store", data, name);
				players[name].food -= data.food;
				players[name].wood -= data.wood;
				players[name].brick -= data.brick;
				console.log("queue emitting general_store sell");
			});
			queue.add(function(){
				let value = data.food + data.wood + 2*data.brick;
				io.sockets.emit("give", name, {money: value}, "general_store");
				players[name].money += value;
				console.log("later player");
			});
		}
	);

	new Building("forest", true,
		function(name){
			queue.add(function(){
				io.sockets.emit("give", name, {wood: 3}, "forest");
				players[name].wood += 3;
				console.log("queue emitting forest give");
			}); 
		},
		function(name){
			queue.add(function(){
				io.sockets.emit("give", name, {wood: 2}, "forest");
				players[name].wood += 2;
				console.log("queue emitting forest give");
			});
		}
	);

	new Building("farm", true,
		function(name){
			queue.add(function(){
				io.sockets.emit("give", name, {food: 3}, "farm");
				players[name].food += 3;
				console.log("queue emitting farm give");
			});
		},
		function(name){
			queue.add(function(){
				io.sockets.emit("give", name, {food: 2}, "farm");
				players[name].food += 2;
				console.log("queue emitting farm give");
			});
		}
	);

	new Building("warehouse", true,
		function(name, data){ //data in form of a give object {resource:amount, etc.}
			queue.add(function(){
				io.sockets.emit("give", name, data, "warehouse");
				for(resource in data){
					players[name][resource] += data[resource];
				}
				console.log("queue emitting warehouse give");
			});
		},
		function(name){
			queue.add(function(){
				io.sockets.emit("give", name, {brick: 1}, "warehouse");
				players[name].brick += 1;
				console.log("queue emitting warehouse give");
			});
		}
	);


	//town - docks

	new Building("dockyard", true,
		function(name, data){
			queue.add(function(){
				io.sockets.emit("give","dockyard",{wood: 1}, name);
				players[name].wood -= 1;
				console.log("emitting dockyard preparation");
			});
			queue.add(function(){
				players[name][data.which_ship].prepared = true;
				io.sockets.emit("move_ship", name, data.which_ship, "dock");
			});
		},
		function(name, data){
			queue.add(function(){
				io.sockets.emit("give","dockyard",{wood: 2}, name);
				players[name].wood -= 2;
				console.log("emitting dockyard preparation");
			});
			queue.add(function(){
				players[name][data.which_ship].prepared = true;
				io.sockets.emit("move_ship", name, data.which_ship, "dock");
			});
		}
	);

	new Building("city_pier", true, function(name, data){
		queue.add(function(){
			io.sockets.emit("give","city_pier",{food: data.cost},name);
			players[name].food -= data.cost;
			console.log("queue emitting city_pier launch");
		});
		
		let which_ship = players[name].small_ship.prepared ? "small_ship" : "big_ship";
		
		queue.add(function(){
			launchShip(name, which_ship, data);
		});
	});


	//player buildings
	new Building("bakery", false, function(name){
		queue.add(function(){
			io.sockets.emit("give", name, {food: 4}, "bakery");
			players[name].food += 4;
			console.log("queue emitting bakery give");
		});
	});

	new Building("bank", false, function(name){
		queue.add(function(){
			io.sockets.emit("give", name, {money: 5}, "bank");
			players[name].money += 5;
			console.log("queue emitting bank give");
		});
	});

	new Building("brickyard", false, function(name){
		queue.add(function(){
			io.sockets.emit("give", name, {brick: 3}, "brickyard");
			players[name].brick += 3;
			console.log("queue emitting brickyard give");
		});
	});

	new Building("chandlery", false, function(name){
		queue.add(function(){
			io.sockets.emit("give", name, {food: 1, wood: 1, brick: 1, money: 1}, "chandlery");
			players[name].food += 1;
			players[name].wood += 1;
			players[name].brick += 1;
			players[name].money += 1;
			console.log("queue emitting chandlery give");
		});
	});

	new Building("cooperage", false, function(name){
		let small = players[name].small_ship;
		let big = players[name].big_ship;
		let n_small_whales = small.right_whales + small.bowhead_whales + small.sperm_whales;
		let n_big_whales = big.right_whales + big.bowhead_whales + big.sperm_whales;
		
		let money_to_give = Math.max(n_small_whales, n_big_whales);
		
		queue.add(function(){
			io.sockets.emit("give", name, {money: money_to_give}, "cooperage");
			players[name].money += money_to_give;
			console.log("queue emitting cooperage give");
		});
	});

	new Building("counting_house", false, function(name){});

	new Building("courthouse", false, function(name, data){
		let cost = data.cost;
		queue.add(function(){
			io.sockets.emit("give","courthouse",cost,name);
			players[name].food -= cost.food;
			players[name].wood -= cost.wood;
			players[name].brick -= cost.brick;
			players[name].money -= cost.money;
			console.log("emitted give to town hall");
		});
		queue.add(function(){
			io.sockets.emit("build", name, data.building_to_build);
			console.log("emitted build");
		});
	});

	new Building("dry_dock", false, function(name, data){
		queue.add(function(){
			io.sockets.emit("give","dry_dock",{wood: 2, food: data.cost},name);
			players[name].wood -= 2;
			players[name].food -= data.cost;
			console.log("queue emitting dry_dock launch");
		});
		let which_ship;
		queue.add(function(){
			if(players[name].small_ship.distance == undefined && players[name].small_ship.prepared == false){
				which_ship = "small_ship";
			}
			else {
				which_ship = "big_ship";
			}
			players[name][which_ship].prepared = true;
			io.sockets.emit("move_ship", name, which_ship, "dock");
		});
		queue.add(function(){
			launchShip(name, which_ship, data);
		});
	});

	new Building("inn", false, function(name){});

	new Building("lighthouse", false, function(name){});

	new Building("lumber_mill", false, function(name, data){
		queue.add(function(){
			io.sockets.emit("give", "lumber_mill", data, name);
			players[name].food -= data.food;
			players[name].wood -= data.wood;
			players[name].brick -= data.brick;
			console.log("queue emitting lumber_mill sell");
		});
		queue.add(function(){
			let value = 2*data.wood;
			io.sockets.emit("give", name, {money: value}, "lumber_mill");
			players[name].money += value;
		});
	});

	new Building("mansion", false, function(name){});

	new Building("market", false, function(name, data){
		queue.add(function(){
			io.sockets.emit("give", "market", data, name);
			players[name].food -= data.food;
			players[name].wood -= data.wood;
			players[name].brick -= data.brick;
			console.log("queue emitting market sell");
		});
		queue.add(function(){
			let value = (data.food>0? data.food+1 : 0) + (data.wood>0? data.wood+1 : 0) + 2*(data.brick>0? data.brick+1 : 0);
			io.sockets.emit("give", name, {money: value}, "market");
			players[name].money += value;
		});
	});

	new Building("municipal_office", false, function(name){});

	new Building("post_office", false, function(name){});

	new Building("schoolhouse", false, function(name){
		queue.add(function(){
			io.sockets.emit("give", name, {food: 2, wood: 2}, "schoolhouse");
			players[name].food += 2;
			players[name].wood += 2;
			console.log("queue emitting schoolhouse give");
		});
	});

	new Building("seamens_bethel", false, function(name){});

	new Building("tavern", false, function(name){
		
		//figure out how many empty sea we can sell (0, 1, or 2), and remove them from the whaling_result
		let n_to_sell = 0;
		for(let i=0; i<game.ocean.whaling_result.length; i++){
			if(game.ocean.whaling_result[i] == "empty_sea" && n_to_sell < 2){
				n_to_sell++;
				game.ocean.whaling_result[i] = undefined;
			}
		}
				
		//tell clients to do stuff
		queue.add(function(){
			io.sockets.emit("sell_empty_sea", n_to_sell);
			console.log("queue emitting sell_empty_sea");
		});
		queue.add(function(){
			io.sockets.emit("give", name, {money: 2 + 2*n_to_sell}, "tavern");
			players[name].money += (2 + 2*n_to_sell);
			console.log("queue emitting tavern give");
		});
		
	});

	new Building("tryworks", false, function(name){});

	new Building("wharf", false, function(name, data){
		queue.add(function(){
			io.sockets.emit("give","wharf",{food: data.cost},name);
			players[name].food -= data.cost;
			console.log("queue emitting wharf launch");
		});
		
		let which_ship = players[name].small_ship.prepared ? "small_ship" : "big_ship";
		
		queue.add(function(){
			launchShip(name, which_ship, data);
		});
	});
}



//function to launch a ship, used by the city_pier, dry_dock, and wharf building actions
function launchShip(name, which_ship, data){
	//Launch ship. Need to determine which ship and priority first
	players[name][which_ship].prepared = false; //not prepared anymore
	
	//iterate through all ships to figure out who's already at that distance
	let max_existing_priority = 0;
	for(let player_name in players){
		let small = players[player_name].small_ship;
		let big = players[player_name].big_ship;
		if(small.distance == data.distance){
			max_existing_priority = Math.max(small.priority, max_existing_priority);
		}
		if(big.distance == data.distance){
			max_existing_priority = Math.max(big.priority, max_existing_priority);
		}
	}
	
	let priority = max_existing_priority + 1;
	
	players[name][which_ship].priority = priority;
	players[name][which_ship].distance = data.distance;
	
	io.sockets.emit("move_ship", name, which_ship, data.distance, priority);
}