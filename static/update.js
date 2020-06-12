//Function to give a resource (food, wood, bricks, money - not whales) to a player. Handles both counter values and animations
//Resources can come from buildings, other players, or out of thin air (no animation).
//Only money is allowed to move from one player to another.
//There's no check if other players have the resources; it's simply subtracted from the counter - check this before calling.

function give(name, amount, thing, from){
	//name: name of player to give resource to
	//amount: amount of resource to give
	//thing: "food" "wood" "brick" or "money"
	//from: name of a building, or name of a player.
		//If left undefined, will just increment the counter, no animation
		//If resource is from a player, it must be 'money'
	
	
}



//Function to reduce a player's resources. Just decrements the counter the appropriate amount

function take(amount, thing, name){
	//amount: amount of resource to take
	//thing: "food" "wood" "brick" or "money"
	//name: name of player to take from
}




function setTurn(name){ //name of player
	//indicates whose turn it is in the GUI, disables/enables appropriate things you can click
	
	//probably disabling clicking is easiest done with a transparent div that covers the whole screen - can't be fixed, just make it 100%
	//need to gray out the end turn button etc. to show disabled stuff to the user
	//don't want to disable everything - keep the build menu, the end game button... so maybe not transparent div
}



function newRound(game){ //game object from server
	//remove all workers from the board, move the first player token
}