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
        if (isFinite(c)){
            this.x = c * vector.x;
            this.y = c * vector.y;
        }
        else {
          this.scale(0);
        }

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
    Vector.prototype.translate = function(normal){
        var x = this.dot(normal);
        var y = this.dot(normal.clone().perp());
        this.x = x;
        this.y = y;

        return this;
    }
    Vector.prototype.translateRev = function(normal){
        var v = normal.clone(
        ).scale(this.x
        ).add(normal.clone(
        ).perp(
        ).scale(this.y)
        );

        this.x = v.x;
        this.y = v.y;

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
        this.timeStamp      = false;

        this.zoomFactor			= 1.2;
        this.position           = new Vector();
        this.zoom               = false;

        this.gravity = new Vector();
        this.enteties	= [];
        this.rigidBodies	= [];
        this.constraints = [];
        this.collisions = [];
    }
    Scene.prototype.setup = function(canvas){
        if (!this.canvas) this.canvas = canvas;
        if (!this.context) this.ctx = this.canvas.getContext("2d");

        this.setSize();

    }
    Scene.prototype.add = function(obj){
        if (obj instanceof RigidBody)
        {
            this.rigidBodies.push(obj);
        }
        else if (obj instanceof Constraint)
        {
            this.constraints.push(obj)
        }
    }
    Scene.prototype.update = function(timeStamp = false){
        if(!this.timeStamp || timeStamp-this.timeStamp > 100){
            for(var body of this.rigidBodies){
                body.setTimeStamp(timeStamp);
            }
            this.timeStamp = timeStamp;
            return;
        }
        this.timeStamp = timeStamp;

        for (var obj of this.rigidBodies){
            if (obj.geometry.inv_mass==0) continue;
            obj.setAcceleration(this.gravity.clone(), timeStamp);
            obj.setAngAcceleration(0, timeStamp);
        }
        // collisions
        for(var con of this.constraints){
            con.compute(timeStamp);
            con.resolve(timeStamp);
        }

        this.collisions = [];
        for (var k1=0; k1<this.rigidBodies.length; k1++){
            for (var k2=k1+1; k2<this.rigidBodies.length; k2++){
                if(!this.rigidBodies[k1].geometry.inv_mass && !this.rigidBodies[k2].geometry.inv_mass) continue;
                var collision = collisionTests.BodyBody(this.rigidBodies[k1],this.rigidBodies[k2], timeStamp);
                if (collision){
                    this.collisions.push(collision);
                }
            }
        }
        this.collisions.sort(function(a,b){return a.timeStamp - b.timeStamp});
        for(var col of this.collisions){
            col.correct();
        }
        for(var col of this.collisions){
            col.resolve();
        }
    }
    Scene.prototype.draw = function(timeStamp){

        this.ctx.setTransform(this.zoom,0,0,this.zoom,this.canvas.width*0.5,this.canvas.height*0.5);
        this.ctx.translate(this.position.x, this.position.y);

        this.ctx.clearRect(this.position.x - this.canvas.width*0.5/this.zoom,
        this.position.y  - this.canvas.height*0.5/this.zoom,
        this.canvas.width/this.zoom, this.canvas.height/this.zoom);

        for(obj of this.enteties){
            this.drawEntity(obj, timeStamp);
        }
        for(obj of this.rigidBodies){
            this.drawEntity(obj, timeStamp);
        }
        for(obj of this.constraints){
            this.drawConstraint(obj, timeStamp);
        }
    }
    Scene.prototype.setZoom = function(zoom){
        if (zoom){
            this.zoomFactor = zoom;
        }

        if (this.canvas.width < this.canvas.height)
            this.zoom = this.zoomFactor*this.canvas.width / 1000;
        else
            this.zoom = this.zoomFactor*this.canvas.height / 1000;

    }
    Scene.prototype.setPosition = function(position){
        if (position){
            this.position = position.clone()
        }
    }
    Scene.prototype.setSize = function(){
        var boxInfo = this.canvas.getBoundingClientRect();
        this.canvas.width	= boxInfo.width;
        this.canvas.height	= boxInfo.height;

        this.setZoom();

        this.draw(this.timeStamp);
    }
    Scene.prototype.zoom = function(change){
        this.setZoom(this.zoomFactor+change);
        this.draw(this.timeStamp);
    }
    Scene.prototype.move = function(vector){
        this.setPosition(this.position.add(vector));
        this.draw(this.timeStamp);
    }
    Scene.prototype.move = function(x, y){
        this.move(new Vector(x, y));
    }
    Scene.prototype.compileAll = function(){
        for(obj of this.rigidBodies){
            if (obj.geometry.mass) continue;
            obj.compile();
        }
    }
    Scene.prototype.coordinateConvert = function(coordinate){
        return coordinate.clone().subtract({x:this.canvas.width*0.5, y:this.canvas.height*0.5}
        ).scale(1/this.zoom
        ).subtract(this.position);
    }
    Scene.prototype.bodyAtPoint = function(coordinate, timeStamp){
        for (body of this.rigidBodies){
            if (collisionTests.pointInGeometry(body.geometry, body.getPosition(timeStamp), body.getAngle(timeStamp), coordinate)) return body;
        }
    }

    Scene.prototype.drawEntity = function(entity, timeStamp){
        var position = entity.getPosition(timeStamp)
        var angle = entity.getAngle(timeStamp);
        for (var comp of entity.geometry.iterateComponents()){
            if (comp.obj instanceof Polygon){
                var p = position.clone().add(comp.position.clone(
                ).rotate(angle)
                );
                var a = comp.angle+angle;
                this.drawPolygon(comp.obj, p, a, entity.geometry.texture)
            }
        }
        this.drawPoint(position, "white");
    }
    Scene.prototype.drawConstraint = function(constraint, timeStamp){
        if (constraint instanceof Rope || constraint instanceof ElasticRope){
            this.ctx.beginPath();

            var p1 = constraint.bodyA.getPosition(timeStamp
            ).add(constraint.positionA.clone(
            ).rotate(constraint.bodyA.getAngle(timeStamp))
            );

            var p2 = constraint.bodyB.getPosition(timeStamp
            ).add(constraint.positionB.clone(
            ).rotate(constraint.bodyB.getAngle(timeStamp))
            );

            this.ctx.moveTo(p1.x, p1.y)
            this.ctx.lineTo(p2.x, p2.y)

            this.ctx.strokeStyle = "yellow";
            this.ctx.strokeWidth = 20;
            this.ctx.stroke();
        }
    }
    Scene.prototype.drawPolygon = function(polygon, position, angle, texture){
        this.ctx.beginPath();
        for(var vertex of polygon.iterateVertices()){
            vertex.rotate(angle
            ).add(position);
            this.ctx.lineTo(vertex.x, vertex.y)
        }
        this.ctx.fillStyle = texture.surfaceColor;
        this.ctx.fill();
    }
    Scene.prototype.drawPoint = function(position, color="black", size=1){
        this.ctx.beginPath();
        this.ctx.fillStyle=color;
        this.ctx.fillRect(position.x-size, position.y-size, 2*size*this.zoom, 2*size*this.zoom);
        this.ctx.fill();
    }

    var Material = function(){
        this.density			= false;
        this.staticFriction		= false;
        this.dynamicFriction	= false;
        this.restitution		= false;
    }

    var Texture = function(){
        this.texture		= false;
        this.textureSize	= false;
        this.surfaceColor	= false;
        this.borderWidth    = 0;
        this.borderColor    = false;
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

    var Geometry = function(texture=default_texture, material=default_material){
        this.components = [];
        this.texture = texture;

        this.material = material;
        this.inertia  = 0;
        this.mass = 0;
        this.inv_mass = 0;
        this.inv_inertia = 0;
        this.surfaceArea  = 0;
    }
    Geometry.prototype.addComponent = function(component, x=0, y=0, angle=0){
        var data = {
          "obj": component,
          "position": new Vector(x,y),
          "angle":angle
        }
        this.components.push(data);
    }
    Geometry.prototype.setTexture = function(texture){
        this.texture = texture;
    }
    Geometry.prototype.iterateComponents = function*(){
        for(var comp of this.components){
            yield comp;
        }
    }
    Geometry.prototype.moveOrigin = function(offset){
        for(var comp of this.components){
            comp.position.subtract(offset);
        }
    }
    Geometry.prototype.compile = function() {
        var data = compiler.compileGeometryAttributes(this);

        this.mass = data.mass;
        this.inertia = data.inertia;
        this.inv_mass = 1/data.mass;
        this.inv_inertia = 1/data.inertia;
        this.surfaceArea = data.surfaceArea;
        this.moveOrigin(data.offset);
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
    Polygon.prototype.rotate = function(angle){
       for (vertex of this.vertices){
           vertex.rotate(angle);
       }
    }

 /*
    var Entity = function(geometry = false){
        this.position   = new Vector();
        this.angle      = 0;

        this.geometry   = geometry;
    }
    Entity.prototype.setPosition = function(x=0, y=0, angle=0){
        this.position.set(x,y);
        this.angle = angle;
    }
 */
 
    var RigidBody = function(geometry = false){
        this.geometry   = geometry;
        this.changeCue    = [];
        
            var snapshot = {
            timeStamp: 0,
            position: new Vector(),
            velocity: new Vector(),
            acceleration: new Vector(),
            angle: 0,
            angVelocity: 0,
            angAcceleration: 0
            }
            this.changeCue.push(snapshot);
    }
    RigidBody.prototype.setTimeStamp = function(timeStamp){
        this.timeStamp = timeStamp;
    }
    RigidBody.prototype.setStartPosition = function(x=0, y=0, angle=0){
      this.setPosition(new Vector(x, y), 0);
      this.setAngle(angle, 0);
    }
    RigidBody.prototype.setStartVelocity = function(vX=0, vY=0, vAngle=0){
      this.setVelocity(new Vector(vX, vY), 0);
      this.setAngVelocity(vAngle, 0);
    }
    
    RigidBody.prototype.update = function(timeStamp){
        return;
        if(!this.timeStamp)this.timeStamp = timeStamp;
        var time = (timeStamp - this.timeStamp) / 1000;
        if (!time) return;

        this.position = this.getPosition(timeStamp);
        this.velocity = this.getVelocity(timeStamp);
        this.angle = this.getAngle(timeStamp);
        this.angVelocity = this.getAngVelocity(timeStamp);
        // position
        this.setTimeStamp(timeStamp);
    }
    RigidBody.prototype.getPosition = function(timeStamp){
        var k;
        for (k = this.changeCue.length-1; k>=0 && this.changeCue[k].timeStamp>timeStamp;k--);
        var snapshot = this.changeCue[k];
        var time = (timeStamp - snapshot.timeStamp) / 1000;
        
        var position = snapshot.position.clone();
        position.add(snapshot.velocity.clone().scale(time));
        position.add(snapshot.acceleration.clone().scale(time*time*0.5));       
            
        return position;
    }
    RigidBody.prototype.getVelocity = function(timeStamp){
        var k;
        for (k = this.changeCue.length-1; k>=0 && this.changeCue[k].timeStamp>timeStamp;k--);
        var snapshot = this.changeCue[k];
        var time = (timeStamp - snapshot.timeStamp) / 1000;
        
        var velocity = snapshot.velocity.clone();
        velocity.add(snapshot.acceleration.clone().scale(time));

        return velocity;
    }
    RigidBody.prototype.getAcceleration = function(timeStamp){
        var k;
        for (k = this.changeCue.length-1; k>=0 && this.changeCue[k].timeStamp>timeStamp;k--);
        var snapshot = this.changeCue[k];
        var time = (timeStamp - snapshot.timeStamp) / 1000;
        
        var acceleration = snapshot.acceleration.clone();

        return acceleration;
    }
    RigidBody.prototype.getAngle = function(timeStamp){
        var k;
        for (k = this.changeCue.length-1; k>=0 && this.changeCue[k].timeStamp>timeStamp;k--);
        var snapshot = this.changeCue[k];
        var time = (timeStamp - snapshot.timeStamp) / 1000;
        
        var angle = snapshot.angle;
        angle+=snapshot.angVelocity*time;
        angle+=snapshot.angAcceleration*time*time*0.5;
        angle = loopRadian(angle);

        return angle;
    }
    RigidBody.prototype.getAngVelocity = function(timeStamp){
        var k;
        for (k = this.changeCue.length-1; k>=0 && this.changeCue[k].timeStamp>timeStamp;k--);
        var snapshot = this.changeCue[k];
        var time = (timeStamp - snapshot.timeStamp) / 1000;

        var angVelocity = snapshot.angVelocity;
        angVelocity += snapshot.angAcceleration*time;

        return angVelocity;
    }
    RigidBody.prototype.getAngAcceleration = function(timeStamp){
        var k;
        for (k = this.changeCue.length-1; k>=0 && this.changeCue[k].timeStamp>timeStamp;k--);
        var snapshot = this.changeCue[k];
        var time = (timeStamp - snapshot.timeStamp) / 1000;

        var angAcceleration = snapshot.angAcceleration;

        return angAcceleration;
    }
    
    RigidBody.prototype.getVelocityInPoint = function(coordinate, timeStamp){
        var radian = coordinate.clone(
        ).subtract(this.getPosition(timeStamp));

        var velocity = this.getVelocity(timeStamp);
        velocity.add(radian.clone(
        ).perp(
        ).reverse(
        ).scale(this.getAngVelocity(timeStamp)
        ));

        return velocity;
    }
    RigidBody.prototype.getInvMassInPoint = function(coordinate, normal, timeStamp){
        var rad = coordinate.clone(
        ).subtract(this.getPosition(timeStamp)
        ).cross(normal);
        var inv_mass = this.geometry.inv_mass + (rad * rad) * this.geometry.inv_inertia;

        return inv_mass;
    }
    RigidBody.prototype.getTimeForDist = function(distance, reverse = false){
        return getTimeForDist(this.velocity, this.acceleration, distance, reverse);
    }
    
    RigidBody.prototype.createSnapshot = function(timeStamp){
        while(this.changeCue.length>1 && this.changeCue[this.changeCue.length-1].timeStamp > timeStamp){
            this.changeCue.splice(-1,1);
        }
        
        if (this.changeCue[this.changeCue.length-1].timeStamp != timeStamp){
            var snapshot = {
                timeStamp: timeStamp,
                position: this.getPosition(timeStamp),
                velocity: this.getVelocity(timeStamp),
                acceleration: this.getAcceleration(timeStamp),
                angle: this.getAngle(timeStamp),
                angVelocity: this.getAngVelocity(timeStamp),
                angAcceleration: this.getAngAcceleration(timeStamp)
            }
            this.changeCue.push(snapshot);
        }
    }
    RigidBody.prototype.setPosition = function(position, timeStamp){
        this.createSnapshot(timeStamp)
        this.changeCue[this.changeCue.length-1].position = position.clone();
    }
    RigidBody.prototype.setVelocity = function(velocity, timeStamp){
        this.createSnapshot(timeStamp);
        this.changeCue[this.changeCue.length-1].velocity = velocity.clone();
    }
    RigidBody.prototype.setAcceleration = function(acceleration, timeStamp){
        this.createSnapshot(timeStamp);
        this.changeCue[this.changeCue.length-1].acceleration = acceleration.clone();
    }
    RigidBody.prototype.setAngle = function(angle, timeStamp){
        this.createSnapshot(timeStamp);
        this.changeCue[this.changeCue.length-1].angle = angle;
    }
    RigidBody.prototype.setAngVelocity = function(angVelocity, timeStamp){
        this.createSnapshot(timeStamp);
        this.changeCue[this.changeCue.length-1].angVelocity = angVelocity;
    }
    RigidBody.prototype.setAngAcceleration = function(angAcceleration, timeStamp){
        this.createSnapshot(timeStamp);
        this.changeCue[this.changeCue.length-1].angAcceleration = angAcceleration;
    }
    RigidBody.prototype.addPosition = function(position, timeStamp){
        this.createSnapshot(timeStamp);
        this.changeCue[this.changeCue.length-1].position.add(position);
    }
    RigidBody.prototype.addVelocity = function(velocity, timeStamp){
        this.createSnapshot(timeStamp);
        this.changeCue[this.changeCue.length-1].velocity.add(velocity);
    }
    RigidBody.prototype.addAcceleration = function(acceleration, timeStamp){
        this.createSnapshot(timeStamp);
        this.changeCue[this.changeCue.length-1].acceleration.add(acceleration);
    }
    RigidBody.prototype.addAngle = function(angle, timeStamp){
        this.createSnapshot(timeStamp);
        this.changeCue[this.changeCue.length-1].angle+=angle;
    }
    RigidBody.prototype.addAngVelocity = function(angVelocity, timeStamp){
        this.createSnapshot(timeStamp);
        this.changeCue[this.changeCue.length-1].angVelocity+=angVelocity;
    }
    RigidBody.prototype.addAngAcceleration = function(angAcceleration, timeStamp){
        this.createSnapshot(timeStamp);
        this.changeCue[this.changeCue.length-1].angAcceleration+=angAcceleration;
    }

    RigidBody.prototype.applyImpulse = function(coordinate, impulse, timeStamp){
        if (!this.geometry.inv_mass) return;

        var velocity = impulse.clone().scale(this.geometry.inv_mass)
        this.addVelocity(velocity, timeStamp);

        var radian = coordinate.clone(
        ).subtract(this.getPosition(timeStamp));

        var angVelocity = radian.cross(impulse) * this.geometry.inv_inertia;
        this.addAngVelocity(angVelocity, timeStamp);
    }
    RigidBody.prototype.applyForce = function(coordinate, force, timeStamp){
        if (!this.geometry.inv_mass) return;
        
        var acceleration = force.clone().scale(this.geometry.inv_mass)
        this.addAcceleration(acceleration, timeStamp);
        
        var radian = coordinate.clone(
        ).subtract(this.getPosition(timeStamp));
        
        var angAcceleration = radian.cross(force) * this.geometry.inv_inertia;
        this.addAngAcceleration(angAcceleration, timeStamp);
    }
 

    var Constraint = function(bodyA, positionA, bodyB, positionB){
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.positionA = positionA;
        this.positionB = positionB;
    }
    Constraint.prototype.compute = function(timeStamp){}
    Constraint.prototype.resolve = function(timeStamp){}

    
    var Joint = function(bodyA, positionA, bodyB, positionB){
        Constraint.call(this, bodyA, positionA, bodyB, positionB);

        this.normal = new Vector();
        this.offset = false;
    }
    Joint.prototype = Object.create(Constraint.prototype);
    Joint.prototype.compute = function(timeStamp){
        this.offset = this.bodyB.getPosition(timeStamp
        ).add(this.positionB.clone(
        ).rotate(this.bodyB.getAngle(timeStamp)
        ));
        this.offset.subtract(
        this.bodyA.getPosition(timeStamp
        ).add(this.positionA.clone(
        ).rotate(this.bodyA.getAngle(timeStamp)
        )));

        this.normal = this.offset.clone().normalize();
    }
    Joint.prototype.resolve = function(timeStamp){
        if (this.offset.squareLength() == 0) return

        var pointA = this.positionA.clone(
        ).rotate(this.bodyA.getAngle(timeStamp)
        ).add(this.bodyA.getPosition(timeStamp)
        );
        var pointB = this.positionB.clone(
        ).rotate(this.bodyB.getAngle(timeStamp)
        ).add(this.bodyB.getPosition(timeStamp)
        );

        var relativeV = this.bodyA.getVelocityInPoint(pointA, timeStamp
        ).subtract(this.bodyB.getVelocityInPoint(pointB, timeStamp));

        var invMssA = this.bodyA.getInvMassInPoint(pointA, this.normal, timeStamp);
        var invMssB = this.bodyB.getInvMassInPoint(pointB, this.normal, timeStamp);
        var totalMass = invMssA + invMssB;
        if (!totalMass) return;
        var j = -1.2*relativeV.dot(this.normal)/totalMass
        var impulse = this.normal.clone(
        ).scale(j);

        this.bodyA.applyImpulse(pointA, impulse, timeStamp);
        this.bodyB.applyImpulse(pointB, impulse.reverse(), timeStamp);

        // offsetfix
        this.bodyA.addPosition(this.offset.clone().scale(invMssA/totalMass), timeStamp);
        this.bodyB.addPosition(this.offset.clone().scale(-invMssB/totalMass), timeStamp);
    }

    var ElasticJoint = function(bodyA, positionA, bodyB, positionB, stiffness=200){
        Joint.call(this, bodyA, positionA, bodyB, positionB);
        this.stiffness = stiffness;
    }
    ElasticJoint.prototype = Object.create(Joint.prototype);
    ElasticJoint.prototype.compute = function(timeStamp){
        Joint.prototype.compute.call(this, timeStamp);
    }
    ElasticJoint.prototype.resolve = function(timeStamp){
        if (this.offset.squareLength() == 0) return

        var pointA = this.positionA.clone(
        ).rotate(this.bodyA.getAngle(timeStamp)
        ).add(this.bodyA.getPosition(timeStamp)
        );
        var pointB = this.positionB.clone(
        ).rotate(this.bodyB.getAngle(timeStamp)
        ).add(this.bodyB.getPosition(timeStamp)
        );

        var force = this.offset.clone().scale(this.stiffness);

        this.bodyA.applyForce(pointA, force, timeStamp);
        this.bodyB.applyForce(pointB, force.reverse(), timeStamp);
    }

    var Rope = function(bodyA, positionA, bodyB, positionB, length=200){
        Joint.call(this, bodyA, positionA, bodyB, positionB);
        this.ropeLength = length;
    }
    Rope.prototype = Object.create(Constraint.prototype);
    Rope.prototype = Object.create(Joint.prototype);
    Rope.prototype.compute = function(timeStamp){
        Joint.prototype.compute.call(this, timeStamp);

        if(this.offset.length()<this.ropeLength) this.offset.scale(0);
        else this.offset.subtract(this.normal.clone().scale(this.ropeLength))
    }
    Rope.prototype.resolve = function(timeStamp){
        Joint.prototype.resolve.call(this, timeStamp);
    }

    var ElasticRope = function(bodyA, positionA, bodyB, positionB, length){
        Rope.call(this, bodyA, positionA, bodyB, positionB, length);
        this.stiffness = stiffness;
    }
    ElasticRope.prototype = Object.create(Rope.prototype);
    ElasticRope.prototype = Object.create(ElasticJoint.prototype);
    ElasticRope.prototype.compute = function(timeStamp){
        Rope.prototype.compute.call(this, timeStamp);
    }
    ElasticRope.prototype.resolve = function(timeStamp){
        ElasticJoint.prototype.resolve.call(this, timeStamp);
    }
    
    var Collision = function Collision(){
        this.bodyA				= false;
        this.bodyB				= false;
        this.normal				= false;
        this.point				= false;
        this.offset			  = false;

        this.timeStamp    = false;
    }
    Collision.prototype.correct = function(){
      if (!this.offset) return false;

      var velocityA = Math.abs(this.bodyA.getVelocityInPoint(this.point, this.timeStamp).dot(this.normal));
      var velocityB = Math.abs(this.bodyB.getVelocityInPoint(this.point, this.timeStamp).dot(this.normal));
      var totalV = velocityA+velocityB;
      if(!totalV)return;
      // correct position
      this.point.add(this.offset.clone().scale((velocityA -velocityB)/totalV));
      this.bodyA.addPosition(this.offset.clone().scale(velocityA/totalV), this.timeStamp);
      this.bodyB.addPosition(this.offset.clone().scale(-velocityB/totalV), this.timeStamp);

      //this.timeStamp-= this.offset.length()/totalV;

      this.offset = false;
    }
    Collision.prototype.resolve = function(){
        // relativeV
        var velocityA = this.bodyA.getVelocityInPoint(this.point, this.timeStamp);
        var velocityB = this.bodyB.getVelocityInPoint(this.point, this.timeStamp);
        var relativeV = velocityA.clone().subtract(velocityB);
        if (relativeV.dot(this.normal)>0) return;

        // inv_mass
        var invMssA = this.bodyA.getInvMassInPoint(this.point, this.normal, this.timeStamp);
        var invMssB = this.bodyB.getInvMassInPoint(this.point, this.normal, this.timeStamp);
        var totalMass = invMssA + invMssB;
        if (!totalMass) return;

        var e = (this.bodyA.geometry.material.restitution + this.bodyB.geometry.material.restitution)/2;
        if(relativeV.dot(this.normal)<10) e = 0;
        var j = -(1+e)*relativeV.dot(this.normal)/totalMass
        var impulse = this.normal.clone(
        ).scale(j);

        this.bodyA.applyImpulse(this.point, impulse, this.timeStamp);
        this.bodyB.applyImpulse(this.point, impulse.reverse(), this.timeStamp);

        //friction
        var tangent = relativeV.clone().project(this.normal.clone().perp()).normalize();

        var relativeV = this.bodyA.getVelocityInPoint(this.point, this.timeStamp
        ).subtract(this.bodyB.getVelocityInPoint(this.point, this.timeStamp));

        var mu = Math.sqrt(
        this.bodyA.geometry.material.staticFriction*this.bodyA.geometry.material.staticFriction +
        this.bodyB.geometry.material.staticFriction*this.bodyB.geometry.material.staticFriction
        );
        var frictionImpulse;
        var jt = -relativeV.dot(tangent)/totalMass

        if(Math.abs( jt ) < j * mu){
          // static friction
            frictionImpulse = tangent.clone(
            ).scale(jt
            );
        }
        else{
          // dynamic friction
            frictionImpulse = tangent.clone().scale(-j * Math.sqrt(
            this.bodyA.geometry.material.dynamicFriction*this.bodyA.geometry.material.dynamicFriction +
            this.bodyB.geometry.material.dynamicFriction*this.bodyB.geometry.material.dynamicFriction
            ));
        }

        this.bodyA.applyImpulse(this.point, frictionImpulse, this.timeStamp);
        this.bodyB.applyImpulse(this.point, frictionImpulse.reverse(), this.timeStamp);
    }

    var CollisionTests = function(){};
    CollisionTests.prototype.BodyBody = function(bodyA, bodyB, timeStamp){
        var collision = new Collision();
        collision.timeStamp = timeStamp;
        collision.bodyA = bodyA;
        collision.bodyB = bodyB;
        collision.normal = new Vector();
        collision.point = new Vector();
        collision.offset = new Vector();

        var positionA = bodyA.getPosition(timeStamp);
        var positionB = bodyB.getPosition(timeStamp);
        var angleA = bodyA.getAngle(timeStamp);
        var angleB = bodyB.getAngle(timeStamp);
        var collisions = [];
        for(var compA of bodyA.geometry.iterateComponents()){
            for(var compB of bodyB.geometry.iterateComponents()){
                if(compA.obj instanceof Polygon){
                    if(compB.obj instanceof Polygon){
                        var col = this.polyPoly(
                          compA.obj,
                          positionA.clone().add(compA.position.clone().rotate(angleA)),
                          angleA+compA.angle,
                          compB.obj,
                          positionB.clone().add(compB.position.clone().rotate(angleB)),
                          angleB+compB.angle
                        );
                        if(col){
                            collisions.push(col);
                            collision.normal.add(col.normal);
                            collision.point.add(col.point);
                        }
                    }
                }
            }
        }

        if (collisions.length==0) return false;
        collision.normal.scale(1/collisions.length);
        if (!collision.normal.squareLength()) return false;
        collision.normal.normalize();

        collision.point.scale(1/collisions.length);

        if (collisions.length>1){

            // compute offset
            for(var col of collisions){
                /*
                v1 = col.offset;
                v1 = n1.scale(X);
                v2 = n2.scale(Y);
                v3 = n3.scale(Z);
                offset = v1 + v2;
                n3_p.dot(v1) = n3_p.dot(v2);

                n3 = collision.normal.clone();

                var n3_p = n3.clone().perp();
                var n1 = col.normal;
                var n2 = n1.clone.perp();
                var X = col.offset.length();

                var Y = X*(n3_p.dot(n1)/n3_p.dot(n2));
                var offset = col.offset.add(n2.scale(Y))
                */

                var perpNormal = collision.normal.clone().perp();
                var Y = col.offset.length()*(perpNormal.dot(col.normal)/perpNormal.dot(col.normal.clone().perp()));
                var offset = col.offset.clone().add(col.normal.clone().perp().scale(Y));
                if (offset.squareLength() > collision.offset.squareLength()){
                    collision.offset = offset;
                }
            }
        }
        else{
            collision.offset = collisions[0].offset;
        }

        return collision;

    }
    CollisionTests.prototype.polyPoly = function(polygonA, positionA, angleA, polygonB, positionB, angleB){
        var pointA = false;
        var pointB = false;
        var collision = new Collision();
        // test collision
        main:
        for(var lineA of polygonA.iterateEdges()){
            lineA.rotate(angleA).add(positionA);
            for(var lineB of polygonB.iterateEdges()){
                lineB.rotate(angleB).add(positionB);
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



        // compile normal
        collision.normal = pointB.clone(
        ).subtract(pointA
        ).normalize(
        ).perp();

        if (positionA.clone(
        ).subtract(pointA
        ).dot(collision.normal
        )<0){
            collision.normal.reverse();
        }

        // run SAT
        var vert1 = this.polyProjectToNormal(
        polygonA,
        positionA,
        angleA,
        collision.normal,
        pointA);
        var vert2 = this.polyProjectToNormal(
        polygonB,
        positionB,
        angleB,
        collision.normal,
        pointA);

        // compute offset
        collision.offset = new Vector();
        if (vert1[0].x<0){
            collision.offset.subtract(collision.normal.clone().scale(vert1[0].x));
        }
        if (vert2[vert2.length-1].x>0){
            collision.offset.add(collision.normal.clone().scale(vert2[vert2.length-1].x));
        }

        // compute collisionPoint
        collision.point = new Vector();
        var totalOffset = 0;
        for (var k=0;vert1[k].x<0;k++){
            totalOffset-=vert1[k].x
            collision.point.add(vert1[k].clone().scale(-vert1[k].x));
        }
        for (var k=vert2.length-1;vert2[k].x>0;k--){
            totalOffset+=vert2[k].x
            collision.point.add(vert2[k].clone().scale(vert2[k].x));
        }
        collision.point.scale(1/totalOffset);

        collision.point.translateRev(collision.normal);
        collision.point.add(pointA);

        return collision;
    }
    CollisionTests.prototype.polyProjectToNormal = function(polygon, position, angle, normal, center){

        var OffsetList = [];

        for(var vertex of polygon.iterateVertices()){
            vertex.rotate(angle
            ).add(position
            ).subtract(center)

            vertex.translate(normal)

            OffsetList.push(vertex);
        }

        OffsetList.sort(function(a,b){return a.x - b.x});

        return OffsetList;
    }
    CollisionTests.prototype.pointInGeometry = function(geometry, position, angle, coordinate){
        for(var comp of geometry.iterateComponents()){
            if(comp.obj instanceof Polygon){
                if(this.pointInPoly(
                  comp.obj,
                  position.clone().add(comp.position.clone().rotate(angle)),
                  angle+comp.angle,
                  coordinate))return true;
            }
        }
        return false;
    }
    CollisionTests.prototype.pointInPoly = function(polygon, position, angle, coordinate){
        var lineA = new Line();
        lineA.pointA = coordinate.clone();
        lineA.pointB = position.clone();

        for(var lineB of polygon.iterateEdges())
        {
            lineB.rotate(angle).add(position);
            if (lineA.intersect(lineB)) return false;
        }
        return true
    }
    var collisionTests = new CollisionTests();
    
    var Compiler = function(){}
    Compiler.prototype.compileGeometryAttributes = function(geometry){
        var dataFull = {
        "mass":0,
        "inertia":0,
        "surfaceArea":0,
        "offset": new Vector()
        };

        var d
        for(var comp of geometry.iterateComponents()){
            data = false
            if (comp.obj instanceof Polygon){
                data = this.compilePolygonAttributes(comp.obj, geometry.material);
            }

            var d = comp.position.length();

            dataFull.surfaceArea+=data.surfaceArea;
            dataFull.offset.add(comp.position.clone().add(data.offset).scale(geometry.material.density*data.surfaceArea));
            dataFull.inertia+= geometry.material.density*(data.inertia + data.surfaceArea*(d*d))
        }
        dataFull.mass = dataFull.surfaceArea*geometry.material.density;
        dataFull.offset.scale(1/dataFull.mass);

        return dataFull;
    }
    Compiler.prototype.compilePolygonAttributes = function(polygon){
        var data = {
        "inertia":0,
        "surfaceArea":0,
        "offset": new Vector()
        };

        var k = 0;
        for(var line of polygon.iterateEdges() ){
            k++;
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

            data.inertia		+= surfaceArea * (d*d) + inertia;
            data.surfaceArea	+= surfaceArea;
            data.offset.add(line.pointA);
        }
        data.offset.scale(1/k).reverse();
        return data;
    }
    var compiler = new Compiler();
    
    
    // helper functions
    
    function loopRadian(radian){
        if (radian > 2*Math.PI) radian%=2*Math.PI;
        if (radian < 0) radian=2*Math.PI + (radian%(2*Math.PI));
        return radian;
    }
    function getTimeForDist(velocity, acceleration, distance, reverse = false){
        // t= - v/a +- Math.sqrt((v/a)^2 + 2s/a)
        var normal = distance.clone().normalize();
        var s = distance.length();
        var a = acceleration.dot(normal);
        var v = velocity.dot(normal);
        
        var vta = v/a;
        var t = -vta + Math.sqrt(vta*vta + 2*s/a)*(reverse?-1:1);
        
        return t;
    }

    // extended -------------------------------------------------------------------------------------------------

    var InputTracker = function(){
        this.canvas = false;
        this.disabled = true;
        this.canvasOffset = new Vector();
        this.cursorPosition = new Vector();
        this.cursorPositionDelta = new Vector();
        this.cursorVelocity = new Vector();
        this.timeStamp = false;
        this.listeners = {};

        this.addListener("m1");
        this.addListener("m2");
        this.addListener("move");
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
    InputTracker.prototype.set = function(canvas){
        if (this.canvas) return;
        this.canvas = canvas;

        var self = this;
        this.canvas.addEventListener("mousemove", function(event){self.cursorMove(event)});
        this.canvas.addEventListener("mousedown", function(event){self.cursorStart(event)});
        this.canvas.addEventListener("mouseup", function(event){self.cursorEnd(event)});

        this.canvas.addEventListener("touchmove", function(event){self.cursorMove(event)});
        this.canvas.addEventListener("touchstart", function(event){self.cursorStart(event)});
        this.canvas.addEventListener("touchend", function(event){self.cursorEnd(event)});
        //this.canvas.addEventListener("mouseleave", function(event){self.cursorEnd(event)});
        //this.canvas.addEventListener("mouseenter", function(event){self.cursorEnd(event)});
        document.body.addEventListener("keydown", function(event){self.keyStart(event)});
        document.body.addEventListener("keyup", function(event){self.keyEnd(event)});
    }
    InputTracker.prototype.unset = function(){
        return; // WIP
    }
    InputTracker.prototype.keyIsSet = function(key){
        if(!this.listeners[""+key]) return false;
        if(this.listeners[""+key].callouts.length === 0) return false;
        return true;
    }

    InputTracker.prototype.notify = function(key, data=undefined){
        if (!this.listeners[""+key]) return

        for (f of this.listeners[""+key].callouts){
            f(data);
        }
    }
    InputTracker.prototype.getKeyState = function(key){
        if(!this.listeners[""+key]) return false;
        return this.listeners[""+key].state;
    }

    InputTracker.prototype.keyStart = function(event){
        if(this.disabled)return;

        var key = event.keyCode;
        if(!this.keyIsSet(key)) return;
        if(this.getKeyState(key)) return;
        this.listeners[""+key].state = true;
        tthis.notify(key, {state:true, timeStamp:event.timeStamp});
    }
    InputTracker.prototype.keyEnd = function(event){
        if(this.disabled)return;

        var key = event.keyCode;
        if(!this.keyIsSet(key)) return;
        if(!this.getKeyState(key)) return;
        this.listeners[""+key].state = false;
        this.notify(key, {state:false, timeStamp:event.timeStamp});
    }
    InputTracker.prototype.cursorMove = function(event){
       if(this.disabled)return;

       this.calcCursorVelocity(event);
       var data = {
       state: true,
       position: this.cursorPosition.clone(),
       positionDelta: this.cursorPositionDelta.clone(),
       velocity: this.cursorVelocity.clone(),
       timeStamp: event.timeStamp};

       this.notify("move", data);
    }
    InputTracker.prototype.cursorStart = function(event){
        if(this.disabled)return;

        if(event instanceof MouseEvent){
            var key = event.buttons;
            if (key === 3){
                if (this.getKeyState("m1") && this.getKeyState("m2"))return;
                if (this.getKeyState("m2")) key = 1;
                else if (this.getKeyState("m1")) key = 2;
            }
            key = "m"+key;
        }
        else if(event instanceof TouchEvent){
            key = "m1";
        }
        if(!this.keyIsSet(key)) return;
        if(this.getKeyState(key)) return;

        this.listeners[""+key].state = true;
        this.calcCursorVelocity(event);

        var data = {
        state: true,
        position: this.cursorPosition.clone(),
        positionDelta: this.cursorPositionDelta.clone(),
        velocity: this.cursorVelocity.clone(),
        timeStamp: event.timeStamp};

        this.notify(key, data)
    }
    InputTracker.prototype.cursorEnd = function(event){
        if(this.disabled)return;

        if(event instanceof MouseEvent){
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
        }
        else if(event instanceof TouchEvent){
            key = "m1";
        }

        if(!this.keyIsSet(key)) return;
        if(!this.getKeyState(key)) return;

        this.listeners[""+key].state = false;
        this.calcCursorVelocity(event);

        var data = {
        state: false,
        position: this.cursorPosition.clone(),
        positionDelta: this.cursorPositionDelta.clone(),
        velocity: this.cursorVelocity.clone(),
        timeStamp: event.timeStamp};

        this.notify(key, data);
    }

    InputTracker.prototype.getCursorPos = function(event){
        var boxInfo = this.canvas.getBoundingClientRect();

        if(event instanceof MouseEvent){
            return new Vector(
            event.clientX-boxInfo.left,
            event.clientY-boxInfo.top
            );
        }
        if(event instanceof TouchEvent){
            if (event.touches.length == 0) return false
            return new Vector(
            event.touches[0].clientX-boxInfo.left,
            event.touches[0].clientY-boxInfo.top
            );
        }
      }
    InputTracker.prototype.calcCursorVelocity = function(event){

       var timediff = event.timeStamp-this.timeStamp;
       if(!timediff) return;
       this.timeStamp = event.timeStamp;

       if(!this.timeStamp || timediff>=1000){
           this.cursorVelocity.set(0,0);
           return;
       }

       var position = this.getCursorPos(event);

       if (!position) return;
       this.cursorPositionDelta = position.clone().subtract(this.cursorPosition);
       this.cursorPosition = position;

       this.cursorVelocity.scale(1/3
       ).add(this.cursorPositionDelta.clone(
       ).scale(1000/timediff
       ).scale(2/3)
       );
    }

    var default_texture = new Texture();
    default_texture.surfaceColor = 'black';
    default_texture.borderColor = 'black';

    var default_material = new Material();
    default_material.density			= 0.1;
    default_material.staticFriction		= 0.2;
    default_material.dynamicFriction	= 0.17;
    default_material.restitution		= 0.2;

    return {
        InputTracker: InputTracker,
        Scene: Scene,
        Vector: Vector,
        Material: Material,
        Geometry: Geometry,
        Polygon: Polygon,
        ElasticJoint: ElasticJoint,
        Joint: Joint,
        ElasticRope: ElasticRope,
        Rope: Rope,
        RigidBody: RigidBody,
        default_texture: default_texture,
        default_material: default_material,
    };
})();
