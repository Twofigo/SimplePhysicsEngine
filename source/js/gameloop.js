var ins;
function setup()
{
    ins = new physics.Scene()
    
    var mat = new physics.Material();
    
	var geo = new physics.Polygon();
	geo.setVertices([
	{x:-14,y:20},
	{x:14,y:20},
	{x:20,y:0},
	{x:14,y:-20},
	{x:-14,y:-20},
	{x:-20,y:0},
	]);
	var obj1 = new physics.RigidBody()
	obj1.geometry = geo;
    obj1.material = mat;
	obj1.setPosition(0,40,0);
	obj1.setVelocity(0,0,0);
	obj1.gravity=true;
    obj1.compile();
	ins.add(obj1);
	
	var geo = new physics.Polygon();
	geo.setVertices([
	{x:-20,y:-20},
	{x:-20,y:20},
	{x:20,y:20},
	{x:20,y:-20},
	]);
	var obj = new physics.RigidBody()
	obj.geometry = geo;
    obj.material = mat;
	obj.setPosition(200,0,0.5);
	obj.setVelocity(-200,0,0);
	obj.gravity=true;
	obj.compile();
    ins.add(obj);
	
    // floor;
	var geo = new physics.Polygon();
	geo.setVertices([
	{x:-800,y:-100},
	{x:800,y:-100},
	{x:800,y:100},
	{x:-800,y:100},
	]);
	
	var obj = new physics.RigidBody();
	obj.geometry = geo.clone();
    obj.material = mat;
	obj.setPosition(0,400);
	obj.stationary=true;
	obj.compile();
    ins.add(obj);

	// roof
	var obj = new physics.RigidBody();
	obj.geometry = geo;
    obj.material = mat;
	obj.setPosition(0,-400);
	obj.stationary=true;
	obj.compile();
    ins.add(obj);
	
	// left wall
	var geo = new physics.Polygon();
	geo.setVertices([
	{x:-100,y:-800},
	{x:100,y:-800},
	{x:100,y:800},
	{x:-100,y:800},
	]);
	var obj2 = new physics.RigidBody();
	obj2.geometry = geo.clone();
    obj2.material = mat;
	obj2.setPosition(-500,0); 
	obj2.stationary=true;
	obj2.compile();
    ins.add(obj2);
	
	// right wall
	var obj = new physics.RigidBody();
	obj.geometry = geo;
    obj.material = mat;
	obj.setPosition(500,0);
	obj.stationary=true;
	obj.compile();
    ins.add(obj);
    
    var obj = new physics.PivotPoint(obj1, new physics.Vector(20,0), obj2, new physics.Vector(800,-20));
    ins.add(obj);
	
    
	ins.gravity.y=300;
	ins.setup(document.getElementById("gameboard"));
    
    var tracker = new physics.InputTracker();
    tracker.set(document.getElementById("gameboard"));
    tracker.enable();
    tracker.addListener("move", function(d){console.log(d)});
    
	window.requestAnimationFrame(mainloop);
}

function mainloop(timestamp){
	ins.update(timestamp);
	ins.draw();
	
	window.requestAnimationFrame(mainloop);
}