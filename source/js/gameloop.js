var ins;
var g;
function setup()
{
    ins = new physics.Scene()
    
	var geo = new physics.Polygon();
	geo.setVertices([
	{x:-14,y:20},
	{x:14,y:20},
	{x:20,y:0},
	{x:14,y:-20},
	{x:-14,y:-20},
	{x:-20,y:0},
	]);
	var obj = new physics.RigidBody()
	obj.geometry = geo;
	obj.setPosition(0,0,0);
	obj.setVelocity(-50,0,8);
    obj.compile();
	ins.add(obj);
    
    var obj = new physics.RigidBody()
	obj.geometry = geo.clone();
	obj.setPosition(0,100,0);
	obj.setVelocity(-10,20,0);
    obj.compile();
	ins.add(obj);
    
    var obj = new physics.RigidBody()
	obj.geometry = geo.clone();
	obj.setPosition(0,-100,0);
	obj.setVelocity(0,65,-5);
    obj.compile();
	ins.add(obj);
	
	var geo = new physics.Polygon();
	geo.setVertices([
	{x:-20,y:-20},
	{x:-20,y:20},
	{x:20,y:20},
	{x:20,y:-20},
	]);
	var obj = new physics.RigidBody()
	obj.geometry = geo;
	obj.setPosition(-200,0,0.5);
	obj.setVelocity(0,0,0);
	obj.compile();
    ins.add(obj);
    
    var obj = new physics.RigidBody()
	obj.geometry = geo.clone();
	obj.setPosition(-100,0,0.5);
	obj.compile();
    ins.add(obj);
    
    var obj = new physics.RigidBody()
	obj.geometry = geo.clone();
	obj.setPosition(200,0,0.5);
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
    

    
    this.constraint = new physics.Rope(ins.rigidBodies[2], new physics.Vector(), ins.rigidBodies[3], new physics.Vector(),100);
    ins.add(this.constraint);
    
    var obj = new physics.RigidBody();
    obj.setPosition(0,100);
    this.constraint = new physics.Rope(obj, new physics.Vector(), ins.rigidBodies[0], new physics.Vector(),100);
    ins.add(this.constraint);
    
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