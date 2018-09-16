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
Vector2D.prototype.copy = function(_vector)
{
	this.x = _vector.x;
	this.y = _vector.y;
	
	return this;	
}
Vector2D.prototype.clone = function()
{
	return new Vector2D(this.x, this.y);
}

Vector2D.prototype.add = function(_vector) 
{
	this.x += _vector.x;
	this.y += _vector.y;

	return this;
}
Vector2D.prototype.subtract = function(_vector) 
{
	this.x -= _vector.x;
	this.y -= _vector.y;

	return this;
}
Vector2D.prototype.scale = function(_x,_y) 
{
	this.x *= _x;
	this.y *= _y || _x;
	
	return this;
}

Vector2D.prototype.project = function(_vector) 
{
    var c = this.dotProduct(_vector) / _vector.squareLength();
    this.x = c * _vector.x;
    this.y = c * _vector.y;
	
    return this;
}
Vector2D.prototype.reflect = function(_axis)
{
	var x = this.x;
	var y = this.y;
	this.project(_axis).scale(2);
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
Vector2D.prototype.dotProduct = function(_vector)
{
	return this.x * _vector.x + this.y * _vector.y;
}
Vector2D.prototype.rotate = function(_angle) 
{
	var s = Math.sin(_angle);
	var c = Math.cos(_angle);	
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
	return this.dotProduct(this);
}
Vector2D.prototype.length = function()
{
	return Math.sqrt(this.squareLength());
}
/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
Polygon
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
Polygon.prototype.getVertices = function*()
{	
	for(let p of this.points)
	{
		yield (new Vector2D()).copy(p);
	}
}

Polygon.prototype.getSurfaces = function*()
{
	var surface = new Surface();
	surface.pointA=false;
	surface.pointB=false;
	var startPoint=	false;
	
	for(let p of this.getVertices())
	{
		if (surface.pointB===false)
		{
			startPoint = p;
			surface.pointB = p;
			continue;			
		}	
		surface.pointA = surface.pointB;
		surface.pointB = p;
		yield surface.clone();
	}
	surface.pointA = surface.pointB;
	surface.pointB = startPoint;
	yield surface.clone();
}
/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
Surface
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
Surface.prototype.clone = function()
{
	return new Surface(this.pointA, this.pointB);
}
Surface.prototype.intersect = function(_surface)
{	
	var cordinate = new Vector2D();
		
    var s1_x = this.pointB.x - this.pointA.x;     
	var s1_y = this.pointB.y - this.pointA.y;   
    var s2_x = _surface.pointB.x - _surface.pointA.x;     
	var s2_y = _surface.pointB.y - _surface.pointA.y;  

	var xDiff = this.pointA.x - _surface.pointA.x;
	var yDiff = this.pointA.y - _surface.pointA.y;
	
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
Collision
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
Collision.prototype.resolveCollision = function()
{
	
	var vector1;
	var vector2;
	
	if (typeof(this.objA.getForceInPoint) !== 'undefined') vector1 = this.objA.getForceInPoint(this.point);
	else vector1 = new Vector2D();
	if (typeof(this.objB.getForceInPoint) !== 'undefined') vector2 = this.objB.getForceInPoint(this.point);
	else vector2 = new Vector2D();
	
	var newVector1 = vector2.clone().subtract(vector1);
	var newVector2 = vector1.clone().subtract(vector2);
	
	if (typeof(this.objA.addForceInPoint) !== 'undefined') this.objA.addForceInPoint(this.point, newVector1);
	if (typeof(this.objB.addForceInPoint) !== 'undefined') this.objB.addForceInPoint(this.point, newVector2);
}

Collision.prototype.correctCollision = function()
{
	const percent = 1;
	const slop = 0.01;
	
	var v = this.normal.clone()
	var correction = 0;
	if (this.offsetA) correction += this.offsetA.length();
	if (this.offsetB) correction += this.offsetB.length();
	
	//correction /= (this.objA.mass+this.objB.mass);
	correction *= percent;
	
	v.scale(correction);
	
	if (this.offsetA)
	{
		this.objA.position.add(this.offsetA.scale(percent));
	}
	if (this.offsetB)
	{
		this.objB.position.add(this.offsetB.scale(percent));
	}
}
/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
StaticBody
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
StaticBody.prototype.draw = function()
{
	game.ctx.beginPath();
	for(let cordinate of this.getVertices())
	{
		game.ctx.lineTo(cordinate.x * game.zoom, cordinate.y * game.zoom)
	}
	game.ctx.fillStyle = this.surfaceColor;
	game.ctx.fill();
	
	
	// center of mass and rotation
	game.ctx.beginPath();
	game.ctx.fillStyle="#FFFFFF";
	game.ctx.fillRect((this.position.x-1)*game.zoom, (this.position.y-1)*game.zoom, 2*game.zoom, 2*game.zoom);
	game.ctx.fill();
}
StaticBody.prototype.getVertices = function*()
{	
	for(let p of this.geometry.getVertices())
	{
		let result = new Vector2D(p.x, p.y);
		result.rotate(this.angle);
		result.add(this.position);
		yield result;
	}
}

StaticBody.prototype.getSurfaces = function*()
{
	var surface = new Surface();
	surface.pointA=false;
	surface.pointB=false;
	var startPoint=	false;
	
	for(let p of this.getVertices())
	{
		if (surface.pointB===false)
		{
			startPoint = p;
			surface.pointB = p;
			continue;			
		}	
		surface.pointA = surface.pointB;
		surface.pointB = p;
		yield surface.clone();
	}
	surface.pointA = surface.pointB;
	surface.pointB = startPoint;
	yield surface.clone();
}
/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
RigidBody
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/
RigidBody.prototype.update = function(_time)
{	
	var t = _time / 1000;
	this.position.x += this.velocity.x * t;
	this.position.y += this.velocity.y * t;
	this.position.y += game.world.gravityStrength * t * t * 0.5;
	
	this.angle -= this.angularVelocity * t;
	if (this.angle > 2*Math.PI) this.angle-=2*Math.PI;
	if (this.angle < 0) this.angle+=2*Math.PI;
	
	this.velocity.y += game.world.gravityStrength * t;
}

RigidBody.prototype.getForceInPoint = function(_coordinate)
{
	var point = _coordinate.clone(
	).subtract(this.position);
	
	var vector = this.velocity.clone(
	).scale(this.mass);
	
	var radius = point.length();
	
	vector.add(point.normalize(
	).scale(this.angularVelocity * this.inertia /10
	).perp()
	);
	
	return vector;
}
RigidBody.prototype.addForceInPoint = function(_coordinate, _vector)
{
	var point = _coordinate.clone(
	).subtract(this.position);
	
	var vector1 = _vector.clone();
	
	var vector2 = vector1.clone();
	
	vector1.project(point);
	vector2.subtract(vector1);
	
	vector1.scale(1/this.mass);
	this.velocity.add(vector1)
	
	var momentum = vector2.length();
	
	
	if (point.x * _vector.y < 0)momentum = -momentum;
	else if (_vector.y==0)
		if (point.y * _vector.x > 0)momentum = -momentum;
	
	this.angularVelocity -= 10*momentum / this.inertia;
}
/*
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
Helper function
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
*/


function testPolygonPolygon(_bodyA, _bodyB)
{	
	var pointA = false;
	var pointB = false;
	
	main:
	for(let surfaceA of _bodyA.getSurfaces())
	{
		for(let surfaceB of _bodyB.getSurfaces())
		{
			let cordinate = surfaceA.intersect(surfaceB);
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
	collision.objA = _bodyA;
	collision.objB = _bodyB;
	
	collision.normal = pointB.clone(
	).subtract(pointA
	).normalize(
	).perp();
	
	collision.point = pointA.clone(
	).add(pointB
	).scale(0.5);
	
	collision.offsetA = findOffset(_bodyA, pointA, collision.normal);

	collision.offsetB = findOffset(_bodyB, pointA, collision.normal);
	
	return collision;
}

function findOffset(_obj, _orgin, _normal)
{
	var offset = false;
	
	var center = (new Vector2D()
	).copy(_obj.position
	).subtract(_orgin
	).project(_normal);

	for(let vertex of _obj.getVertices())
	{
		let v = vertex.clone(
		).subtract(_orgin
		).project(_normal);
		
		if (v.x * center.x >=0 && v.y * center.y >=0) continue;
		if (!(offset) || offset.squareLength() < v.squareLength()) offset = v;
	}
	if (offset)
		return offset.reverse();
	return false
}

function compilePolygon(_body)
{
	_body.mass			= 0;
	_body.inertia 		= 0;
	_body.surfaceArea	= 0;
	var originOffset = new Vector2D();
	for( surface of _body.geometry.getSurfaces() )
	{
		// relative cordinate !!!
		
		let v = surface.pointB.clone(
		).subtract(surface.pointA);
		
		let b = v.length();
		
		let a = surface.pointA.clone(
		).project(v
		).length();
		
		let h = surface.pointA.clone(
		).project(v.perp()
		).length();
		
		let surfaceArea = b*h/2;
		let inertia = ( (b*b*b)*h - (b*b)*h*a + b*h*(a*a) + b*(h*h*h) ) / 36 
		
		let center = new Vector2D(); 
		center.x = ( surface.pointA.x + surface.pointB.x ) / 3;
		center.y = ( surface.pointA.y + surface.pointB.y ) / 3;
		
		let d = center.length();
		
		_body.mass			+= _body.density*surfaceArea;
		_body.inertia		+= _body.density*surfaceArea * (d*d) + inertia;
		_body.surfaceArea	+= surfaceArea;
		originOffset.add(center);
	}
	
	_body.inv_mass	= 1/_body.mass;
	
	console.log("color: "+_body.surfaceColor);
	console.log("mass: "+_body.mass);
	console.log("inertia: "+_body.inertia);
	console.log("area: "+_body.surfaceArea);
	
	// cheat
	
	for( p of _body.geometry.points)
	{
		p.x += originOffset.x;
		p.y += originOffset.y;
	}
	
	
	/*
	game.ctx.beginPath();
	game.ctx.fillStyle="black";
	game.ctx.fillRect(
	originOffset.x + _body.position.x - 2
	originOffset.y + _body.position.y - 2
	4,4);
	game.ctx.fill();
	*/
}





