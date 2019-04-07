var physics = (function(){

    var Vector = function(x,y){
        this.x;
        this.y;
        this.set(x,y);
    }
    Vector.prototype.set = function(x, y){
        this.x = x || 0;
        this.y = y || 0;
        return this;
    }
    Vector.prototype.copy = function(vector){
        return this.set(vector.x, vector.y);
    }
    Vector.prototype.clone = function(){
        return new Vector(this.x, this.y);
    }
    Vector.prototype.scale = function(x = 0, y = x){
        this.x  *= x;
        this.y  *= y;
        return this;
    }
    Vector.prototype.reverse = function(){
        return this.scale(-1);
    }
    Vector.prototype.perp = function(){
        return this.set(this.y, -this.x);
    }
    Vector.prototype.project = function(normal){
        return this.copy(normal.clone().scale(this.dot(normal)));
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
    Vector.prototype.rotate = function(angle = 0){
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        return this.set(this.x*c - this.y*s, this.x*s + this.y*c);
    }
    Vector.prototype.normalize = function(){
        var l = this.length();
        if(l > 0){
            this.scale(1/l);
        }
        return this;
    }
    Vector.prototype.translate = function(normal){
        return this.set(this.dot(normal), this.dot(normal.clone().perp()));
    }
    Vector.prototype.dot = function(vector){
        return this.x * vector.x + this.y * vector.y;
    }
    Vector.prototype.squareLength = function(){
        return this.dot(this);
    }
    Vector.prototype.length = function(){
        return Math.sqrt(this.squareLength());
    }

    var createScene(){
        return new Scene();
    };

    var Scene = function(){
        this.entities	= [];

        this.views = [];
    }
    Scene.prototype.addEntity = function(entity){
        this.rigidBodies.push(entity);
    }
    Scene.prototype.createView(canvas){
        var view = new View(canvas);
        this.views.push(view);
        return view;
    }
    Scene.prototype.update = function(timeStamp){
        for(view of this.views){
            view.draw(timeStamp);
        }
    }
    Scene.prototype.start = function(){
        var self = this;
        var loop = function(timeStamp) {
            self.update(timeStamp);
            window.requestAnimationFrame(loop)
        };
        window.requestAnimationFrame(loop);
    }


    var View = function(canvas, scene){
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.scene = scene;

        this.canvasPosition;

        //camera
        this.zoom = 1;
        this.position = new Vector();
        this.pxScaler;
    }
    View.prototype.setup = function(canvas){
        if (!this.canvas) this.canvas = canvas;
        if (!this.context) this.ctx = this.canvas.getContext("2d");
        this.sizeAdjust();
    }
    View.prototype.setZoom = function(zoom){
        if (zoom){
            this.zoom = zoom;
        }
        if (this.canvas.width < this.canvas.height){
            this.pxScaler = this.zoom*this.canvas.width / 1000;
        }
        else{
            this.pxScaler = this.zoom*this.canvas.height / 1000;
        }
    }
    View.prototype.setPosition = function(position){
        this.position = position.clone()
    }
    View.prototype.sizeAdjust = function(){
        var box = this.canvas.getBoundingClientRect();
        this.canvasPosition = new Vector(box.left, box.top)
        this.canvas.width	= box.width;
        this.canvas.height	= box.height;
        this.setZoom();
    }
    View.prototype.coordinateToScene = function(coordinate){
        return coordinate.clone(
        ).subtract( (new Vector(this.canvas.width, this.canvas.height)).scale(0.5)
        ).subtract(this.canvasPosition
        ).scale(1/this.zoom
        ).subtract(this.position);
    }
    View.prototype.sceneToCoordinate = function(coordinate){
        return coordinate.clone(
        ).add(this.position
        ).scale(this.zoom
        ).add(this.canvasPosition
        ).add( (new Vector(this.canvas.width, this.canvas.height)).scale(0.5) );
    }
    View.prototype.draw = function(timeStamp){
        this.ctx.save();
        this.ctx.clearRect(0,0,canvas.width, canvas.height);
        this.ctx.translate(this.position.x, this.position.y);
        this.ctx.setTransform(this.pxScaler,0,0,this.pxScaler,this.canvas.width*0.5,this.canvas.height*0.5);

        for(obj of this.scene.entities){
            this.drawGeometry(obj.geometry, obj.getPosition(timeStamp), obj.getAngle(timeStamp));
        }

        this.ctx.restore();
    }
    Scene.prototype.drawGeometry = function(geometry, position, angle){
        this.ctx.beginPath();
        for(var vertex of geometry.iterateVertices()){
            vertex.rotate(angle
            ).add(position);
            this.ctx.lineTo(vertex.x, vertex.y)
        }
        this.ctx.fillStyle = geometry.texture.surfaceColor;
        this.ctx.fill();
    }


    var Edge = function(pointA = new Vector(), pointB = new Vector()){
        this.pA 	= pointA;
        this.pB 	= pointB;
    }
    Edge.prototype.clone = function(){
        return new Edge(this.pA.clone(), this.pB.clone());
    }
    Edge.prototype.normal = function(){
        return this.pB.clone().subtract(this.pA).normalize().perp();
    }
    Edge.prototype.scale = function(x = 0, y = x){
        this.pA.scale(vector);
        this.pB.scale(vector);
        return this;
    }
    Edge.prototype.add = function(vector){
        this.pA.add(vector);
        this.pB.add(vector);
        return this;
    }
    Edge.prototype.subtract = function(vector){
        this.pA.subtract(vector);
        this.pB.subtract(vector);
        return this;
    }
    Edge.prototype.rotate = function(angle = 0){
        this.pA.rotate(vector);
        this.pB.rotate(vector);
        return this;
    }

    var Polygon = function(vertices){
        this.vertices;
        this.radious;
    }
    Polygon.prototype.clone = function(){
        var obj = new Polygon();
        return obj.setVertices(this.vertices);
    }
    Polygon.prototype.setVertices = function(vertices){
        this.vertices = [];
        for (v of vertices){
            this.vertices.push(new Vector(v.x, v.y));
        }
    }
    Polygon.prototype.iterateVertices = function*(){
        for(var vertex of this.vertices){
            yield vertex.clone();
        }
    }
    Polygon.prototype.iterateEdges = function*(){
        var edge = new Edge();
        var start=	false;
        for(var vertex of this.iterateVertices())
        {
            if (start===false)
            {
                start = vertex;
                edge.pB = vertex;
                continue;
            }
            edge.pA = edge.pB;
            edge.pB = vertex;
            yield edge.clone();
        }
        edge.pA = edge.pB;
        edge.pB = start;
        yield edge.clone();
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
    Polygon.prototype.compile = function(){
        var offset = new Vector();

        // convex and clockwise check
        var normal;
        var direction;
        var radious;

        for(var edge of this.iterateEdges()){
            if (normal){
                var temp = normal.dot(edge.pB);
                if (!direction) direction = temp>0?1:-1;
                if (temp*direction < 0) throw "Cannot compile non convex polygon";
            }
            offset.add(edge.pA);
            normal = edge.normal();
        }
        offset.scale(1/this.vertices.length).reverse();
        this.moveOrigin(offset);
        if(direction>0){ // makes nodes always go counter clockwise
            this.vertices.reverse();
        }

        for(var vertex of this.iterateVertices()){
            radious = edge.pA.length();
            if (!this.radious || radious>this.radious){
                this.radious = radious;
            }
        }
    }

    var Material = function(){
        this.density;
        this.staticFriction;
        this.dynamicFriction;
        this.restitution;
    }
    var default_material = new Material();
    default_material.density			= 0.1;
    default_material.staticFriction		= 0.2;
    default_material.dynamicFriction	= 0.17;
    default_material.restitution		= 0.2;

    var Texture = function(){
        this.surfaceColor;
    }
    var default_texture = new Texture();
    default_texture.surfaceColor = 'black';

    var Geometry = function(){
        this.texture;
        this.material;

        this.surfaceArea;
        this.mass = 0;
        this.inertia = 0;
        this.inv_mass;
        this.inv_inertia;

        this.setTexture();
        this.setMaterial();
    }
    Geometry.prototype = Object.create(Polygon.prototype);
    Geometry.prototype.clone = function(){
        var obj = new Geometry();
        obj.vertices = Polygon.prototype.clone.call(this).vertices;
        obj.texture = this.texture;
        obj.material = this.material;

        obj.surfaceArea = this.surfaceArea;
        obj.mass = this.mass;
        obj.inertia = this.inertia;
        obj.inv_mass = this.inv_mass;
        obj.inv_inertia = this.inv_inertia;
        return obj;
    }
    Geometry.prototype.setTexture = function(texture){
        this.texture = texture || default_texture;
    }
    Geometry.prototype.setMaterial = function(material){
        this.material = material || default_material;
    }
    Geometry.prototype.compile = function() {
        Polygon.prototype.compile.call(this);
        this.surfaceArea = 0;
        this.mass = 0;
        this.inertia = 0;

        for(var edge of this.iterateEdges()){
            var v = edge.pB.clone().subtract(edge.pA);

            var b = v.length();
            var a = edge.pB.dot(v).scale(1/v.squareLength());
            var h = edge.pB.dot(v.perp()).scale(1/v.squareLength());

            var surfaceArea = b*h/2;
            var inertia = b*h*(b*b - b*a + a*a + h*h)/36;

            var d = edge.pB.clone().add(edge.pA).length()/3;
            this.inertia		+= surfaceArea * (d*d) + inertia;
            this.surfaceArea	+= surfaceArea;
        }

        this.mass = this.surfaceArea*this.material.density;
        this.inertia*=this.material.density;
        this.inv_mass = 1/this.mass;
        this.inv_inertia = 1/this.inertia;
    }

    var Snapshot = function(){
        this.timeStamp;
        this.position;
        this.velocity;
        this.acceleration;
        this.angle;
        this.angVelocity;
    }

    var RigidBody = function(id=""){
        this.id = id;
        this.geometry;
        this.collitions = [];
        this.changeCue = [];
        this.changeCue.push(new Snapshot);

    }
    RigidBody.prototype.setStartPosition = function(x=0, y=0, angle=0){
      this.setPosition(new Vector(x, y), 0);
      this.setAngle(angle, 0);
    }
    RigidBody.prototype.setStartVelocity = function(velocity_x=0, velocity_y=0, angVelocity=0){
      this.setVelocity(new Vector(velocity_x, velocity_y), 0);
      this.setAngVelocity(angVelocity, 0);
    }
    RigidBody.prototype.createSnapshot = function(timeStamp){
        this.purgeSnapshot(timeStamp);
        if (this.changeCue[this.changeCue.length-1].timeStamp != timeStamp){
            var s = new Snapshot();
            s.timeStamp = timeStamp;
            s.position = this.getPosition(timeStamp);
            s.velocity = this.getVelocity(timeStamp);
            s.angle = this.getAngle(timeStamp);
            s.angVelocity = this.getAngVelocity(timeStamp);
            this.changeCue.push(s);
        }
    }
    RigidBody.prototype.addCollision = function(collision){
        this.purgeSnapshot(collision.timeStamp, true);
        collision.resolve();
        this.changeCue.push(collision);
    }
    RigidBody.prototype.getLastSnapshot = function(timeStamp){
        this.clearInvalidCollitions();
        for (var k = this.changeCue.length-1; k>=0; k--){
            if (this.changeCue[k].timeStamp<timeStamp){
              return this.changeCue[k];
            }
        }
        return false;
    }
    RigidBody.prototype.getNextSnapshot = function(timeStamp){
      for (var k = this.changeCue.length-1; k>=0; k--){
          if (this.changeCue[k].timeStamp<timeStamp){
              if (k == this.changeCue.length-1) return false;
              return this.changeCue[k+1];
          }
      }
      return false;
    }
    RigidBody.prototype.purgeSnapshots = function(timeStampm, includeCurrent=false){
        while(this.collitions.length>0 && (this.collitions[this.collitions.length-1].timeStamp > timeStamp || (includeCurrent && this.collitions[this.collitions.length-1].timeStamp == timeStamp))){
            this.collitions[this.collitions.length-1].invalid=true;
            this.collitions.splice(-1,1);
        }
        while(this.changeCue.length>1 && (this.changeCue[this.changeCue.length-1].timeStamp > timeStamp || (includeCurrent && this.changeCue[this.changeCue.length-1].timeStamp == timeStamp))){
            this.changeCue.splice(-1,1);
        }
    }
    RigidBody.prototype.clearHistory = function(timeStamp, includeCurrent=false){
        while(this.collitions.length>0 && (this.collitions[0].timeStamp < timeStamp || (includeCurrent && this.collitions[0].timeStamp == timeStamp))){
            this.collitions.splice(0,1);
        }
        while(this.changeCue.length>1 && (this.changeCue[0].timeStamp < timeStamp || (includeCurrent && this.changeCue[0].timeStamp == timeStamp))){
            this.changeCue.splice(0,1);
        }
    }
    RigidBody.prototype.clearInvalidCollitions = function(){
        for(var k=0; k<this.collitions.length; k++){
            if (this.collitions[k].invalid == true){
                this.purgeSnapshots(this.collitions[k].timeStamp, true);
                return;
            }
        }
    }

    RigidBody.prototype.getLatestSnapshotTime = function(){
        return this.getLatestSnapshot().timeStamp;
    }
    RigidBody.prototype.getLastSnapshotTime = function(timeStamp){

        var snapshot = this.getLastSnapshot(timeStamp);
        if (!snapshot) return false;
        return timeStamp.timeStamp;
    }
    RigidBody.prototype.getNextSnapshotTime = function(timeStamp){

        var snapshot = this.getNextSnapshot(timeStamp);
        if (!snapshot) return false;
        return timeStamp.timeStamp;
    }

    RigidBody.prototype.getPosition = function(timeStamp){
        var snapshot = this.getLastSnapshot(timeStamp);
        var time = (timeStamp - snapshot.timeStamp) / 1000;

        var position = snapshot.position.clone();
        position.add(snapshot.velocity.clone().scale(time));
        position.add(snapshot.acceleration.clone().scale(time*time*0.5));
        return position;
    }
    RigidBody.prototype.getVelocity = function(timeStamp){
        var snapshot = this.getLastSnapshot(timeStamp);
        var time = (timeStamp - snapshot.timeStamp) / 1000;

        var velocity = snapshot.velocity.clone();
        velocity.add(snapshot.acceleration.clone().scale(time));
        return velocity;
    }
    RigidBody.prototype.getAcceleration = function(timeStamp){
        var snapshot = this.getLastSnapshot(timeStamp);
        var time = (timeStamp - snapshot.timeStamp) / 1000;

        var acceleration = snapshot.acceleration.clone();
        return acceleration;
    }
    RigidBody.prototype.getAngle = function(timeStamp){
        var snapshot = this.getLastSnapshot(timeStamp);
        var time = (timeStamp - snapshot.timeStamp) / 1000;

        var angle = snapshot.angle;
        angle+=snapshot.angVelocity*time;
        angle = loopRadian(angle);
        return angle;
    }
    RigidBody.prototype.getAngVelocity = function(timeStamp){
        var snapshot = this.getLastSnapshot(timeStamp);
        var time = (timeStamp - snapshot.timeStamp) / 1000;

        var angVelocity = snapshot.angVelocity;
        return angVelocity;
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
        ).perp(
        ).reverse(
        ).dot(normal);
        var inv_mass = this.geometry.inv_mass + rad * rad * this.geometry.inv_inertia;
        return inv_mass;
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

    RigidBody.prototype.applyImpulse = function(coordinate, impulse, timeStamp){
        if (!this.geometry.inv_mass) return;
        var velocity = impulse.clone().scale(this.geometry.inv_mass)
        this.addVelocity(velocity, timeStamp);
        var radian = coordinate.clone(
        ).subtract(this.getPosition(timeStamp));
        var angVelocity = radian.cross(impulse) * this.geometry.inv_inertia;
        this.addAngVelocity(angVelocity, timeStamp);
    }

    var Collision = function Collision(){
        this.bodyA;
        this.bodyB;
        this.normal;
        this.point;
        this.offset;
        this.timeStamp;

        this.invalid = false;
    }
    Collision.prototype.resolve = function(){
        // relativeV
        var relative_velocity = this.bodyB.getVelocityInPoint(this.point, this.timeStamp).clone(
        ).subtract(this.bodyA.getVelocityInPoint(this.point, this.timeStamp));

        if (relativeV.dot(this.normal)>0) return;
        // inv_mass
        var invMssA = this.bodyA.getInvMassInPoint(this.point, this.normal, this.timeStamp);
        var invMssB = this.bodyB.getInvMassInPoint(this.point, this.normal, this.timeStamp);
        var totalMass = invMssA + invMssB;
        if (!totalMass) return;

        var e = (this.bodyA.geometry.material.restitution + this.bodyB.geometry.material.restitution)/2;
        //if(relativeV.dot(this.normal)<10) e = 0; // minimal movement
        var j = -(1+e)*relativeV.dot(this.normal)/totalMass
        var impulse = this.normal.clone().scale(j);
        this.bodyB.applyImpulse(this.point, impulse, this.timeStamp);
        this.bodyA.applyImpulse(this.point, impulse.reverse(), this.timeStamp);

        //friction
        var tangent_normal = relative_velocity.clone().project(this.normal.clone().perp()).normalize();
        var relative_velocity = this.bodyB.getVelocityInPoint(this.point, this.timeStamp
        ).subtract(this.bodyA.getVelocityInPoint(this.point, this.timeStamp));
        var mu = Math.sqrt(
        this.bodyA.geometry.material.staticFriction*this.bodyA.geometry.material.staticFriction +
        this.bodyB.geometry.material.staticFriction*this.bodyB.geometry.material.staticFriction
        );
        var frictionImpulse;
        var jt = -relativeV.dot(tangent_normal)/totalMass
        if(Math.abs( jt ) < j * mu){
          // static friction
            frictionImpulse = tangent_normal.clone(
            ).scale(jt
            );
        }
        else{
          // dynamic friction
            frictionImpulse = tangent_normal.clone().scale(-j * Math.sqrt(
            this.bodyA.geometry.material.dynamicFriction*this.bodyA.geometry.material.dynamicFriction +
            this.bodyB.geometry.material.dynamicFriction*this.bodyB.geometry.material.dynamicFriction
            ));
        }
        this.bodyB.applyImpulse(this.point, frictionImpulse, this.timeStamp);
        this.bodyA.applyImpulse(this.point, frictionImpulse.reverse(), this.timeStamp);
    }

    var CollisionTests = function(){};
    CollisionTests.prototype.pointInGeometry = function(body, coordinate){
        for(var edge of body.geometry.iterateEdges()){
            edge.rotate(body.getAngle(timeStamp)
            ).add(body.getPosition(timeStamp));

            var normal = edge.normal();
            var v = vertex.rotate(bodyA.getAngle(timeStamp)
            ).add(bodyA.getPosition(timeStamp));
            var distance = v.clone().subtract(edge.pA
            ).dot(normal);

            if (distance>0) return true
        }
        return false;
    }
    CollisionTests.prototype.getClosestSupportingPoint = function(bodyA, bodyB, timeStamp){
        var data = {};
        for(var edge of bodyB.geometry.iterateEdges()){
            edge.rotate(bodyB.getAngle(timeStamp)
            ).add(bodyB.getPosition(timeStamp));

            var normal = edge.normal();
            var d={};
            for(var vertex of bodyA.geometry.iterateVertices()){
                var v = vertex.rotate(bodyA.getAngle(timeStamp)
                ).add(bodyA.getPosition(timeStamp));
                var distance = v.clone().subtract(edge.pA
                ).dot(normal);
                if (d.distance==undefined || d.distance > distance)
                {
                    d.normal = normal;
                    d.v = v;
                    d.distance = distance;
                }
            }
            if (data.distance==undefined || data.distance < d.distance){
                data = d;
            }
        }
        return data;
    }
    CollisionTests.prototype.timeForLinearDistance = function(bodyA, bodyB, distance, normal, timeStamp){
        var relative_velocity = bodyB.getVelocity(timeStamp).subtract(bodyA.getVelocity(timeStamp));
        var time = distance/relative_velocity.dot(normal);
        if (!isFinite(time)) return false;
        return time;
    }
    CollisionTests.prototype.radiusCollide = function(bodyA, bodyB, timeStamp){
        var distance_vector = bodyB.getPosition(timeStamp).subtract(bodyA.getPosition(timeStamp));
        var normal = distance_vector.clone().normalize();
        var radious = bodyA.geometry.radious - bodyB.geometry.radious;
        if (distance <= radious) return true;
        var distance = distance_vector.length() - radious;
        var time = this.timeForLinearDistance(bodyA, bodyB, distance, normal, timeStamp);
        if (time === false || time<0) return false;
        return time;
    }
    CollisionTests.prototype.SAT = function(bodyA, bodyB, timeStamp){
        var positionA = bodyA.getPosition(timeStamp);
        var positionB = bodyB.getPosition(timeStamp);
        var angleA = bodyA.getAngle(timeStamp);
        var angleB = bodyB.getAngle(timeStamp);
        var dA = this.getClosestSupportingPoint(bodyA.geometry, bodyB.geometry, positionA, positionB, angleA, angleB);
        var dB = this.getClosestSupportingPoint(bodyB.geometry, bodyA.geometry, positionB, positionA, angleB, angleA);
        var collision = new Collision();
        collision.timeStamp = timeStamp;

        // geometry overlaps if distance is possitive
        if (dA.distance > dB.distance)
        {
            collision.bodyA = bodyA;
            collision.bodyB = bodyB;
            collision.normal = dA.normal.reverse();
            collision.point = dA.v;
            collision.offset = dA.normal.clone().scale(dA.distance);
            return collision;
        }
        collision.bodyA = bodyB;
        collision.bodyB = bodyA;
        collision.normal = dB.normal.reverse();
        collision.point = dB.v;
        collision.offset = dB.normal.clone().scale(dB.distance);
        return collision;
    }
    CollisionTests.prototype.testCollition = function(bodyA, bodyB, timeStamp){
        var timeStamp_local = timeStamp;

        var time = radiusCollide(bodyA, bodyB, timeStamp);
        if (time === false) return false;
        if (time !== true) timeStamp_local += time; // bad ckeck, can be infinate

        var distance;
        var collision;

        for(var k = 0; k<500; k++){
            collision = this.SAT(bodyA, bodyB, timeStamp_local)
            distance = collision.offset.dot(collision.normal);
            if (Math.abs(distance) < 0.05){
                return collision;
            }
            if (distance<0){
                if (time){ // binary seach
                    timeStamp_local -= time*=0.5;
                    continue;
                }
                else{
                    return collision;
                }
            }

            time = this.timeForLinearDistance(collision.bodyA, collision.bodyB, collision.offset.length(), collision.normal, timeStamp_local);
            if (time === false) return false;
            timeStamp_local += time;
            if (timeStamp_local <= timeStamp) return false;
        }
    }

    function loopRadian(radian){
        if (radian > 2*Math.PI) radian%=2*Math.PI;
        if (radian < 0) radian=2*Math.PI + (radian%(2*Math.PI));
        return radian;
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

    return {
    Vector: Vector,
    Scene: Scene,
    RigidBody: RigidBody,
    };
})();
