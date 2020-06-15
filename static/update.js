
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

function getLocation(what, relative_to, name=undefined){
	//what: an element, a building (for which the center of it is returned), or anything in PlayerBoard.location
	//relative_to: top-left of this element is considered (0,0)
	//name: of player, if in a playerboard
	
	if(what instanceof HTMLElement){
		let box = what.getBoundingClientRect();
		let relative_to_box = relative_to.getBoundingClientRect();
				
		return {
			x: box.x - relative_to_box.x,
			y: box.y - relative_to_box.y
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
	else { //on playerboard
		let player_board_box = player_boards[name].div.getBoundingClientRect();
		let relative_to_box = relative_to.getBoundingClientRect();
		let local_pos = player_boards[name].location[what];
		
		return {
			x: (player_board_box.x + local_pos.x) - relative_to_box.x,
			y: (player_board_box.y + local_pos.y) - relative_to_box.y
		};
	}
}


let makeResourceAndAnimate = function(name, thing, start_pos){ //start_pos relative to player_board_container
	//create resource
	let resource = document.createElement("img");
	resource.className = "animated_resource";
	switch(thing){
		case "food": resource.src = "/static/images/food_3d.png"; break;
		case "wood": resource.src = "/static/images/wood_3d.png"; break;
		case "brick": resource.src = "/static/images/brick_3d.png"; break;
		case "money": resource.src = "/static/images/small_coin_front.png"; break;
	}
	resource.style.top = start_pos.y + "px";
	resource.style.left = start_pos.x + "px";
	animation_div.appendChild(resource);
	
	//animate it
	let endpoint = getLocation(thing, animation_div, name);
	moveAnimate(resource, player_board_container, start_pos, endpoint, give_animation_speed, function(){ //see animate.js
		resource.remove();
		//add one to receiving player's counter
		let counter = player_boards[name][thing + "_counter"];
		counter.textContent = Number(counter.textContent) + 1;
	});
}


//Function to give resources (food, wood, bricks, money - not whales) to a player. Handles both counter values and animations
//Resources can come from buildings, other players, or out of thin air (no animation).
//Only money is allowed to move from one player to another.
//There's no check if other players have the resources; it's simply subtracted from the counter - check this before calling.

//Two ways of calling - one for generic give, second for giving one item. The first uses the second

function give(name, stuff, from){
	//name: name of player to give resource to
	//stuff: object of {thing: amount, thing: amount, etc.} - things must be "food" "wood" "brick" or "money"
	//from: name of a building, or name of a player.
		//If left undefined, will just increment the counter, no animation
		//If resource is from a player, it must be 'money'
	
	let things = Object.keys(stuff); //array of property names - "food" "wood" etc.
	//keep giving the first thing in 'stuff' until we run out
	
	let give_next = function(){
		let this_thing = things[0];
		if(stuff[things[0]] > 1){
			stuff[things[0]]--;
		}
		else {
			things.splice(0,1); //done with this property
		}
		give_one(name, this_thing, from);
		if(things.length > 0){
			window.setTimeout(give_next, time_between_gives);
		}
	}
	give_next();
}


function give_one(name, thing, from){
	//name: name of player to give resource to
	//amount: amount of resource to give
	//thing: "food" "wood" "brick" or "money"
	//from: name of a building, or name of a player.
		//If left undefined, will just increment the counter, no animation
		//If resource is from a player, it must be 'money'
	
	//check if valid inputs
	if(!player_boards.hasOwnProperty(name)){
		throw new Error("Cannot give stuff to a player not in player_boards");
	}
	if(!(thing == "food" || thing == "wood" || thing == "brick" || thing == "money")){
		throw new Error("Cannot give " + thing + ", invalid resource type");
	}
	if(player_boards.hasOwnProperty(from)){
		if(thing != "money"){
			throw new Error("Cannot give anything but money from one player to another");
		}
	}
	
	//check if coming from a player
	if(player_boards.hasOwnProperty(from)){
		
		//subtract one from the money counter of the giving player
		let counter = player_boards[from][thing + "_counter"];
		counter.textContent = Number(counter.textContent) - 1;
		
		let start_pos = getLocation(thing, animation_div, from); //from is a name here
		makeResourceAndAnimate(name, thing, start_pos);
	}
	//check if coming from a building
	else if(buildings.hasOwnProperty(from)){
		let start_pos = getLocation(from, animation_div); //from is a building here
		makeResourceAndAnimate(name, thing, start_pos);
	}
	else {
		//just increment the receiving player's counter w/o animation
		let counter = player_boards[name][thing + "_counter"];
		counter.textContent = Number(counter.textContent) + 1;
	}
	
}






//Function to reduce a player's resources. Just decrements the counter the appropriate amount

function take(amount, thing, name){
	//amount: amount of resource to take
	//thing: "food" "wood" "brick" or "money"
	//name: name of player to take from
	
	//verify inputs are valid
	if(amount <= 0){
		throw new Error("Cannot take 0 or less resources, " + amount + " requested.");
	}
	if(!(thing == "food" || thing == "wood" || thing == "brick" || thing == "money")){
		throw new Error("Cannot take " + thing + ", invalid resource type");
	}
	if(!player_boards.hasOwnProperty(name)){
		throw new Error("Cannot take from a player (" + name + ") who doesn't have a board");
	}
	
	//remove
	let counter = player_boards[name][thing + "_counter"];
	counter.textContent = Number(counter.textContent) - amount;
}



function moveWorker(name, where){ //note: trying to move a player to a building while a place worker animation is going on will mess up the worker slots. Annoying to fix so stays
	//name: name of player
	//where: a building, or "player_board" to return all workers to storage
	
	if(where == "player_board"){
		let worker_1 = player_boards[name].worker_1;
		let worker_2 = player_boards[name].worker_2;
		
		let startpoint_1 = getLocation(worker_1, animation_div);
		let startpoint_2 = getLocation(worker_2, animation_div);
		let endpoint_1 = getLocation("worker_1_storage", animation_div, name);
		let endpoint_2 = getLocation("worker_2_storage", animation_div, name);
		
		//animate
		changeParent(worker_1, animation_div);
		changeParent(worker_2, animation_div);
		
		moveAnimate(worker_1, player_board_container, startpoint_1, endpoint_1, worker_animation_speed, function(){
			changeParent(worker_1, player_boards[name].div); //waiting till finished so things looking in the div don't think the worker was available during animation
			updateSelectableBuildings();
		});
		moveAnimate(worker_2, player_board_container, startpoint_2, endpoint_2, worker_animation_speed, function(){
			changeParent(worker_2, player_boards[name].div); //waiting till finished so things looking in the div don't think the worker was available during animation
			updateSelectableBuildings();
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
		});
	}
	else {
		throw new Error("Cannot move worker to " + where +", invalid destination");
	}
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
				else {
					buildings[type].setSelectable(true);
				}
			}
		}
		else {
			buildings[type].setSelectable(false);
		}
	}
}




function setTurn(name){ //name of player
	//indicates whose turn it is in the GUI, disables/enables appropriate things you can click
	
	//Click event handler requires a building to be selectable to do its action, so updating selectable will suffice for enable/disable stuff
	
	//change data/enable-disable stuff
	my_turn = (name == my_name);
	updateSelectableBuildings();
	
	//update GUI stuff
	//player board background
	for(let p in player_boards){
		player_boards[p].div.style.backgroundColor = "antiquewhite";
	}
	player_boards[name].div.style.backgroundColor = "#99ff99";
}



function newRound(game){ //game object from server
	//remove all workers from the board, move the first player token
}