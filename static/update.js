
//function to change the parent of an absolutely positioned element, without changing its location on screen
function changeParent(object, new_parent){
	let box = object.getBoundingClientRect();
	let new_parent_box = new_parent.getBoundingClientRect();
	
	let new_top = box.top - new_parent_box.top;
	let new_left = box.left - new_parent_box.left;
	
	new_parent.appendChild(object);
	object.style.top = new_top + "px";
	object.style.left = new_left + "px";
}

function getLocation(what, relative_to, name=undefined, use_center=false){
	//what: an element, a building (for which the center of it is returned), or anything in PlayerBoard.location
	//relative_to: top-left of this element is considered (0,0)
	//name: of player, if in a playerboard
	//use_center: for HTMLElements, returns location of center of element if true
	
	if(what instanceof HTMLElement){
		let box = what.getBoundingClientRect();
		let relative_to_box = relative_to.getBoundingClientRect();
		
		let x_offset = use_center ? 0.5*box.width : 0;
		let y_offset = use_center ? 0.5*box.height : 0;
		
		return {
			x: box.x + x_offset - relative_to_box.x,
			y: box.y + y_offset - relative_to_box.y
		};
	}
	else if(buildings.hasOwnProperty(what)){
		let b = buildings[what];
		let building_box = buildings[what].div.getBoundingClientRect();
		let relative_to_box = relative_to.getBoundingClientRect();
		
		return {
			x: (building_box.x + 0.5*building_box.width) - relative_to_box.x,
			y: (building_box.y + 0.5*building_box.height) - relative_to_box.y
		};
	}
	else if(player_boards[name].location.hasOwnProperty(what)){
		let player_board_box = player_boards[name].div.getBoundingClientRect();
		let relative_to_box = relative_to.getBoundingClientRect();
		let local_pos = player_boards[name].location[what];
		
		return {
			x: (player_board_box.x + local_pos.x) - relative_to_box.x,
			y: (player_board_box.y + local_pos.y) - relative_to_box.y
		};
	}
	else {
		throw new Error(what + " is an invalid 'what' argument for getLocation()");
	}
}



let makeResource = function(thing, startpoint){
	//create resource
	let resource = document.createElement("img");
	resource.className = "animated_resource";
	switch(thing){
		case "food": resource.src = "/static/images/food_3d.png"; break;
		case "wood": resource.src = "/static/images/wood_3d.png"; break;
		case "brick": resource.src = "/static/images/brick_3d.png"; break;
		case "money": resource.src = "/static/images/small_coin_front.png"; break;
	}
	resource.style.top = startpoint.y + "px";
	resource.style.left = startpoint.x + "px";
	animation_div.appendChild(resource);
	
	return resource;
}


//Function to give resources (food, wood, bricks, money - not whales) to or from a player. Handles both counter values and animations
//Resources can come from buildings, other players, HTMLElements, or out of thin air (no animation).
//Only money is allowed to move from one player to another.
//There's no check if other players have the resources; it's simply subtracted from the counter - check this before calling.

//Two ways of calling - one for generic give (give()), second for giving one item (give_one()). The first uses the second

function give(to, data, from){
	//to: name of player to give resource to, building to "give" resource to, or HTMLElement
	//data: object of {thing: amount, thing: amount, etc.} - resources must be "food" "wood" "brick" or "money"
	//from: name of a building, or name of a player, or HTMLElement
		//If resource is given to a player from a player, must be "money"
	
	//if giving to a player and 'from' is undefined, or if taking ("giving") from a player and 'to' is undefined, will just change the counter w/o animation

	
	//populate an array with resources to give in a row
	let give_array = [];
	for(let resource in data){
		for(let i=0; i<data[resource]; i++){
			give_array.push(resource);
		}
	}
	
	if(give_array.length == 0){ //this can happen when launching a ship for 0 food using the bonus
		socket.emit("done");
		return;
	}
	
	//give them with pauses in between
	let give_next = function(){
		let this_resource = give_array.splice(0,1)[0];
		
		give_one(to, this_resource, from, give_array.length==0); //emit done when animation finishes if we just used the last resource
		
		if(give_array.length > 0){
			window.setTimeout(give_next, time_between_gives);
		}
	}
	give_next();
}


function give_one(to, thing, from, emit_done=false){
	//to: name of player to give resource to, name of a building, or HTMLElement
	//thing: "food" "wood" "brick" or "money"
	//from: name of a building, or name of a player, or HTMLElement
		//If resource is to a player from a player, it must be 'money'
	//emit_done: if true, will emit the "done" event when the animation finishes
	
	//if giving to a player and 'from' is undefined, or if "giving" from a player and 'to' is undefined, will just change the counter w/o animation
	
	//check if valid inputs
	if(! (player_boards.hasOwnProperty(to) || buildings.hasOwnProperty(to) || /pay_for/.test(to) || to instanceof HTMLElement || to == undefined) ){
		throw new Error("Cannot give stuff to something that's not a player, building, a pay_for, HTMLElement, or undefined");
	}
	if(!(thing == "food" || thing == "wood" || thing == "brick" || thing == "money")){
		throw new Error("Cannot give " + thing + ", invalid resource type");
	}
	if(! (player_boards.hasOwnProperty(from) || buildings.hasOwnProperty(from) || /pay_for/.test(from) || from instanceof HTMLElement || from == undefined) ){
		throw new Error("Cannot give stuff from something that's not a player, building, a pay_for, HTMLElement, or undefined");
	}
	if(player_boards.hasOwnProperty(to) && player_boards.hasOwnProperty(from) && thing != "money"){
		throw new Error("Cannot give anything but money from one player to another");
	}
	
	//determine animation args based on what 'from' and 'to' are
	
	let resource;
	let scroll_to_match;
	let startpoint;
	let endpoint;
	let finish_function = function(){ //default just remove the resource
		resource.remove();
		if(emit_done){socket.emit("done");}
	};
	
	
	//check if coming from a player
	if(player_boards.hasOwnProperty(from)){
		
		//subtract one from the counter of the giving player
		let counter = player_boards[from][thing + "_counter"];
		counter.textContent = Number(counter.textContent) - 1;
		
		if(to == undefined){
			//return now w/o animation
			if(emit_done){socket.emit("done");}
			return;
		}
		
		startpoint = getLocation(thing, animation_div, from); //from is a name here
	}
	//check if coming from a building
	else if(buildings.hasOwnProperty(from)){
		startpoint = getLocation(from, animation_div); //from is a building here
	}
	//check if coming from pay_for section
	else if(from == "pay_for_food" || from == "pay_for_wood"){
		startpoint = getLocation(from, animation_div, to); //to should be a player here
	}
	//check if coming from an HTMLElement
	else if(from instanceof HTMLElement){
		startpoint = getLocation(from, animation_div, undefined, true);
	}
	
	
	//check if going to a player
	if(player_boards.hasOwnProperty(to)){		
		if(from == undefined){
			//increment the counter now and return w/o animation
			let counter = player_boards[to][thing + "_counter"];
			counter.textContent = Number(counter.textContent) + 1;
			if(emit_done){socket.emit("done");}
			return;
		}
		
		scroll_to_match = player_board_container;
		endpoint = getLocation(thing, animation_div, to);
		finish_function = function(){
			resource.remove();
			
			//add one to receiving player's counter
			let counter = player_boards[to][thing + "_counter"];
			counter.textContent = Number(counter.textContent) + 1;
			
			if(emit_done){socket.emit("done");}
		}
	}
	//check if going to a building
	else if(buildings.hasOwnProperty(to)){
		scroll_to_match = game_div;
		endpoint = getLocation(to, animation_div);
	}
	//check if going to pay_for section
	else if(to == "pay_for_food" || to == "pay_for_wood"){
		scroll_to_match = player_board_container;
		endpoint = getLocation(to, animation_div, from); //from should be a player here
	}
	//check if going to an HTMLElement
	else if(to instanceof HTMLElement){
		scroll_to_match = to;
		endpoint = getLocation(to, animation_div, undefined, true);
	}
	
	
	//if execution got here, then we should be doing an animation. If somehow startpoint and endpoint aren't defined, something went wrong, throw an error
	if(startpoint && endpoint){
		resource = makeResource(thing, startpoint);
		moveAnimate(resource, scroll_to_match, startpoint, endpoint, give_animation_speed, finish_function);
	}
	else {
		throw new Error("Error defining startpoint or endpoint in give_one()");
	}
}





function moveWorker(name, where, emit_done=true){ //note: trying to move a player to a building while a place worker animation is going on will mess up the worker slots. Annoying to fix so stays
	//name: name of player
	//where: a building, or "player_board" to return all workers to storage
	//emit_done: whether we should emit done when finishing
	
	if(where == "player_board"){
		let worker_1 = player_boards[name].worker_1;
		let worker_2 = player_boards[name].worker_2;
		
		let startpoint_1 = getLocation(worker_1, animation_div);
		let startpoint_2 = getLocation(worker_2, animation_div);
		let endpoint_1 = getLocation("worker_1_storage", animation_div, name);
		let endpoint_2 = getLocation("worker_2_storage", animation_div, name);
		
		//figure out who has longer to travel, so we can emit "done" when they finish
		let dist_1 = Math.hypot(endpoint_1.x - startpoint_1.x, endpoint_1.y - startpoint_1.y);
		let dist_2 = Math.hypot(endpoint_2.x - startpoint_2.x, endpoint_2.y - startpoint_2.y);
		
		//animate
		changeParent(worker_1, animation_div);
		changeParent(worker_2, animation_div);
		
		moveAnimate(worker_1, player_board_container, startpoint_1, endpoint_1, worker_animation_speed, function(){
			changeParent(worker_1, player_boards[name].div); //waiting till finished so things looking in the div don't think the worker was available during animation
			updateSelectableBuildings();
			if(dist_1 > dist_2 && emit_done){socket.emit("done");}
		});
		moveAnimate(worker_2, player_board_container, startpoint_2, endpoint_2, worker_animation_speed, function(){
			changeParent(worker_2, player_boards[name].div); //waiting till finished so things looking in the div don't think the worker was available during animation
			updateSelectableBuildings();
			if(dist_2 >= dist_1 && emit_done){socket.emit("done");}
		});
	}
	else if(buildings.hasOwnProperty(where)){
		//get worker
		let available_workers = player_boards[name].div.getElementsByClassName("worker");
		let worker;
		if(available_workers.length > 0){
			worker = available_workers[0];
		}
		else {
			throw new Error("No available worker found");
		}
		
		//get worker slot
		let worker_slot = buildings[where].getOpenWorkerSlot();
		
		//animate
		changeParent(worker, animation_div);
		let startpoint = getLocation(worker, animation_div);
		let endpoint = getLocation(worker_slot, animation_div);
		moveAnimate(worker, board, startpoint, endpoint, worker_animation_speed, function(){
			changeParent(worker, worker_slot);
			updateSelectableBuildings();
			socket.emit("done");
		});
	}
	else {
		throw new Error("Cannot move worker to " + where +", invalid destination");
	}
}




function moveShip(name, which_ship, where, priority=1, emit_done=true){
	//name: player name
	//which_ship: "small_ship" or "big_ship"
	/*where: One of -
		"player_board" (to return to storage)
		"dock" (to prepare it)
		a number 1-6 to launch it
		"to_shore" (1 row)
		"to_sea" (1 row)
		"right" or "left" (to change priority position)
	*/
	//priority (optional): 1, 2, or 3. Only used for when 'where'= 1-6 (launching)
	//emit_done (optional): whether or not to emit the "done" event when finished
	
	//note: ship's z-index will be set to 4-priority (priority 1,2,3 maps to z-index: 3,2,1)
	
	
	let ship = player_boards[name][which_ship];
	let startpoint = getLocation(ship, animation_div);
	
	if(where == "player_board"){
		ship_highlighter.style.display = "none"; //only time we call this is when a return is finishing and this ship was highlighted. So, remove the highlight
		
		let endpoint = getLocation(which_ship + "_storage", animation_div, name);
		
		changeParent(ship, animation_div);
		moveAnimate(ship, player_board_container, startpoint, endpoint, ship_fast_animation_speed, function(){
			changeParent(ship, player_boards[name].div);
			ship.style.zIndex = ""; //so dock slots work properly later
			if(emit_done){socket.emit("done");}
		});
	}
	else if(where == "dock"){
		let dock_slot = getOpenDockSlot();
		let endpoint = getLocation(dock_slot, animation_div); //this is top middle of slot, want top-left of ship so need to modify a bit
		endpoint.x -= 0.5*ship.width;
				
		changeParent(ship, animation_div);
		moveAnimate(ship, ocean, startpoint, endpoint, ship_fast_animation_speed, function(){
			changeParent(ship, dock_slot);
			if(emit_done){socket.emit("done");}
		});
	}
	else if(typeof where == "number"){
		//go to the appropriate food label (should be straight down from dock), then horizontally into position
		
		let ocean_pos = getLocation(ocean, animation_div);
		
		//get offsets to final destination relative to the ocean
		let x_offset = whaling_track_origin.x + (priority-1)*whaling_priority_offset;
		let y_offset = whaling_track_origin.y + (where+1)*whaling_row_offset;
		
		let endpoint_1 = {
			x: ocean_pos.x + ocean_center_x - 0.5*ship.width,
			y: ocean_pos.y + y_offset - 0.6*ship.height
		};
		let additional_x_offset = x_offset - ocean_center_x; //have to calculate endpoint_2 after we get there, b/c scrolling might have happened. Add this to the ship's x position to get endpoint_2
		
		//animate the steps in a row
		changeParent(ship, animation_div);
		moveAnimate(ship, ocean, startpoint, endpoint_1, ship_medium_animation_speed, function(){
			let startpoint_2 = getLocation(ship, animation_div);
			let endpoint_2 = {
				x: startpoint_2.x + additional_x_offset,
				y: startpoint_2.y
			};
			moveAnimate(ship, ocean, startpoint_2, endpoint_2, ship_slow_animation_speed, function(){
				changeParent(ship, ocean);
				ship.style.zIndex = 4-priority; //priority 1,2,3 maps to z-index 3,2,1
				if(emit_done){socket.emit("done");}
			});
		});
		
	}
	else if(where == "to_shore" || where == "to_sea"){
		let endpoint = {
			x: startpoint.x,
			y: startpoint.y + (where=="to_shore"? -whaling_row_offset : whaling_row_offset)
		};
		
		changeParent(ship, animation_div);
		moveAnimate(ship, ocean, startpoint, endpoint, ship_slow_animation_speed, function(){
			changeParent(ship, ocean);
			if(emit_done){socket.emit("done");}
		});
	}
	else if(where == "left" || where == "right"){
		let endpoint = {
			x: startpoint.x + (where=="left"? -whaling_priority_offset : whaling_priority_offset),
			y: startpoint.y
		};
		
		changeParent(ship, animation_div);
		moveAnimate(ship, ocean, startpoint, endpoint, ship_slow_animation_speed, function(){
			ship.style.zIndex = Number(ship.style.zIndex) + (where=="left"? 1 : -1);
			changeParent(ship, ocean);
			if(emit_done){socket.emit("done");}
		});
	}
	
	updateShipPriorityAndDistance();
}



function updateSelectableBuildings(){
	for(let type in buildings){
		if(my_turn){
			if(buildings[type].in_town){
				buildings[type].setSelectable(true);
			}
			else {
				if(!buildings[type].has_action){
					buildings[type].setSelectable(false);
				}
				else if(buildings[type].getNumberOfWorkers() >= 1){
					buildings[type].setSelectable(false);
				}
				else if(inn_phase_active){
					buildings[type].setSelectable(false);
				}
				else {
					buildings[type].setSelectable(true);
				}
			}
		}
		else {
			buildings[type].setSelectable(false);
		}
		
		//do pay_for stuff
		if(document.getElementById("my_player_board")){ //the elements below won't exist for spectators
			if(my_turn && !pay_for_used){
				document.getElementById("pay_for_food").classList.add("pay_for_selectable");
				document.getElementById("pay_for_wood").classList.add("pay_for_selectable");
			}
			else {
				document.getElementById("pay_for_food").classList.remove("pay_for_selectable");
				document.getElementById("pay_for_wood").classList.remove("pay_for_selectable");
			}
		}
		
	}
}



function updateShipPriorityAndDistance(){
	//the players' ships have the custom properties 'distance' and 'priority', used for determining if a launch is valid before we tell the server
	//this function updates those by asking the server
	
	socket.emit("get_state", function(players, game){
		for(let i=0; i<game.players.length; i++){
			let name = game.players[i];
			player_boards[name].small_ship.distance = players[name].small_ship.distance;
			player_boards[name].small_ship.priority = players[name].small_ship.priority;
			player_boards[name].big_ship.distance = players[name].big_ship.distance;
			player_boards[name].big_ship.priority = players[name].big_ship.priority;
		}
	});
}



function setTurn(name){ //name of player, or undefined to set it to no one's turn (e.g. during movement phase)
	
	//Click event handler requires a building to be selectable to do its action, so updating selectable will suffice for enable/disable stuff
	
	//change data/enable-disable stuff
	my_turn = (name == my_name);
	pay_for_used = false;
	updateSelectableBuildings();
	
	//update GUI stuff
	//player board background
	for(let p in player_boards){
		player_boards[p].div.style.backgroundColor = "antiquewhite";
	}
	if(name != undefined){
		player_boards[name].div.style.backgroundColor = "#99ff99";
	}
	
	socket.emit("done");
}



function moveRoundCounterWhale(animate=true){
	//round will be the number we should end up on
	
	let startpoint = getLocation(round_counter_whale, ocean);
	let endpoint = {};
	
	if(round < 7){
		endpoint.x = round_counter_origin.x;
		endpoint.y = round_counter_origin.y + (round-1)*round_counter_offset;
	}
	else {
		endpoint.x = round_counter_origin.x + round_counter_offset;
		endpoint.y = round_counter_origin.y + (12-round)*round_counter_offset;
	}
	
	if(animate){
		//animate but keep as a child of the ocean
		moveAnimate(round_counter_whale, animation_div, startpoint, endpoint, whale_counter_speed, function(){
			socket.emit("done");
		});
	}
	else {
		round_counter_whale.style.left = endpoint.x + "px";
		round_counter_whale.style.top = endpoint.y + "px";
	}
}



function moveFirstPlayerToken(name){
	//name: name of player to move it to
	
	let destination = player_boards[name].first_player_token_spot;
	
	let startpoint = getLocation(first_player_token, animation_div);
	let endpoint = getLocation(destination, animation_div);
	endpoint.x += 5; //account for padding
	endpoint.y += 5;
	
	changeParent(first_player_token, animation_div);
	moveAnimate(first_player_token, player_board_container, startpoint, endpoint, first_player_token_speed, function(){
		changeParent(first_player_token, destination);
		socket.emit("done");
	});
}



function sellEmptySea(n){
	//n: number of empty sea tokens to sell
	
	//Note: This function only moves tokens to the tavern then removes them. Money stuff is taken care of by give()
	
	if(n > 2){
		throw new Error("May only sell up to 2 empty sea tokens, " + n + " requested");
	}
	
	let empty_sea_tokens = ocean.getElementsByClassName("empty_sea");
	empty_sea_tokens = Object.assign([], empty_sea_tokens); //so the list won't change as they're removed
	
	let idx = 0; //current index in empty_sea_tokens
	
	//define function to be called repeatedly with a delay between
	let tokenToTavern = function(){
		let empty_sea = empty_sea_tokens[idx];
		idx++;
		
		let startpoint = getLocation(empty_sea, animation_div);
		let endpoint = getLocation("tavern", animation_div);
		endpoint.x -= 0.5*empty_sea.width;
		endpoint.y -= 0.5*empty_sea.height;
		
		let last_one = (idx >= n);
		
		//animate
		changeParent(empty_sea, animation_div);
		moveAnimate(empty_sea, town, startpoint, endpoint, empty_sea_speed, function(){
			empty_sea.remove();
			if(last_one){
				socket.emit("done");
			}
		});
		
		//check if we need to do another one
		if(!last_one && n > 1){
			setTimeout(tokenToTavern, time_between_sea_sells);
		}
	}
	
	if(n > 0){
		tokenToTavern();
	}
}



//function to handle the pay 3 money for 2 food/wood (on playerboard)

function payFor(name, resource, step){
	//name: player name who's doing this
	//resource: "food" or "wood"
	//step: 0 or 1, step 0 is paying money, step 1 is receiving the resource
	
	if(resource != "food" && resource != "wood"){
		throw new Error("payFor() only accepts the resources food and wood, not " + resource);
	}
	
	if(step == 0){
		give("pay_for_" + resource, {money: 3}, name);
	}
	
	if(step == 1){
		let give_obj = {};
		give_obj[resource] = 2;
		give(name, give_obj, "pay_for_" + resource);
	}
}