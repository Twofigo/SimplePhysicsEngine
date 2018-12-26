var ins;;
function setup()
{
    ins = new physics.Scene()

    var poly = new physics.Polygon();
    poly.setVertices([
    {x:-20,y:-20},
    {x:-20,y:20},
    {x:20,y:20},
    {x:20,y:-20},
    ]);
    var geo = new physics.Geometry();
    geo.addComponent(poly.clone(), 0, 0);
    geo.addComponent(poly.clone(), 30, 30);
    geo.compile();
    var obj = new physics.RigidBody()
    obj.geometry = geo;
    obj.setStartPosition(0,0,0);
    obj.setStartVelocity(30,40,0);
    ins.add(obj);

    var geo = new physics.Geometry();
    geo.addComponent(poly.clone());
    geo.compile();
    var obj = new physics.RigidBody()
    obj.geometry = geo;
    obj.setStartPosition(0,100,0);
    ins.add(obj);

    // floor;
    var poly = new physics.Polygon();
    poly.setVertices([
    {x:-800,y:-100},
    {x:800,y:-100},
    {x:800,y:100},
    {x:-800,y:100},
    ]);
    var geo = new physics.Geometry();
    geo.addComponent(poly);

    var obj = new physics.RigidBody();
    obj.geometry = geo;
    obj.setStartPosition(0,400);
    ins.add(obj);

    // roof
    var obj = new physics.RigidBody();
    obj.geometry = geo;
    obj.setStartPosition(0,-400);
    ins.add(obj);

    // left wall
    var poly = new physics.Polygon();
    poly.setVertices([
    {x:-100,y:-800},
    {x:100,y:-800},
    {x:100,y:800},
    {x:-100,y:800},
    ]);
    var geo = new physics.Geometry();
    geo.addComponent(poly);

    var obj = new physics.RigidBody();
    obj.geometry = geo;
    obj.setStartPosition(-500,0);
    ins.add(obj);

    // right wall
    var obj = new physics.RigidBody();
    obj.geometry = geo;
    obj.setStartPosition(500,0);
    ins.add(obj);

    ins.gravity.y=300;
    ins.setup(document.getElementById("gameboard"));

    this.obj = new physics.RigidBody();
    this.obj.geometry = new physics.Geometry();
    var r = new physics.Rope()

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
    this.obj.geometry = new physics.Geometry();
    this.constraint = new physics.Joint(this.obj, new physics.Vector(), this.obj, new physics.Vector(),1000);
    ins.add(this.constraint);
}
Grabber.prototype.grabAndDrop = function(data){
    if(data.state)
    {
        var cordinate = ins.coordinateConvert(data.position);
        var body = ins.bodyAtPoint(cordinate, data.timestamp);
        if(!body) return;
        this.constraint.bodyB = body;
        this.constraint.positionB = cordinate.subtract(body.getPosition(data.timestamp)).rotate(-body.getAngle(data.timestamp))
    }
    if(!data.state)
    {
        this.constraint.bodyB = this.obj;
        this.constraint.positionB.set();
    }
}
Grabber.prototype.move = function(data){
    var cordinate = ins.coordinateConvert(data.position);
    this.obj.setTimeStamp(data.timeStamp);
    this.obj.setVelocity(data.velocity.scale(0.5).scale(1/ins.zoom), data.timestamp);
    this.obj.setPosition(cordinate, data.timestamp);
}

function mainloop(timestamp){
	ins.update(timestamp);
	ins.draw(timestamp);

	window.requestAnimationFrame(mainloop);
}
