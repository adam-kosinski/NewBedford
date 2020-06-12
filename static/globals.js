//DOM references
let home_screen = document.getElementById("home_screen");
let player_display = document.getElementById("player_display");
let start_button = document.getElementById("start_button");

let game_div = document.getElementById("game_div");
let player_board_container = document.getElementById("player_board_container");
let town = document.getElementById("town");

let first_player_token = document.getElementById("first_player_token");

//bulk DOM info (references and locations)
let player_boards = {}; //keys are player names, see init.js for more information on PlayerBoard objects



//state
let game_active = false;

