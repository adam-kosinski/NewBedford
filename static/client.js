//SETUP ---------------------------------------------------

let socket = io();
let id; //id of the socket


//CONNECTION TO SERVER -----------------------------------

//send a new player message to the server, and pick name
function registerName(){
	let name = prompt("Please enter a name:"); //TODO: make this a GUI thing not a prompt
	if(!name || name===""){
		registerName();
		return;
	}
	
	socket.emit("new player", name, function(success){
		console.log("Name registration success:",success);
		if(!success){
			alert("'"+name+"' is taken. Please choose another");
			registerName();
		}
	});
}

registerName();

//store the id of the connection
socket.on("connect", function(){
	console.log("My ID: "+socket.id);
	id = socket.id;
});


socket.on("state", function(state){
	
});


socket.on("state", function(state){
	
});


socket.on("banner", function(message){
	
});

