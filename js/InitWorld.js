var camera, scene, controls, renderer;
var ambientLight, boxLightR, boxLightG, boxLightB;
var geometry;
var floorSize = 100;
var skyboxSize = floorSize*10;
var boxCoords = {x:0, y:9, z:-30};
var detonatorCoords = {x:0, y:9, z:30};
var r=5;
var angle=0;
var bum = true;
var counter = 0;
var clock = new THREE.Clock();
var loader;

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

    //fireworks
    this.engine = new ParticleEngine();
    engine.setValues( Examples.firework );
    engine.initialize();
    this.engine2 = new ParticleEngine();
    engine2.setValues( Examples.firework );
    engine2.initialize();

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

function restartEngine(parameters) {
    engine.destroy();
    engine = new ParticleEngine();
    engine.setValues( parameters );
    engine.initialize();
    engine2.destroy();
    engine2 = new ParticleEngine();
    engine2.setValues( parameters );
    engine2.initialize();
    bum = true;

}

function updateFireworks() {
    if(bum){
        var dt = clock.getDelta();
        engine.update( dt * 0.3);
        engine2.update( dt * 0.5 ); 
        counter += 1;
    } 

    if(counter == 200){
        counter = 0;
        bum = false;
        restartEngine(Examples.firework)
    }
}