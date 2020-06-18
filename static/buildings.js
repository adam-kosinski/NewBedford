class Building {
	constructor(type, width, height){
		//NOTE: if width and height are provided, it is assumed the building is in the town, and no background image is rendered
		//Also, for town buildings, worker slots must be specified manually, since they're not neatly one-in-the-center
		
		this.type = type;
		
		this.div = document.createElement("div");
		this.div.className = "building";
		this.div.object = this; //so click handlers can trace from the event target to this object
		
		this.location = undefined; //set by setPosition() below
		this.worker_slots = []; //Can find number of workers by looking inside each slot and counting - see this.getNumberOfWorkers()
		//see this.addWorkerSlot()
		
		this.has_action = true;
		if(type=="counting_house" || type=="mansion" || type=="municipal_office" || type=="seamens_bethel"){
			this.has_action = false;
		}
		
		//in town conditional stuff
		this.in_town = false;
		if(width != undefined && height != undefined){
			this.in_town = true;
			this.div.style.width = width + "px";
			this.div.style.height = height + "px";
		} else {
			this.div.style.backgroundImage = "url('/static/images/buildings/" + type + ".jpg')";
			//go ahead and add the single worker slot in the middle
			this.addWorkerSlot(building_width/2 - worker_height/2, building_height/2 - worker_height/2);
		}
		
		//add it
		town.appendChild(this.div);
		buildings[type] = this;
		
		//initialize if it's selectable (have to have added it first)
		updateSelectableBuildings();
	}
	
	addWorkerSlot(x, y){ //coords relative to building div, top-left of the worker
		let slot = document.createElement("div");
		slot.className = "worker_slot";
		slot.style.top = y + "px";
		slot.style.left = x + "px";
		this.div.appendChild(slot);
		this.worker_slots.push(slot);
	}
	
	getOpenWorkerSlot(){
		for(let i=0; i<this.worker_slots.length; i++){
			let slot = this.worker_slots[i];
			if(slot.children.length == 0){
				return slot;
			}
		}
		throw new Error("Couldn't find empty worker slot in " + this.type + " building");
	}
	
	getNumberOfWorkers(){
		let n = 0;
		for(let i=0; i<this.worker_slots.length; i++){
			let slot = this.worker_slots[i];
			if(slot.children.length != 0){
				n++;
			}
		}
		return n;
	}
	
	setPosition(left, top){ //TODO: decide whether to keep this
		this.div.style.left = left + "px";
		this.div.style.top = top + "px";
	}
	
	setSelectable(selectable){ //arg is true/false
		this.selectable = selectable;
		if(selectable == true){
			this.div.classList.add("selectable");
		}
		else {
			this.div.classList.remove("selectable");
		}
	}
}




class BuildingArea {
	constructor(name){ //player name
		this.name = name;
		this.index = Object.keys(building_areas).length;
		
		//determine number of 90deg counterclockwise rotations (though shows up as clockwise b/c websites)
		switch(this.index){
			case 0: this.n_rotations = 0; break;
			case 1: this.n_rotations = 2; break;
			case 2: this.n_rotations = 1; break;
			case 3: this.n_rotations = 3; break;
			default: throw new Error("BuildingArea has invalid index in building_areas array");
		}
		
		this.buildings = []; //can have undefined 'holes' b/c of the post office. Next building built will go there
		//each index corresponds to a specific location
		
		let name_display = document.createElement("p");
		name_display.className = "name_display";
		name_display.textContent = name;
		name_display.style.transform = "rotate(" + (this.n_rotations*90) + "deg)";
		town.appendChild(name_display);
		
		
		//add to storage
		building_areas[name] = this;
	}
	
	build(building_name, animate=true){
		//calculate location (relative to town div)
		/*method:
		We can calculate a pre-defined sequence of locations (center of building) w/ respect to the center of the central town, in the top-right build space
		Sequence is center, right, left, then go up to the next row, repeat, etc.
		Note: these locations correspond to the indices in this.buildings
		Check how many BuildingAreas exist, rotate appropriately
		Add offsets to make location top-left of building, and relative to upper-left of town div instead of town center
		*/
		
		if(buildings.hasOwnProperty(building_name)){
			throw new Error("Cannot build duplicate building");
		}
		
		let seq = [
			{x: 50, y: -195}, //center
			{x: 150, y: -150}, //right
			{x: -50, y: -250} //left
		]; //each additional row subtracts 100 from y
		
		//figure out which building we're on - use that to find row and col
		let n;
		if(this.buildings.indexOf(undefined) != -1){
			n = this.buildings.indexOf(undefined);
		}
		else {
			n = this.buildings.length;
		}
		let row = Math.floor(n/3);
		let col = n % 3;
		
		let pos = seq[col];
		pos.y -= row*100;
		
		//rotate (counterclockwise)
		for(let i=0; i<this.n_rotations; i++){
			let rotated = {
				x: -pos.y,
				y: pos.x
			};
			pos = rotated;
		}
		
		//apply offsets
		pos.x += (-0.5*building_width) + (0.5*town_width);
		pos.y += (-0.5*building_height) + (0.5*town_height);
		
		
		//now place the building there
		let building = new Building(building_name);
		building.setPosition(pos.x, pos.y);
		this.buildings[n] = building_name;
		
		if(animate){
			building.div.style.opacity = 0;
			fadeAnimate(building.div, 0, 1, building_fade_in_time, function(){
				socket.emit("done");
			});
		}
		
		//no need to emit "done" if not animating - the server only ever builds from the queue w/ animation
	}
}





building_costs = {
	"bakery": {food: 2, wood: 0, brick: 1, money: 0},
	"bank": {food: 0, wood: 0, brick: 4, money: 0},
	"brickyard": {food: 0, wood: 0, brick: 4, money: 0},
	"chandlery": {food: 2, wood: 2, brick: 2, money: 0},
	"cooperage": {food: 0, wood: 4, brick: 0, money: 0},
	"counting_house": {food: 2, wood: 3, brick: 0, money: 0},
	"courthouse": {food: 0, wood: 5, brick: 1, money: 0},
	"dry_dock": {food: 0, wood: 2, brick: 2, money: 0},
	"inn": {food: 2, wood: 0, brick: 2, money: 0},
	"lighthouse": {food: 0, wood: 2, brick: 2, money: 0},
	"lumber_mill": {food: 0, wood: 3, brick: 1, money: 0},
	"mansion": {food: 0, wood: 4, brick: 0, money: 10},
	"market": {food: 1, wood: 1, brick: 1, money: 0},
	"municipal_office": {food: 0, wood: 4, brick: 4, money: 0},
	"post_office": {food: 0, wood: 2, brick: 1, money: 0},
	"schoolhouse": {food: 2, wood: 2, brick: 1, money: 0},
	"seamens_bethel": {food: 0, wood: 5, brick: 5, money: 0},
	"tavern": {food: 3, wood: 0, brick: 2, money: 0},
	"tryworks": {food: 0, wood: 0, brick: 3, money: 0},
	"wharf": {food: 0, wood: 3, brick: 1, money: 0}
};


//function to see if player has enough resources to build something
function canPlayerBuild(name, building, discounts=[]){
	//name: player name
	//building: name of building
	//discounts: array of strings, each string counts as minus 1 of that resource
	
	let n_food = Number(player_boards[name].food_counter.textContent);
	let n_wood = Number(player_boards[name].wood_counter.textContent);
	let n_brick = Number(player_boards[name].brick_counter.textContent);
	let n_money = Number(player_boards[name].money_counter.textContent);
	
	let cost = getBuildingCost(building, discounts);
	
	//add one to money cost if it's courthouse build and the courthouse isn't my building
	if(build_type == "courthouse" && !building_areas[name].buildings.includes("courthouse")){
		cost.money++;
	}

	console.log(n_food, n_wood, n_brick, n_money);
	console.log(cost.food, cost.wood, cost.brick, cost.money);
	
	return (n_food >= cost.food) && (n_wood >= cost.wood) && (n_brick >= cost.brick) && (n_money >= cost.money);
}

function getBuildingCost(building, discounts=[]){
	//building: name of building
	//discounts: array of strings, each string counts as minus 1 of that resource
	
	let cost = {};
	Object.assign(cost, building_costs[building]); //need a shallow copy to avoid changing reference costs
	
	for(let i=0; i<discounts.length; i++){
		switch(discounts[i]){
			case "food": cost.food = Math.max(cost.food-1, 0); break;
			case "wood": cost.wood = Math.max(cost.wood-1, 0); break;
			case "brick": cost.brick = Math.max(cost.brick-1, 0); break;
		}
	}
	
	return cost;
}