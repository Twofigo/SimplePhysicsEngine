var game;

function setup()
{
	game = new Game();
	game.init();
	
	var geo = new Polygon();
	geo.vertices = [
	{x:-14,y:20},
	{x:14,y:20},
	{x:20,y:0},
	{x:14,y:-20},
	{x:-14,y:-20},
	{x:-20,y:0},
	];
	var obj = new RigidBody()
	obj.geometry = geo;
	obj.setPosition(0,40,0);
	obj.setVelocity(0,0,0);
	obj.gravity=false;
	game.world.rigidBodies.push(obj);
	
	var geo = new Polygon();
	geo.vertices = [
	{x:-20,y:-20},
	{x:-20,y:20},
	{x:20,y:20},
	{x:20,y:-20},
	];
	var obj = new RigidBody()
	obj.geometry = geo;
	obj.setPosition(200,0,20);
	obj.setVelocity(-200,0,0);
	obj.gravity=true;
	game.world.rigidBodies.push(obj);
	
	
	// floor;
	var geo = new Polygon();
	geo.vertices = [
	{x:-800,y:-100},
	{x:800,y:-100},
	{x:800,y:100},
	{x:-800,y:100},
	];
	
	var obj = new RigidBody();
	obj.geometry = geo.clone();
	obj.setPosition(0,400);
	obj.stationary=true;
	game.world.rigidBodies.push(obj)

	// roof
	var obj = new RigidBody();
	obj.geometry = geo;
	obj.setPosition(0,-400);
	obj.stationary=true;
	game.world.rigidBodies.push(obj)
	
	// left wall
	var geo = new Polygon();
	geo.vertices = [
	{x:-100,y:-800},
	{x:100,y:-800},
	{x:100,y:800},
	{x:-100,y:800},
	];
	var obj = new RigidBody();
	obj.geometry = geo.clone();
	obj.setPosition(-500,0); 
	obj.stationary=true;
	game.world.rigidBodies.push(obj)
	
	// right wall
	var obj = new RigidBody();
	obj.geometry = geo;
	obj.setPosition(500,0);
	obj.stationary=true;
	game.world.rigidBodies.push(obj)
	
	compileGeometry();
	
	game.world.gravity.y=300;
	
	window.requestAnimationFrame(mainloop);
}

function compileGeometry()
{
	for(obj of game.world.rigidBodies)
	{
		if (obj.geometry instanceof Polygon)
			compilePolygon(obj);
	}
}

function mainloop(timestamp)
{
	if (game.timestamp === false) game.timestamp = timestamp;
	var timeDelta = timestamp - game.timestamp;
	game.timestamp = timestamp;
	
	if (timeDelta>50)timeDelta=6;
	timeDelta=5;
	
	updateForeground(timeDelta);
	updateBackground(timeDelta);
	
	drawForeground();
	drawBackground();
	
	window.requestAnimationFrame(mainloop)
}

function updateForeground(time)
{
	if (!time) return;
	
	for(let obj of game.world.rigidBodies)
	{
		obj.update(time);
	}
	
	// collide others
	for (let k1=0; k1<game.world.rigidBodies.length; k1++)
	{
		let objA = game.world.rigidBodies[k1];
		if (objA.ghost) continue;
		for (let k2=k1+1; k2<game.world.rigidBodies.length; k2++)
		{
			let objB = game.world.rigidBodies[k2];
			
			if (objB.ghost) continue;
			if (objA.stationary && objB.stationary) continue;
			if (!(objA.moving || objB.moving)) continue;
			
			var collision = testPolygonPolygon(
			game.world.rigidBodies[k1],
			game.world.rigidBodies[k2]
			);
			
			if (collision)
			{
				if (!objA.collidable) continue;
				if (!objB.collidable) continue;
				collision.resolveCollision();
				collision.correctCollision();
			}
		}		
	}
}
function updateBackground(time)
{
	if (!time) return;
}
function drawForeground()
{
	game.ctx.clearRect(-game.canvas.width/2, -game.canvas.height/2, game.canvas.width, game.canvas.height);
	for(obj of game.world.enteties)
	{
		obj.draw();
	}
	for(obj of game.world.rigidBodies)
	{
		obj.geometry.draw();
	}
}
function drawBackground()
{
}