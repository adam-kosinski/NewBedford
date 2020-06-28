//DOM references
let home_screen = document.getElementById("home_screen");
let player_display = document.getElementById("player_display");
let start_button = document.getElementById("start_button");

let game_div = document.getElementById("game_div");
let banner = document.getElementById("banner");
let animation_div = document.getElementById("animation_div"); //whenever animating, make the object a child of this b/c it's fixed position
let player_scroll_wrapper = document.getElementById("player_scroll_wrapper");
let player_board_container = document.getElementById("player_board_container");
let board = document.getElementById("board");
let town = document.getElementById("town");
let ocean = document.getElementById("ocean");
let ocean_bag = document.getElementById("ocean_bag");
let ship_highlighter; //created in initGameDisplay() - init.js
let round_counter_whale; //created in initGameDisplay() - init.js
let choose_whale_sign = document.getElementById("choose_whale_sign");
let choose_whale_pass_button = document.getElementById("choose_whale_pass_button");
let ocean_mask = document.getElementById("ocean_mask"); //for lighthouse
let ocean_mask_sign = document.getElementById("ocean_mask_sign");

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

let launch_type = "city_pier"; //or "dry_dock" or "wharf"

let whale_seller = undefined;
let whale_to_sell = undefined;
let whale_buyer = undefined;

let lighthouse_screen_open = false; //so mouseover event knows whether to highlight ships


//bulk DOM info (references, locations, data)
let player_boards = {}; //keys are player names, contains PlayerBoard objects (see init.js)
let buildings = {}; //keys are building names, contains Building objects (see init.js)
let building_areas = {}; //keys are player names, contains BuildingArea objects (see init.js)
let building_costs = {}; //keys are building names, contains {food:int, wood:int, brick:int, money:int} objects. Filled in buildings.js
let dock_slots = []; //contains dock slot HTML divs, positioned correctly and with the correct z-indices


//state
let my_name;
let rulebook_page = 1;
let game_active = false;
let inn_phase_active = false; //used by updateSelectableBuildings(), if true only common town/whaling actions will be selectable
let round = 1;
let animation_in_progress = false; //click event handlers only run when this is false
let my_turn = false;
let returning_whale = false; //used to prevent multiple-clicks for returning a whale
let pay_for_used = false; //whether the current player has already used their "pay 3 money for 2 food/wood" option this turn

let town_bounding_box = { //initialize explicitly w/o the function b/c when loading the page sizes haven't been established yet
	x_min: 376,
	x_max: 766,
	y_min: 90,
	y_max: 480
};
//holds the town bounding box relative to the board div, set with getTownBoundingBox() in buildings.js.
//Used for resizing the layout when buildings are built, see buildings.js



//animation config
let give_animation_speed = 0.4; //pixels/ms
let time_between_gives = 150; //ms

let worker_animation_speed = 0.4; //pixels/ms

let build_duration = 2000; //ms
let post_office_speed = 0.3; //speed of post office moving from one person to another

let ship_fast_animation_speed = 0.4; //pixels/ms - for things like docking or returning to storage
let ship_medium_animation_speed = 0.2; //pixels/ms - for launching
let ship_slow_animation_speed = 0.1; //pixels/ms - for small movements within the sea

let ocean_bag_speed = 0.4; //pixels/ms
let time_between_whales_back_in = 200; //ms, for when unclaimed whales go back in the bag
let whale_draw_speed = 0.1; //coming out the bag
let whale_medium_speed = 0.3; //moving to and from the bag to the storage on the right of the ocean
let whale_fast_speed = 0.6; //moving from ocean storage to a player's ship

let whale_counter_speed = 0.2;

let first_player_token_speed = 0.3;

let whale_return_speed = 0.4;

let trash_whale_duration = 1000; //ms

let empty_sea_speed = 0.4; //for selling empty sea to the tavern
let time_between_sea_sells = 200; //ms

//misc config
let whaling_track_origin = {x: 169, y: 120}; //offset from top-left of ocean to the center of the left-most return spot
let ocean_center_x = 128; //offset from left of ocean to the center of the vertical food label band in the middle
let whaling_priority_offset = 30; //px offset between priorities on whaling track
let whaling_row_offset = 48; //px offset between rows on the whaling track

let whale_storage_origin = {x: 255, y: 0}; //offset from top-left of ocean to top-left corner of first whale storage spot on right of ocean
let whale_storage_offset_y = 53;

let round_counter_origin = {x: 2, y: 133};
let round_counter_offset = 55; //px to move the round counter whale to get to the next spot, either vertically or horizontally

let whale_costs = {
	right_whale: 2,
	bowhead_whale: 4,
	sperm_whale: 8
};

//config copied from style.css
let building_width = 100; //px
let building_height = 100; //px
let town_width = 400; //px
let town_height = 400; //px
let worker_height = 30; //px