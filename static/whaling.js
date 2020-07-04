
function showOceanBag(){
	//we're going to animate this one as a child of the game div
	let ocean_pos = getLocation(ocean, game_div);
	let startpoint = {x: ocean_pos.x - 320, y: ocean_pos.y - 535};
	let endpoint = {x: startpoint.x, y: ocean_pos.y + 115};
	moveAnimate(ocean_bag, animation_div, startpoint, endpoint, ocean_bag_speed, function(){
		//making scroll_to_match a fixed element negates extra scrolling effect (already taken care of b/c child of game_div)
		socket.emit("done");
	});
}

function hideOceanBag(){
	//we're going to animate this one as a child of the game div
	let ocean_pos = getLocation(ocean, game_div);
	let startpoint = {x: ocean_pos.x - 320, y: ocean_pos.y + 115};
	let endpoint = {x: startpoint.x, y: ocean_pos.y - 535};
	moveAnimate(ocean_bag, animation_div, startpoint, endpoint, ocean_bag_speed, function(){
		socket.emit("done");
	});
}

function clearPreviousWhales(){ //"whale" can mean empty sea by the way
	//we assume the ocean bag is shown, and animate the whale tokens going back in - basically the opposite of drawWhale() below
	//animation first done w/ animation_div as parent, then going into the bag w/ ocean_bag as parent (so z-index stuff works right)

	let whales = ocean.getElementsByClassName("whale");
	whales = Object.assign([], whales); //assign to an array so it's not so dynamic
	
	if(whales.length == 0){
		socket.emit("done");
		return;
	}
	let bag_pos = getLocation(ocean_bag, animation_div);
	
	let idx = 0;
	
	//define function to call at a delay (to do one whale at a time)
	let putWhaleBack = function(){
		let whale = whales[idx];
		let last_whale = idx >= whales.length - 1;
		idx++;
		
		let startpoint_1 = getLocation(whale, animation_div);
		let endpoint_1 = {
			x: bag_pos.x + 115, //see drawWhale
			y: bag_pos.y - 75
		};
		changeParent(whale, animation_div);
		moveAnimate(whale, ocean_bag, startpoint_1, endpoint_1, whale_medium_speed, function(){
			let startpoint_2 = {x: 115, y: -75};
			let endpoint_2 = {x: 115, y: 50};
			changeParent(whale, ocean_bag);
			moveAnimate(whale, animation_div, startpoint_2, endpoint_2, whale_draw_speed, function(){ //using animation_div to cancel out scroll correction b/c animation_div is fixed positioned
				whale.remove();
				if(last_whale){
					socket.emit("done");
				}
			});
		});
		
		if(!last_whale){
			setTimeout(putWhaleBack, time_between_whales_back_in);
		}
	}
	
	putWhaleBack();
}

function drawWhale(type, index){
	//type: "empty_sea", "right_whale", "bowhead_whale", or "sperm_whale"
	//index: 0 for the first whale drawn, 1 for second, etc.
	
	let whale = document.createElement("img");
	whale.className = "whale";
	if(type == "empty_sea"){whale.classList.add("empty_sea");}
	whale.id = "whale_" + index;
	whale.src = "/static/images/" + type + ".png";
	whale.style.left = "115px"; //from fiddling with how it looks on the image
	whale.style.top = "50px";
	whale.style.zIndex = 1;
	ocean_bag.appendChild(whale);
	
	//now animate it coming out of the bag, then going to the correct place on the right of the ocean
	let startpoint_1 = {x: 115, y: 50};
	let endpoint_1 = {x: 115, y: -75};
	moveAnimate(whale, animation_div, startpoint_1, endpoint_1, whale_draw_speed, function(){ //using animation div to cancel scroll-matching animation effect
		//set timeout to break up the change in animation speed
		setTimeout(function(){
			//put the whale in a storage spot, using animation_div this time as the parent when animating
			let startpoint_2 = getLocation(whale, animation_div);
			
			let ocean_pos = getLocation(ocean, animation_div);
			let endpoint_2 = {
				x: ocean_pos.x + whale_storage_origin.x,
				y: ocean_pos.y + whale_storage_origin.y + index*whale_storage_offset_y
			};
			
			changeParent(whale, animation_div);
			moveAnimate(whale, ocean, startpoint_2, endpoint_2, whale_medium_speed, function(){
				changeParent(whale, ocean);
				whale.style.zIndex = ""; //reset it to default so the :hover styling can work
				socket.emit("done");
			});
		}, 100);
	});
}



function highlightShip(name, which_ship){
	//name: player name
	//which_ship: "small_ship" or "big_ship"
	
	let ship = player_boards[name][which_ship];
	let ship_center_pos = getLocation(ship, ocean, undefined, true);
	
	ship_highlighter.style.width = which_ship == "small_ship" ? "10px" : "20px";
	ship_highlighter.style.height = which_ship == "small_ship" ? "10px" : "20px";
	ship_highlighter.style.left = ship_center_pos.x + "px";
	ship_highlighter.style.top = ship_center_pos.y + "px";
	ship_highlighter.style.zIndex = ship.style.zIndex; //ship guaranteed to have a styled z-index b/c I started them w/ z-index 0
	//also guaranteed to be behind the ship since I added the highlighter to the ocean div before the ship
	
	ship_highlighter.style.display = "block";
}


function setWhaleChooser(name, which_ship){
	//name: name of the player currently choosing a whale, or undefined if no one is
	//which_ship: "small_ship" or "big_ship"
	
	console.log("server says: set whale chooser",name,which_ship);
	
	if(name == undefined){
		ship_highlighter.style.display = "none";
		choose_whale_sign.style.display = "none";
		socket.emit("done");
		return;
	}
	
	highlightShip(name, which_ship);
	let whale_options = ocean.getElementsByClassName("whale");
	
	if(name == my_name){
		//show choose whale sign and display tiles as clickable
		let ocean_pos = getLocation(ocean, game_div);
		choose_whale_sign.style.left = ocean_pos.x + 100 + "px";
		choose_whale_sign.style.top = ocean_pos.y - 85 + "px";
		choose_whale_sign.style.display = "block";
		
		for(let i=0; i<whale_options.length; i++){
			if(! whale_options[i].classList.contains("empty_sea")){
				whale_options[i].classList.add("selectable");
			}
		}
	}
	else {
		choose_whale_sign.style.display = "none";
		for(let i=0; i<whale_options.length; i++){
			whale_options[i].classList.remove("selectable");
		}
	}
	
	socket.emit("done");
}


function chooseWhale(name, which_ship, whale_type, idx){
	//name: player name
	//which_ship: "small_ship" or "big_ship"
	//whale_type: "right_whale", "bowhead_whale", or "sperm_whale"
	//idx: index of the chosen whale
	
	//first remove the choose whale sign and the highlighting
	choose_whale_sign.style.display = "none";
	let whales = document.getElementsByClassName("whale");
	for(let i=0; i<whales.length; i++){
		whales[i].classList.remove("selectable");
	}
	
	//animate the whale going to the player's ship
	let whale = document.getElementById("whale_" + idx);
	let startpoint = getLocation(whale, animation_div);
	let endpoint = getLocation(which_ship + "_" + whale_type, animation_div, name);
	endpoint.x -= 0.5*whale.width;
	endpoint.y -= 0.5*whale.height;
	
	changeParent(whale, animation_div);
	moveAnimate(whale, player_board_container, startpoint, endpoint, whale_fast_speed, function(){
		whale.remove();
		player_boards[name][which_ship + "_" + whale_type + "_counter"].addOne();
		socket.emit("done");
	});
}



function startReturn(name, which_ship, emit_done=true){
	//name: name of player who's starting to return their ship
	//which_ship: "small_ship" or "big_ship"
	
	//display on GUI
	highlightShip(name, which_ship);
	player_boards[name][which_ship + "_whale_counter_table"].classList.add("returning");
	
	if(name == my_name){		
		//make whales selectable
		let right_whales = player_boards[name][which_ship + "_right_whale_counter"];
		let bowhead_whales = player_boards[name][which_ship + "_bowhead_whale_counter"];
		let sperm_whales = player_boards[name][which_ship + "_sperm_whale_counter"];
		
		if(right_whales.textContent != "0"){right_whales.classList.add("selectable");}
		if(bowhead_whales.textContent != "0"){bowhead_whales.classList.add("selectable");}
		if(sperm_whales.textContent != "0"){sperm_whales.classList.add("selectable");}
		
		alert("Return the whales on your " + which_ship.replace("_"," ") + ". Click to pay for a whale, shift click to sell it.");
	}
	
	if(emit_done){socket.emit("done");}
}

function payForWhale(name, which_ship, whale_type, buyer=undefined){
	//name: name of player returning a whale
	//which_ship: "small_ship" or "big_ship"
	//whale_type: "right_whale", "bowhead_whale", or "sperm_whale"
	//buyer: name of buyer (only if the whale was bought) - the whale will go to them instead of the person returning the whale
	
	let ship_counter = player_boards[name][which_ship + "_" + whale_type + "_counter"];
	let cost = whale_costs[whale_type];
	
	give(ship_counter, {money: cost}, buyer? buyer : name);
}

function payWhaleSeller(name, which_ship, whale_type){
	//name: name of player returning a whale
	//which_ship: "small_ship" or "big_ship"
	//whale_type: "right_whale", "bowhead_whale", or "sperm_whale"
	
	//this is the first function that gets called when a whale is sold, so close the sell dialog
	whale_seller = undefined;
	whale_to_sell = undefined;
	whale_buyer = undefined;
	closePopups();
	
	let ship_counter = player_boards[name][which_ship + "_" + whale_type + "_counter"];
	let sold_for = whale_costs[whale_type] / 2;
	
	give(name, {money: sold_for}, ship_counter);
}

function returnWhale(name, which_ship, whale_type, buyer=undefined){
	//name: name of player returning a whale
	//which_ship: "small_ship" or "big_ship"
	//whale_type: "right_whale", "bowhead_whale", or "sperm_whale"
	//buyer: name of buyer (only if the whale was bought) - the whale will go to them instead of the person returning the whale
	
	//decrement the ship's whale counter
	let ship_counter = player_boards[name][which_ship + "_" + whale_type + "_counter"]
	ship_counter.subtractOne();
	if(ship_counter.textContent == "0"){
		ship_counter.classList.remove("selectable");
	}
	
	//animate a whale going to the return spot
	let whale = document.createElement("img");
	whale.className = "whale_counter"; //take advantage of this class's already-done width and height styling
	whale.src = "/static/images/" + whale_type + ".png";
	player_boards[name].div.appendChild(whale);
	
	//copy over the width/height values from the class styling, to this element, so we can change its parent to the animation_div
	whale.style.width = whale.width + "px";
	whale.style.height = whale.height + "px";
	
	let startpoint = getLocation(which_ship + "_" + whale_type, animation_div, name);
	startpoint.x -= 0.5*whale.width;
	startpoint.y -= 0.5*whale.height;
	
	let endpoint = getLocation(whale_type, animation_div, buyer? buyer : name);
	endpoint.x -= 0.5*whale.width;
	endpoint.y -= 0.5*whale.height;
		
	//animate
	animation_div.appendChild(whale);
	moveAnimate(whale, player_board_container, startpoint, endpoint, whale_return_speed, function(){
		whale.remove();
		player_boards[buyer? buyer : name][whale_type + "_counter"].addOne();
		returning_whale = false;
		socket.emit("done");
	});
}

function trashWhale(name, which_ship, whale_type){ //make whale fade out if no one bought it
	//name: name of player returning a whale
	//which_ship: "small_ship" or "big_ship"
	//whale_type: "right_whale", "bowhead_whale", or "sperm_whale"
	
	//decrement the ship's whale counter
	let ship_counter = player_boards[name][which_ship + "_" + whale_type + "_counter"]
	ship_counter.subtractOne();
	if(ship_counter.textContent == "0"){
		ship_counter.classList.remove("selectable");
	}
	
	//animate a whale rising from the slot and fading out
	
	//create whale first
	let whale = document.createElement("img");
	whale.className = "whale_counter"; //take advantage of this class's already-done width and height styling
	whale.src = "/static/images/" + whale_type + ".png";
	player_boards[name].div.appendChild(whale);
	
	//copy over the width/height values from the class styling, to this element, so we can change its parent to the animation_div
	whale.style.width = whale.width + "px";
	whale.style.height = whale.height + "px";
	
	let startpoint = getLocation(which_ship + "_" + whale_type, animation_div, name);
	startpoint.x -= 0.5*whale.width;
	startpoint.y -= 0.5*whale.height;
	
	let endpoint = {
		x: startpoint.x,
		y: startpoint.y - 0.5*whale.height
	};
	
	
	//now animate
	let move_speed = Math.abs(startpoint.y - endpoint.y) / (trash_whale_duration + 50); //little longer moving than fading b/c the move's finish function removes the whale
	
	animation_div.appendChild(whale);
	moveAnimate(whale, player_board_container, startpoint, endpoint, move_speed, function(){
		whale.remove();
		socket.emit("done");
	});
	fadeAnimate(whale, 1, 0, trash_whale_duration, function(){});
}

function finishReturn(){
	
	//remove styling showing that a ship was returning
	//highlight was already removed in moveShip(), called by the server before this function
	let table = document.getElementsByClassName("returning")[0];
	if(table){
		table.classList.remove("returning");
	}
	
	//whale counters from the returned ship should by this point not be selectable, so don't need to do anything there
	
	socket.emit("done"); //wow that was really a three line function
}



// --------- EVENT LISTENERS ---------------------------------------------------------------------------------------


//Event listner for choosing whales

ocean.addEventListener("click",function(e){
	if(! (e.target.classList.contains("whale") && e.target.classList.contains("selectable")) ){
		return;
	}
	
	let idx = Number(e.target.id.match(/\d+/)[0]);
	
	//immediately make whales non-selectable, in case lag allows a second click
	choose_whale_sign.style.display = "none";
	let whales = document.getElementsByClassName("whale");
	for(let i=0; i<whales.length; i++){
		whales[i].classList.remove("selectable");
	}
	
	console.log("choose whale", idx);
	socket.emit("choose_whale", idx);
});



//Event listener for passing on choosing whales (if can't or if don't want to)

choose_whale_pass_button.addEventListener("click", function(e){
	
	//immediately make whales non-selectable, in case lag allows a second click
	choose_whale_sign.style.display = "none";
	let whales = document.getElementsByClassName("whale");
	for(let i=0; i<whales.length; i++){
		whales[i].classList.remove("selectable");
	}
	
	socket.emit("choose_whale", undefined);
});


//Event listener for returning a whale

document.addEventListener("click", function(e){
	if( ! (e.target.classList.contains("whale_counter") && e.target.classList.contains("selectable")) ){
		return;
	}
	if(returning_whale){return;} //wait for the last one to finish
	
	let whale_type = e.target.className.match(/right_whale|bowhead_whale|sperm_whale/)[0];
	
	if(e.shiftKey){
		//TODO sell the whale
		console.log("sell", whale_type);
		
		popup_background.style.display = "block"; //open immediately to prevent additional return/sell clicks
		socket.emit("sell_whale", whale_type, whale_costs[whale_type]);
	}
	else {
		//return the whale
		
		let cost = whale_costs[whale_type];
		let n_money = Number(player_boards[my_name].money_counter.textContent);
		
		if(cost > n_money){
			alert("You don't have enough money to return this whale");
			return;
		}
		
		returning_whale = true; //prevent problems with rapid clicking
		
		console.log("return",whale_type);
		socket.emit("return_whale", whale_type, cost);
	}
});



//Event listeners for buying a whale

document.getElementById("buy_whale_buttons").addEventListener("click", function(e){
	if(whale_bought_or_passed){return;}
	
	if(e.target.id == "buy_whale_button"){
		console.log("buy");
		
		let cost = whale_costs[whale_to_sell];
		let n_money = Number(player_boards[my_name].money_counter.textContent);
		
		if(cost > n_money){
			alert("You don't have enough money to buy this whale");
			return;
		}
		
		whale_bought_or_passed = true;
		socket.emit("buy_whale", true);
	}
	else if(e.target.id == "no_buy_whale_button"){
		whale_bought_or_passed = true;
		console.log("pass");
		socket.emit("buy_whale", false);
	}
});