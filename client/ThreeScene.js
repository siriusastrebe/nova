import { TextureLoader, PlaneGeometry, Scene, PerspectiveCamera, Vector3, WebGLRenderer, PCFSoftShadowMap, SphereBufferGeometry, Mesh, MeshLambertMaterial, SpotLight, LineBasicMaterial, AmbientLight, Line, MeshBasicMaterial, MeshPhongMaterial, BufferGeometry, DoubleSide } from 'three'
import { Lensflare, LensflareElement } from "three/examples/jsm/objects/Lensflare";
import starsData from './stars-limited.js';


console.log(starsData);

var camera, sceneEarth, sceneStars, renderer;
var earth, moon;
var stars = [];
var width = window.innerWidth - 30;
var height = windowHeight();
var aspect = width / height;
var siriusGlow;

let animationDuration = undefined;
var hour = 12;

var textureLoader = new TextureLoader();
var textureFlare0 = textureLoader.load( "/public/lensflare0.png" );
var textureFlare3 = textureLoader.load( "/public/lensflare3.png" );
var textureFlare4 = textureLoader.load( "/public/lensflare4.png" );

window.addEventListener( 'resize', onWindowResize, false );

init()

function init() {
  sceneEarth = new Scene();
  sceneStars = new Scene();

  const fov = 40;
  const near = 0.1;
  const far = 4000;
  camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 350);

  camera.lookAt(new Vector3(0, 0, 0));

  renderer = new WebGLRenderer( { antialias: true } );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setSize(width , height);

  createStars();
  createSiriusGlow();
  createCanisMajor()

  let t = new Date();

  textureLoader.load('/public/land_ocean_ice_cloud_1024.jpg', (texture) => {
    const geometry = new SphereBufferGeometry( 50, 64, 64 );
    const material = new MeshLambertMaterial({map: texture});
    earth = new Mesh( geometry, material );

    window.earth = earth;

    earth.position.z = 300;
    earth.position.y = -20;
    earth.position.x = -97.6;
    earth.rotation.y = 2.5;

    earth.scale.x = earth.scale.y = earth.scale.z = 2;
    earth.receiveShadow = true;

    sceneEarth.add(earth);
    createSun(earth);

    startAnimation();
  }, function (a, b, c) {
    console.log('progress', a.loaded / a.total, new Date() - t);
  }, function ( error ) {
    console.log( error );
  });

  textureLoader.load('/public/usgsmoon.jpg', (texture) => {
    const geometry = new SphereBufferGeometry( 50, 32, 32 );
    const material = new MeshLambertMaterial({map: texture});
    const moon = new Mesh( geometry, material );

    window.moon = moon;

    moon.position.z = 500;
    moon.position.y = 120;
    moon.position.x = -400;
    moon.rotation.y = Math.PI / 3 * 5;

    moon.scale.x = moon.scale.y = moon.scale.z = 0.3;
    moon.receiveShadow = true;

    sceneEarth.add(moon)
  }, undefined, function ( error ) {
    console.error( error );
  });

  //renderer.domElement.addEventListener('click', onClick, false)
}
function windowHeight() {
  return Math.max(window.innerHeight * 1.05, 600);
}
function onWindowResize(){
  camera.aspect = (window.innerWidth - 30) / windowHeight();
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth - 30, windowHeight() );
}



function createSun(earth) {
  var light = new SpotLight( 0xffffff, 12, 4000, Math.PI / 32);
  light.target = earth;
  light.castShadow = true;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 4000;
  light.position.set(0, 0, -3000);
  sceneEarth.add(light);

  var lensflare = new Lensflare();

  lensflare.addElement( new LensflareElement( textureFlare0, 700, 0 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 60, 0.6 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 70, 0.7 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 120, 0.9 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 70, 1 ) );

  light.add(lensflare);
}
function createStars() {
  var light = new AmbientLight(0xffffff, 1);
  sceneStars.add(light);
  console.log('Stars: ', starsData.length);

  for (let i=0; i<starsData.length; i++) {
    var data = starsData[i];

    var size = 5 - data['Mag'] * 0.8;
    var sides = 5;

    if (data['Mag'] < -1) {
      size = 12;
      sides = 9;
    }

    var geometry = new SphereBufferGeometry( size, sides, sides );
    var color = approximateStarColor(Number(data['ColorIndex']));
    var material = new MeshPhongMaterial( {color: color} );
    var sphere = new Mesh( geometry, material );

    position(data['Dec'], data['RA'], sphere);
    sphere.userData['starData'] = data;

    stars.push(sphere);
    sceneStars.add(sphere);
  }
}
function animateStars() {
  hour += 0.001;

  for (let i=0; i<starsData.length; i++) {
    var data = starsData[i];
    var sphere = stars[i];
    position(data['Dec'], data['RA'], sphere);
  }
}


function animate() {
  //requestAnimationFrame(animate);

  if (animationDuration !== undefined) {
    requestAnimationFrame(animate);
    animationDuration += 1;

    var t = animationDuration / 400;
    t = Math.min(Math.pow(t, 2), 1);
    var quadEased = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    var angle = (Math.PI * .60) * quadEased;
    var newCameraDistance = 350 + quadEased * 400;
    camera.position.set(Math.sin(angle) * newCameraDistance, quadEased * quadEased * 220, Math.cos(angle) * newCameraDistance);
    camera.lookAt(new Vector3(0, 0, 0));
  }

  if (animationDuration > 400) {
    animationDuration = undefined;
    slowAnimate();
  }

  render();
}

function slowAnimate() {
  setTimeout(() => {
    requestAnimationFrame(() => {
      slowAnimate();
    });
  }, 150);

  earth.rotation.y = earth.rotation.y + 0.003;
  const flickerBv = Number(starsData[0]['ColorIndex']) + Math.random() - 0.5;
  const flickerColor = approximateStarColor(flickerBv);
  //const flickerColor = 'rgb(' + Math.floor(Math.random() * 255) + ', 255, 255)';
  const rgb = flickerColor.substring(4, flickerColor.length - 1).split(',').map((a) => a/255);
  stars[0].material.color.setRGB(rgb[0], rgb[1], rgb[2])
  if (siriusGlow) {
    siriusGlow.material.color.setRGB(rgb[0], rgb[1], rgb[2])
  }

  render();
}
function render() {
  // Trick to allow multiple scenes on a single renderer
  renderer.autoClear = false;
  renderer.clear();

  renderer.render(sceneStars, camera);
  renderer.render(sceneEarth, camera);
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


export function startAnimation() {
  requestAnimationFrame(animate);
  animationDuration = 0;
}

export function renderSpace() {
  document.getElementById("threescene").appendChild( renderer.domElement );
}



function createSiriusGlow() {
  var material = new MeshBasicMaterial({
    map: textureFlare4
  });

  material.transparent = true;
  material.opacity = 0.4;
  // This allow us to see the 2d image from both sides
  material.side = DoubleSide;

  var geometry = new PlaneGeometry(160, 160);
  var mesh = new Mesh(geometry, material);

  siriusGlow = mesh;

  var data = starsData[0];
  position(data['Dec'], data['RA'], mesh);

  mesh.lookAt(new Vector3(0, 0, 0));

  sceneEarth.add(mesh);
}


function position(dec, ra, object) {
  var pos = equitorialToCartesian(dec, ra);

  object.position.x = pos.x;
  object.position.y = pos.y;
  object.position.z = pos.z;
}
function equitorialToCartesian(dec, ra) {
  var decR = Number(dec) / 180 * Math.PI;
  var raR = (Number(ra) + hour) / 24 * Math.PI * 2;
  var pos = {}
  pos.z = Math.cos(raR) * Math.cos(decR) * 1;
  pos.x = Math.sin(raR) * Math.cos(decR) * 1;
  pos.y = Math.sin(decR) * 1;
  return pos;
}

function createCanisMajor() {
  var material = new LineBasicMaterial({
    color: 0xaaaaaa,
  });

  var constellationPositions = [
    [
      equitorialToCartesian("-16.71314306", "6.7525694"), // Sirius
      equitorialToCartesian("-23.83330131", "7.05040932"),
      equitorialToCartesian("-26.39320776", "7.13985723"),
      equitorialToCartesian("-27.93484165", "7.02865325"),
      equitorialToCartesian("-28.97208931", "6.9770963"), // Adhara
      equitorialToCartesian("-24.18422296", "6.90220967"),
      equitorialToCartesian("-19.25570928", "6.61138858"),
      equitorialToCartesian("-17.95591658", "6.37832983"),
      equitorialToCartesian("-16.71314306", "6.7525694"),
      equitorialToCartesian("-17.05424675", "6.93561842"),
      equitorialToCartesian("-15.63325876", "7.06263699"),
      equitorialToCartesian("-12.03859273", "6.90318908"),
      equitorialToCartesian("-17.05424675", "6.93561842")
    ],
    [
      equitorialToCartesian("-26.39320776", "7.13985723"),
      equitorialToCartesian("-26.77268601", "7.24685045"),
      equitorialToCartesian("-29.30311979", "7.40158473")
    ]
  ]

  for (var i=0; i<constellationPositions.length; i++) {
    var points = [];
    for (var j=0; j<constellationPositions[i].length; j++) {
      var p = constellationPositions[i][j];
      points.push( new Vector3(p.x, p.y, p.z) );
    }

    var geometry = new BufferGeometry().setFromPoints( points );
    var line = new Line( geometry, material );
    sceneStars.add( line );
  }
}
function createSaturn() {
  var saturn = gltf.scene;
  saturn.scale.set(0.1, 0.1, 0.1);
  saturn.position.z = 250;
  saturn.position.y = -20;
  saturn.position.x = -44;
  saturn.rotation.x = -0.34;
  saturn.children[0].receiveShadow = true;
  saturn.children[1].receiveShadow = true;
  saturn.children[2].castShadow = true;

  sceneEarth.add(saturn)

  createSun(saturn)
}
