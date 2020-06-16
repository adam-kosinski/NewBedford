//utility functions -------------------------------------------------

function closePopups(){
	popup_background.style.display = "none";
	
	let popups = document.getElementsByClassName("popup");
	for(let i=0; i<popups.length; i++){
		popups[i].style.display = "none";
	}
}

function openPopup(id){ //id should be name of building + "_popup"
	closePopups(); //only have one open at a time
	
	//popup specific stuff
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



//Event handling ----------------------------------------------------

document.addEventListener("click", function(e){
	if(e.target.className == "x_button"){
		closePopups();
	}
	
	
	//warehouse
	if(e.target.id == "warehouse_wood"){
		socket.emit("place_worker", "warehouse", {brick: 1, wood: 1});
		closePopups();
	}
	else if(e.target.id == "warehouse_food"){
		socket.emit("place_worker", "warehouse", {brick: 1, food: 1});
		closePopups();
	}
	else if(e.target.id == "warehouse_brick"){
		socket.emit("place_worker", "warehouse", {brick: 2});
		closePopups();
	}
	
	
	
	//general_store	
	if(e.target.id == "store_sell_button"){
		console.log("sell",opened_store);
		let sell_data = {
			food: Number(food_to_sell.textContent),
			wood: Number(wood_to_sell.textContent),
			brick: Number(brick_to_sell.textContent)
		}
		console.log(sell_data)
		//TODO: emit
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
});


