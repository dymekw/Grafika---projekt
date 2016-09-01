var camera, scene, controls, renderer;
var ambientLight, boxLightR, boxLightG, boxLightB;
var geometry;
var floorSize = 100;
var skyboxSize = floorSize*10;
var boxCoords = {x:0, y:9, z:-30};
var detonatorCoords = {x:0, y:9, z:30};
var r=5;
var angle=0;
var boom = true;
var counter = 0;
var clock = new THREE.Clock();
var loader;
var random = Math.random();
var fireworks = [];
var condition = true;
var stopPosition = randomVector3(-20,20, 50,100, -50,-10);

function init() {
    Physijs.scripts.worker = 'js/physijs_worker.js';
    Physijs.scripts.ammo = 'ammo.js';
    
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, -50, 0));
    //scene.fog = new THREE.FogExp2( 0xaaaaaa, 0.003);    
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
    createSphere();

    //explosion
    this.boom1 = new ParticleEngine();
    boom1.setValues( Examples.firework );
    boom1.initialize();
    this.boom2 = new ParticleEngine();
    boom2.setValues( Examples.firework );
    boom2.initialize();
    this.boom3 = new ParticleEngine();
    boom3.setValues( Examples.firework );
    boom3.initialize();

    //fireworks
    emitterSettings = {
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
    this.particleGroup = new ShaderParticleGroup(
    {
        texture: THREE.ImageUtils.loadTexture('images/spark.png'),
        maxAge: 2,
        colorize: 1,
        blending: THREE.AdditiveBlending,
    });
    
    var colors = ["red", "orange", "yellow", "green", "blue", "violet", "pink", "magenta", "cyan", "steelblue", "seagreen"];
    for (var i = 0; i < colors.length; i++)
    {
        emitterSettings.colorMiddle = new THREE.Color( colors[i] );
        emitterSettings.colorEnd = new THREE.Color( colors[i] );
        particleGroup.addPool( 1, emitterSettings, false );
    }
    
    // Add the particle group to the scene so it can be drawn.
    scene.add( particleGroup.mesh );

    //firework
    loader = new THREE.OBJMTLLoader();
    loader.addEventListener('load', function (event) {
        var mesh = event.content;
        mesh.position = {x:0, y:8.2, z:30};
        mesh.scale = {x:.2, y:.2, z:.2};
        mesh.rotation.x=Math.PI/2;
        mesh.rotation.z=Math.PI;
        scene.add(mesh);
        });
    loader.load('models/firework.obj', 'models/firework.mtl', {side: THREE.DoubleSide});
    loader.removeEventListener('load');

    for(var i = 0; i < 10; i++){
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
    }

    
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

    var ground = new Physijs.BoxMesh(new THREE.CubeGeometry(floorSize, 1, floorSize), ground_material, 0);
    ground.position.y=7.5;
    
    scene.add( ground );  
}

function createSphere() {
    var stoneGeom = new THREE.CubeGeometry(0.6, 6, 2);

    var stone = new Physijs.BoxMesh(stoneGeom, Physijs.createMaterial(new THREE.MeshPhongMaterial(
    {
                                    transparent: true, opacity: 0.8,
//                            map: THREE.ImageUtils.loadTexture( 'textures/darker_wood.jpg' )
        })));
    stone.position = new THREE.Vector3(0,8,-10);
    stone.lookAt(scene.position);
    stone.__dirtyRotation = true;
    scene.add(stone);
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
    var detonatorLight = new THREE.PointLight(0x0000ff, 5, 20);
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
    if (angle >= 2*Math.PI)    angle -= 2*Math.PI;    
    boxLightR.position.z = Math.cos(angle) * r + boxCoords.z;
    boxLightR.position.x = Math.sin(angle) * r + boxCoords.x;    
    boxLightG.position.z = Math.cos(angle + 2*Math.PI/3) * r + boxCoords.z;
    boxLightG.position.x = Math.sin(angle + 2*Math.PI/3) * r + boxCoords.x;   
    boxLightB.position.z = Math.cos(angle + 4*Math.PI/3) * r + boxCoords.z;
    boxLightB.position.x = Math.sin(angle + 4*Math.PI/3) * r + boxCoords.y;
}

function randomVector3(xMin, xMax, yMin, yMax, zMin, zMax)
{
    //return new THREE.Vector3(0, 50, -30);
    return new THREE.Vector3( xMin + (xMax - xMin) * Math.random(),
        yMin + (yMax - yMin) * Math.random(), zMin + (zMax - zMin) * Math.random() );
}

function updateFireworks() {
    var dt = clock.getDelta();
    particleGroup.tick( dt );
    //var direction = THREE.Vector3((stopPosition.x - boxCoords.x)/10, (stopPosition.y - boxCoords.y)/10, (stopPosition.z - boxCoords.z)/100)

    // if ( random < dt ){
    //     particleGroup.triggerPoolEmitter( 1, stopPosition );
    // } else {
    //     random = Math.random();
    // }
    if(boom){
        boom1.update(dt * 0.2);
        boom2.update(dt * 0.3);
        boom3.update(dt * 0.4);
    } 

    if(!condition){
        condition = (Math.random() < 2*dt);
        stopPosition = randomVector3(-30,30, 40,60, -70, 10);
    }

    if(condition){ 
        fireworks[counter].position.x += (fireworks[counter].position.x >= stopPosition.x) ? 0 : (Math.abs(stopPosition.x - boxCoords.x)/10);
        fireworks[counter].position.y += (fireworks[counter].position.y >= stopPosition.y) ? 0 : (Math.abs(stopPosition.y - boxCoords.y)/10);
        fireworks[counter].position.z += (fireworks[counter].position.z >= stopPosition.z) ? 0 : (Math.abs(stopPosition.z - boxCoords.z)/10);
        if(fireworks[counter].position.x >= stopPosition.x && 
            fireworks[counter].position.y >= stopPosition.y &&
            fireworks[counter].position.z >= stopPosition.z){
            particleGroup.triggerPoolEmitter( 1, new THREE.Vector3(fireworks[counter].position.x, fireworks[counter].position.y, fireworks[counter].position.z) );
            fireworks[counter].position = {x:boxCoords.x, y:boxCoords.y, z:boxCoords.z};
            counter += 1;
            if( counter === 10){
                counter = 0;
            }
           // random = Math.random();
            condition = false;
        }
    }
    
}