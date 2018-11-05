function Game()
{
	this.canvas			= false;
	this.ctx			= false;
	this.gameloop		= false;
	this.timestamp		= false;
	this.zoom			= 1;
	this.world			= false;

	//	initiate;
	//	setSize;
}

function World()
{
	this.gravity = new Vector2D();
	
	this.enteties	= [];
	this.rigidBodies	= [];
}

function Vector2D(x , y)
{
	this.x		= x || 0;
	this.y		= y || 0;
	
	//	copy;
	//	clone;
	
	//	add;
	//	subtract;
	//	scale;
	
	//	project;
	//	reverse;
	//	normalize;
	//	dot;
	//	rotate;
	//	perp;
	
	//	squareLength;
	//	lenght;
}
function GraphicsData()
{
	this.texture		= false;
	this.textureSize	= false;
	this.surfaceColor	= 'black';
}
function Line(pointA, pointB)
{
	this.pointA 	= pointA || new Vector2D();
	this.pointB 	= pointB || new Vector2D();
	
	//	clone;
	//	intersect;
}
function Entity(position, angle)
{	
	this.position		= position || new Vector2D();
	this.angle			= angle || 0;
			
	this.graphicsData	= new GraphicsData();
		
	//	clone;
	//	draw;
	//	setPosition;
}
function Polygon(position, angle, vertices)
{
	Entity.call(this, position, angle);
	this.vertices	= vertices || [];
	
	//	clone;
	//	draw;
	
	//	getVertices;
	//	getEdges;
	
	//	getAbsVertices;
	//	getAbsEdges;
}
Polygon.prototype = Object.create(Entity.prototype);

function RigidBody()
{
	this.gravity			= false;
	this.moving				= false;
	this.stationary			= false;
	this.collidable			= true;
	this.ghost				= false;
	
	this.geometry 			= false;

	this.staticFriction		= 0.1;
	this.dynamicFriction	= 0.05;
	this.restitution		= 0.05;
	
	this.velocity			= new Vector2D();
	this.angularVelocity	= 0;
	this.force				= new Vector2D();
	this.torque				= 0;
	
	this.density			= 0.1;
	this.inertia			= false;
	this.mass				= false;
	this.surfaceArea		= false;
	
	//	update;
	
	//	setPosition;
	//	setVelocity;
	
	//	getForce;
	//	applyForce;
	
	//	getImpulse;
	//	applyImpulse;
}
function Collision(objA, objB)
{
	this.objA				= objA || false;
	this.objB				= objB || false;
	
	this.normal				= false;
	this.point				= false;
	
	this.offsetA			= false;
	this.offsetB			= false;
	
	//	resolveCollision;
	//	correctCollision;
	
}