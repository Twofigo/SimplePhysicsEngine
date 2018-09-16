var game;

function setup()
{
	game = new Game();
	game.init();
	
	var geo = new Polygon();
	geo.angle = 0;
	geo.points = [
	{x:-14,y:20},
	{x:14,y:20},
	{x:20,y:0},
	{x:14,y:-20},
	{x:-14,y:-20},
	{x:-20,y:0},
	];
	var obj = new RigidBody()
	obj.position.x=0;
	obj.position.y=0; 
	obj.geometry = geo;
	obj.surfaceColor = "green";
	obj.velocity.x = 0;
	obj.velocity.y = 0;
	obj.angularVelocity = 2;
	game.world.rigidBodies.push(obj);
	
	var geo = new Polygon();
	geo.angle = 0;
	geo.points = [
	{x:-20,y:-20},
	{x:-20,y:20},
	{x:20,y:20},
	{x:20,y:-20},
	];
	var obj = new RigidBody()
	obj.position.x=200;
	obj.position.y=0; 
	obj.geometry = geo;
	obj.surfaceColor = "red";
	obj.velocity.x = -50;
	obj.velocity.y = 0;
	obj.angularVelocity = 1;
	game.world.rigidBodies.push(obj);
	
	
	var geo = new Polygon();
	geo.points = [
	{x:-800,y:0},
	{x:800,y:0},
	{x:800,y:100},
	{x:-800,y:100},
	];
	var obj = new StaticBody();
	obj.position.x=0;
	obj.position.y=300; 
	obj.geometry = geo;
	obj.surfaceColor = "blue";
	game.world.staticBodies.push(obj)
	
	var geo = new Polygon();
	geo.points = [
	{x:-800,y:0},
	{x:800,y:0},
	{x:800,y:100},
	{x:-800,y:100},
	];
	var obj = new StaticBody();
	obj.position.x=0;
	obj.position.y=-400; 
	obj.geometry = geo;
	obj.surfaceColor = "blue";
	game.world.staticBodies.push(obj)
	
	var geo = new Polygon();
	geo.points = [
	{x:-100,y:-800},
	{x:100,y:-800},
	{x:100,y:800},
	{x:-100,y:800},
	];
	var obj = new StaticBody();
	obj.position.x=-500;
	obj.position.y=0; 
	obj.geometry = geo;
	obj.surfaceColor = "blue";
	game.world.staticBodies.push(obj)
	
	var geo = new Polygon();
	geo.points = [
	{x:-100,y:-800},
	{x:100,y:-800},
	{x:100,y:800},
	{x:-100,y:800},
	];
	var obj = new StaticBody();
	obj.position.x=500;
	obj.position.y=0; 
	obj.geometry = geo;
	obj.surfaceColor = "blue";
	game.world.staticBodies.push(obj)
	
	compileGeometry();
	
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

function mainloop(_timestamp)
{
	if (game.timestamp === false) game.timestamp = _timestamp;
	var timeDelta = _timestamp - game.timestamp;
	game.timestamp = _timestamp;
	
	if (timeDelta>50)timeDelta=6;
	
	updateForeground(timeDelta);
	updateBackground(timeDelta);
	
	drawForeground();
	drawBackground();
	
	window.requestAnimationFrame(mainloop)
}

function updateForeground(_time)
{
	if (!_time) return;
	
	for(let obj of game.world.rigidBodies)
	{
		obj.update(_time);
	}
	
	// collide others
	for (let k1=0; k1<game.world.rigidBodies.length; k1++)
	{
		for (let k2=k1+1; k2<game.world.rigidBodies.length; k2++)
		{
			var collision = testPolygonPolygon(
			game.world.rigidBodies[k1],
			game.world.rigidBodies[k2]
			);
			
			if (collision)
			{
				collision.resolveCollision();
				collision.correctCollision();
			}
		}		
	}
	
	// collide world
	for(let obj1 of game.world.rigidBodies)
	{
		for(let obj2 of game.world.staticBodies)
		{
			var collision = testPolygonPolygon(
			obj1,
			obj2
			);
			
			if (collision)
			{
				collision.resolveCollision();
				collision.correctCollision();
			}
		}
	}
}
function updateBackground(_time)
{
	if (!_time) return;
}
function drawForeground()
{
	game.ctx.clearRect(-game.canvas.width/2, -game.canvas.height/2, game.canvas.width, game.canvas.height);
	for(obj of game.world.rigidBodies.concat(game.world.staticBodies))
	{
		obj.draw();
	}
}
function drawBackground()
{
}