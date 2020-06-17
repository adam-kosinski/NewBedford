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
	
	//Buildings
	
	if(/building/.test(e.target.className) && /selectable/.test(e.target.className)){		
		
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
			
		}
		else if(building == "city_pier"){
			
		}
		
		
		//player buildings requiring further input 
		else if(building == "courthouse"){
			build_type = "courthouse";
			build_menu_select_mode = true;
			openPopup("build_menu");
		}
		else if(building == "dry_dock"){
			
		}
		else if(building == "lighthouse"){
			
		}
		else if(building == "lumber_mill"){
			
		}
		else if(building == "market"){
			
		}
		else if(building == "tryworks"){
			
		}
		else if(building == "wharf"){
			
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