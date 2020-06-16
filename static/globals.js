//DOM references
let home_screen = document.getElementById("home_screen");
let player_display = document.getElementById("player_display");
let start_button = document.getElementById("start_button");

let game_div = document.getElementById("game_div");
let animation_div = document.getElementById("animation_div"); //whenever animating, make the object a child of this b/c it's fixed position
let player_scroll_wrapper = document.getElementById("player_scroll_wrapper");
let player_board_container = document.getElementById("player_board_container");
let town = document.getElementById("town");

let first_player_token = document.getElementById("first_player_token");

let popup_background = document.getElementById("popup_background");

let food_to_sell = document.getElementById("food_to_sell");
let wood_to_sell = document.getElementById("wood_to_sell");
let brick_to_sell = document.getElementById("brick_to_sell");
let store_sell_button = document.getElementById("store_sell_button");
let opened_store = undefined;

//bulk DOM info (references, locations, data)
let player_boards = {}; //keys are player names, contains PlayerBoard objects (see init.js)
let buildings = {}; //keys are building names, contains Building objects (see init.js)
let building_areas = {}; //keys are player names, contains BuildingArea objects (see init.js)
let building_click_handlers = {}; //keys are buildings, contains functions - what to do when the building is clicked (see buildings.js)

//state
let my_name;
let game_active = false;
let animation_in_progress = false; //click event handlers only run when this is false
let my_turn = false;




//config
let give_animation_speed = 0.3; //pixels/ms
let time_between_gives = 150; //ms

let worker_animation_speed = 0.3; //pixels/ms

//config copied from style.css
let building_width = 100; //px
let building_height = 100; //px
let town_width = 400; //px
let town_height = 400; //px
let worker_height = 30; //px