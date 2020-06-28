//NOTE: Any events related to pop-up windows are in popup.js, not here


start_button.addEventListener("click", function(){
	let n_players = player_display.children.length;
	if(n_players < 2 || n_players > 4){
		alert("Game supports 2-4 players, but currently " + n_players + " are connected");
	}
	else {
		socket.emit("start_game");
	}
});


document.getElementById("home_screen_rulebook_menu").addEventListener("click", function(){
	openPopup("rulebook");
});


document.getElementById("clear_game_button").addEventListener("click", function(){
	if(confirm("Are you sure you want to clear the current game? All stored progress will be lost.")){
		if(confirm("Are you super definitely 100% sure?")){
			console.log("clear game");
			socket.emit("clear_game");
		}
	}
});


document.addEventListener("click", function(e){	
	
	console.log(e.pageX, e.pageY);
	
	if(!pay_for_used && !animation_in_progress){
		if(e.target.id == "pay_for_food" || (e.target.parentElement && e.target.parentElement.id == "pay_for_food")){
			//check if have enough money
			let n_money = Number(player_boards[my_name].money_counter.textContent);
			if(n_money < 3){
				alert("You don't have enough money to do this");
			}
			else {
				pay_for_used = true;
				updateSelectableBuildings();
				socket.emit("pay_for", "food");
			}
		}
		if(e.target.id == "pay_for_wood" || (e.target.parentElement && e.target.parentElement.id == "pay_for_wood")){
			//check if have enough money
			let n_money = Number(player_boards[my_name].money_counter.textContent);
			if(n_money < 3){
				alert("You don't have enough money to do this");
			}
			else {
				pay_for_used = true;
				updateSelectableBuildings();
				socket.emit("pay_for", "wood");
			}
		}
	}
	
	//Buildings	
	
	let building_target;
	
	let up_one = e.target.parentElement ? e.target.parentElement : undefined;
	let up_two = e.target.parentElement ?
					(e.target.parentElement.parentElement ? e.target.parentElement.parentElement : undefined)
					: undefined;
	
	if(e.target.classList.contains("building")){
		building_target = e.target;
	}
	else if(up_one && up_one.classList.contains("building")){
		building_target = up_one;
	}
	else if(up_two && up_two.classList.contains("building")){
		building_target = up_two;
	}
	
	
	if(building_target && building_target.classList.contains("selectable")){		
		
		//Checks
		
		if(animation_in_progress){
			alert("Animation in progress, wait for it to finish before doing stuff");
			return;
		}
		
		let building = building_target.object.type;
		console.log("Clicked on "+building);
		
		//check if can pay for the building - if not in town, not my building, and I don't have any money
		if(!buildings[building].in_town && !building_areas[my_name].buildings.includes(building) && Number(player_boards[my_name].money_counter.textContent) <= 0){
			alert("You don't have enough money to go here");
			return;
		}
		
		
		
		//Do building specific stuff
		
		//central town
		if(building == "town_hall"){
			build_type = "town_hall";
			build_menu_select_mode = true;
			openPopup("build_menu");
		}
		else if(building == "general_store"){
			openPopup("general_store_popup");
		}
		else if(building == "forest"){
			socket.emit("place_worker", "forest");
			my_turn = false;
			updateSelectableBuildings();
		}
		else if(building == "farm"){
			socket.emit("place_worker", "farm");
			my_turn = false;
			updateSelectableBuildings();
		}
		else if(building == "warehouse"){
			if(buildings.warehouse.getNumberOfWorkers() == 0){
				openPopup("warehouse_popup");
			}
			else {
				socket.emit("place_worker", "warehouse");
				my_turn = false;
				updateSelectableBuildings();
			}
		}
		
		
		//town - docks
		else if(building == "dockyard"){
			//check if have a ship in player board first
			let available_ships = player_boards[my_name].div.getElementsByClassName("ship");
			if(available_ships.length == 0){
				alert("You don't have any ships available to prepare");
				return;
			}
			//check if have enough wood
			let n_workers = buildings.dockyard.getNumberOfWorkers();
			let n_wood = Number(player_boards[my_name].wood_counter.textContent);
			if(n_workers == 0 && n_wood < 1 || n_workers > 0 && n_wood < 2){
				alert("You don't have enough wood to prepare a ship");
				return;
			}
			
			let which_ship = available_ships[0].className.match(/small_ship|big_ship/)[0];
			socket.emit("place_worker", "dockyard", {which_ship: which_ship});
			my_turn = false;
			updateSelectableBuildings();
		}
		else if(building == "city_pier"){
			//check if have a prepared ship to launch
			if( ! (
				player_boards[my_name].small_ship.parentElement.classList.contains("dock_slot") ||
				player_boards[my_name].big_ship.parentElement.classList.contains("dock_slot") )
			){
				alert("You don't have any prepared ships to launch");
				return;
			}
			launch_type = "city_pier";
			openPopup("launch_popup");
		}
		
		
		//player buildings requiring checks or further input 
		else if(building == "cooperage"){
			//see if there are any whales on a ship, if not, alert the player
			let ship_types = ["small_ship", "big_ship"];
			let whale_types = ["right_whale", "bowhead_whale", "sperm_whale"];
			
			for(let i=0; i<ship_types.length; i++){
				for(let j=0; j<whale_types.length; j++){
					let ship_type = ship_types[i];
					let whale_type = whale_types[j];
					
					console.log(ship_type, whale_type);
					
					let counter = player_boards[my_name][ship_type + "_" + whale_type + "_counter"];
					if(counter.textContent != "0"){
						socket.emit("place_worker", "cooperage");
						my_turn = false;
						updateSelectableBuildings();
						return;
					}
				}
			}
			
			alert("You don't have any whales on one of your ships, going here will give you nothing.");
		}
		else if(building == "courthouse"){
			build_type = "courthouse";
			build_menu_select_mode = true;
			openPopup("build_menu");
		}
		else if(building == "dry_dock"){
			//check if have a ship in player board first
			let available_ships = player_boards[my_name].div.getElementsByClassName("ship");
			if(available_ships.length == 0){
				alert("You don't have any ships available to prepare");
				return;
			}
			//check if have enough wood
			if(Number(player_boards[my_name].wood_counter.textContent) < 2){
				alert("You don't have enough wood (2) to prepare a ship");
				return;
			}
			launch_type = "dry_dock";
			openPopup("launch_popup");
		}
		else if(building == "lighthouse"){
			//make sure there's a ship in the ocean
			updateShipPriorityAndDistance(); //just in case
			if(player_boards[my_name].small_ship.distance == undefined && player_boards[my_name].big_ship.distance == undefined){
				alert("You don't have any ships in the ocean to move.");
			}
			else {
				showLighthouseScreen(); //bottom of popup.js
			}
		}
		else if(building == "lumber_mill"){
			openPopup("lumber_mill_popup");
		}
		else if(building == "market"){
			openPopup("market_popup");
		}
		else if(building == "post_office"){
			//don't let me go there if I own it
			if(building_areas[my_name].buildings.includes("post_office")){
				alert("You already own the post office");
			}
			else {
				socket.emit("place_worker", "post_office");
				my_turn = false;
				updateSelectableBuildings();
			}
		}
		else if(building == "tavern"){
			//only emit to server if there are ocean tiles, if none alert the user
			let empty_sea_tokens = ocean.getElementsByClassName("empty_sea");
			if(empty_sea_tokens.length > 0){
				socket.emit("place_worker", "tavern");
				my_turn = false;
				updateSelectableBuildings();
			}
			else {
				alert("There are no empty sea tokens available to sell.");
			}
		}
		else if(building == "tryworks"){
			//check if player has right whales they can return
			let n_on_small = Number(player_boards[my_name].small_ship_right_whale_counter.textContent);
			let n_on_big = Number(player_boards[my_name].big_ship_right_whale_counter.textContent);
			if(n_on_small == 0 && n_on_big == 0){
				alert("You don't have any right whales on your ships, going here will do nothing.");
				return;
			}
			openPopup("tryworks_popup");
		}
		else if(building == "wharf"){
			//check if have a prepared ship
			if( ! (
				player_boards[my_name].small_ship.parentElement.classList.contains("dock_slot") ||
				player_boards[my_name].big_ship.parentElement.classList.contains("dock_slot") )
			){
				alert("You don't have any prepared ships to launch");
				return;
			}
			launch_type = "wharf";
			openPopup("launch_popup");
		}
		
		
		//player buildings not requiring checks or further user input
		else if(building == "bakery" ||
				building == "bank" ||
				building == "brickyard" ||
				building == "chandlery" ||
				building == "inn" ||
				building == "schoolhouse")
		{
			socket.emit("place_worker", building);
			my_turn = false;
			updateSelectableBuildings();
		}
		
		//no event handlers for buildings w/o actions (e.g. mansion)
	}
});