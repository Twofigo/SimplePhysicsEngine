var physics = (function(){

    var Vector = function(x   = 0, y   = 0){
       this.set(x,y);
    }
    Vector.prototype.set = function(x   = 0, y   = 0){
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
    
        this.zoomFactor			= 1.2;
        this.position           = new Vector();
        this.zoom               = false;
       
        this.gravity = new Vector();	
        this.enteties	= [];
        this.rigidBodies	= [];
        this.constraints = [];
    }   
    Scene.prototype.setup = function(canvas){
        if (!this.canvas) this.canvas = canvas;
        if (!this.context) this.ctx = this.canvas.getContext("2d");
  
        this.setSize();
    }
    Scene.prototype.update = function(timestamp = false){
      	var time = this.getTimeDelta(timestamp);
        if (!time) return;
        
        for(var con of this.constraints){
            con.compute();
            con.resolve();
        }
        for(var obj of this.rigidBodies){
            if(obj.gravity) obj.addForce(this.gravity.clone().scale(obj.mass));
            obj.update(time);
        }
        
        for (var k1=0; k1<this.rigidBodies.length; k1++){
            var bodyA = this.rigidBodies[k1];
            for (var k2=k1+1; k2<this.rigidBodies.length; k2++){
                var bodyB = this.rigidBodies[k2];
                collisionTests.testCollision(bodyA,bodyB);
            }		
        }
        
        
        if (this.timestamp !== timestamp) this.update(timestamp);
    }
    Scene.prototype.draw = function(){
        
        this.ctx.clearRect(-this.canvas.width/2, -this.canvas.height/2, this.canvas.width, this.canvas.height);
        for(obj of this.enteties)
        {
            this.drawEntity(obj);
        }
        for(obj of this.rigidBodies)
        {
            this.drawEntity(obj);
        }
        for(obj of this.constraints)
        {
            this.drawConstraint(obj);
        }
    }
    Scene.prototype.setSize = function(){
        var boxInfo = this.canvas.getBoundingClientRect();
        this.canvas.width	= boxInfo.width;
        this.canvas.height	= boxInfo.height;
        
        this.ctx.restore();
        this.position.set(this.canvas.width/2, this.canvas.height/2);
        this.ctx.translate(this.position.x, this.position.y);
        this.ctx.save();
        
        if (boxInfo.width < boxInfo.height)
            this.zoom = this.zoomFactor*boxInfo.width /1000;
        else
            this.zoom = this.zoomFactor*boxInfo.height / 1000;
        
        this.draw();
    }
    Scene.prototype.getTimeDelta = function(timestamp){
        if (!timestamp)
        {
            this.timestamp = false;
            return 10;
        }
        if (!this.timestamp){
            this.timestamp = timestamp;
            return 0;
        }
        var time = timestamp - this.timestamp;
        
        if (time > 100)
        {
            this.timestamp = false;
            return 10;
        }
        
        this.timestamp = timestamp;
        
        return time
    }
    Scene.prototype.compileAll = function(){
        for(obj of this.rigidBodies){
            if (obj.mass !== false) continue;
            obj.compile();
        }
    }
    Scene.prototype.add = function(obj){
        if (obj instanceof RigidBody)
        {
            this.rigidBodies.push(obj);
        }
        else if (obj instanceof Entity)
        {
            this.enteties.push(obj)
        }
        else if (obj instanceof Constraint)
        {
            this.constraints.push(obj)
        }
    }
    Scene.prototype.drawEntity = function(entity, canvas=this.canvas){
        if (entity.geometry instanceof Polygon){
            this.ctx.beginPath();
            for(var vertex of entity.geometry.iterateVertices()){
                vertex.rotate(entity.angle).add(entity.position);
                this.ctx.lineTo(vertex.x * this.zoom, vertex.y * this.zoom)
            }
            this.ctx.fillStyle = entity.material.surfaceColor;
            this.ctx.fill();
        }
        this.drawPoint(entity.position, "white");
    }
    Scene.prototype.drawConstraint = function(constraint, canvas=this.canvas){
        if (constraint instanceof Rope || constraint instanceof StiffRope){
            this.ctx.beginPath();
           
           var p1 = constraint.bodyA.position.clone(
            ).add(constraint.positionA.clone(
            ).rotate(constraint.bodyA.angle))
            var p2 = constraint.bodyB.position.clone(
            ).add(constraint.positionB.clone(
            ).rotate(constraint.bodyB.angle))
            
            this.ctx.moveTo(p1.x * this.zoom, p1.y * this.zoom)
            this.ctx.lineTo(p2.x * this.zoom, p2.y * this.zoom)
            
            this.ctx.strokeStyle = "yellow";
            this.ctx.strokeWidth = 20;
            this.ctx.stroke();
        }
    }
    Scene.prototype.drawPoint = function(position, color="black", size=1){
        this.ctx.beginPath();
        this.ctx.fillStyle="#FFFFFF";
        this.ctx.fillRect((position.x-size)*this.zoom, (position.y-size)*this.zoom, 2*size*this.zoom, 2*size*this.zoom);
        this.ctx.fill();
    }
    Scene.prototype.bodyAtPoint = function(coordinate){
        for (body of this.rigidBodies)
        {
            if (collisionTests.pointInPoly(body, coordinate)) return body;
        }
    }

    var Material = function(){    
        this.density			= 0.1;
        this.staticFriction		= 0.2;
        this.dynamicFriction	= 0.17;
        this.restitution		= 0.2;

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
        var coordinate = new Vector();
            
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
            coordinate.x = this.pointA.x + (t * s1_x);
            coordinate.y = this.pointA.y + (t * s1_y);
            
            return coordinate;
        }
        return false; // No collision
    }
    
    var Polygon = function(vertices = []){
        this.vertices	= vertices;
    }
    Polygon.prototype.clone = function(){	
        var obj = new Polygon();
        for(var vertex of this.iterateVertices())
        {
            obj.vertices.push(vertex);
        }
        return obj;
    }
    Polygon.prototype.setVertices = function(vertices){
        this.vertices = [];
        for (v of vertices){
            this.vertices.push(new Vector(v.x, v.y));
        }
    }
    Polygon.prototype.iterateVertices = function*(){	
        for(var vertex of this.vertices)
        {
            yield vertex.clone();
        }
    }
    Polygon.prototype.iterateEdges = function*(){
        var line = new Line();
        line.pointA=false;
        line.pointB=false;
        var startPoint=	false;
        
        for(var vertex of this.iterateVertices())
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
    Polygon.prototype.moveOrigin = function(offset){
       for (vertex of this.vertices){
           vertex.add(offset);
       }
    }
    
    var Entity = function(position = new Vector(),angle = 0,geometry = false,material = false){
        this.position   = position;
        this.angle      = 0;
        
        this.geometry   = geometry;
        this.material   = material;
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
        if (this.stationary) return;
        
        //linear
        this.velocity.add(impulse.clone().scale(1/this.mass));

        var temp = coordinate.clone(
        ).subtract(this.position);
        this.angularVelocity += temp.cross(impulse) / this.inertia;
    }
    RigidBody.prototype.applyForce = function(coordinate, force){
        if (this.stationary) return;        
        //linear
        this.addForce(force);
        var temp = coordinate.clone(
        ).subtract(this.position);
        this.addTorque(temp.cross(force));
    }
    RigidBody.prototype.getVelocity = function(coordinate){
        var radianA = coordinate.clone(
        ).subtract(this.position);
        return velocityA = this.velocity.clone(
        ).add(radianA.clone().perp().scale(this.angularVelocity).reverse());
    }
    RigidBody.prototype.getInvMass = function(coordinate, normal){ // need to change name
        if(this.stationary) return 0;
        
        var rApn = coordinate.clone(
        ).subtract(this.position 
        ).cross(normal);
        return (1/this.mass) + (rApn * rApn) / this.inertia;
    }
    RigidBody.prototype.addForce = function(force){
        this.force.add(force);
    }
    RigidBody.prototype.addTorque = function(torque){
        this.torque += torque;
    }
    RigidBody.prototype.compile = function() {
        var data;
        if (this.geometry instanceof Polygon) {
            data = compilePolygon(this.geometry, this.material);
        }
        this.mass = data.mass;
        this.inertia = data.inertia;
        this.surfaceArea = data.surfaceArea;
        this.geometry.moveOrigin(data.originOffset);
    }
    
    var Constraint = function(bodyA, positionA, bodyB, positionB){
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.positionA = positionA;
        this.positionB = positionB;
        
        this.normal = new Vector();
        
        this.offset = false;
        this.impulse = false;
        this.force = false;
    }
    Constraint.prototype.compute = function(){}
    Constraint.prototype.resolve = function(){
        if (this.force)
        {
            this.bodyA.applyForce(this.positionA.clone().rotate(this.bodyA.angle).add(this.bodyA.position), this.force);
            this.bodyB.applyForce(this.positionB.clone().rotate(this.bodyB.angle).add(this.bodyB.position), this.force.reverse());
        }
        if (this.impulse)
        {
            this.bodyA.applyImpulse(this.positionA.clone().rotate(this.bodyA.angle).add(this.bodyA.position), this.impulse);
            this.bodyB.applyImpulse(this.positionB.clone().rotate(this.bodyB.angle).add(this.bodyB.position), this.impulse.reverse());
        }
        if (this.offset)
        {
            const percent = 1;
            //this.bodyA.position.add(this.offset.scale(percent));
            this.bodyB.position.add(this.offset.scale(percent).reverse());
        }
        
    }
    
    var Rope = function(bodyA, positionA, bodyB, positionB, length=20, forcePerDist=1){
        Constraint.call(this, bodyA, positionA, bodyB, positionB);
        this.ropeLength = length;
        this.forcePerDist = forcePerDist;
    }
    Rope.prototype = Object.create(Constraint.prototype);
    Rope.prototype.compute = function(){
        this.offset = this.bodyB.position.clone(
        ).add(
        this.positionB.clone(
        ).rotate(this.bodyB.angle)
        ).subtract(
        this.bodyA.position.clone(
        ).add(
        this.positionA.clone(
        ).rotate(this.bodyA.angle)
        )
        );
        
        this.normal = this.offset.clone().normalize();
        
        if(this.offset.length()<this.ropeLength) this.offset.scale(0);
        else this.offset.subtract(this.normal.clone().scale(this.ropeLength)) 
            
        this.force = this.offset.clone().scale(this.forcePerDist);
    }
    
    var StiffRope = function(bodyA, positionA, bodyB, positionB, length=20){
        Constraint.call(this, bodyA, positionA, bodyB, positionB);
        this.ropeLength = length;
    }
    StiffRope.prototype = Object.create(Constraint.prototype);
    StiffRope.prototype.compute = function(){
        this.offset = this.bodyB.position.clone(
        ).add(this.positionB.clone(
        ).rotate(this.bodyB.angle)
        ).subtract(
        this.bodyA.position.clone(
        ).add(this.positionA.clone(
        ).rotate(this.bodyA.angle))
        );
        
        this.normal = this.offset.clone().normalize();
        
        if(this.offset.length()<this.ropeLength) this.offset = false;
        else this.offset.subtract(this.normal.clone().scale(this.ropeLength)) 
        
        if (this.offset)
        {
            var relativeV = this.bodyA.getVelocity(this.positionA
            ).subtract(this.bodyB.getVelocity(this.positionB));
            if (relativeV.dot(this.normal)>0) return;
            
            var totalMass = this.bodyA.getInvMass(this.positionA, this.normal) + this.bodyB.getInvMass(this.positionB, this.normal);
            this.impulse = this.normal.clone(
            ).scale(-relativeV.dot(this.normal)/totalMass);
        }
        else this.impulse = false;
            
    }
    
    var Collision = function Collision(){
        this.bodyA				= false;
        this.bodyB				= false;
        this.normal				= false;
        this.point				= false;
        this.offsetA			= false;
        this.offsetB			= false;
    }
    Collision.prototype.resolve = function(){	
        
        var relativeV = this.bodyA.getVelocity(this.point
        ).subtract(this.bodyB.getVelocity(this.point));
        if (relativeV.dot(this.normal)>0) return;
        
        var totalMass = this.bodyA.getInvMass(this.point, this.normal) + this.bodyB.getInvMass(this.point, this.normal);
        var e = (this.bodyA.material.restitution + this.bodyB.material.restitution)/2;
        var j = -(1+e)*relativeV.dot(this.normal)/totalMass
        var impulse = this.normal.clone(
        ).scale(j);
        
        this.bodyA.applyImpulse(this.point, impulse);
        this.bodyB.applyImpulse(this.point, impulse.reverse());

        //friction
        
        var tangent = relativeV.project(this.normal.clone().perp()).normalize();
        
        var relativeV = this.bodyA.getVelocity(this.point
        ).subtract(this.bodyB.getVelocity(this.point));
        
        var mu = Math.sqrt(
        this.bodyA.material.staticFriction*this.bodyA.material.staticFriction + 
        this.bodyB.material.staticFriction*this.bodyB.material.staticFriction
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
            this.bodyA.material.dynamicFriction*this.bodyA.material.dynamicFriction + 
            this.bodyB.material.dynamicFriction*this.bodyB.material.dynamicFriction
            ));
        }
        
        this.bodyA.applyImpulse(this.point, frictionImpulse);
        this.bodyB.applyImpulse(this.point, frictionImpulse.reverse());
    }
    Collision.prototype.correct = function(){
        const percent = 0.2;
        
        if (this.offsetA)
        {
            this.bodyA.position.add(this.offsetA.scale(percent));
        }
        if (this.offsetB)
        {
            this.bodyB.position.add(this.offsetB.scale(percent));
        }
    }
    
    var CollisionTests = function(){};
    CollisionTests.prototype.testCollision = function(bodyA, bodyB){
        if (bodyA.stationary && bodyB.stationary) return false;
        var collision = this.bodyBody(bodyA,bodyB);
        if (collision){
            collision.resolve();
            collision.correct();
        }
    }
    CollisionTests.prototype.bodyBody = function(bodyA, bodyB){
        return this.polyPoly(bodyA,bodyB);
    }
    CollisionTests.prototype.polyPoly = function(bodyA, bodyB){
        var pointA = false;
        var pointB = false;
        
        main:
        for(var lineA of bodyA.geometry.iterateEdges())
        {
            lineA.rotate(bodyA.angle).add(bodyA.position);
            for(var lineB of bodyB.geometry.iterateEdges())
            {
                lineB.rotate(bodyB.angle).add(bodyB.position);
                var coordinate = lineA.intersect(lineB);
                if (!coordinate) continue; 
                if (!pointA)pointA = coordinate
                else {
                    pointB = coordinate;
                    break main;
                }
            }
        }
        
        if (!pointA || !pointB) return false;
        
        var collision = new Collision();
        collision.bodyA = bodyA;
        collision.bodyB = bodyB;
        
        collision.normal = pointB.clone(
        ).subtract(pointA
        ).normalize(
        ).perp();
         
        if (collision.bodyA.position.clone(
        ).subtract(pointA
        ).dot(collision.normal
        )<0)
        {
            collision.normal.reverse();
        }
        
        var totalOffset = 0;
        collision.point = new Vector();
        for (var obj = collision.bodyA;; obj= collision.bodyB)
        {
            var maxOffset = false;
            var center = obj.position.clone(
            ).subtract(pointA
            ).project(collision.normal)
            
            for(var vertex of obj.geometry.iterateVertices())
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
            if (obj===collision.bodyA) {
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
    CollisionTests.prototype.pointInPoly = function(body, coordinate){
        var lineA = new Line();
        lineA.pointA = coordinate.clone();
        lineA.pointB = body.position.clone();
        
        for(var lineB of body.geometry.iterateEdges())
        {
            lineB.rotate(body.angle).add(body.position);
            if (lineA.intersect(lineB)) return false; 
        }
        return true
    }
    var collisionTests = new CollisionTests();    
    
    function compilePolygon(geometry, material){
        var data = {
        "mass":0,
        "inertia":0,
        "surfaceArea":0,
        "originOffset": new Vector()
        };
        
        var originOffset = new Vector();
        for( line of geometry.iterateEdges() )
        {
            // relative coordinate !!!
            
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
            
            data.mass			+= material.density*surfaceArea;
            data.inertia		+= material.density*surfaceArea * (d*d) + inertia*material.density;
            data.surfaceArea	+= surfaceArea;
            data.originOffset.add(center);
        }
        return data;
    }
    
    // extended -------------------------------------------------------------------------------------------------
    
    var InputTracker = function(){
        this.canvas = false;
        this.disabled = true;
        this.canvasOffset = new Vector();
        this.cursorPosition = new Vector();
        this.cursorPositionDelta = new Vector();
        this.cursorVelocity = new Vector();
        this.timestamp = false;
        this.listeners = {};
        
        this.addListener("m1");
        this.addListener("m2");
        this.addListener("move");
    }
    InputTracker.prototype.set = function(canvas){
        if (this.canvas) return;
        this.canvas = canvas;
        
        var self = this;
        this.canvas.addEventListener("mousemove", function(event){self.cursorMove(event)});
        this.canvas.addEventListener("mousedown", function(event){self.cursorStart(event)});
        this.canvas.addEventListener("mouseup", function(event){self.cursorEnd(event)});
        //this.canvas.addEventListener("mouseleave", function(event){self.cursorEnd(event)});
        //this.canvas.addEventListener("mouseenter", function(event){self.cursorEnd(event)});
        document.body.addEventListener("keydown", function(event){self.keyStart(event)});
        document.body.addEventListener("keyup", function(event){self.keyEnd(event)});
    }
    InputTracker.prototype.unset = function(){
        return; // WIP
    }
    InputTracker.prototype.notify = function(key, data=undefined){
        if (!this.listeners[""+key]) return
        
        for (f of this.listeners[""+key].callouts){
            f(data);
        }
    }
    InputTracker.prototype.addListener = function(key, func){
        if (!this.listeners[""+key]){
            this.listeners[""+key] = {state:false, callouts:[]};
        }
        if (func) this.listeners[""+key].callouts.push(func);
    }
    InputTracker.prototype.removeListener = function(key, func) {
        if (!this.listeners[""+key]) return
        var index = this.listeners[""+key].callouts.indexOf(func);
        if(index > -1) {
            this.listeners[""+key].callouts.splice(index, 1);
        }
    }
    InputTracker.prototype.enable = function(){
        this.disabled = false;
    }
    InputTracker.prototype.disable = function(){
        this.disabled = true;
    }
    InputTracker.prototype.getKeyState = function(key){
        if(!this.listeners[""+key]) return false;
        return this.listeners[""+key].state; 
    }
    InputTracker.prototype.keyIsSet = function(key){
        if(!this.listeners[""+key]) return false;
        if(this.listeners[""+key].callouts.length === 0) return false;
        return true;
    }
    InputTracker.prototype.keyStart = function(event){
        if(this.disabled)return;
        
        var key = event.keyCode; 
        if(!this.keyIsSet(key)) return;
        if(this.getKeyState(key)) return;
        this.listeners[""+key].state = true;
        tthis.notify(key, {state:true});
    }
    InputTracker.prototype.keyEnd = function(event){
        if(this.disabled)return;
        
        var key = event.keyCode;
        if(!this.keyIsSet(key)) return;
        if(!this.getKeyState(key)) return;
        this.listeners[""+key].state = false;
        this.notify(key, {state:false});
    }
    InputTracker.prototype.cursorMove = function(event){
       if(this.disabled)return;
       
       this.calcCursorVelocity(event);
       var data = {
       state: true,
       position: this.cursorPosition.clone(),
       positionDelta: this.cursorPositionDelta.clone(),
       velocity: this.cursorVelocity.clone()};
       
       this.notify("move", data);
    }
    InputTracker.prototype.cursorStart = function(event){
        if(this.disabled)return;
       
        var key = event.buttons;
        if (key === 3){
            if (this.getKeyState("m1") && this.getKeyState("m2"))return;
            if (this.getKeyState("m2")) key = 1;
            else if (this.getKeyState("m1")) key = 2;  
        }
        key = "m"+key;
        
        if(!this.keyIsSet(key)) return;
        if(this.getKeyState(key)) return;
        
        this.listeners[""+key].state = true;
        this.calcCursorVelocity(event);
        
        var data = {
        state: true,
        position: this.cursorPosition.clone(),
        positionDelta: this.cursorPositionDelta.clone(),
        velocity: this.cursorVelocity.clone()};
        
        this.notify(key, data)
    }
    InputTracker.prototype.cursorEnd = function(event){
        if(this.disabled)return;

        var key = event.buttons;
        if (!this.getKeyState("m1") && !this.getKeyState("m2"))return;
        
        if (key){
            if (key === 2) key = 1
            else if (key === 1) key = 2 
        }
        else if (!key){
            if (this.getKeyState("m2")) key = 2;
            else if (this.getKeyState("m1")) key = 1; 
        }
        key = "m"+key;
        
        if(!this.keyIsSet(key)) return;
        if(!this.getKeyState(key)) return;
        
        this.listeners[""+key].state = false;
        this.calcCursorVelocity(event);
        
        var data = {
        state: false,
        position: this.cursorPosition.clone(),
        positionDelta: this.cursorPositionDelta.clone(),
        velocity: this.cursorVelocity.clone()};
        
        this.notify(key, data);
    }
    InputTracker.prototype.getCursorPos = function(event){
       var boxInfo = this.canvas.getBoundingClientRect();
       
       //event.touches[0].clientX;
       //event.touches[0].clientY;
       return new Vector(
       event.clientX-boxInfo.left,
       event.clientY-boxInfo.top
       );
    }
    InputTracker.prototype.calcCursorVelocity = function(event){
       var position = this.getCursorPos(event);
       
       this.cursorPositionDelta=this.cursorPosition.subtract(position);
       this.cursorPosition = position;
       
       if(!this.timestamp || timestamp>=100){
           this.cursorVelocity.set(0,0);
           this.timestamp = event.timestamp;
           return;
       }
       this.cursorVelocity.scale(1/3
       ).add(this.curosrPositionDelta.clone(
       ).scale(1000/event.timeStamp-this.timestamp
       ).scale(2/3)
       );
    }
    
    
    
    return {
        InputTracker: InputTracker,
        Scene: Scene,
        Vector: Vector,
        Material: Material,
        Polygon: Polygon,
        //PivotPoint: PivotPoint,3
        Rope: Rope,
        StiffRope: StiffRope,
        RigidBody: RigidBody
    };
})();