//function to linearly animate an existing HTML element (the object) moving from one location to another
//HTML element must be absolutely positioned. Animation is done without changing the element's parent

function moveAnimate(object, startpoint, endpoint, speed, finish_function){
	//object: the existing HTML element to animate
	//startpoint: {x: pixel_coord, y: pixel_coord} - position of initial element state, with respect to parent element
	//endpoint: {x: pixel_coord, y: pixel_coord} - position of final element state, with respect to parent element
	//speed: in pixels/ms
	//finish_function (optional): function to call upon completion of animation. If left undefined, no function will be called
	
	//determine duration based on desired speed
	let dx = endpoint.x - startpoint.x;
	let dy = endpoint.y - startpoint.y;
	let dist = Math.hypot(dx, dy);
	let duration = dist / speed;
	
	//determine inital position of parent - if the parent moves, I want the animated element to move with it
	let initial_p_box = object.parentElement.getBoundingClientRect();
	
	//animate
	let t_start = performance.now();
	let step = function(t_now){
		let fraction = (t_now - t_start) / duration; //all in ms
		
		let p_box = object.parentElement.getBoundingClientRect();
		let p_offset_x = p_box.x - initial_p_box.x;
		let p_offset_y = p_box.y - initial_p_box.y;
		
		if(fraction >= 1){
			object.style.left = endpoint.x + p_offset_x + "px";
			object.style.top = endpoint.y + p_offset_y + "px";
			if(finish_function){
				finish_function();
			}
		}
		else {
			let x = startpoint.x + p_offset_x + (endpoint.x - startpoint.x)*fraction;
			let y = startpoint.y + p_offset_y + (endpoint.y - startpoint.y)*fraction;
			object.style.left = x + "px";
			object.style.top = y + "px";
			window.requestAnimationFrame(step);
		}
	}
	
	window.requestAnimationFrame(step);
}