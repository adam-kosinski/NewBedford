//DOM references
let home_screen = document.getElementById("home_screen");
let player_display = document.getElementById("player_display");
let start_button = document.getElementById("start_button");

let game_div = document.getElementById("game_div");
let player_scroll_wrapper = document.getElementById("player_scroll_wrapper");
let player_board_container = document.getElementById("player_board_container");
let town = document.getElementById("town");

let first_player_token = document.getElementById("first_player_token");

//bulk DOM info (references, locations, data)
let player_boards = {}; //keys are player names, contains PlayerBoard objects (see init.js)
let buildings = {}; //keys are building names, contains Building objects (see init.js)
let building_areas = {}; //keys are player names, contains BuildingArea objects (see init.js)


//state
let my_name;
let game_active = false;




//config
let give_animation_speed = 0.3; //pixels/ms
let time_between_gives = 150; //ms
let building_width = 100; //px, size also defined in CSS file
let building_height = 100; //px