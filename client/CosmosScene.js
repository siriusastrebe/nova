import { TextureLoader, PlaneGeometry, Scene, PerspectiveCamera, Vector3, WebGLRenderer, PCFSoftShadowMap, SphereBufferGeometry, Mesh, MeshLambertMaterial, SpotLight, LineBasicMaterial, AmbientLight, Line, MeshBasicMaterial, MeshPhongMaterial, BufferGeometry, DoubleSide } from 'three';
import { Lensflare, LensflareElement } from "three/examples/jsm/objects/Lensflare";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import starsData from './stars.js';
console.log(starsData);

window.addEventListener( 'resize', onWindowResize, false );

var camera, scene, sceneStars, renderer, controls;
var stars = [];
var width = window.innerWidth - 30;
var height = windowHeight();
var aspect = width / height;

var textureLoader = new TextureLoader();
var objLoader = new OBJLoader();

init();

function init() {
  scene = new Scene();
  sceneStars = new Scene();

  const fov = 40;
  const near = 0.1;
  const far = 200000;
  camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 800);

  renderer = new WebGLRenderer( { antialias: true } );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setSize(width , height);

  createEarth();
  createMoon();
  createStars();

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
function render() {
  // Trick to allow multiple scenes on a single renderer
  renderer.autoClear = false;
  renderer.clear();

  renderer.render(sceneStars, camera);
  renderer.render(scene, camera);
}
function animate() {
  requestAnimationFrame(animate);
  render();
}





// Export functions
export function renderSpace() {
  document.getElementById("cosmosscene").appendChild( renderer.domElement );
}

export function addAsset(asset) {
  let model;

  objLoader.load('/public/SpaceFighter01/SpaceFighter01.obj', (object) => {
    textureLoader.load('/public/SpaceFighter01/F01_512.jpg', (texture) => {
      let material = new MeshBasicMaterial({map: texture});

      object.traverse(function (child) {
        if (child.isMesh) {
          child.material = material;
        }
      });

      scene.add(object);
      render();
    });
  });
}

export function updateAsset(asset) {
  console.log('Updating asset', asset);
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
  var light = new SpotLight( 0xffffff, 3, 0, Math.PI / 256);
  light.target = earth;
  light.castShadow = true;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 200000;
  light.position.set(100000, 0, 0);
  scene.add(light);

  var lensflare = new Lensflare();

  var textureFlare0 = textureLoader.load( "/public/lensflare0.png" );
  var textureFlare3 = textureLoader.load( "/public/lensflare3.png" );
  var textureFlare4 = textureLoader.load( "/public/lensflare4.png" );

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
  var light = new AmbientLight(0xffffff, 1);
  sceneStars.add(light);
  console.log('Stars: ', starsData.length);

  for (let i=0; i<starsData.length; i++) {
    var data = starsData[i];

    var size = 100 - data['Mag'] * 10;
    var sides = 7;

    if (data['Mag'] < -1) {
      size = 180;
      sides = 9;
    }

    var geometry = new SphereBufferGeometry(size, sides, sides);
    var color = approximateStarColor(Number(data['ColorIndex']));
    var material = new MeshPhongMaterial( {color: color} );
    var sphere = new Mesh( geometry, material );

    position(data['Dec'], data['RA'], sphere);
    sphere.userData['starData'] = data;

    stars.push(sphere);
    sceneStars.add(sphere);
  }
}

//function createSaturn() {
//  var saturn = gltf.scene;
//  saturn.scale.set(0.1, 0.1, 0.1);
//  saturn.position.z = 250;
//  saturn.position.y = -20;
//  saturn.position.x = -44;
//  saturn.rotation.x = -0.34;
//  saturn.children[0].receiveShadow = true;
//  saturn.children[1].receiveShadow = true;
//  saturn.children[2].castShadow = true;
//
//  scene.add(saturn)
//
//  createSun(saturn)
//}

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
  var pos = equitorialToCartesian(dec, ra);

  object.position.x = pos.x;
  object.position.y = pos.y;
  object.position.z = pos.z;
}
function equitorialToCartesian(dec, ra) {
  var decR = Number(dec) / 180 * Math.PI;
  var raR = Number(ra) / 24 * Math.PI * 2;
  var pos = {}
  pos.z = Math.cos(raR) * Math.cos(decR)  * 100000;
  pos.x = Math.sin(raR) * Math.cos(decR) * 100000;
  pos.y = Math.sin(decR) * 100000;
  return pos;
}

/*
function onClick(event) {
  var canvas = renderer.domElement
  var bounds = canvas.getBoundingClientRect();
  var mouse = {}
  mouse.x = ( (event.clientX - bounds.left) / canvas.clientWidth ) * 2 - 1;
  mouse.y = - ( (event.clientY - bounds.top) / canvas.clientHeight ) * 2 + 1;
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects(sceneStars.children, true);
  if (intersects.length > 0) {
    for (let i=0; i<intersects.length; i++) {
      var intersect = intersects[i];
      if (intersect.object && intersect.object.userData && intersect.object.userData.starData) {
        var starData = intersect.object.userData.starData;
        console.log('"' + starData.Dec + '", "' + starData.RA + '"');
      }
    }
  }
}
*/
