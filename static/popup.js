//utility functions -------------------------------------------------

function closePopups(){
	popup_background.style.display = "none";
	
	let popups = document.getElementsByClassName("popup");
	for(let i=0; i<popups.length; i++){
		popups[i].style.display = "none";
	}
}

function openPopup(id){
	closePopups(); //only have one open at a time
	
	popup_background.style.display = "block";
	document.getElementById(id).style.display = "block";
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
});


