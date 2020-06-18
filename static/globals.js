//DOM references
let home_screen = document.getElementById("home_screen");
let player_display = document.getElementById("player_display");
let start_button = document.getElementById("start_button");

let game_div = document.getElementById("game_div");
let animation_div = document.getElementById("animation_div"); //whenever animating, make the object a child of this b/c it's fixed position
let player_scroll_wrapper = document.getElementById("player_scroll_wrapper");
let player_board_container = document.getElementById("player_board_container");
let board = document.getElementById("board");
let town = document.getElementById("town");
let ocean = document.getElementById("ocean");

let first_player_token = document.getElementById("first_player_token");

let popup_background = document.getElementById("popup_background");

//popup stuff
let food_to_sell = document.getElementById("food_to_sell");
let wood_to_sell = document.getElementById("wood_to_sell");
let brick_to_sell = document.getElementById("brick_to_sell");
let store_sell_button = document.getElementById("store_sell_button");
let opened_store = undefined;

let build_menu_select_mode = false;
let build_type = "town_hall"; //or "courthouse"
let building_to_build = undefined;
let first_discount = undefined;
let second_discount = undefined;
let build_button = document.getElementById("build_button");


//bulk DOM info (references, locations, data)
let player_boards = {}; //keys are player names, contains PlayerBoard objects (see init.js)
let buildings = {}; //keys are building names, contains Building objects (see init.js)
let building_areas = {}; //keys are player names, contains BuildingArea objects (see init.js)
let building_costs = {}; //keys are building names, contains {food:int, wood:int, brick:int, money:int} objects. Filled in buildings.js
let dock_slots = []; //contains dock slot HTML divs, positioned correctly and with the correct z-indices


//state
let my_name;
let game_active = false;
let animation_in_progress = false; //click event handlers only run when this is false
let my_turn = false;

let town_bounding_box = { //initialize explicitly w/o the function b/c when loading the page sizes haven't been established yet
	x_min: 376,
	x_max: 766,
	y_min: 80,
	y_max: 470
};
//holds the town bounding box relative to the board div, set with getTownBoundingBox() in buildings.js.
//Used for resizing the layout when buildings are built, see buildings.js



//animation config
let give_animation_speed = 0.3; //pixels/ms
let time_between_gives = 150; //ms

let worker_animation_speed = 0.3; //pixels/ms

let building_fade_in_time = 2000; //ms
let layout_move_speed = 50 / building_fade_in_time; //pixels/ms

let ship_fast_animation_speed = 0.3; //pixels/ms - for things like docking or returning to storage
let ship_medium_animation_speed = 0.1; //pixels/ms - for launching
let ship_slow_animation_speed = 0.05; //pixels/ms - for small movements within the sea


//misc config
let whaling_track_origin = {x: 169, y: 120}; //offset from top-left of ocean to the center of the left-most return spot
let ocean_center_x = 128; //offset from left of ocean to the center of the vertical food label band in the middle
let whaling_priority_offset = 30; //px offset between priorities on whaling track
let whaling_row_offset = 48; //px offset between rows on the whaling track


//config copied from style.css
let building_width = 100; //px
let building_height = 100; //px
let town_width = 400; //px
let town_height = 400; //px
let worker_height = 30; //px