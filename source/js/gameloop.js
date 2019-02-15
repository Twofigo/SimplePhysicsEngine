var ins;;
function setup()
{
    ins = new physics.Scene()

    var geo = new physics.Geometry();
    geo.setVertices([
    {x:-20,y:-20},
    {x:-20,y:20},
    {x:20,y:20},
    {x:20,y:-20},
    ]);
    geo.compile();

    var obj = new physics.RigidBody()
    obj.geometry = geo;
    obj.setStartPosition(0,0,0);
    obj.setStartVelocity(30,0,0);
    ins.add(obj);

    var obj = new physics.RigidBody()
    obj.geometry = geo;
    obj.setStartPosition(50,0,0);
    ins.add(obj);

    // floor;
    var geo = new physics.Geometry();
    geo.setVertices([
    {x:-800,y:-100},
    {x:800,y:-100},
    {x:800,y:100},
    {x:-800,y:100},
    ]);
    geo.compile(true);

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
    var geo = new physics.Geometry();
    geo.setVertices([
    {x:-100,y:-800},
    {x:100,y:-800},
    {x:100,y:800},
    {x:-100,y:800},
    ]);
    geo.compile(true);

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


    //g = new Grabber();
    //tracker.addListener("move", function(d){g.move(d)});
    //tracker.addListener("m1", function(d){g.grabAndDrop(d)});

    window.requestAnimationFrame(mainloop);
}

var Grabber = function(){
    this.obj = new physics.RigidBody();
    this.obj.geometry = new physics.Geometry();
    this.obj.geometry.compile(true);
    this.constraint = new physics.Rope(this.obj, new physics.Vector(), this.obj, new physics.Vector(), 0);
    ins.add(this.constraint);
}
Grabber.prototype.grabAndDrop = function(data){
    if(data.state)
    {
        var cordinate = ins.coordinateConvert(data.position);
        var body = ins.bodyAtPoint(cordinate, data.timeStamp);
        if(!body) return;
        this.constraint.bodyB = body;
        this.constraint.positionB = cordinate.subtract(body.getPosition(data.timeStamp)).rotate(-body.getAngle(data.timeStamp))
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
    this.obj.setVelocity(data.velocity.scale(0.5).scale(1/ins.zoom), data.timeStamp);
    this.obj.setPosition(cordinate, data.timeStamp);
}

function mainloop(timeStamp){
	ins.update(timeStamp);
	ins.draw(timeStamp);

	window.requestAnimationFrame(mainloop);
}
