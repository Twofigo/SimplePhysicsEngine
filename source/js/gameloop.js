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

    var obj = new physics.RigidBody("poppy")
    obj.geometry = geo;
    obj.setStartPosition(0,0,1);
    obj.setStartVelocity(70,0,0);
    ins.add(obj);

    var obj = new physics.RigidBody("Jeff")
    obj.geometry = geo;
    obj.setStartPosition(100,0,0);
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

    var obj = new physics.RigidBody("floor");
    obj.geometry = geo;
    obj.setStartPosition(0,400);
    ins.add(obj);

    // roof
    var obj = new physics.RigidBody("roof");
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

    var obj = new physics.RigidBody("left");
    obj.geometry = geo;
    obj.setStartPosition(-500,0);
    ins.add(obj);

    // right wall
    var obj = new physics.RigidBody("right");
    obj.geometry = geo;
    obj.setStartPosition(500,0);
    ins.add(obj);

    ins.gravity.y=300;
    ins.setup(document.getElementById("gameboard"));

    this.obj = new physics.RigidBody();
    this.obj.geometry = new physics.Geometry();
    var r = new physics.Rope()

    view = scene.createView(document.getElementById("gameboard"));
    scene.start();
}
