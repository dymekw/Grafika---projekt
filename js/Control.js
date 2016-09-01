/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function (camera, floorSize) {

	var scope = this;
    var obstacles = new Array();

	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;

	var velocity = new THREE.Vector3();

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );
	};

	var onKeyDown = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true;
                break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;
		}

	};

	var onKeyUp = function ( event ) {

		switch( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = false;
				break;
			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;

		}

	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};


	this.update = function ( delta ) {
		delta *= 0.1;
        
        //gently stop
		velocity.x += ( - velocity.x ) * 0.08 * delta;
		velocity.z += ( - velocity.z ) * 0.08 * delta;

		if (moveForward)    velocity.z -= 0.08 * delta;
		if (moveBackward)   velocity.z += 0.08 * delta;
		if (moveLeft)       velocity.x -= 0.08 * delta;
		if (moveRight)      velocity.x += 0.08 * delta;

		this.moveCamera();
	};
    
    this.moveCamera = function() {
        while (Math.abs(velocity.x) > 0.001 || Math.abs(velocity.z) > 0.001) {
            yawObject.translateX(velocity.x);
            yawObject.translateZ(velocity.z);
            
            if (!this.isInObstacle())   break;
            
            //camera in obstacle
            yawObject.translateX(-velocity.x);
            yawObject.translateZ(-velocity.z);
            velocity.x*=0.999;
            velocity.z*=0.999;
        }
    }
    
    this.isInObstacle = function() {
        for (var i = 0; i < obstacles.length; i++) {
            if (obstacles[i].minX <= yawObject.position.x && obstacles[i].maxX >= yawObject.position.x) {
                if (obstacles[i].minZ <= yawObject.position.z && obstacles[i].maxZ >= yawObject.position.z) {
                    return true;
                }
            }
        }
        return false;
    }
    
    this.addObstacle = function(x1, x2, z1, z2) {
        obstacles.push({minX:x1, maxX:x2, minZ:z1, maxZ:z2});
    }
    
    this.getRotationX = function() {
        return pitchObject.rotation.x;
    }
    
    this.getRotationY = function() {
        return yawObject.rotation.y;
    }
};
