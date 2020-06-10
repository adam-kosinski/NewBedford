//SETUP ---------------------------------------------------

let name = prompt("Please enter a name:");
if(!name || name===""){name = "unnamed";}

let socket = io();
let id; //id of the socket


//CONNECTION TO SERVER -----------------------------------

//send a new player message to the server
socket.emit("new player", name);

//store the id of the connection
socket.on("connect", function(){
	console.log("My ID: "+socket.id);
	id = socket.id;
});
