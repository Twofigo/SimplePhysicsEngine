function Game()
{
	// attributes
	this.canvas			= false;
	this.ctx			= false;
	this.gameloop		= false;
	this.timestamp		= false;
	this.zoom			= 1;
	this.world			= false;

	// members
	//	this.initiate;
	//	this.setSize;
}

function World()
{
	// attributes
	this.gravityStrength	= 200;
	
	this.staticBodies	= [];
	this.rigidBodies	= [];
	
	// members
}

function Vector2D(_x , _y)
{
	// attributes
	this.x		= _x || 0;
	this.y		= _y || 0;
	
	// members
	//	this.copy;
	//	this.clone;
	
	//	this.add;
	//	this.subtract;
	//	this.scale;
	
	//	this.project;
	//	this.reverse;
	//	this.normalize;
	//	this.dotProduct;
	//	this.rotate;
	//	this.perp;
	
	//	this.squareLength;
	//	this.lenght;
}

function Surface(_pointA, _pointB)
{
	// attributes
	this.pointA 	= _pointA || new Vector2D();
	this.pointB 	= _pointB || new Vector2D();
	
	// members
	//	this.clone;
	//	this.intersect;
}

function Collision(_objA, _objB)
{
	// attributes
	this.objA				= _objA || false;
	this.objB				= _objA || false;
	
	this.normal				= false;
	this.point				= false;
	
	this.offsetA			= false;
	this.offsetB			= false;
	
	// members
	//	this.resolveCollision;
	//	this.correctCollision;
	
}

function Polygon()
{
	// attributes
	this.points		= [];
	
	// members
	//	this.getVertices;
	//	this.getSurfaces;
}

function StaticBody()
{
	// attributes
	this.id				= false;
	this.geometry		= false;
	
	this.position		= new Vector2D();
	this.angle			= 0;
	
	this.friction		= 1;
	this.restitution		= 1;
	
	this.surfaceColor	= "black";
	
	// members
	//	this.draw;
	//	this.getVertices;
	//	this.getSurfaces;
}

function RigidBody()
{
	StaticBody.call(this);
	
	// attributes
	this.velocity			= new Vector2D();
	this.angularVelocity	= 0;
	
	this.density			= 1;
	
	this.inertia			= false;
	this.mass				= false;
	this.inv_mass			= false;
	this.surfaceArea		= false;
	
	// members
	//	update();
	//	getForceInPoint();
	//	addForceInPoint();
}

RigidBody.prototype = Object.create(StaticBody.prototype);