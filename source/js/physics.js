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
    
        this.zoomFactor			= 1.5;
        this.zoom               = false; 
       
        this.gravity = new Vector();	
        this.enteties	= [];
        this.rigidBodies	= [];
    }   
    Scene.prototype.setup = function(canvas){
        if (!this.canvas) this.canvas = canvas;
        if (!this.context) this.ctx = this.canvas.getContext("2d");
  
        this.setSize();
    }
    Scene.prototype.update = function(timestamp = false){
      	var time = this.getTimeDelta(timestamp);
        if (!time) return;
        
        for(var obj of this.rigidBodies)
        {
            obj.addForce(this.gravity.clone().scale(obj.mass));
            obj.update(time);
        }
        
        // collide others
        collisionTests.testAll(this.rigidBodies);
        
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
    }
    Scene.prototype.setSize = function(){
        var boxInfo = this.canvas.getBoundingClientRect();
        this.canvas.width	= boxInfo.width;
        this.canvas.height	= boxInfo.height;
        
        this.ctx.restore();
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
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
    Scene.prototype.drawPoint = function(position, color="black", size=1){
        this.ctx.beginPath();
        this.ctx.fillStyle="#FFFFFF";
        this.ctx.fillRect((position.x-size)*this.zoom, (position.y-size)*this.zoom, 2*size*this.zoom, 2*size*this.zoom);
        this.ctx.fill();
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
        
        var e = (this.objA.material.restitution + this.objB.material.restitution)/2;
         
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
    collisionTests.prototype.testAll = function(rigidBodies){
        for (var k1=0; k1<rigidBodies.length; k1++){
            var bodyA = rigidBodies[k1];
            for (var k2=k1+1; k2<rigidBodies.length; k2++){
                var bodyB = rigidBodies[k2];
                if (bodyA.stationary && bodyB.stationary) continue;
                var collision = collisionTests.polyPoly(bodyA,bodyB);
                if (collision){
                    collision.resolveCollision();
                    collision.correctCollision();
                }
            }		
        }
    }
    collisionTests.prototype.polyPoly = function(bodyA, bodyB){
        var pointA = false;
        var pointB = false;
        
        main:
        for(var lineA of bodyA.geometry.iterateEdges())
        {
            lineA.rotate(bodyA.angle).add(bodyA.position);
            for(var lineB of bodyB.geometry.iterateEdges())
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
    collisionTests.prototype.pointInPoly = function(body, point){
        var lineA = new Line();
        lineA.pointA = point.clone();
        lineB.pointB = body.position.clone();
        
        for(var lineB of body.geometry.iterateEdges())
        {
            lineB.rotate(body.angle).add(body.position);
            if (lineA.intersect(lineB)) return true; 
        }
    }
    collisionTests = new collisionTests();    
    
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
        this.cursorVelocity = new Vector();
        this.timestamp = false;
        
        this.listeners = {};
    }
    InputTracker.prototype.set = function(canvas){
        if (this.canvas) return;
        this.canvas = canvas;
        
        var self = this;
        this.canvas.addEventListener("mousemove", function(event){self.cursorMove(event)});
        this.canvas.addEventListener("mousedown", function(event){self.cursorStart(event)});
        this.canvas.addEventListener("mouseup", function(event){self.cursorEnd(event)});
        this.canvas.addEventListener("mouseleave", function(event){self.cursorEnd(event)});
        this.canvas.addEventListener("mouseenter", function(event){self.cursorEnd(event)});
        document.body.addEventListener("keydown", function(event){self.keyStart(event)});
        document.body.addEventListener("keyup", function(event){self.keyEnd(event)});
    }
    InputTracker.prototype.unset = function(){
        return; // WIP
    }
    InputTracker.prototype.call = function(key, data=undefined){
        if (!this.listeners[""+key]) return
        
        for (f of this.listeners[""+key].callouts){
            f(data);
        }
    }
    InputTracker.prototype.addListener = function(key, func){
        if (!this.listeners[""+key]){
            this.listeners[""+key] = {state:false, callouts:[]};
        }
        this.listeners[""+key].callouts.push(func);
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
    InputTracker.prototype.cursorMove = function(event){
        if(this.disabled)return;
        
       var data = {
       position: new Vector(),
       positionDelta: new Vector(),
       velocity: new Vector()};
       
       var boxInfo = this.canvas.getBoundingClientRect();
       
       //event.touches[0].clientX;
       //event.touches[0].clientY;
       data.position.x=event.clientX-boxInfo.left;
       data.position.y=event.clientY-boxInfo.top;
       data.positionDelta=this.cursorPosition.subtract(data.position);
       this.cursorPosition = data.position.clone();
       data.velocity = this.cursorVelocity.scale(1/3
       ).add(data.positionDelta.clone(
       ).scale(1000/event.timeStamp-this.timestamp
       ).scale(2/3)
       );
       this.cursorVelocity = data.velocity.clone();
       
       this.call("move", data);
    }
    InputTracker.prototype.cursorStart = function(event){
        if(this.disabled)return;
        
        this.cursorMove(event);
        var key = "m"+event.buttons;
        if(!this.listeners[""+key]) return;
        if(this.listeners[""+key].state) return;
        this.listeners[""+key].state = true;
        this.call(key, true)
    }
    InputTracker.prototype.cursorEnd = function(event){
        if(this.disabled)return;
        
        this.cursorMove(event);
        var key = "m"+event.buttons;
        if(!this.listeners[""+key]) return;
        if(!this.listeners[""+key].state) return;
        this.listeners[""+key].state = false;
        this.call(key, false)
    }
    InputTracker.prototype.keyStart = function(event){
        if(this.disabled)return;
        
        var key = event.keyCode;
        if(!this.listeners[""+key]) return;
        if(this.listeners[""+key].state) return;
        this.listeners[""+key].state = true;
        this.call(key, true)
    }
    InputTracker.prototype.keyEnd = function(event){
        if(this.disabled)return;
        
        var key = event.keyCode;
        if(!this.listeners[""+key]) return;
        if(!this.listeners[""+key].state) return;
        this.listeners[""+key].state = false;
        this.call(key, false)
    }
    
    
    
    return{
        InputTracker: InputTracker,
        Scene: Scene,
        Vector: Vector,
        Material: Material,
        Polygon: Polygon,
        RigidBody: RigidBody
    }
})();