/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
Game
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
Game.prototype.init = function()
{
	this.canvas = document.getElementById("gameboard");
	this.ctx = game.canvas.getContext("2d");
	
	this.world = new World();
	
	this.setSize();
} 
Game.prototype.setSize = function()
{
	this.canvas.width	= window.innerWidth;
	this.canvas.height	= window.innerHeight;
	
	this.ctx.restore();
	this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
	this.ctx.save();
	
	if (this.canvas.width < this.canvas.height)
		this.zoom = window.innerWidth /1000;
	else
		this.zoom = window.innerHeight / 1000;
	
	
	drawForeground();
	drawBackground();
}

/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
World
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/


/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
Vector2D
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
Vector2D.prototype.copy = function(vector)
{
	this.x = vector.x;
	this.y = vector.y;
	
	return this;	
}
Vector2D.prototype.clone = function()
{
	return new Vector2D(this.x, this.y);
}

Vector2D.prototype.add = function(vector) 
{
	this.x += vector.x;
	this.y += vector.y;

	return this;
}
Vector2D.prototype.subtract = function(vector) 
{
	this.x -= vector.x;
	this.y -= vector.y;

	return this;
}
Vector2D.prototype.scale = function(x,y) 
{
	this.x *= x;
	this.y *= y || x;
	
	return this;
}

Vector2D.prototype.project = function(vector) 
{
    var c = this.dot(vector) / vector.squareLength();
    this.x = c * vector.x;
    this.y = c * vector.y;
	
    return this;
}
Vector2D.prototype.reflect = function(axis)
{
	var x = this.x;
	var y = this.y;
	this.project(axis).scale(2);
	this.x -= x;
	this.y -= y;
	
	return this;
}
Vector2D.prototype.reverse = function() 
{
	this.x = -this.x;
	this.y = -this.y;
	
	return this;
}
Vector2D.prototype.normalize = function() 
{
	var length = this.length();
	if(length > 0) 
	{
		this.x = this.x / length;
		this.y = this.y / length;
	}
	
	return this;
}
Vector2D.prototype.dot = function(vector)
{
	return this.x * vector.x + this.y * vector.y;
}
Vector2D.prototype.cross = function(vector)
{
	return this.x * vector.y - this.y * vector.x;
}
Vector2D.prototype.rotate = function(angle) 
{
	var s = Math.sin(angle);
	var c = Math.cos(angle);	
	var x = this.x;
	var y = this.y;
	
	this.x = x*c - y*s;
	this.y = x*s + y*c;
	
	return this;
}
Vector2D.prototype.perp = function() 
{
	var x = this.x;
	this.x = this.y;
	this.y = -x;
	
	return this;
}

Vector2D.prototype.squareLength = function() 
{
	return this.dot(this);
}
Vector2D.prototype.length = function()
{
	return Math.sqrt(this.squareLength());
}

/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
Line
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
Line.prototype.clone = function()
{
	return new Line(this.pointA.clone(), this.pointB.clone());
}
Line.prototype.intersect = function(line)
{	
	var cordinate = new Vector2D();
		
    var s1_x = this.pointB.x - this.pointA.x;     
	var s1_y = this.pointB.y - this.pointA.y;   
    var s2_x = line.pointB.x - line.pointA.x;     
	var s2_y = line.pointB.y - line.pointA.y;  

	var xDiff = this.pointA.x - line.pointA.x;
	var yDiff = this.pointA.y - line.pointA.y;
	
    var s = (s1_x*yDiff - s1_y*xDiff) / (s1_x*s2_y - s2_x*s1_y);
    var t = (s2_x*yDiff - s2_y*xDiff) / (s1_x*s2_y - s2_x*s1_y);
	
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    {
        cordinate.x = this.pointA.x + (t * s1_x);
        cordinate.y = this.pointA.y + (t * s1_y);
		
		return cordinate;
    }
    return false; // No collision
}
/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
Entity
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
Entity.prototype.clone = function()
{	
	return obj = new Entity(this.position.clone(), this.angle);
}
Entity.prototype.draw = function()
{	
	return;
}
Entity.prototype.setPosition = function(x, y, angle)
{	
	if (x=='undefined' || y=='undefined') return;
	
	this.position.x = x;
	this.position.y = y;
	this.angle = angle || 0;
}
/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
Polygon
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
Polygon.prototype.clone = function()
{	
	var obj = new Polygon(this.position.clone(), this.angle);
	for(let vertex of this.getVertices())
	{
		obj.vertices.push(vertex);
	}
	return obj;
}

Polygon.prototype.getVertices = function*()
{	
	for(let vertex of this.vertices)
	{
		yield (new Vector2D()).copy(vertex);
	}
}

Polygon.prototype.getEdges = function*()
{
	var line = new Line();
	line.pointA=false;
	line.pointB=false;
	var startPoint=	false;
	
	for(let vertex of this.getVertices())
	{
		if (line.pointB===false)
		{
			startPoint = vertex;
			line.pointB = vertex;
			continue;			
		}	
		line.pointA = line.pointB;
		line.pointB = vertex;
		yield line.clone();
	}
	line.pointA = line.pointB;
	line.pointB = startPoint;
	yield line.clone();
}

Polygon.prototype.getAbsVertices = function*()
{	
	for(let vertex of this.getVertices())
	{
		vertex.rotate(this.angle);
		vertex.add(this.position);
		yield vertex;
	}
}
Polygon.prototype.getAbsEdges = function*()
{
	for(let line of this.getEdges())
	{
		line.pointA.rotate(this.angle);
		line.pointA.add(this.position);
		line.pointB.rotate(this.angle);
		line.pointB.add(this.position);
		
		yield line.clone();
	}
}

Polygon.prototype.draw = function()
{
	game.ctx.beginPath();
	for(let cordinate of this.getAbsVertices())
	{
		game.ctx.lineTo(cordinate.x * game.zoom, cordinate.y * game.zoom)
	}
	game.ctx.fillStyle = this.graphicsData.surfaceColor;
	game.ctx.fill();
	
	// center of mass
	game.ctx.beginPath();
	game.ctx.fillStyle="#FFFFFF";
	game.ctx.fillRect((this.position.x-1)*game.zoom, (this.position.y-1)*game.zoom, 2*game.zoom, 2*game.zoom);
	game.ctx.fill();
	
	Entity.prototype.draw.call(this);
}
/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
RigidBody
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
RigidBody.prototype.update = function(time)
{	
	if (this.stationary) return;
	if (this.velocity.length()+this.angularVelocity==0)
	{
		this.moving = false;
		return;
	}
	this.moving = true;
	var t = time / 1000;
	
	//position
	if (this.gravity) this.force.add(game.world.gravity.clone().scale(this.mass));
	var accelleration = this.force.scale(1/this.mass);
	
	this.geometry.position.add(this.velocity.clone().scale(t));
	this.geometry.position.add(accelleration.clone().scale(t * t * 0.5));
	
	this.velocity.add(accelleration.scale(t));
	
	//angle
	var angularAccelleration = this.torque/this.inertia;
	
	this.geometry.angle += this.angularVelocity * 2*Math.PI * t;
	this.geometry.angle += angularAccelleration * 2*Math.PI * t * t * 0.5;
	if (this.geometry.angle > 2*Math.PI) this.geometry.angle%=2*Math.PI;
	if (this.geometry.angle < 0) this.geometry.angle=(this.geometry.angle%(2*Math.PI)) - 2*Math.PI;
	
	this.angularVelocity += angularAccelleration*t;
	
	// reset forces
	this.force.scale(0);
	this.torque = 0;
}
RigidBody.prototype.setPosition = function(x, y, angle)
{
	this.geometry.setPosition(x,y, angle);
}
RigidBody.prototype.setVelocity = function(vx, vy, angularVelocity)
{
	if (vx=='undefined' || vy=='undefined') return;
	if (this.stationary) return;
		
	this.velocity.x		= vx;
	this.velocity.y		= vy;
	this.angularVelocity= angularVelocity || 0;
}
RigidBody.prototype.applyImpulse = function(coordinate, impulse)
{
	if (this.ghost) return;
	if (!this.collidable) return;
	if (this.stationary) return;
	
	//linear
	this.velocity.add(impulse.clone().scale(1/this.mass));

	var temp = coordinate.clone(
	).subtract(this.geometry.position);
	this.angularVelocity += temp.cross(impulse) / this.inertia;
}

RigidBody.prototype.getForce = function(coordinate)
{
	if (this.stationary) return new Vector2D();
		
	var normal = coordinate.clone(
	).subtract(this.geometry.position);
	var radius = normal.length();
	normal.normalize();
	
	var vector = this.force.clone();
	
	vector.add(normal.clone(
	).scale(this.torque / radius
	).perp()
	);
	
	if (this.gravity)vector.add(game.world.gravity.clone().scale(this.mass));
	
	return vector;
}
RigidBody.prototype.applyForce = function(coordinate, force)
{
	if (this.stationary) return;
	
	this.force.add(force)
	
	var torque = force.clone(
	).dot(coordinate.clone(
	).subtract(this.geometry.position
	).perp()
	);
	
	this.torque += torque;
}
/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
Collision
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
Collision.prototype.resolveCollision = function()
{	
	//general
	let radianA = this.point.clone(
	).subtract(this.objA.geometry.position);
	let radianB = this.point.clone(
	).subtract(this.objB.geometry.position);
	
	//bounce
	let velocityA = this.objA.velocity.clone(
	).add(radianA.clone().perp().scale(this.objA.angularVelocity).reverse());
	let velocityB = this.objB.velocity.clone(
	).add(radianB.clone().perp().scale(this.objB.angularVelocity).reverse());
	
	let relativeV = velocityA.clone(
	).subtract(velocityB);
	
	if (relativeV.dot(this.normal)>0) return;
	
	let rApn = radianA.clone( 
	).cross(this.normal);
	let rBpn = radianB.clone(
	).cross(this.normal);
	let totalMass = 0;
	totalMass +=	this.objA.stationary?0:(1/this.objA.mass);
	totalMass +=	this.objB.stationary?0:(1/this.objB.mass);
	totalMass +=	this.objA.stationary?0:(rApn * rApn) / this.objA.inertia;
	totalMass +=	this.objB.stationary?0:(rBpn * rBpn) / this.objB.inertia;
	
	let e = Math.sqrt(
	this.objA.restitution*this.objA.restitution + 
	this.objB.restitution*this.objB.restitution
	);
	
	let j = -(1+e)*relativeV.dot(this.normal)/totalMass
	var impulse = this.normal.clone(
	).scale(j);
	
	this.objA.applyImpulse(this.point, impulse);
	this.objB.applyImpulse(this.point, impulse.reverse());

	//friction
	
	let tangent = relativeV.project(this.normal.clone().perp()).normalize();
	
	velocityA = this.objA.velocity.clone(
	).add(radianA.clone().perp().scale(this.objA.angularVelocity).reverse());
	velocityB = this.objB.velocity.clone(
	).add(radianB.clone().perp().scale(this.objB.angularVelocity).reverse());
	
	relativeV = velocityA.clone(
	).subtract(velocityB);
	
	let mu = Math.sqrt(
	this.objA.staticFriction*this.objA.staticFriction + 
	this.objB.staticFriction*this.objB.staticFriction
	);
	
	var frictionImpulse;
	
	let jt = -relativeV.dot(tangent)/totalMass
	
	if(Math.abs( jt ) < j * mu)
	{
		// static friction
		frictionImpulse = tangent.clone(
		).scale(jt
		);
	}
	else
	{
		// dunamic friction
		frictionImpulse = tangent.clone().scale(-j * Math.sqrt(
		this.objA.dynamicFriction*this.objA.dynamicFriction + 
		this.objB.dynamicFriction*this.objB.dynamicFriction
		));
	}
	
	this.objA.applyImpulse(this.point, frictionImpulse);
	this.objB.applyImpulse(this.point, frictionImpulse.reverse());
}

Collision.prototype.correctCollision = function()
{
	const percent = 0.2;
	const slop = 0.1;
	
	var v = this.normal.clone()
	var correction = 0;
	if (this.offsetA) correction += this.offsetA.length();
	if (this.offsetB) correction += this.offsetB.length();
	
	//correction /= (this.objA.mass+this.objB.mass);
	correction *= percent;
	
	v.scale(correction);
	
	if (this.offsetA)
	{
		this.objA.geometry.position.add(this.offsetA.scale(percent));
	}
	if (this.offsetB)
	{
		this.objB.geometry.position.add(this.offsetB.scale(percent));
	}
}
/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
Helper function
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/


function testPolygonPolygon(bodyA, bodyB)
{	
	var pointA = false;
	var pointB = false;
	
	main:
	for(let lineA of bodyA.geometry.getAbsEdges())
	{
		for(let lineB of bodyB.geometry.getAbsEdges())
		{
			let cordinate = lineA.intersect(lineB);
			if (cordinate) 
			{
				if (!pointA)pointA = cordinate
				else
				{
					pointB = cordinate;
					break main;
				}
			}
		}
	}
	
	if (!pointA)return false;
	
	var collision = new Collision();
	collision.objA = bodyA;
	collision.objB = bodyB;
	
	collision.normal = pointB.clone(
	).subtract(pointA
	).normalize(
	).perp();
	
	if (collision.normal.squareLength()==0) return false;
	
	if (collision.objA.geometry.position.clone(
	).subtract(pointA
	).dot(collision.normal
	)<0)
	{
		collision.normal.reverse();
	}
	
	var temp1 = findOffset(bodyA.geometry, pointA, collision.normal);
	collision.offsetA = temp1.offset;
	
	var temp2 = findOffset(bodyB.geometry, pointA, collision.normal);
	collision.offsetB = temp2.offset;
	
	if (temp1 || temp2)
	{
		if (!temp2 ||
		(temp1 && 
		temp1.offset.length() > temp2.offset.length()))
		{
			collision.point = temp1.point;
		}
		else
		{
			collision.point = temp2.point;
		}
	}
	else
	{
		collision.point = pointA.clone(
		).add(pointB
		).scale(0.5);		
	}
	
	//drawForeground();
	game.ctx.beginPath();
	game.ctx.fillStyle="green";
	game.ctx.fillRect((collision.point.x-2)*game.zoom, (collision.point.y-2)*game.zoom, 4*game.zoom, 4*game.zoom);
	game.ctx.fill();
	
	
	return collision;
}

function findOffset(geometry, orgin, normal)
{
	var offset = false;
	var point = false;
	
	var center = (new Vector2D()
	).copy(geometry.position
	).subtract(orgin
	).project(normal);

	for(let vertex of geometry.getAbsVertices())
	{
		let v = vertex.clone(
		).subtract(orgin
		).project(normal);
		
		if (v.x * center.x >=0 && v.y * center.y >=0) continue;
		if (!(offset) || offset.squareLength() < v.squareLength())
		{
			offset = v;
			point = vertex.clone();
		}
	}
	if (offset)
	{
		return {
		"offset":offset.reverse(),
		"point":point
		}
	}
	return false
}

function compilePolygon(body)
{
	body.mass			= 0;
	body.inertia 		= 0;
	body.surfaceArea	= 0;
	var originOffset = new Vector2D();
	for( line of body.geometry.getEdges() )
	{
		// relative cordinate !!!
		
		let v = line.pointB.clone(
		).subtract(line.pointA);
		
		let b = v.length();
		
		let a = line.pointA.clone(
		).project(v
		).length();
		
		let h = line.pointA.clone(
		).project(v.perp()
		).length();
		
		let surfaceArea = b*h/2;
		//let inertia = ( (b*b*b)*h - (b*b)*h*a + b*h*(a*a) + b*(h*h*h) ) / 36;
		let inertia = b*h*(b*b - b*a + a*a + h*h)/36;
		
		let center = new Vector2D(); 
		center.x = ( line.pointA.x + line.pointB.x ) / 3;
		center.y = ( line.pointA.y + line.pointB.y ) / 3;
		
		let d = center.length();
		
		body.mass			+= body.density*surfaceArea;
		body.inertia		+= body.density*surfaceArea * (d*d) + inertia*body.density;
		body.surfaceArea	+= surfaceArea;
		originOffset.add(center);
	}
	
	body.inv_mass	= 1/body.mass;
	
	for( vertex of body.geometry.vertices)
	{
		vertex.x += originOffset.x;
		vertex.y += originOffset.y;
	}
}





