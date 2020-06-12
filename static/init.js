//Function to load the game display for the first time. Only called once (from client.js) usually.
//Most often called at game start, but also can be called mid-game (for reconnections etc.)

function init_game_display(players, game){	
	console.log("Initting game display");
	console.log(players, game);
	
	town.style.top = (window.innerHeight-400)/2 + "px";
	
	home_screen.style.display = "none";
	game_div.style.display = "block";
}