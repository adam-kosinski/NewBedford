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
		
		this.setSelectable(true); //TODO remove, let setTurn() function do this
		
		//add it
		town.appendChild(this.div);
		buildings[type] = this;
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
			if(slot.children.length == 0){
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
			this.div.className += " selectable";
		}
		else {
			this.div.className = this.div.className.replace("selectable", "");
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
	
	build(building_name){
		//calculate location (relative to town div)
		/*method:
		We can calculate a pre-defined sequence of locations (center of building) w/ respect to the center of the central town, in the top-right build space
		Sequence is center, right, left, then go up to the next row, repeat, etc.
		Note: these locations correspond to the indices in this.buildings
		Check how many BuildingAreas exist, rotate appropriately
		Add offsets to make location top-left of building, and relative to upper-left of town div instead of town center
		*/
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
	}
}







building_click_handlers = {
	"building": function(){}
};