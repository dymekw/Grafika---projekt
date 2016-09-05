var camera, scene, controls, renderer;
var ambientLight, boxLightR, boxLightG, boxLightB;
var geometry;
var floorSize = 100;
var skyboxSize = floorSize*10;
var boxCoords = {x:0, y:9, z:-30};
var detonatorCoords = {x:0, y:8.2, z:31.5};
var r=5;
var angle=0;
var loader;
var sphere;
var speed = new THREE.Vector3(0,0,-1);
var clicked = false;
var gravity = 50;
var h = 1.667;
var boundingBox, ground;
var floorHit = false;
//explosions
var clock = new THREE.Clock();
var firework;
var boom = false; //starting explosion and fireworks
var condition = true; //starting one firework
var stopPosition = randomVector3(-20,20, 50,100, -50,-10);  //place of firework rocket explosion
var xStop = false; //stop updating firework rocket position
var yStop = false;
var zStop = false;
//firework rocket
var rocket;
var fly = false; 
//sparkles
var sparklesNumber = 49;
var sparklesLights = [];
var sparklesSpheres = [];
var counter = 0;

function init() {
    Physijs.scripts.worker = 'js/physijs_worker.js';
    Physijs.scripts.ammo = 'ammo.js';
    
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, -gravity, 0));
    
    addLight();
    controls = new THREE.PointerLockControls(camera, floorSize);
    controls.addObstacle(boxCoords.x-1.5, boxCoords.x+1.5, boxCoords.z-1.5, boxCoords.z+1.5);  //firewoks box
    controls.addObstacle(-floorSize, -floorSize/2+0.5, -floorSize, floorSize);  //left edge of floor
    controls.addObstacle(floorSize/2-0.5, floorSize, -floorSize, floorSize);  //right edge of floor
    controls.addObstacle(-floorSize, floorSize, -floorSize, -floorSize/2+0.5);  //front edge of floor
    controls.addObstacle(-floorSize, floorSize, floorSize/2-0.5, floorSize);  //rear edge of floor
    scene.add(controls.getObject());
                
    createFloor();
    createSkybox();
    createFireworksBox();
    createFence();
    initializeExplosion();
    initializeFireworks();
    initializeSparkles();
   
    //firework rocket
    loader = new THREE.OBJMTLLoader();
    loader.addEventListener('load', function (event) {
        var mesh = event.content;
        mesh.position = {x:0, y:8.2, z:30};
        mesh.scale = {x:.2, y:.2, z:.2};
        mesh.rotation.x=Math.PI/2;
        mesh.rotation.z=Math.PI;
        rocket = mesh;
        scene.add(mesh);
    });
    loader.load('models/firework.obj', 'models/firework.mtl', {side: THREE.DoubleSide});
    loader.removeEventListener('load');

    loader = new THREE.OBJMTLLoader();
    loader.addEventListener('load', function (event) {
        var mesh = event.content;
        mesh.position = {x:boxCoords.x, y:boxCoords.y, z:boxCoords.z};
        mesh.scale = {x:.2, y:.2, z:.2};
        mesh.rotation.x=Math.PI;
        mesh.rotation.z=Math.PI;
        fireworks.push(mesh)
        scene.add(mesh);
    });
    loader.load('models/firework.obj', 'models/firework.mtl', {side: THREE.DoubleSide});
    loader.removeEventListener('load'); 
    
    //detonator
    loader = new THREE.OBJMTLLoader();
    loader.addEventListener('load', function (event) {
        var mesh = event.content;
        mesh.position = detonatorCoords;
	scene.add(mesh);
	boundingBox = new Physijs.BoxMesh(new THREE.CubeGeometry(2,0.3,2), Physijs.createMaterial(new THREE.MeshNormalMaterial( { transparent: true, opacity: 0.0 } )), 0);
	boundingBox.position = new THREE.Vector3(detonatorCoords.x, detonatorCoords.y, detonatorCoords.z);
        scene.add(boundingBox);
        });
    loader.load('models/detonator.obj', 'models/detonator.mtl', {side: THREE.DoubleSide});
    loader.removeEventListener('load');

    loader = new THREE.OBJMTLLoader();
    loader.addEventListener('load', function (event) {
        var mesh = event.content;
        mesh.position = {x:boxCoords.x, y:boxCoords.y, z:boxCoords.z};
        mesh.scale = {x:.2, y:.2, z:.2};
        firework = mesh;
        scene.add(mesh);
    });
    loader.load('models/firework.obj', 'models/firework.mtl', {side: THREE.DoubleSide});
    loader.removeEventListener('load'); 

    
    //renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xffffff );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );
}

function createFloor() {
    geometry = new THREE.PlaneGeometry(floorSize, floorSize, 10, 10);
    geometry.applyMatrix( new THREE.Matrix4().makeRotationX(-Math.PI/2));
    mesh = createMesh(geometry, "grass B.jpg", 12, "grass B bump.jpg");

    var ground_material = Physijs.createMaterial(
                    mesh.material,
                    .9, .3);

    ground = new Physijs.BoxMesh(new THREE.CubeGeometry(floorSize, 1, floorSize), ground_material, 0);
    ground.position.y=7.5;
    
    scene.add( ground );
}

function createSphere() {
    if (sphere) return;
    if (clicked) {
        var currentPos = controls.getObject().position;
        //vector from current position to detonator
        var ray = new THREE.Vector3(detonatorCoords.x - currentPos.x, 0, detonatorCoords.z - currentPos.z);
        var velocity = ray.length() * Math.sqrt(gravity / (2*h));
        
        var geometry = new THREE.SphereGeometry( .3, 32, 32 );

        sphere = new Physijs.SphereMesh(geometry, Physijs.createMaterial(new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5 })));
        sphere.position = new THREE.Vector3(controls.getObject().position.x, controls.getObject().position.y, controls.getObject().position.z);
        sphere.lookAt(scene.position);
        sphere.__dirtyRotation = true;
        scene.add(sphere);

        speed.applyAxisAngle(new THREE.Vector3(0,1,0), controls.getRotationY());
        speed.multiplyScalar(velocity);
        sphere.setLinearVelocity({ x: speed.x, y: speed.y, z: speed.z});
	    sphere.addEventListener('collision', hit);
        fly=true;
    } else {
        clicked = true;

    }
}

function hit(other_object, relative_velocity, relative_rotation, contact_normal) {
  if (other_object == ground) {
      floorHit = true;
  }
  if (other_object == boundingBox) {
      fly=true;
  }
}

function createFireworksBox() {
    loader = new THREE.OBJMTLLoader();
    loader.addEventListener('load', function (event) {
            var mesh = event.content;
            mesh.position.y=boxCoords.y;
            mesh.position.z=boxCoords.z;
            scene.add(mesh);
        });
    loader.load('models/fireworks.obj', 'models/fireworks.mtl', {side: THREE.DoubleSide});
    loader.removeEventListener('load'); 
}

function createFence() {
    loader = new THREE.OBJMTLLoader();
    loader.addEventListener('load', function (event) {
        var mesh = event.content;
            for(var i=0; i<floorSize/2; i++) {
                var m = mesh.clone();
                m.position.x=-floorSize/2;
                m.position.y = 9;
                m.position.z=-floorSize/2 + i*2 + 1;
                scene.add(m);
            }
            for(var i=0; i<floorSize/2; i++) {
                var m = mesh.clone();
                m.position.x=floorSize/2;
                m.position.y = 9;
                m.position.z=-floorSize/2 + i*2 + 1;
                scene.add(m);
            }
            for(var i=0; i<floorSize/2; i++) {
                var m = mesh.clone();
                m.rotation.y=Math.PI/2;
                m.position.z=-floorSize/2;
                m.position.y = 9;
                m.position.x=-floorSize/2 + i*2 + 1;
                scene.add(m);
            }
            for(var i=0; i<floorSize/2; i++) {
                var m = mesh.clone();
                m.rotation.y=Math.PI/2;
                m.position.z=floorSize/2;
                m.position.y = 9;
                m.position.x=floorSize/2 - i*2 - 1;
                scene.add(m);
            }
        });
    loader.load('models/fence.obj', 'models/fence.mtl', {side: THREE.DoubleSide});
    loader.removeEventListener('load');
}

function createSkybox() {
    //behind
    geometry = new THREE.PlaneGeometry(skyboxSize, skyboxSize, 10, 10);
    geometry.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI));
    mesh = createMesh(geometry, "dawnmountain-zneg.png", 1);
    mesh.position.z=(skyboxSize-1)/2;
    scene.add( mesh );
    
    //front
    geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    mesh = createMesh(geometry, "dawnmountain-zpos.png", 1);
    mesh.position.z=-(skyboxSize-1)/2;
    scene.add(mesh);
    
    //right
    geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    geometry.applyMatrix( new THREE.Matrix4().makeRotationY(-Math.PI/2));
    mesh = createMesh(geometry, "dawnmountain-xpos.png", 1);
    mesh.position.x=(skyboxSize-1)/2;
    scene.add(mesh);
    
    //left
    geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    geometry.applyMatrix( new THREE.Matrix4().makeRotationY(Math.PI/2));
    mesh = createMesh(geometry, "dawnmountain-xneg.png", 1);
    mesh.position.x=-(skyboxSize-1)/2;
    scene.add(mesh);
       
    //top
    geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2 ));
    mesh = createMesh(geometry, "dawnmountain-ypos.png", 1);
    mesh.position.y=(skyboxSize-1)/2;
    scene.add(mesh);
       
    //bottom
    geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
    mesh = createMesh(geometry, "dawnmountain-yneg.png", 1);
    mesh.position.y=-(skyboxSize-1)/2;
    scene.add(mesh);
}

function initializeExplosion() {
    var explosion = {
        positionStyle  : Type.SPHERE,
        positionBase   : new THREE.Vector3( 0, 10, -30 ),
        positionRadius : 0.2,     
        velocityStyle  : Type.SPHERE,
        speedBase      : -6,
        speedSpread    : 1,      
        accelerationBase : new THREE.Vector3( 0, 15, 0 ),        
        particleTexture : THREE.ImageUtils.loadTexture( 'images/spark.png' ),       
        sizeTween    : new Tween( [0.5, 0.7, 1.3], [2, 20, 1] ),
        opacityTween : new Tween( [0.2, 0.7, 2.5], [0.75, 1, 0] ),
        colorTween   : new Tween( [0.4, 0.8, 1.0], [ new THREE.Vector3(0,1,1), new THREE.Vector3(0,1,0.6), new THREE.Vector3(0.8, 1, 0.6) ] ),
        blendStyle   : THREE.AdditiveBlending,        
        particlesPerSecond : 1000,
        particleDeathAge   : 2.5,       
        emitterDeathAge    : 0.2
    };
    this.boom1 = new ParticleEngine();
    boom1.setValues(explosion);
    boom1.initialize();
    this.boom2 = new ParticleEngine();
    boom2.setValues(explosion);
    boom2.initialize();
    this.boom3 = new ParticleEngine();
    boom3.setValues(explosion);
    boom3.initialize();
}

function initializeFireworks() {
    var emitterSettings = {
        type: 'sphere',
        positionSpread: new THREE.Vector3(2, 2, 2),
        acceleration: new THREE.Vector3(0, 0, 0),
        radius: 2,
        speed: 10,
        speedSpread: 5,
        sizeStart: 5,
        // sizeStartSpread: 30,
        sizeEnd: 3,
        opacityStart: 1,
        opacityMiddle: 1,
        opacityEnd: 0,
        colorStart: new THREE.Color('white'),
        colorStartSpread: new THREE.Vector3(0.5,0.5,0.5),
        colorMiddle: new THREE.Color('red'),
        colorEnd: new THREE.Color('red'),
        particlesPerSecond: 2000,
        alive: 0, // initially disabled, will be triggered later
        emitterDuration: 0.1
    };
    // Create a particle group to add the emitter
    this.particleGroup = new ShaderParticleGroup({
        texture: THREE.ImageUtils.loadTexture('images/spark.png'),
        maxAge: 2,
        colorize: 1,
        blending: THREE.AdditiveBlending,
    });   
    var colors = ["red", "orange", "yellow", "green", "blue", "violet", "pink", "magenta", "cyan", "steelblue", "seagreen"];
    for (var i = 0; i < colors.length; i++) {
        emitterSettings.colorMiddle = new THREE.Color( colors[i] );
        emitterSettings.colorEnd = new THREE.Color( colors[i] );
        particleGroup.addPool( 1, emitterSettings, false );
    }
    // Add the particle group to the scene so it can be drawn.
    scene.add( particleGroup.mesh );
}

function initializeSparkles() {
    var sphereLight = new THREE.SphereGeometry(0.02);
    var sphereLightMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
    for(var i = 0; i < sparklesNumber; i++){
        var light = new THREE.PointLight( 0x000000, 1, 0.0);
        var sphereLightMesh = new THREE.Mesh(sphereLight, sphereLightMaterial);
        var lightPosition = randomVector3(-0.15, 0.15, 8.10, 8.40, 30.4, 31.4);
        light.position = lightPosition;
        light.visible = false;
        sphereLightMesh.position = lightPosition;
        sphereLightMesh.visible = false;
        sparklesLights.push(light);
        sparklesSpheres.push(sphereLightMesh);
        scene.add(sparklesLights[i]);
        scene.add(sparklesSpheres[i]);
    }
}

function addLight() {
    ambiLight = new THREE.AmbientLight(0x222222)
    scene.add(ambiLight);    
    boxLightR = new THREE.PointLight(0xff0000, 5, 20);
    boxLightR.position.y = 20;
    scene.add(boxLightR);   
    boxLightG = new THREE.PointLight(0x00ff00, 5, 20);
    boxLightG.position.y = 20;
    scene.add(boxLightG);   
    boxLightB = new THREE.PointLight(0x0000ff, 5, 20);
    boxLightB.position.y = 20;
    scene.add(boxLightB);    
    var detonatorLight = new THREE.PointLight(0xffffff, 5, 20);
    detonatorLight.position.set(detonatorCoords.x, 20, detonatorCoords.z);
    scene.add(detonatorLight);
}

function createMesh(geom, imageFile, scaleFactor, bumpFile) {
    geom.computeVertexNormals();   
    var texture = THREE.ImageUtils.loadTexture("textures/" + imageFile);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(scaleFactor, scaleFactor);    
    var mat = new THREE.MeshPhongMaterial();
    mat.map = texture;                
    if (bumpFile) {
        var bump = THREE.ImageUtils.loadTexture("textures/" + bumpFile)
        bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
        bump.repeat.set(scaleFactor, scaleFactor);
        mat.bumpMap = bump;
        mat.bumpScale = 0.2;
    }
    return new THREE.Mesh(geom, mat);
}

function updateLights(delta) {
    angle += delta/400;
    if (angle >= 2*Math.PI) {
        angle -= 2*Math.PI; 
    }   
    boxLightR.position.z = Math.cos(angle) * r + boxCoords.z;
    boxLightR.position.x = Math.sin(angle) * r + boxCoords.x;    
    boxLightG.position.z = Math.cos(angle + 2*Math.PI/3) * r + boxCoords.z;
    boxLightG.position.x = Math.sin(angle + 2*Math.PI/3) * r + boxCoords.x;   
    boxLightB.position.z = Math.cos(angle + 4*Math.PI/3) * r + boxCoords.z;
    boxLightB.position.x = Math.sin(angle + 4*Math.PI/3) * r + boxCoords.y;
}

function randomVector3(xMin, xMax, yMin, yMax, zMin, zMax) {
    return new THREE.Vector3( xMin + (xMax - xMin) * Math.random(),
        yMin + (yMax - yMin) * Math.random(), zMin + (zMax - zMin) * Math.random() );
}

function updateSphereVelocity() {
    if (sphere && floorHit) {
         speed.multiplyScalar(0.99);
         sphere.setLinearVelocity({ x:speed.x, y: sphere.getLinearVelocity().y, z:speed.z});
    }
}

function calculateInclination(mesh, iks, igrek, zet) {
    var x = iks/30.0;
    var y = (igrek - 31.8)/51.8;
    var z = (zet + 30.0)/30.0;

    if(x>0){
        if(z>=0) {
            mesh.rotation.x = Math.atan(Math.abs(y/x));
            mesh.rotation.z = 3*Math.PI/2 + Math.atan(Math.abs(z/x));
        }
        else {
            mesh.rotation.x = Math.PI/2 + Math.atan(Math.abs(y/x));
            mesh.rotation.z = Math.PI + Math.atan(Math.abs(z/x));
        }
    }
    else if(x < 0) {
        if(z>=0){
            mesh.rotation.x = Math.atan(Math.abs(y/x));
            mesh.rotation.z = Math.atan(Math.abs(z/x));
        }
        else {
            mesh.rotation.x = Math.PI/2 + Math.atan(Math.abs(y/x));
            mesh.rotation.z = Math.PI/2 + Math.atan(Math.abs(z/x));
        }
    } 
    else {
        if(z>=0){
            mesh.rotation.z = Math.atan(Math.abs(z/x));
        }
        else {
            mesh.rotation.z = Math.PI/2 + Math.atan(Math.abs(z/x));
        }
    }
}

function updateFireworks() {
    var dt = clock.getDelta();
    particleGroup.tick( dt );

    if(boom){
        boom1.update(dt * 0.2);
        boom2.update(dt * 0.3);
        boom3.update(dt * 0.4);
    } 

    if(!condition && boom){
        condition = (Math.random() < 2*dt);
        stopPosition = randomVector3(-30,30, 40,60, -70, 10);
        calculateInclination(firework, stopPosition.x, stopPosition.y, stopPosition.z); 
    }

    if(condition && boom){ 
        if(boxCoords.x < stopPosition.x){
            firework.position.x += (firework.position.x >= stopPosition.x) ? 0 : (Math.abs(stopPosition.x - boxCoords.x)/10);
            if(firework.position.x >= stopPosition.x){
                xStop = true;
            }
        } else {
            firework.position.x -= (firework.position.x <= stopPosition.x) ? 0 : (Math.abs(stopPosition.x - boxCoords.x)/10);
                if(firework.position.x <= stopPosition.x){
                xStop = true;
            }
        }
        if(boxCoords.y < stopPosition.y){
            firework.position.y += (firework.position.y >= stopPosition.y) ? 0 : (Math.abs(stopPosition.y - boxCoords.y)/10);
            if(firework.position.y >= stopPosition.y){
                yStop = true;
            }    
        } else {
            firework.position.y -= (firework.position.y <= stopPosition.y) ? 0 : (Math.abs(stopPosition.y - boxCoords.y)/10);
            if(firework.position.y <= stopPosition.y){
                yStop = true;
            }
        }
        if(boxCoords.z > stopPosition.z){
            firework.position.z += (firework.position.z >= stopPosition.z) ? 0 : (Math.abs(stopPosition.z - boxCoords.z)/10);
            if(firework.position.z >= stopPosition.z){
                zStop = true;
            }
        } else {
            firework.position.z -= (firework.position.z <= stopPosition.z) ? 0 : (Math.abs(stopPosition.z - boxCoords.z)/10);
            if(firework.position.z <= stopPosition.z){
                zStop = true;
            }
        }      
        if(xStop && yStop && zStop){
            particleGroup.triggerPoolEmitter( 1, new THREE.Vector3(firework.position.x, firework.position.y, firework.position.z) );
            firework.position = {x:boxCoords.x, y:boxCoords.y, z:boxCoords.z};
            firework.rotation.x = 0;
            firework.rotation.y = 0;
            firework.rotation.z = 0;
            xStop = false;
            yStop = false;
            zStop = false;
            condition = false;
        }
    }  
}

function updateRocket() {
    if(fly){
        rocket.position.z -= 0.8;
        sparklesLights[sparklesNumber - 1].position.z -= 0.4;
        sparklesSpheres[sparklesNumber - 1].position.z -= 0.4;
        sparklesLights.visible = true;
        for(var i = 0; i < sparklesNumber - 1; i +=2 ){
            sparklesLights[i].visible = true;
            sparklesLights[i].position.z -= 0.4;
            sparklesSpheres[i].position.z -= 0.4;
            sparklesLights[i + 1].position.z -= 0.4;
            sparklesSpheres[i + 1].position.z -= 0.4;
            if(sparklesSpheres[i].visible === true){
                sparklesSpheres[i].visible = false;
                sparklesSpheres[i+1].visible = true;
            }
            else{
                sparklesSpheres[i].visible = true;
                sparklesSpheres[i+1].visible = false;
            }                     
        }
        if(rocket.position.z <= -25){
            boom = true;
        }
        if(rocket.position.z <= -28.5){
            scene.remove(rocket);
            for(var i = 0; i < sparklesNumber; i++){
                scene.remove(sparklesLights[i]);
                scene.remove(sparklesSpheres[i]);
            }
            fly = false;
        }
    }
}
