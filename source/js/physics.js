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

        this.rigidBodies	= [];
        this.constraints = [];

        this.collisionNotes = [];
    }
    Scene.prototype.setup = function(canvas){
        if (!this.canvas) this.canvas = canvas;
        if (!this.context) this.ctx = this.canvas.getContext("2d");
        this.setSize();
    }
    Scene.prototype.start = function(){
        var self = this;
        var loop = function(timeStamp) {
          ins.update(timeStamp);
        	ins.draw(timeStamp);
        	window.requestAnimationFrame(loop)
        };
        window.requestAnimationFrame(loop);
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
        /*
        if(!this.timeStamp || timeStamp-this.timeStamp > 100){
            for(var body of this.rigidBodies){
                body.setTimeStamp(timeStamp);
            }
            this.timeStamp = timeStamp;
            return;
        }
        this.timeStamp = timeStamp;
*/
        if(!this.timeStamp)this.timeStamp = 0;
        this.timeStamp+=10
        timeStamp = this.timeStamp;

        var loopCondition;
        do{
            loopCondition = false;
            for (var k1=0; k1<this.rigidBodies.length; k1++){
                for (var k2=k1+1; k2<this.rigidBodies.length; k2++){
                    if(!this.rigidBodies[k1].geometry.inv_mass && !this.rigidBodies[k2].geometry.inv_mass) continue;
                    if (this.getCollisionNote(this.rigidBodies[k1], this.rigidBodies[k2], timeStamp)) continue;

                    loopCondition = true;
                    var collision = collisionTests.getCollition(this.rigidBodies[k1],this.rigidBodies[k2], timeStamp, timeStamp+3000); // upper limit
                    if (collision){
                        this.clearCollisionNotes(collision.bodyB, collision.timeStamp);
                        this.clearCollisionNotes(collision.bodyA, collision.timeStamp);
                        this.addCollisionNote(collision.bodyA, collision.bodyB, collision.timeStamp);

                        collision.resolve();
                    }
                    else{
                        this.addCollisionNote(this.rigidBodies[k1], this.rigidBodies[k2], timeStamp+3000)
                    }
                }
            }
        }while(loopCondition)
    }
    Scene.prototype.draw = function(timeStamp){

        timeStamp = this.timeStamp;
        this.ctx.setTransform(this.zoom,0,0,this.zoom,this.canvas.width*0.5,this.canvas.height*0.5);
        this.ctx.translate(this.position.x, this.position.y);
        this.ctx.clearRect(this.position.x - this.canvas.width*0.5/this.zoom,
        this.position.y  - this.canvas.height*0.5/this.zoom,
        this.canvas.width/this.zoom, this.canvas.height/this.zoom);
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
    Scene.prototype.addCollisionNote = function(bodyA, bodyB, timeStamp){
        this.clearCollisionNotes(bodyA, bodyB);
        var note = {}
        note.bodyA = bodyA;
        note.bodyB = bodyB;
        note.timeStamp = timeStamp;
        this.collisionNotes.push(note);
        this.collisionNotes.sort(function(a, b) {return b.timeStamp - a.timeStamp;});
    }
    Scene.prototype.getCollisionNote = function(bodyA, bodyB, timeStamp){
        var note;
        for(var k=this.collisionNotes.length-1; k>0; k--){
            note = this.collisionNotes[k];
            if (note.timeStamp < timeStamp) continue;
            if (note.bodyA == bodyA || note.bodyB == bodyA){
                if (note.bodyA == bodyB || note.bodyB == bodyB){
                    return note;
                }
            }
        }
        return false;
    }
    Scene.prototype.clearCollisionNotes = function(body, timeStamp = false){
        var note;
        for(var k=this.collisionNotes.length-1; k>0; k--){
            note = this.collisionNotes[k];
            if (timeStamp && note.timeStamp < timeStamp) continue;
            if (note.bodyA == body || note.bodyB == body){
                this.collisionNotes.splice(k, 1);
            }
        }
    }
    Scene.prototype.clearCollisionNotes = function(bodyA, bodyB, timeStamp = false){
        var note;
        for(var k=this.collisionNotes.length-1; k>0; k--){
            note = this.collisionNotes[k];
            if (timeStamp && note.timeStamp < timeStamp) continue;
            if (note.bodyA == bodyA || note.bodyB == bodyA){
                if (note.bodyA == bodyB || note.bodyB == bodyB){
                    this.collisionNotes.splice(k, 1);
                }
            }
        }
    }
    Scene.prototype.purgeOldCollisionNotes = function(timeStamp){
        var note;
        for(var k=0; k<this.collisionNotes.length-1; k--){
            note = this.collisionNotes[k];
            if (note.timeStamp > timeStamp) continue;
            this.collisionNotes.splice(k, 1);
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
        this.drawGeometry(entity.geometry, position, angle)
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

    var Edge = function(pointA = new Vector(), pointB = new Vector()){
        this.pointA 	= pointA;
        this.pointB 	= pointB;
    }
    Edge.prototype.clone = function(){
        return new Edge(this.pointA.clone(), this.pointB.clone());
    }
    Edge.prototype.normal = function(){
        return this.pointB.clone().subtract(this.pointA).normalize().perp();
    }
    Edge.prototype.rotate = function(angle){
        this.pointA.rotate(angle);
        this.pointB.rotate(angle);
        return this;
    }
    Edge.prototype.add = function(position){
        this.pointA.add(position);
        this.pointB.add(position);
        return this;
    }
    Edge.prototype.intersect = function(edge){
        var coordinate = new Vector();
        var s1_x = this.pointB.x - this.pointA.x;
        var s1_y = this.pointB.y - this.pointA.y;
        var s2_x = edge.pointB.x - edge.pointA.x;
        var s2_y = edge.pointB.y - edge.pointA.y;
        var xDiff = this.pointA.x - edge.pointA.x;
        var yDiff = this.pointA.y - edge.pointA.y;
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
        if (this.vertices == undefined) return false;
        for(var vertex of this.vertices)
        {
            yield vertex.clone();
        }
    }
    Polygon.prototype.iterateEdges = function*(){
        var edge = new Edge();
        edge.pointA=false;
        edge.pointB=false;
        var startPoint=	false;
        for(var vertex of this.iterateVertices())
        {
            if (edge.pointB===false)
            {
                startPoint = vertex;
                edge.pointB = vertex;
                continue;
            }
            edge.pointA = edge.pointB;
            edge.pointB = vertex;
            yield edge.clone();
        }
        edge.pointA = edge.pointB;
        edge.pointB = startPoint;
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
      var normal;
      var dir;
      for(var edge of this.iterateEdges()){
          if (normal){
            var n = normal.dot(edge.pointB);
            if (n*dir > 1 || !dir ) dir=n;
            else throw "Cannot compile non convex polygon";
          }
          offset.add(edge.pointA);
          normal = edge.normal();
      }
      offset.scale(1/this.vertices.length).reverse();
      this.moveOrigin(offset);
      if(dir>0){ // makes nodes always go counter clockwise
          this.vertices.reverse();
      }
    }

    var Geometry = function(){
        this.texture;
        this.material;
        this.surfaceArea;
        this.inertia;
        this.mass;
        this.inv_mass;
        this.inv_inertia;
        this.radious;
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
        obj.inertia = this.inertia;
        obj.mass = this.mass;
        obj.inv_mass = this.inv_mass;
        obj.inv_inertia = this.inv_inertia;
        return obj;
    }
    Geometry.prototype.setTexture = function(texture=default_texture){
        this.texture = texture;
    }
    Geometry.prototype.setMaterial = function(material=default_material){
        this.material = material;
    }
    Geometry.prototype.compile = function(fixed = false) {
      Polygon.prototype.compile.call(this);
      this.surfaceArea = 0;
      this.mass = 0;
      this.inertia = 0;
      var k = 0;
      for(var edge of this.iterateEdges() ){
          k++;
          // relative coordinate !!!
          var v = edge.pointB.clone(
          ).subtract(edge.pointA);
          var b = v.length();
          var a = edge.pointA.clone(
          ).project(v
          ).length();
          var h = edge.pointA.clone(
          ).project(v.perp()
          ).length();
          var surfaceArea = b*h/2;
          var inertia = b*h*(b*b - b*a + a*a + h*h)/36;
          var center = new Vector();
          center.x = ( edge.pointA.x + edge.pointB.x ) / 3;
          center.y = ( edge.pointA.y + edge.pointB.y ) / 3;
          var d = center.length();
          this.inertia		+= surfaceArea * (d*d) + inertia;
          this.surfaceArea	+= surfaceArea;
          var r = edge.pointA.length();
          if (!this.radious || r>this.radious){
              this.radious = r;
          }
      }

      this.mass = this.surfaceArea*this.material.density;
      this.inertia*=this.material.density;
      if (!fixed){
          this.inv_mass = 1/this.mass;
          this.inv_inertia = 1/this.inertia;
      }
      else{
          this.inv_mass = 0
          this.inv_inertia = 0;
      }
    }

    var Snapshot = function(){
      this.timeStamp = 0;
      this.position = new Vector();
      this.velocity = new Vector();
      this.acceleration = new Vector();
      this.angle = 0;
      this.angVelocity = 0;
      this.angAcceleration = 0;
    }

    var RigidBody = function(id=""){
        this.id = id;
        this.geometry;
        this.changeCue    = [];
        this.changeCue.push(new Snapshot);"left"
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
    RigidBody.prototype.createSnapshot = function(timeStamp){

        this.purgeSnapshot(timeStamp);
        if (this.changeCue[this.changeCue.length-1].timeStamp != timeStamp){

            var s = new Snapshot();
            s.timeStamp = timeStamp;
            s.position = this.getPosition(timeStamp);
            s.velocity = this.getVelocity(timeStamp);
            s.acceleration = this.getAcceleration(timeStamp);
            s.angle = this.getAngle(timeStamp);
            s.angVelocity = this.getAngVelocity(timeStamp);
            s.angAcceleration = this.getAngAcceleration(timeStamp);
            this.changeCue.push(s);
        }
    }
    RigidBody.prototype.purgeSnapshot = function(timeStamp){

        while(this.changeCue.length>1 && this.changeCue[this.changeCue.length-1].timeStamp > timeStamp){
            this.changeCue.splice(-1,1);
        }
    }
    RigidBody.prototype.getLatestSnapshot = function(){
        return this.changeCue[this.changeCue.length-1];
    }
    RigidBody.prototype.getLastSnapshot = function(timeStamp){
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
    RigidBody.prototype.getLatestSnapshotTime = function(){
        return this.getLatestSnapshot().timeStamp;"wtf asd"
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
        angle+=snapshot.angAcceleration*time*time*0.5;
        angle = loopRadian(angle);
        return angle;
    }
    RigidBody.prototype.getAngVelocity = function(timeStamp){

        var snapshot = this.getLastSnapshot(timeStamp);
        var time = (timeStamp - snapshot.timeStamp) / 1000;

        var angVelocity = snapshot.angVelocity;
        angVelocity += snapshot.angAcceleration*time;
        return angVelocity;
    }
    RigidBody.prototype.getAngAcceleration = function(timeStamp){

        var snapshot = this.getLastSnapshot(timeStamp);
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
    RigidBody.prototype.getLinearValuesInPlane = function(normal, coordinate, timeStamp){

      // not taking anuglar acceleration into account
      // only works for small distances
      var d = {};
      d.velocity = this.getVelocityInPoint(coordinate, timeStamp).dot(normal);
      var radian = coordinate.clone(
      ).subtract(this.getPosition(timeStamp));
      var t = (0.5*Math.PI)/this.getAngVelocity(timeStamp)
      var a = radian.clone(
      ).perp(
      ).scale(2/(t*t));
      d.acceleration = a.add(this.getAcceleration(timeStamp)).dot(normal);
      return d
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
    Constraint.prototype.compute = function(timeStamp){
}
    Constraint.prototype.resolve = function(timeStamp){
}

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
        this.bodyA;
        this.bodyB;
        this.normal;
        this.point;
        this.offset;
        this.timeStamp;
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
        var relativeV = velocityB.clone().subtract(velocityA);
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
        this.bodyB.applyImpulse(this.point, impulse, this.timeStamp);
        this.bodyA.applyImpulse(this.point, impulse.reverse(), this.timeStamp);
        //friction
        var tangent = relativeV.clone().project(this.normal.clone().perp()).normalize();
        var relativeV = this.bodyB.getVelocityInPoint(this.point, this.timeStamp
        ).subtract(this.bodyA.getVelocityInPoint(this.point, this.timeStamp));
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
        this.bodyB.applyImpulse(this.point, frictionImpulse, this.timeStamp);
        this.bodyA.applyImpulse(this.point, frictionImpulse.reverse(), this.timeStamp);
    }

    var CollisionTests = function(){};
    CollisionTests.prototype.pointInGeometry = function(geometry, position, angle, coordinate){
        return this.pointInPoly(geometry, position, angle, coordinate);
    }
    CollisionTests.prototype.pointInPoly = function(polygon, position, angle, coordinate){
        var edgeA = new Edge();
        edgeA.pointA = coordinate.clone();
        edgeA.pointB = position.clone();
        for(var edgeB of polygon.iterateEdges())
        {
            edgeB.rotate(angle).add(position);
            if (edgeA.intersect(edgeB)) return false;
        }
        return true
    }
    CollisionTests.prototype.getClosestSupportingPoint = function(polygonA, polygonB, positionA, positionB, angleA, angleB){
        var data = {};
        for(var edge of polygonB.iterateEdges()){
            edge.rotate(angleB
            ).add(positionB);
            var normal = edge.normal();
            var d={};
            for(var vertex of polygonA.iterateVertices()){
                var v = vertex.rotate(angleA
                ).add(positionA);
                var distance = v.clone().subtract(edge.pointA
                ).dot(normal); // not sure if normal is correct
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
    CollisionTests.prototype.getCollition = function(bodyA, bodyB, timeStamp, max){
        var localTimeStamp = timeStamp;
        var collision;
        var time;
        var distance;
        var snapshot;
        var timespan;
        var k = 0;
        while(k++<50){
            collision = this.SAT(bodyA, bodyB, localTimeStamp)
            if (!collision) return false;
            distance = collision.offset.dot(collision.normal);
            if (Math.abs(distance) < 0.1) break;

            if (distance > (collision.bodyA.geometry.radious+collision.bodyB.geometry.radious)/2){
                var v = collision.bodyA.getVelocity(localTimeStamp).subtract(collision.bodyB.getVelocity(localTimeStamp)).dot(collision.normal);
                var a = collision.bodyA.getAcceleration(localTimeStamp).subtract(collision.bodyB.getAcceleration(localTimeStamp)).dot(collision.normal);
                time = getTimeForDist(distance, v, a)
            }
            else{
                var d1 = collision.bodyA.getLinearValuesInPlane(collision.normal, collision.point, timeStamp);
                var d2 = collision.bodyB.getLinearValuesInPlane(collision.normal, collision.point.clone().add(collision.offset), timeStamp);
                var v = d1.velocity - d2.velocity;
                var a = d1.acceleration - d2.acceleration;
                time = getTimeForDist(distance, v, a);
            }
            if(!time) return false;

            timespan = minOfTwo(collision.bodyA.getNextSnapshotTime(localTimeStamp), collision.bodyB.getNextSnapshotTime(localTimeStamp));
            if (!timespan || localTimeStamp+time < timespan) localTimeStamp+=time;
            else localTimeStamp = timespan;

            if (localTimeStamp > max) return false;
            if (localTimeStamp < timeStamp) return false;
        }
        if (Math.abs(distance) > 0.1) throw "infinate loop conditions";
        return collision;
    }


    var collisionTests = new CollisionTests();
    // helper functions
    function maxOfTwo(value1, value2){
        if (!value1){
          if (!value2) return false;
          return value2;
        }
        else if (!value2) return value1
        else{
          if (value1<value2) return value1;
          return value2;
        }
    }
    function minOfTwo(value1, value2){
        if (!value1){
          if (!value2) return false;
          return value2;
        }
        else if (!value2) return value1
        else{
          if (value1>value2) return value1;
          return value2;
        }
    }
    function getTimeForDist(distance, velocity, acceleration){ // make it handle negative d
        var v = velocity;
        var a = acceleration;
        var d = distance;
        var t;
        if (!d) return false;
        if (a){
          if (distance > 0){
            t = (Math.sqrt(v*v - 2*a*d)-v)/a;
          }
          else{ // reverse time
            t = -(Math.sqrt(v*v + 2*a*d)+v)/a;
          }
          if (isNaN(t)) return false;
          return t*1000;
        }
        if (v){
          t = d/v
          return t*1000;
        }
        return false;
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
        ElasticJoint: ElasticJoint,
        Joint: Joint,
        ElasticRope: ElasticRope,
        Rope: Rope,
        RigidBody: RigidBody,
        default_texture: default_texture,
        default_material: default_material,
        collisionTests: CollisionTests,
    };
})();
