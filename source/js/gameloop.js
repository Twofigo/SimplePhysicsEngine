var game;

function setup()
{
	var geo = new physics.Polygon();
	geo.vertices = [
	{x:-14,y:20},
	{x:14,y:20},
	{x:20,y:0},
	{x:14,y:-20},
	{x:-14,y:-20},
	{x:-20,y:0},
	];
	var obj = new physics.RigidBody()
	obj.geometry = geo;
	obj.setPosition(0,40,0);
	obj.setVelocity(0,1,0);
	obj.gravity=true;
	physics.scene.rigidBodies.push(obj);
	
	var geo = new physics.Polygon();
	geo.vertices = [
	{x:-20,y:-20},
	{x:-20,y:20},
	{x:20,y:20},
	{x:20,y:-20},
	];
	var obj = new physics.RigidBody()
	obj.geometry = geo;
	obj.setPosition(200,0,20);
	obj.setVelocity(-200,0,0);
	obj.gravity=true;
	physics.scene.rigidBodies.push(obj);
	
	
	// floor;
	var geo = new physics.Polygon();
	geo.vertices = [
	{x:-800,y:-100},
	{x:800,y:-100},
	{x:800,y:100},
	{x:-800,y:100},
	];
	
	var obj = new physics.RigidBody();
	obj.geometry = geo.clone();
	obj.setPosition(0,400);
	obj.stationary=true;
	physics.scene.rigidBodies.push(obj)

	// roof
	var obj = new physics.RigidBody();
	obj.geometry = geo;
	obj.setPosition(0,-400);
	obj.stationary=true;
	physics.scene.rigidBodies.push(obj)
	
	// left wall
	var geo = new physics.Polygon();
	geo.vertices = [
	{x:-100,y:-800},
	{x:100,y:-800},
	{x:100,y:800},
	{x:-100,y:800},
	];
	var obj = new physics.RigidBody();
	obj.geometry = geo.clone();
	obj.setPosition(-500,0); 
	obj.stationary=true;
	physics.scene.rigidBodies.push(obj)
	
	// right wall
	var obj = new physics.RigidBody();
	obj.geometry = geo;
	obj.setPosition(500,0);
	obj.stationary=true;
	physics.scene.rigidBodies.push(obj)
	
	physics.scene.init();
	
	physics.scene.gravity.y=300;
	
	window.requestAnimationFrame(mainloop);
}

function mainloop(timestamp)
{
	if (physics.scene.timestamp === false) physics.scene.timestamp = timestamp;
	var timeDelta = timestamp - physics.scene.timestamp;
	physics.scene.timestamp = timestamp;
	
	if (timeDelta>50)timeDelta=6;
	timeDelta=5;
	
	physics.scene.update(timeDelta);
	physics.scene.draw(timeDelta);
	
	window.requestAnimationFrame(mainloop)
}