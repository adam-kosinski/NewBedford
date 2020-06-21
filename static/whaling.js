
function showOceanBag(){
	//we're going to animate this one as a child of the game div
	let ocean_pos = getLocation(ocean, game_div);
	let startpoint = {x: ocean_pos.x - 320, y: ocean_pos.y - 535};
	let endpoint = {x: startpoint.x, y: ocean_pos.y + 115};
	console.log("startpoint",startpoint);
	console.log("endpoint",endpoint);
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
	console.log("startpoint",startpoint);
	console.log("endpoint",endpoint);
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
		moveAnimate(whale, ocean_bag, startpoint_1, endpoint_1, whale_fast_speed, function(){
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
			moveAnimate(whale, ocean, startpoint_2, endpoint_2, whale_fast_speed, function(){
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