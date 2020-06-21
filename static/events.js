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

document.addEventListener("click", function(e){	
	
	console.log(e.pageX, e.pageY);
	
	//Buildings
	
	if(e.target.classList.contains("building") && e.target.classList.contains("selectable")){		
		
		//Checks
		
		if(animation_in_progress){
			alert("Animation in progress, wait for it to finish before doing stuff");
			return;
		}
		
		let building = e.target.object.type;
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
		}
		else if(building == "farm"){
			socket.emit("place_worker", "farm");
		}
		else if(building == "warehouse"){
			if(buildings.warehouse.getNumberOfWorkers() == 0){
				openPopup("warehouse_popup");
			}
			else {
				socket.emit("place_worker", "warehouse");
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
		
		
		//player buildings requiring further input 
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
			
		}
		else if(building == "lumber_mill"){
			openPopup("lumber_mill_popup");
		}
		else if(building == "market"){
			openPopup("market_popup");
		}
		else if(building == "tryworks"){
			
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
		
		
		//rest of the player buildings w/ actions
		else if(building == "bakery" ||
				building == "bank" ||
				building == "brickyard" ||
				building == "chandlery" ||
				building == "cooperage" ||
				building == "inn" ||
				building == "post_office" ||
				building == "schoolhouse" ||
				building == "tavern")
		{
			
		}
	}
});