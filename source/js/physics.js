var physics = (function(){
    var Vector = function(x   = 0, y   = 0){
        this.x  = x;
        this.y  = y;
    }
    Vector.prototype.clone = function(){
        return new Vector(this.x, this.y);
    }
    Vector.prototype.reverse = function(){
        this.x = -this.x;
        this.y = -this.y;
        
        return this;
    }
    Vector.prototype.normalize = function(){
        var length = this.length();
        if(length > 0) 
        {
            this.scale(1/length);
        }
        
        return this;
    }
    Vector.prototype.perp = function(){
        var x = this.x;
        this.x = this.y;
        this.y = -x;
        
        return this;
    }
    Vector.prototype.copy = function( vector ){
        this.x = vector.x;
        this.y = vector.y;
        
        return this;	
    }
    Vector.prototype.add = function(vector){
        this.x += vector.x;
        this.y += vector.y;

        return this;
    }
    Vector.prototype.subtract = function(vector){
        this.x -= vector.x;
        this.y -= vector.y;

        return this;
    }
    Vector.prototype.project = function(vector){
        var c = this.dot(vector) / vector.squareLength();
        this.x = c * vector.x;
        this.y = c * vector.y;
        
        return this;
    }
    Vector.prototype.scale = function(x   = 0, y   = x){
        this.x  *= x;
        this.y  *= y;
        
        return this;
    }
    Vector.prototype.rotate = function(angle = 0){
        var s = Math.sin(angle);
        var c = Math.cos(angle);	
        var x = this.x;
        var y = this.y;
        
        this.x = x*c - y*s;
        this.y = x*s + y*c;
        
        return this;
    }
    Vector.prototype.squareLength = function(){
        return this.dot(this);
    }
    Vector.prototype.length = function(){
        return Math.sqrt(this.squareLength());
    }
    Vector.prototype.dot = function(vector){
        return this.x * vector.x + this.y * vector.y;
    }
    Vector.prototype.cross = function(vector){
        return this.x * vector.y - this.y * vector.x;
    }
    
    var Scene = function(){
        this.canvas			= false;
        this.ctx			= false;
        this.timestamp      = false;
    
        this.zoom			= 1;
            
        this.gravity = new Vector();	
        this.enteties	= [];
        this.rigidBodies	= [];
    }   
    Scene.prototype.init = function(){
        if (!this.canvas) this.canvas = document.getElementById("gameboard");
        if (!this.context) this.ctx = this.canvas.getContext("2d");
  
        this.setSize();
        
        for(obj of this.rigidBodies)
        {
            if (obj.mass !== false) continue;
            if (obj.geometry instanceof Polygon)
                compilePolygon(obj);
        }
    }
    Scene.prototype.update = function(timestamp = false){
      	var time = this.getTimeDelta(timestamp);
        if (!time) return;
        
        for(var obj of this.rigidBodies)
        {
            obj.update(time);
        }
        
        // collide others
        for (var k1=0; k1<this.rigidBodies.length; k1++)
        {
            var objA = this.rigidBodies[k1];
            for (var k2=k1+1; k2<this.rigidBodies.length; k2++)
            {
                var objB = this.rigidBodies[k2];
                
                if (objA.stationary && objB.stationary) continue;
                
                var collision = collisionTests.polyPoly(
                this.rigidBodies[k1],
                this.rigidBodies[k2]
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
        
        if (this.timestamp !== timestamp) this.update(timestamp);
    }
    Scene.prototype.draw = function(){
        
        this.ctx.clearRect(-this.canvas.width/2, -this.canvas.height/2, this.canvas.width, this.canvas.height);
        for(obj of this.enteties)
        {
            obj.draw();
        }
        for(obj of this.rigidBodies)
        {
            obj.draw();
        }
    }
    Scene.prototype.setSize = function(){
        this.canvas.width	= window.innerWidth;
        this.canvas.height	= window.innerHeight;
        
        this.ctx.restore();
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.save();
        
        if (this.canvas.width < this.canvas.height)
            this.zoom = window.innerWidth /1000;
        else
            this.zoom = window.innerHeight / 1000;
        
        
        this.draw();
    }
    Scene.prototype.getTimeDelta = function(timestamp)
    {
        if (!timestamp)
        {
            this.timestamp = false;
            return 16;
        }
        if (!this.timestamp){
            this.timestamp = timestamp;
            return 0;
        }
        var time = timestamp - this.timestamp;
        
        
        if (time > 500)
        {
            this.timestamp = false;
            return 10;
        }
        if (time > 50)
        {
            return 50;
            this.timestamp+=50;
        }
        
        this.timestamp = timestamp;
        
        return time
    }
    
    var Material = function(){    
        this.density			= 0.1;
        this.staticFriction		= 0.2;
        this.dynamicFriction	= 0.17;
        this.restitution		= 0.0005;

        this.texture		= false;
        this.textureSize	= false;
        this.surfaceColor	= 'black';
        this.borderWidths   = 0;
        this.borderColor    = 'black';
    }
    
    var Line = function(pointA = new Vector(), pointB = new Vector()){
        this.pointA 	= pointA;
        this.pointB 	= pointB;
    }
    Line.prototype.clone = function(){
        return new Line(this.pointA.clone(), this.pointB.clone());
    }
    Line.prototype.rotate = function(angle){
        this.pointA.rotate(angle);
        this.pointB.rotate(angle);
        return this;
    }
    Line.prototype.add = function(position){
        this.pointA.add(position);
        this.pointB.add(position);
        
        return this;
    }
    Line.prototype.intersect = function(line){	
        var cordinate = new Vector();
            
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
    
    var Polygon = function(vertices = []){
        this.vertices	= vertices;
    }
    Polygon.prototype.clone = function(){	
        var obj = new Polygon();
        for(var vertex of this.getVertices())
        {
            obj.vertices.push(vertex);
        }
        return obj;
    }
    Polygon.prototype.getVertices = function*(){	
        for(var vertex of this.vertices)
        {
            yield (new Vector()).copy(vertex);
        }
    }
    Polygon.prototype.getEdges = function*(){
        var line = new Line();
        line.pointA=false;
        line.pointB=false;
        var startPoint=	false;
        
        for(var vertex of this.getVertices())
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
    
    var Entity = function(position = new Vector(),angle = 0,geometry = false,material = false){
        this.position   = position;
        this.angle      = 0;
        
        this.geometry   = geometry;
        this.material   = material;
    }
    Entity.prototype.draw = function(){
       drawPolygon(this.geometry, this.material, this.position, this.angle);
    }
    
    var RigidBody = function(position = new Vector(),angle = 0,geometry = false,material = false){    
        Entity.call(this, position, angle, geometry, material);
    
        this.velocity			= new Vector();
        this.angularVelocity	= 0;
        this.force				= new Vector();
        this.torque				= 0;
        
        this.inertia			= false;
        this.mass				= false;
        this.surfaceArea		= false;
        
        this.gravity			= false;
        this.stationary			= false;
        this.collidable			= true;
    }
    RigidBody.prototype = Object.create(Entity.prototype);
    RigidBody.prototype.setPosition = function(x = 0, y = 0, angle = 0){
        this.position.x = x;
        this.position.y = y;
        this.angle      = angle;
    }
    RigidBody.prototype.setVelocity = function(vx = 0, vy = 0, angularVelocity = 0){
        if (vx=='undefined' || vy=='undefined') return;
        if (this.stationary) return;
            
        this.velocity.x		= vx;
        this.velocity.y		= vy;
        this.angularVelocity= angularVelocity || 0;
    }
    RigidBody.prototype.update = function(time){
        if (this.stationary) return;
        var t = time / 1000;
        
        //position
        if (this.gravity) this.force.add(physics.scene.gravity.clone().scale(this.mass));
        var accelleration = this.force.scale(1/this.mass);
        
        this.position.add(this.velocity.clone().scale(t));
        this.position.add(accelleration.clone().scale(t * t * 0.5));
        
        this.velocity.add(accelleration.scale(t));
        
        //angle
        var angularAccelleration = this.torque/this.inertia;
        
        this.angle += this.angularVelocity * t;
        this.angle += angularAccelleration * t * t * 0.5;
        if (this.angle > 2*Math.PI) this.angle%=2*Math.PI;
        if (this.angle < 0) this.angle=2*Math.PI + (this.angle%(2*Math.PI));
        
        this.angularVelocity += angularAccelleration*t;
        
        // reset forces
        this.force.scale(0);
        this.torque = 0;
    }
    RigidBody.prototype.applyImpulse = function(coordinate, impulse){
        if (!this.collidable) return;
        if (this.stationary) return;
        
        //linear
        this.velocity.add(impulse.clone().scale(1/this.mass));

        var temp = coordinate.clone(
        ).subtract(this.position);
        this.angularVelocity += temp.cross(impulse) / this.inertia;
    }
    
    var Collision = function Collision(){
        this.objA				= false;
        this.objB				= false;
        this.normal				= false;
        this.point				= false;
        this.offsetA			= false;
        this.offsetB			= false;
    }
    Collision.prototype.resolveCollision = function(){	
        //general
        var radianA = this.point.clone(
        ).subtract(this.objA.position);
        var radianB = this.point.clone(
        ).subtract(this.objB.position);
        
        //bounce
        var velocityA = this.objA.velocity.clone(
        ).add(radianA.clone().perp().scale(this.objA.angularVelocity).reverse());
        var velocityB = this.objB.velocity.clone(
        ).add(radianB.clone().perp().scale(this.objB.angularVelocity).reverse());
        
        var relativeV = velocityA.clone(
        ).subtract(velocityB);
        
        if (relativeV.dot(this.normal)>0) return;
        
        var rApn = radianA.clone( 
        ).cross(this.normal);
        var rBpn = radianB.clone(
        ).cross(this.normal);
        var totalMass = 0;
        totalMass +=	this.objA.stationary?0:(1/this.objA.mass);
        totalMass +=	this.objB.stationary?0:(1/this.objB.mass);
        totalMass +=	this.objA.stationary?0:(rApn * rApn) / this.objA.inertia;
        totalMass +=	this.objB.stationary?0:(rBpn * rBpn) / this.objB.inertia;
        
        var e = Math.sqrt(
        this.objA.material.restitution*this.objA.material.restitution + 
        this.objB.material.restitution*this.objB.material.restitution
        );
        
        var j = -(1+e)*relativeV.dot(this.normal)/totalMass
        var impulse = this.normal.clone(
        ).scale(j);
        
        this.objA.applyImpulse(this.point, impulse);
        this.objB.applyImpulse(this.point, impulse.reverse());

        //friction
        
        var tangent = relativeV.project(this.normal.clone().perp()).normalize();
        
        velocityA = this.objA.velocity.clone(
        ).add(radianA.clone().perp().scale(this.objA.angularVelocity).reverse());
        velocityB = this.objB.velocity.clone(
        ).add(radianB.clone().perp().scale(this.objB.angularVelocity).reverse());
        
        relativeV = velocityA.clone(
        ).subtract(velocityB);
        
        var mu = Math.sqrt(
        this.objA.material.staticFriction*this.objA.material.staticFriction + 
        this.objB.material.staticFriction*this.objB.material.staticFriction
        );
        
        var frictionImpulse;
        
        var jt = -relativeV.dot(tangent)/totalMass
        
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
            this.objA.material.dynamicFriction*this.objA.material.dynamicFriction + 
            this.objB.material.dynamicFriction*this.objB.material.dynamicFriction
            ));
        }
        
        this.objA.applyImpulse(this.point, frictionImpulse);
        this.objB.applyImpulse(this.point, frictionImpulse.reverse());
    }
    Collision.prototype.correctCollision = function(){
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
            this.objA.position.add(this.offsetA.scale(percent));
        }
        if (this.offsetB)
        {
            this.objB.position.add(this.offsetB.scale(percent));
        }
    }
    
    var collisionTests = function(){};
    collisionTests.prototype.polyPoly = function(bodyA, bodyB){
        var pointA = false;
        var pointB = false;
        
        main:
        for(var lineA of bodyA.geometry.getEdges())
        {
            lineA.rotate(bodyA.angle).add(bodyA.position);
            for(var lineB of bodyB.geometry.getEdges())
            {
                lineB.rotate(bodyB.angle).add(bodyB.position);
                var cordinate = lineA.intersect(lineB);
                if (!cordinate) continue; 
                if (!pointA)pointA = cordinate
                else {
                    pointB = cordinate;
                    break main;
                }
            }
        }
        
        if (!pointA || !pointB) return false;
        
        var collision = new Collision();
        collision.objA = bodyA;
        collision.objB = bodyB;
        
        collision.normal = pointB.clone(
        ).subtract(pointA
        ).normalize(
        ).perp();
         
        if (collision.objA.position.clone(
        ).subtract(pointA
        ).dot(collision.normal
        )<0)
        {
            collision.normal.reverse();
        }
        
        var totalOffset = 0;
        collision.point = new Vector();
        for (var obj = collision.objA;; obj= collision.objB)
        {
            var maxOffset = false;
            var center = obj.position.clone(
            ).subtract(pointA
            ).project(collision.normal)
            
            for(var vertex of obj.geometry.getVertices())
            {
                vertex.rotate(obj.angle
                ).add(obj.position);
                var v = vertex.clone(
                ).subtract(pointA
                ).project(collision.normal);
                
                if (v.dot(center)>=0)continue;
                
                var offset = v.length()
                collision.point.add(vertex.scale(offset));
                totalOffset += offset;
                if (!maxOffset || maxOffset.squareLength() < v.squareLength())
                {
                    maxOffset = v;
                }
            }
            if (obj===collision.objA) {
                if (maxOffset) collision.offsetA = maxOffset.reverse();
            }
            else
            {
                if (maxOffset) collision.offsetB = maxOffset.reverse();
                break;
            }
        }
        collision.point.scale(1/totalOffset);
        
        return collision;
    }
    collisionTests = new collisionTests();
    
    
    function compilePolygon(body){
        body.mass			= 0;
        body.inertia 		= 0;
        body.surfaceArea	= 0;
        var originOffset = new Vector();
        for( line of body.geometry.getEdges() )
        {
            // relative cordinate !!!
            
            var v = line.pointB.clone(
            ).subtract(line.pointA);
            
            var b = v.length();
            
            var a = line.pointA.clone(
            ).project(v
            ).length();
            
            var h = line.pointA.clone(
            ).project(v.perp()
            ).length();
            
            var surfaceArea = b*h/2;
            //var inertia = ( (b*b*b)*h - (b*b)*h*a + b*h*(a*a) + b*(h*h*h) ) / 36;
            var inertia = b*h*(b*b - b*a + a*a + h*h)/36;
            
            var center = new Vector(); 
            center.x = ( line.pointA.x + line.pointB.x ) / 3;
            center.y = ( line.pointA.y + line.pointB.y ) / 3;
            
            var d = center.length();
            
            body.mass			+= body.material.density*surfaceArea;
            body.inertia		+= body.material.density*surfaceArea * (d*d) + inertia*body.material.density;
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
    
    function drawPolygon(pylygon, material, position = new Vector(), angle = 0){
        physics.scene.ctx.beginPath();
        for(var vertex of pylygon.getVertices())
        {
            vertex.rotate(angle).add(position);
            physics.scene.ctx.lineTo(vertex.x * physics.scene.zoom, vertex.y * physics.scene.zoom)
        }
        physics.scene.ctx.fillStyle = material.surfaceColor;
        physics.scene.ctx.fill();
        
        // center of mass
        physics.scene.ctx.beginPath();
        physics.scene.ctx.fillStyle="#FFFFFF";
        physics.scene.ctx.fillRect((position.x-1)*physics.scene.zoom, (position.y-1)*physics.scene.zoom, 2*physics.scene.zoom, 2*physics.scene.zoom);
        physics.scene.ctx.fill();
    }
    
    return{
        scene: new Scene(),
        Vector: Vector,
        Material: Material,
        Polygon: Polygon,
        RigidBody: RigidBody
    }
})();