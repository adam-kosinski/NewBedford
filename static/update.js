
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
			x: box.x - relative_to.x,
			y: box.y - relative_to.y
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

function newAnimatedResource(type){
	let img = document.createElement("img");
	img.className = "animated_resource";
	switch(type){
		case "food": img.src = "/static/images/food_3d.png"; break;
		case "wood": img.src = "/static/images/wood_3d.png"; break;
		case "brick": img.src = "/static/images/brick_3d.png"; break;
		case "money": img.src = "/static/images/small_coin_front.png"; break;
	}
	return img;
}


let makeResourceAndAnimate = function(name, thing, start_pos){ //start_pos relative to player_board_container
	//create resource
	let resource = newAnimatedResource(thing); //thing should always be "money" here
	resource.style.top = start_pos.y + "px";
	resource.style.left = start_pos.x + "px";
	player_board_container.appendChild(resource);
	
	//animate it
	let endpoint = getLocation(thing, player_scroll_wrapper, name);
	moveAnimate(resource, start_pos, endpoint, give_animation_speed, function(){ //see animate.js
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
		
		let start_pos = getLocation(thing, player_scroll_wrapper, from); //from is a name here
		makeResourceAndAnimate(name, thing, start_pos);
	}
	//check if coming from a building
	else if(buildings.hasOwnProperty(from)){
		let start_pos = getLocation(from, player_scroll_wrapper); //from is a building here
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



function moveWorker(name, where){
	//name: name of player
	//where: a building, or "player_board" to return it to storage
	
	if(where == "player_board"){
		
	}
	else if(buildings.hasOwnProperty(where)){
		//TODO: actually write this		
		let worker_slot = buildings[where].getOpenWorkerSlot();
		
		worker_slot.appendChild(player_boards[name].worker_1);
		player_boards[name].worker_1.style.top = "0";
		player_boards[name].worker_1.style.left = "0";
	}
	else {
		throw new Error("Cannot move worker to " + where +", invalid destination");
	}
}




function setTurn(name){ //name of player
	//indicates whose turn it is in the GUI, disables/enables appropriate things you can click
		
	//remember not all buildings are selectable (e.g. mansion)
	//I'm going to have the click event handler check if the building is selectable, only then do the action
	//check for how many workers are on the building - if it's player owned and there's a worker, don't make it selectable
}



function newRound(game){ //game object from server
	//remove all workers from the board, move the first player token
}