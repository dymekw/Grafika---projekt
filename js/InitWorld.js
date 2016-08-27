var camera, scene, controls, renderer;
var ambientLight, geometry;
var floorSize = 100;
var skyboxSize = floorSize*10;
var boxCoords = {x:0, y:9, z:-30};
var detonatorCoords = {x:0, y:9, z:30};
var r=5;

function init() {
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2( 0xaaaaaa, 0.003);
    
    addLight();

    controls = new THREE.PointerLockControls(camera, floorSize);
    scene.add(controls.getObject());

    // floor
    geometry = new THREE.PlaneGeometry(floorSize, floorSize, 10, 10);
    geometry.applyMatrix( new THREE.Matrix4().makeRotationX(-Math.PI/2));

    mesh = createMesh(geometry, "grass B.jpg", 12, "grass B bump.jpg");
    mesh.position.y=8;
    scene.add( mesh );
                
    // skybox 
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
                
    // box
    var loader = new THREE.OBJLoader(); 
    loader.load('models/fireworks.obj', function(geometry) {
        var material = new THREE.MeshLambertMaterial({color: 0x5C3A21});

        geometry.children.forEach(function(child) {
            if (child.children.length == 1) {
                if (child.children[0] instanceof THREE.Mesh) {
                    child.children[0].material = material;
                }
            }
        });
        geometry.scale.set(80, 80, 80);
        geometry.applyMatrix( new THREE.Matrix4().makeRotationY(Math.PI));
        geometry.position.y=boxCoords.y;
        geometry.position.z=boxCoords.z;
        geometry.side = THREE.DoubleSide;
        scene.add(geometry);
    });
    //

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xffffff );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );
}

function addLight() {
    ambiLight = new THREE.AmbientLight(0x222222)
    scene.add(ambiLight);
    
    var boxLight = new THREE.PointLight(0xff0000, 5, 20);
    boxLight.position.set(boxCoords.x-r*Math.sqrt(3)/2, 20, boxCoords.z+r/2);
    scene.add(boxLight);
    
    boxLight = new THREE.PointLight(0x00ff00, 5, 20);
    boxLight.position.set(boxCoords.x+r*Math.sqrt(3)/2, 20, boxCoords.z+r/2);
    scene.add(boxLight);
    
    boxLight = new THREE.PointLight(0x0000ff, 5, 20);
    boxLight.position.set(boxCoords.x, 20, boxCoords.z-r);
    scene.add(boxLight);
    
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