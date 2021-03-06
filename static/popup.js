//utility functions -------------------------------------------------

function closePopups(){
	popup_background.style.display = "none";
	
	let popups = document.getElementsByClassName("popup");
	for(let i=0; i<popups.length; i++){
		popups[i].style.display = "none";
	}
}

function openPopup(id){ //id of popup's HTML element, or for stores: name of store + "_popup"
	closePopups(); //only have one open at a time
		
	//popup specific stuff
	if(id == "initial_resources_popup"){
		document.getElementById("starting_food").textContent = 0;
		document.getElementById("starting_wood").textContent = 0;
		document.getElementById("starting_brick").textContent = 0;
		document.getElementById("starting_money").textContent = 0;
		document.getElementById("starting_total").textContent = 0;
		document.getElementById("ready_button").disabled = true;
	}
	if(id == "sell_whale_popup"){
		document.getElementById("whale_seller_name").textContent = whale_seller==my_name? "You are selling:" : whale_seller + " is selling:";
		document.getElementById("whale_to_sell_display").src = "/static/images/" + whale_to_sell + ".png";
		document.getElementById("whale_buyer_name").textContent = whale_buyer==my_name? "you" : whale_buyer;
		
		document.getElementById("buy_whale_buttons").style.display = whale_buyer==my_name? "block" : "none";
	}
	if(id == "build_menu"){
		let container = document.getElementById("build_menu_buildings");
		if(build_menu_select_mode){
			document.getElementById("build_menu_title").textContent = "Select building to build:";
			container.classList.add("build_select_on");
		}
		else {
			document.getElementById("build_menu_title").textContent = "Available buildings to build";
			container.classList.remove("build_select_on");
		}
	}
	if(id == "build_discount_popup"){
		document.getElementById("building_to_build_display").src = "/static/images/buildings/" + building_to_build + "_back.jpg";
		document.getElementById("discount_food_counter").textContent = player_boards[my_name].food_counter.textContent;
		document.getElementById("discount_wood_counter").textContent = player_boards[my_name].wood_counter.textContent;
		document.getElementById("discount_brick_counter").textContent = player_boards[my_name].brick_counter.textContent;
		document.getElementById("second_discount_row").style.display = build_type=="courthouse"? "table-row" : "none";
		build_button.disabled = true;
		let choice_1 = document.getElementsByClassName("discount_choice_1");
		let choice_2 = document.getElementsByClassName("discount_choice_2");
		let cost = getBuildingCost(building_to_build);
		for(let i=0; i<3; i++){
			choice_1[i].style.backgroundColor = "white";
			choice_2[i].style.backgroundColor = "white";
			
			//don't display it if cost of that item is 0
			let resource = choice_1[i].className.match(/food|wood|brick/)[0];
			if(cost[resource] == 0){
				choice_1[i].style.display = "none";
				choice_2[i].style.display = "none";
			}
			else {
				choice_1[i].style.display = "inline";
				choice_2[i].style.display = "inline";
			}
		}
		first_discount = undefined;
		second_discount = undefined;
	}
	if(id == "general_store_popup"){
		loadStore("general_store");
		id = "store_popup";
	}
	if(id == "lumber_mill_popup"){
		loadStore("lumber_mill");
		id = "store_popup";
	}
	if(id == "market_popup"){
		loadStore("market");
		id = "store_popup";
	}
	if(id == "launch_popup"){
		//set correct costs
		let n_food = Number(player_boards[my_name].food_counter.textContent);
		let costs = [1,2,3,4,5,6]; //food cost
		if(launch_type == "city_pier" && buildings.city_pier.getNumberOfWorkers() == 0){
			costs = costs.map(x => x-1);
		}
		if(launch_type == "wharf"){
			costs = costs.map(x => Math.ceil(x/2));
		}
		for(let i=0; i<costs.length; i++){
			document.getElementById("cost_"+(i+1)).textContent = costs[i];
			let tr = document.getElementById("distance_"+(i+1));
			if(costs[i] > n_food){
				tr.classList.add("disabled");
			}
			else {
				tr.classList.remove("disabled");
			}
		}
	}
	if(id == "tryworks_popup"){
		//only let the player return right whales off a ship w/ right whales
		let n_on_small = Number(player_boards[my_name].small_ship_right_whale_counter.textContent);
		let n_on_big = Number(player_boards[my_name].big_ship_right_whale_counter.textContent);
		document.getElementById("tryworks_small_ship_button").style.display = n_on_small>0? "block" : "none";
		document.getElementById("tryworks_big_ship_button").style.display = n_on_big>0? "block" : "none";
	}
	
	//open
	popup_background.style.display = "block";
	document.getElementById(id).style.display = "block";
}

function loadStore(type){
	//type: "general_store", "lumber_mill", "market"
	
	opened_store = type;
	
	document.getElementById("store_food_counter").textContent = player_boards[my_name].food_counter.textContent;
	document.getElementById("store_wood_counter").textContent = player_boards[my_name].wood_counter.textContent;
	document.getElementById("store_brick_counter").textContent = player_boards[my_name].brick_counter.textContent;
	document.getElementById("store_food_row").style.display = "table-row";
	document.getElementById("store_wood_row").style.display = "table-row";
	document.getElementById("store_brick_row").style.display = "table-row";
	document.getElementById("wood_price").textContent = "$1";
	document.getElementById("store_bonus").style.display = "none";
	document.getElementById("market_bonus").style.display = "none";
	document.getElementById("store_total").textContent = "0";
	food_to_sell.textContent = 0;
	wood_to_sell.textContent = 0;
	brick_to_sell.textContent = 0;
	
	if(type == "general_store"){
		if(buildings.general_store.getNumberOfWorkers() == 0){
			document.getElementById("store_bonus").style.display = "block";
		}
	}
	if(type == "lumber_mill"){
		document.getElementById("store_food_row").style.display = "none";
		document.getElementById("store_brick_row").style.display = "none";
		document.getElementById("wood_price").textContent = "$2";
	}
	if(type == "market"){
		document.getElementById("market_bonus").style.display = "block";
	}
}



function getNumberOfShipsAtDistance(dist){
	let n = 0;
	updateShipPriorityAndDistance(); //just in case
	for(let name in player_boards){
		if(player_boards[name].small_ship.distance == dist){n++;}
		if(player_boards[name].big_ship.distance == dist){n++;}
	}
	return n;
}



//Event handling ----------------------------------------------------

document.addEventListener("click", function(e){
	
	if(e.target.className == "x_button"){
		closePopups();
	}
	
	
	//rulebook
	if(e.target.id == "next_page"){
		rulebook_page = Math.min(rulebook_page + 1, 9);
		document.getElementById("rulebook").style.backgroundImage = "url('/static/images/rules/page_" + rulebook_page + ".png')";
	}
	if(e.target.id == "prev_page"){
		rulebook_page = Math.max(rulebook_page - 1, 1);
		document.getElementById("rulebook").style.backgroundImage = "url('/static/images/rules/page_" + rulebook_page + ".png')";
	}
	//take care of cursor
	let next_page = document.getElementById("next_page");
	let prev_page = document.getElementById("prev_page");
	if(rulebook_page == 1){
		prev_page.style.cursor = "default";
	}
	else if(rulebook_page == 9){
		next_page.style.cursor = "default";
	}
	else {
		next_page.style.cursor = "pointer";
		prev_page.style.cursor = "pointer";
	}
	
	
	
	//initial resources
	//plus-minus stuff
	if(e.target.parentElement.classList.contains("starting")){
		let counter =  e.target.parentElement.previousElementSibling;
		let type = counter.id.match(/food|wood|brick|money/)[0];
		
		if(e.target.classList.contains("plus")){
			counter.textContent = Number(counter.textContent) + 1;
		}
		if(e.target.classList.contains("minus")){
			counter.textContent = Math.max(Number(counter.textContent) - 1, 0);
		}
		
		//total
		let total = document.getElementById("starting_total");
		let n_food = Number(document.getElementById("starting_food").textContent);
		let n_wood = Number(document.getElementById("starting_wood").textContent);
		let n_brick = Number(document.getElementById("starting_brick").textContent);
		let n_money = Number(document.getElementById("starting_money").textContent);
		total.textContent = n_food + n_wood + 2*n_brick + n_money;
		
		//ready_button state
		let ready_button = document.getElementById("ready_button");
		if(total.textContent == "5"){
			ready_button.disabled = false;
			ready_button.style.cursor = "pointer";
		}
		else {
			ready_button.disabled = true;
			ready_button.style.cursor = "default";
		}
	}
	if(e.target.id == "ready_button"){
		let n_food = Number(document.getElementById("starting_food").textContent);
		let n_wood = Number(document.getElementById("starting_wood").textContent);
		let n_brick = Number(document.getElementById("starting_brick").textContent);
		let n_money = Number(document.getElementById("starting_money").textContent);
		let starting_resources = {
			food: n_food,
			wood: n_wood,
			brick: n_brick,
			money: n_money
		};
		
		closePopups();
		socket.emit("initial_resources", starting_resources);
	}
	
	
	
	
	
	
	//build menu
	if(e.target.id == "build_menu_mallet" || (e.target.parentElement && e.target.parentElement.id == "build_menu_mallet")){
		build_menu_select_mode = false;
		openPopup("build_menu");
	}
	
	if(e.target.id == "rule_menu" || (e.target.parentElement && e.target.parentElement.id == "rule_menu")){
		openPopup("rulebook");
	}
	
	if(build_menu_select_mode && e.target.tagName == "IMG"){
		let split = e.target.id.split("-");
		if(split[1] == "back"){
			building_to_build = split[0];
			
			//open the build_discount_popup if first player, otherwise check if player has resources now
			if((build_type == "town_hall" && buildings.town_hall.getNumberOfWorkers() == 0) ||
			   (build_type == "courthouse" && buildings.courthouse.getNumberOfWorkers() == 0))
			{
				openPopup("build_discount_popup");
			}
			else if(canPlayerBuild(my_name, building_to_build)){ //will only trigger w/ town hall b/c only one player allowed on the courthouse
				let yes_build = confirm("Confirm build?");
				if(yes_build){
					socket.emit("build", building_to_build, build_type, getBuildingCost(building_to_build));
					closePopups();
					my_turn = false;
					updateSelectableBuildings();
				}
			}
			else {
				alert("You don't have enough resources to build this building");
			}
		}
	}
	
	
	
	//build discount popup
	if(e.target.classList.contains("discount_choice_1")){
		if(build_type == "town_hall" || (build_type == "courthouse" && second_discount)){
			build_button.disabled = false;
			build_button.style.cursor = "pointer";
		}
		
		let same_row = document.getElementsByClassName("discount_choice_1");
		for(let i=0; i<same_row.length; i++){
			same_row[i].style.backgroundColor = "white";
		}
		e.target.style.backgroundColor = "orange";
		
		first_discount = e.target.className.match(/food|wood|brick/)[0];
	}
	
	if(e.target.classList.contains("discount_choice_2")){
		if(first_discount){
			build_button.disabled = false;
			build_button.style.cursor = "pointer";			
		}
		
		let same_row = document.getElementsByClassName("discount_choice_2");
		for(let i=0; i<same_row.length; i++){
			same_row[i].style.backgroundColor = "white";
		}
		e.target.style.backgroundColor = "orange";
		
		second_discount = e.target.className.match(/food|wood|brick/)[0];
	}
	
	if(e.target.id == "build_button"){
		let discount = build_type=="courthouse"? [first_discount, second_discount] : [first_discount];
		if(canPlayerBuild(my_name, building_to_build, discount)){
			console.log("building", building_to_build);
			console.log("discount", discount);
			
			let cost = getBuildingCost(building_to_build, discount);
			socket.emit("build", building_to_build, build_type, cost);
			
			my_turn = false;
			updateSelectableBuildings();
			closePopups();
		}
		else {
			alert("You don't have enough resources to build this building with the chosen discount.\n\nIf building with the courthouse, this includes paying the courthouse owner.");
		}
	}
	
	
	
	//warehouse
	if(e.target.id == "warehouse_wood"){
		socket.emit("place_worker", "warehouse", {brick: 1, wood: 1});
		my_turn = false;
		updateSelectableBuildings();
		closePopups();
	}
	else if(e.target.id == "warehouse_food"){
		socket.emit("place_worker", "warehouse", {brick: 1, food: 1});
		my_turn = false;
		updateSelectableBuildings();
		closePopups();
	}
	else if(e.target.id == "warehouse_brick"){
		socket.emit("place_worker", "warehouse", {brick: 2});
		my_turn = false;
		updateSelectableBuildings();
		closePopups();
	}
	
	
	
	//store	
	if(e.target.id == "store_sell_button"){
		console.log("sell",opened_store);
		let sell_data = {
			food: Number(food_to_sell.textContent),
			wood: Number(wood_to_sell.textContent),
			brick: Number(brick_to_sell.textContent)
		}
		console.log(sell_data)
		socket.emit("place_worker", opened_store, sell_data);
		my_turn = false;
		updateSelectableBuildings();
		closePopups();
	}
	else if(e.target.id == "food_plus"){
		let my_food = Number(player_boards[my_name].food_counter.textContent);
		food_to_sell.textContent = Math.min( Number(food_to_sell.textContent) + 1, my_food );
	}
	else if(e.target.id == "food_minus"){
		food_to_sell.textContent = Math.max( Number(food_to_sell.textContent) - 1, 0 );
	}
	else if(e.target.id == "wood_plus"){
		let my_wood = Number(player_boards[my_name].wood_counter.textContent);
		wood_to_sell.textContent = Math.min( Number(wood_to_sell.textContent) + 1, my_wood );
	}
	else if(e.target.id == "wood_minus"){
		wood_to_sell.textContent = Math.max( Number(wood_to_sell.textContent) - 1, 0 );
	}
	else if(e.target.id == "brick_plus"){
		let my_brick = Number(player_boards[my_name].brick_counter.textContent);
		brick_to_sell.textContent = Math.min( Number(brick_to_sell.textContent) + 1, my_brick );
	}
	else if(e.target.id == "brick_minus"){
		brick_to_sell.textContent = Math.max( Number(brick_to_sell.textContent) - 1, 0 );
	}
	
	if(food_to_sell.textContent == "0" && wood_to_sell.textContent == "0" && brick_to_sell.textContent == "0"){
		store_sell_button.disabled = true;
		store_sell_button.style.cursor = "default";
	}
	else {
		store_sell_button.disabled = false;
		store_sell_button.style.cursor = "pointer";
	}
	
	let n_food = Number(food_to_sell.textContent);
	let n_wood = Number(wood_to_sell.textContent);
	let n_brick = Number(brick_to_sell.textContent);
	let total = document.getElementById("store_total");
	switch(opened_store){
		case "general_store": total.textContent = n_food + n_wood + 2*n_brick; break;
		case "lumber_mill": total.textContent = 2*n_wood; break;
		case "market": total.textContent = (n_food>0 ? n_food+1 : 0) + (n_wood>0 ? n_wood+1 : 0) + 2*(n_brick>0 ? n_brick+1 : 0); break;
	}
	
	
	
	//launch popup
	if(e.target.tagName == "TR" || e.target.parentElement.tagName == "TR" || e.target.parentElement.parentElement.tagName == "TR"){
		//note: that if statement has the potential to produce errors if the element is doesn't have enough parents going up
		//I don't really care though, if it gets that far up the tree nothing should be happening anyways. Also this is a v v v rare event
		
		let tr = e.target.tagName == "TR" ? e.target : 
			e.target.parentElement.tagName == "TR" ? e.target.parentElement : e.target.parentElement.parentElement;
		
		if(tr.classList.contains("distance_option") && !tr.classList.contains("disabled")){
			let distance = Number(tr.id.match(/[1-6]/)[0]);
			if(getNumberOfShipsAtDistance(distance) >= 3){ //should never be greater than 3, but who knows? Function in the top section of this file
				alert("Distance " + distance + " is full of ships already, you can't launch there");
				return;
			}
			
			let cost = Number(document.getElementById("cost_"+distance).textContent);
			socket.emit("place_worker", launch_type, {distance: distance, cost:cost});
			my_turn = false;
			updateSelectableBuildings();
			closePopups();
		}
	}
	
	
	
	//tryworks popup
	if(e.target.id == "tryworks_small_ship_button"){
		closePopups();
		socket.emit("place_worker", "tryworks", {which_ship: "small_ship"});
		my_turn = false;
		updateSelectableBuildings();
	}
	if(e.target.id == "tryworks_big_ship_button"){
		closePopups();
		socket.emit("place_worker", "tryworks", {which_ship: "big_ship"});
		my_turn = false;
		updateSelectableBuildings();
	}
	
});







/* Lighthouse stuff -------------------------------------------- */

function showLighthouseScreen(){
	closePopups(); //just in case?
	
	ocean.style.zIndex = 16;
	ocean_mask.style.display = "block";
	ocean_mask_sign.style.display = "block";
	
	buildings.dockyard.div.classList.remove("selectable");
	buildings.city_pier.div.classList.remove("selectable");
	
	lighthouse_screen_open = true;
}

function hideLighthouseScreen(){
	ocean_mask.style.display = "none";
	ocean_mask_sign.style.display = "none";
	ocean.style.zIndex = 1;
	
	updateSelectableBuildings();
	
	lighthouse_screen_open = false;
}


document.addEventListener("keydown", function(e){
	if(e.key == "Escape" && lighthouse_screen_open){
		hideLighthouseScreen();
		ship_highlighter.style.display = "none";
	}
});

ocean.addEventListener("mousemove", function(e){
	if(lighthouse_screen_open && e.target == player_boards[my_name].small_ship && e.target.distance != undefined){
		ocean.style.cursor = "pointer";
		highlightShip(my_name, "small_ship");
	}
	else if(lighthouse_screen_open && e.target == player_boards[my_name].big_ship && e.target.distance != undefined){
		ocean.style.cursor = "pointer";
		highlightShip(my_name, "big_ship");
	}
	else {
		if(lighthouse_screen_open){ship_highlighter.style.display = "none";}
		ocean.style.cursor = "";
	}
});

ocean.addEventListener("click", function(e){
	if(lighthouse_screen_open && e.target == player_boards[my_name].small_ship && e.target.distance != undefined){
		//check if next row is full
		if(getNumberOfShipsAtDistance(e.target.distance + 1) >= 3){
			alert("The next row is full, you can't move your ship there.");
		}
		else if(e.target.distance >= 6){
			alert("This ship is at distance 6, it can't be moved out further");
		}
		else {
			hideLighthouseScreen();
			ocean.style.cursor = "";
			ship_highlighter.style.display = "none";
			socket.emit("place_worker", "lighthouse", {which_ship: "small_ship"});
			my_turn = false;
			updateSelectableBuildings();
		}
	}
	else if(lighthouse_screen_open && e.target == player_boards[my_name].big_ship && e.target.distance != undefined){
		if(getNumberOfShipsAtDistance(e.target.distance + 1) >= 3){
			alert("The next row is full, you can't move your ship there.");
		}
		else if(e.target.distance >= 6){
			alert("This ship is at distance 6, it can't be moved out further");
		}
		else {
			hideLighthouseScreen();
			ocean.style.cursor = "";
			ship_highlighter.style.display = "none";
			socket.emit("place_worker", "lighthouse", {which_ship: "big_ship"});
			my_turn = false;
			updateSelectableBuildings();
		}
	}
});

