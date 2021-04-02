import { TextureLoader, PlaneGeometry, Scene, PerspectiveCamera, Vector3, Matrix4, WebGLRenderer, PCFSoftShadowMap, SphereBufferGeometry, Mesh, MeshLambertMaterial, SpotLight, LineBasicMaterial, AmbientLight, Line, MeshBasicMaterial, MeshPhongMaterial, BufferGeometry, DoubleSide, Euler, Quaternion, AxesHelper, GridHelper } from 'three';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import starsData from './stars.js';
console.log(starsData);

window.addEventListener( 'resize', onWindowResize, false );

let camera, scene, sceneStars, renderer, controls;
let stars = [];
let width = window.innerWidth - 30;
let height = windowHeight();
let aspect = width / height;
let cameraDistance = 800;

let textureLoader = new TextureLoader();
let objLoader = new OBJLoader();

let assets = {};
let controlledAsset;

init();

function init() {
  scene = new Scene();
  sceneStars = new Scene();

  const fov = 75;
  const near = 0.1;
  const far = 200000;
  camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 0);

  renderer = new WebGLRenderer( { antialias: true } );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setSize(width , height);

  createEarth();
  createMoon();
  createStars();

  const gridHelper = new GridHelper( 4000, 40, 0x0000ff, 0x808080 );
  sceneStars.add(gridHelper);

  let worldAxis = new AxesHelper(2000);
  sceneStars.add(worldAxis);

  render();
  requestAnimationFrame(animate);

  //renderer.domElement.addEventListener('click', onClick, false)
  controls = new OrbitControls( camera, renderer.domElement );
  controls.update();
}
function windowHeight() {
  return Math.max(window.innerHeight * 1.05, 600);
}
function onWindowResize(){
  camera.aspect = (window.innerWidth - 30) / windowHeight();
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, windowHeight() );
}

let t = new Date();

function render() {
  // Trick to allow multiple scenes on a single renderer
  renderer.autoClear = false;
  renderer.clear();

//  averagedt = (averagedt * 0.8) + (dt * (1-0.8));

  // Update each asset's position and rotation by dt, the fraction of a second that has elapsed since last render()
  Object.keys(assets).forEach((id) => {
    const asset = assets[id];

    // asset.t stores the local timestamp of when the asset was last updated with server gamestate
    let dt = (new Date() - asset.t) / 1000;

    let x = asset.x + asset.dx * dt + 1/2 * asset.ddx * dt * dt;
    let y = asset.y + asset.dy * dt + 1/2 * asset.ddy * dt * dt;
    let z = asset.z + asset.dz * dt + 1/2 * asset.ddz * dt * dt;

    const orientation = new Quaternion(asset.i, asset.j, asset.k, asset.w);

    const rotationAxis = new Vector3(asset.di, asset.dj, asset.dk);
    const rotationAngle = asset.da * dt; 

    const torqueAxis = new Vector3(asset.ddi, asset.ddj, asset.ddk);
    const torqueAngle = 1/2 * asset.dda * dt * dt; 

    const rotationQuaternion = new Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);
    const torqueQuaternion = new Quaternion().setFromAxisAngle(torqueAxis, torqueAngle);

    orientation.multiply(rotationQuaternion);
    orientation.multiply(torqueQuaternion);
    orientation.normalize();

    rotationQuaternion.multiply(torqueQuaternion);

//    function quaternionToAxisAngle(q) {
//      // https://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm
//      const payload = {}; 
//      q.normalize();
//  
//      payload.angle = 2 * Math.acos(q.w);
//      double s = Math.sqrt(1-q.w*q.w); // assuming quaternion normalised then w is less than 1, so term always positive.
//      if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
//        // if s close to zero then direction of axis not important. If it is important that axis is normalised then replace with x=1; y=z=0;
//        payload.axis = new Quaternion(q.x, q.y. q.z);
//      } else {
//        payload.axis = new Quaternion(q.x/s, q.y/s. q.z/s);
//      }   
//    }
//
//    const {axis, angle} = quaternionToAxisAngle(rotationQuaternion);

    if (asset.object) {
      asset.object.position.x = x;
      asset.object.position.y = y;
      asset.object.position.z = z;

      asset.object.setRotationFromQuaternion(orientation);
    }
  });

  // Camera fixing
  if (controlledAsset && controlledAsset.object) {
    const orientation = controlledAsset.object.quaternion;

    // For some reason the camera is flipped 180° and mirrored
    const opposite = new Quaternion(1, 0, 0, 0).premultiply(orientation).multiply(new Quaternion(0, 0, 1, 0)).normalize();

    // Adjust so we're kinda looking down on the ship
    const downwardsAdjustment = new Quaternion().setFromEuler(new Euler(-0.4, 0, 0));
    const upwardsAdjustment = new Quaternion().setFromEuler(new Euler(0.4, 0, 0));
    opposite.multiply(downwardsAdjustment);

    const vectorOrientation = new Vector3(0, 0, 1).applyQuaternion(opposite);

    camera.position.x = controlledAsset.object.position.x + vectorOrientation.x * cameraDistance;
    camera.position.y = controlledAsset.object.position.y + vectorOrientation.y * cameraDistance;
    camera.position.z = controlledAsset.object.position.z + vectorOrientation.z * cameraDistance;

    opposite.multiply(upwardsAdjustment);
    camera.setRotationFromQuaternion(opposite);
  }

  renderer.render(sceneStars, camera);
  renderer.render(scene, camera);
}
function animate() {
  render();
  requestAnimationFrame(animate);
}





// Export functions
export function renderSpace() {
  document.getElementById("cosmosscene").appendChild( renderer.domElement );
}

export function addAsset(asset) {
  let model;

  assets[asset.id] = asset;
  objLoader.load(asset.obj, (object) => {
    textureLoader.load(asset.texture, (texture) => {
      let material = new MeshBasicMaterial({map: texture});

      object.traverse(function (child) {
        if (child.isMesh) {
          child.material = material;
        }
      });

      asset.object = object;

      scene.add(object);
      render();
    });
  });
}

export function updateAsset(asset) {
  const existing = assets[asset.id];
  if (existing) {
    existing.t = new Date();

    for (let key in asset) {
      if (existing[key] !== asset[key]) {
        if (Math.abs(existing[key] - asset[key]) > 0.1) {
          //console.log(key, existing[key] - asset[key]);
        }
        existing[key] = asset[key];
      }
    }
  } else {
    console.error('Unable to update asset, no asset found with with the id ' + asset.id);
  }
}

export function setControlledAsset(asset) {
  const existing = assets[asset.id];
  if (existing) {
    controlledAsset = existing;
  } else {
    console.error('Unable to setControlledAsset, no asset found with with the id ' + asset.id);
  }
}



// ----------------------------------------------------------------
// Environmental 
// ----------------------------------------------------------------
function createEarth() {
  textureLoader.load('/public/land_ocean_ice_cloud_1024.jpg', (texture) => {
    const geometry = new SphereBufferGeometry( 50, 64, 64 );
    const material = new MeshLambertMaterial({map: texture});
    const earth = new Mesh( geometry, material );

    window.earth = earth;

    earth.position.z = 0;
    earth.position.y = 0;
    earth.position.x = -2000;
    earth.rotation.y = 2.5;

    earth.scale.x = earth.scale.y = earth.scale.z = 20;
    earth.receiveShadow = true;

    scene.add(earth);
    createSun(earth);
  }, function (a, b, c) {
    //console.log('progress', a.loaded / a.total, new Date() - t);
  }, function ( error ) {
    console.log( error );
  });
}

function createSun(earth) {
  let light = new SpotLight( 0xffffff, 3, 0, Math.PI / 256);
  light.target = earth;
  light.castShadow = true;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 200000;
  light.position.set(100000, 0, 0);
  scene.add(light);

  let lensflare = new Lensflare();

  let textureFlare0 = textureLoader.load( "/public/lensflare0.png" );
  let textureFlare3 = textureLoader.load( "/public/lensflare3.png" );
  let textureFlare4 = textureLoader.load( "/public/lensflare4.png" );

  lensflare.addElement( new LensflareElement( textureFlare0, 700, 0 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 60, 0.6 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 70, 0.7 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 120, 0.9 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 70, 1 ) );

  light.add(lensflare);
}
function createMoon() {
  textureLoader.load('/public/usgsmoon.jpg', (texture) => {
    const geometry = new SphereBufferGeometry( 50, 32, 32 );
    const material = new MeshLambertMaterial({map: texture});
    const moon = new Mesh( geometry, material );

    window.moon = moon;

    moon.position.z = 500;
    moon.position.y = 120;
    moon.position.x = 400;
    moon.rotation.y = Math.PI / 3 * 5;

    moon.scale.x = moon.scale.y = moon.scale.z = 3;
    moon.receiveShadow = true;

    scene.add(moon)
  }, undefined, function ( error ) {
    console.error( error );
  });
}
function createStars() {
  let light = new AmbientLight(0xffffff, 1);
  sceneStars.add(light);
  console.log('Stars: ', starsData.length);

  for (let i=0; i<starsData.length; i++) {
    let data = starsData[i];

    let size = 100 - data['Mag'] * 10;
    let sides = 7;

    if (data['Mag'] < -1) {
      size = 180;
      sides = 9;
    }

    let geometry = new SphereBufferGeometry(size, sides, sides);
    let color = approximateStarColor(Number(data['ColorIndex']));
    let material = new MeshPhongMaterial( {color: color} );
    let sphere = new Mesh( geometry, material );

    position(data['Dec'], data['RA'], sphere);
    sphere.userData['starData'] = data;

    stars.push(sphere);
    sceneStars.add(sphere);
  }
}

function randomStarColor() {
  return 'rgb('+randomRGB()+','+randomRGB()+','+randomRGB()+')';

  function randomRGB() {
    return Math.floor(Math.random() * 28) + 288;
  }
}

function approximateStarColor(bv) {
  const spectrum = [
    'rgb(255, 239, 153)',
    'rgb(255, 240, 159)',
    'rgb(255, 242, 165)',
    'rgb(255, 243, 171)',
    'rgb(255, 244, 178)',
    'rgb(255, 245, 184)',
    'rgb(255, 246, 191)',
    'rgb(255, 247, 198)',
    'rgb(255, 248, 205)',
    'rgb(255, 249, 212)',
    'rgb(255, 250, 219)',
    'rgb(255, 251, 226)',
    'rgb(255, 251, 234)',
    'rgb(255, 252, 241)',
    'rgb(255, 253, 249)',
    'rgb(255, 253, 255)',
    'rgb(255, 254, 255)',
    'rgb(252, 254, 255)',
    'rgb(248, 254, 255)',
    'rgb(244, 254, 255)',
    'rgb(240, 254, 255)',
    'rgb(236, 254, 255)',
    'rgb(231, 254, 255)',
    'rgb(227, 254, 255)',
    'rgb(223, 254, 255)'
  ]

  if (bv < -0.5) {
    return spectrum[spectrum.length -1];
  }
  if (bv > 2) {
    return spectrum[0];
  }

  const rgb = spectrum[Math.floor((-bv + 2) / 2.5 * spectrum.length)]
  return rgb;
}



// ----------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------
function position(dec, ra, object) {
  let pos = equitorialToCartesian(dec, ra);

  object.position.x = pos.x;
  object.position.y = pos.y;
  object.position.z = pos.z;
}
function equitorialToCartesian(dec, ra) {
  let decR = Number(dec) / 180 * Math.PI;
  let raR = Number(ra) / 24 * Math.PI * 2;
  let pos = {}
  pos.z = Math.cos(raR) * Math.cos(decR)  * 100000;
  pos.x = Math.sin(raR) * Math.cos(decR) * 100000;
  pos.y = Math.sin(decR) * 100000;
  return pos;
}

function smoothOrientation(asset, orientation) {
  const currentOrientation = asset.object.quaternion;
  const discrepancy = currentOrientation.angleTo(orientation);
console.log(discrepancy);
  currentOrientation.rotateTowards(orientation, discrepancy <= 0.01 ? discrepancy : discrepancy / 2); 
}
