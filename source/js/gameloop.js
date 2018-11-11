var game;

function setup()
{
    var mat = new physics.Material();
    
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
    obj.material = mat;
	obj.setPosition(0,40,0);
	obj.setVelocity(0,0,0);
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
    obj.material = mat;
	obj.setPosition(200,0,0.5);
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
    obj.material = mat;
	obj.setPosition(0,400);
	obj.stationary=true;
	physics.scene.rigidBodies.push(obj)

	// roof
	var obj = new physics.RigidBody();
	obj.geometry = geo;
    obj.material = mat;
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
    obj.material = mat;
	obj.setPosition(-500,0); 
	obj.stationary=true;
	physics.scene.rigidBodies.push(obj)
	
	// right wall
	var obj = new physics.RigidBody();
	obj.geometry = geo;
    obj.material = mat;
	obj.setPosition(500,0);
	obj.stationary=true;
	physics.scene.rigidBodies.push(obj)
	
	physics.scene.init();
	
	physics.scene.gravity.y=300;
	
	window.requestAnimationFrame(mainloop);
}

function mainloop(timestamp)
{
	physics.scene.update(timestamp);
	physics.scene.draw();
	
	window.requestAnimationFrame(mainloop)
}