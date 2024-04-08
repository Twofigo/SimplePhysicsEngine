var ins;
var g;
function setup()
{
	var texture = new physics.Texture();
	texture.surfaceColor = "#002299";

    ins = new physics.Scene()
    
	var thing = new physics.Polygon();
	thing.setVertices([
	{x:-14,y:20},
	{x:14,y:20},
	{x:20,y:0},
	{x:14,y:-20},
	{x:-14,y:-20},
	{x:-20,y:0},
	]);

	
	var last = new physics.RigidBody();
    last.setPosition(0,-300); 
	for (var k = 0; k < 6; k++){
		var obj = new physics.RigidBody();
		obj.texture = texture;
		obj.geometry = thing.clone();
		obj.setPosition((k-4)*50,-100,k*800);
		obj.setVelocity(0,0,0);
		obj.compile();
		ins.add(obj);

		this.constraint = new physics.Rope(obj, new physics.Vector(10,0), last, new physics.Vector(-10,0),100, 100);
    	ins.add(this.constraint);

		last = obj;
	}
	
	var box = new physics.Polygon();
	box.setVertices([
	{x:-20,y:-20},
	{x:-20,y:20},
	{x:20,y:20},
	{x:20,y:-20},
	]);

	for (var k = 0; k < 8; k++){
		var obj = new physics.RigidBody()
		obj.texture = texture;
		obj.geometry = box.clone();
		obj.setPosition((k-4)*50,100,k*800);
		obj.setVelocity(0,0,0);
		obj.compile();
		ins.add(obj);
	}

	var plank = new physics.Polygon();
	box.setVertices([
	{x:-80,y:-10},
	{x:-80,y:10},
	{x:80,y:10},
	{x:80,y:-10},
	]);

	for (var k = 0; k < 3; k++){
		var obj = new physics.RigidBody()
		obj.texture = texture;
		obj.geometry = box.clone();
		obj.setPosition((k-2)*50,0,10);
		obj.setVelocity(0,0,0);
		obj.compile();
		ins.add(obj);
	}

	var bigbox = new physics.Polygon();
	bigbox.setVertices([
	{x:-40,y:-40},
	{x:-40,y:40},
	{x:40,y:40},
	{x:40,y:-40},
	]);

	for (var k = 0; k < 4; k++){
		var obj = new physics.RigidBody()
		obj.geometry = bigbox.clone();
		obj.texture = texture;

		obj.setPosition((k-2)*100,200,k*800);
		obj.compile();
		ins.add(obj);
	}
	
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
	obj.setPosition(0,400);
    ins.add(obj);

	// roof
	var obj = new physics.RigidBody();
	obj.geometry = geo;
	obj.setPosition(0,-400);
    ins.add(obj);
	
	// left wall
	var geo = new physics.Polygon();
	geo.setVertices([
	{x:-100,y:-800},
	{x:100,y:-800},
	{x:100,y:800},
	{x:-100,y:800},
	]);
	var obj = new physics.RigidBody();
	obj.geometry = geo.clone();
	obj.setPosition(-500,0); 
    ins.add(obj);
	
	// right wall
	var obj = new physics.RigidBody();
	obj.geometry = geo;
	obj.setPosition(500,0);
    ins.add(obj);
    
	ins.gravity.y=300;
	ins.setup(document.getElementById("gameboard"));
    
    var tracker = new physics.InputTracker();
    tracker.set(document.getElementById("gameboard"));
    tracker.enable();
    
    g = new Grabber();
    tracker.addListener("move", function(d){g.move(d)});
    tracker.addListener("m1", function(d){g.grabAndDrop(d)});
    
	window.requestAnimationFrame(mainloop);
}

var Grabber = function(){
    this.obj = new physics.RigidBody();
    
    this.constraint = new physics.Joint(this.obj, new physics.Vector(), this.obj, new physics.Vector(),1000);
    ins.add(this.constraint);
}
Grabber.prototype.grabAndDrop = function(data){
    if(data.state)
    {
        var cordinate = data.position.subtract(ins.position).scale(1/ins.zoom);
        var body = ins.bodyAtPoint(cordinate);
        if(!body) return;
        this.constraint.bodyB = body;
        this.constraint.positionB = cordinate.subtract(body.position).rotate(-body.angle)
    }
    if(!data.state)
    {
        this.constraint.bodyB = this.obj;
        this.constraint.positionB.set();
    }
}
Grabber.prototype.move = function(data){
    this.obj.velocity = data.velocity.scale(0.5).scale(1/ins.zoom);
    this.obj.position = data.position.subtract(ins.position).scale(1/ins.zoom);
}

function mainloop(timestamp){
	ins.update(timestamp);
	ins.draw();
	
	window.requestAnimationFrame(mainloop);
}