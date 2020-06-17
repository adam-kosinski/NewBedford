//function to linearly animate an existing HTML element (the object) moving from one location to another
//HTML element must be absolutely positioned. Animation is done without changing the element's parent

function moveAnimate(object, scroll_to_match, startpoint, endpoint, speed, finish_function){
	//object: the existing HTML element to animate
	//scroll_to_match: if this HTML element moves on the page, offset the object the same amount - usually the object's destination
	//startpoint: {x: pixel_coord, y: pixel_coord} - position of initial element state, with respect to parent element
	//endpoint: {x: pixel_coord, y: pixel_coord} - position of final element state, with respect to parent element
	//speed: in pixels/ms
	//finish_function (optional): function to call upon completion of animation. If left undefined, no function will be called
	
	//determine duration based on desired speed
	let dx = endpoint.x - startpoint.x;
	let dy = endpoint.y - startpoint.y;
	let dist = Math.hypot(dx, dy);
	let duration = dist / speed;
	
	//determine inital position of scroll_to_match element - if that moves, I want the animated element to move with it
	let initial_s_box = scroll_to_match.getBoundingClientRect();
	
	//animate
	let t_start = performance.now();
	let step = function(t_now){
		let fraction = (t_now - t_start) / duration; //all in ms
		
		let s_box = scroll_to_match.getBoundingClientRect();
		let s_offset_x = s_box.x - initial_s_box.x;
		let s_offset_y = s_box.y - initial_s_box.y;
		
		if(fraction >= 1){
			object.style.left = endpoint.x + s_offset_x + "px";
			object.style.top = endpoint.y + s_offset_y + "px";
			animation_in_progress = false;
			if(finish_function){
				finish_function();
			}
		}
		else {
			animation_in_progress = true;
			let x = startpoint.x + s_offset_x + (endpoint.x - startpoint.x)*fraction;
			let y = startpoint.y + s_offset_y + (endpoint.y - startpoint.y)*fraction;
			object.style.left = x + "px";
			object.style.top = y + "px";
			window.requestAnimationFrame(step);
		}
	}
	
	window.requestAnimationFrame(step);
}



//function to animate an object fading in/out

function fadeAnimate(object, start_opacity, end_opacity, duration, finish_function){
	//object: the HTML element to animate
	//start_opacity: value between 0 and 1
	//end_opacity: value between 0 and 1
	//duration: in ms
	//finish_function (optional): function to run when done animating
	
	let t_start = performance.now();
	let step = function(t_now){
		let fraction = (t_now - t_start) / duration; //all in ms
		
		if(fraction >= 1){
			object.style.opacity = end_opacity;
			animation_in_progress = false;
			if(finish_function){
				finish_function();
			}
		}
		else {
			animation_in_progress = true;
			object.style.opacity = start_opacity + (end_opacity - start_opacity)*fraction;
			window.requestAnimationFrame(step);
		}
	}
	
	window.requestAnimationFrame(step);
}