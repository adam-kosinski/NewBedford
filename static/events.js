start_button.addEventListener("click", function(){
	let n_players = player_display.children.length;
	if(n_players < 2 || n_players > 4){
		alert("Game supports 2-4 players, but currently " + n_players + " are connected");
	}
	else {
		socket.emit("start_game");
	}
});