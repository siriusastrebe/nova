import { TextureLoader, BufferGeometry, BufferAttribute, PlaneGeometry, Scene, PerspectiveCamera, Vector3, Matrix4, WebGLRenderer, PCFSoftShadowMap, SphereBufferGeometry, Mesh, MeshLambertMaterial, SpotLight, LineBasicMaterial, AmbientLight, Line, MeshBasicMaterial, MeshPhongMaterial, DoubleSide, Euler, Quaternion, AxesHelper, GridHelper, MathUtils, Float32BufferAttribute, PointsMaterial, Points, ShaderMaterial, AdditiveBlending, NormalBlending, Color, DirectionalLight, PointLight, SVGRenderer, SVGObject, TetrahedronGeometry, DynamicDrawUsage, StaticDrawUsage  } from 'three';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CSM from 'three-csm';
import starsData from './stars-2500.js';

class Timer {
  constructor() {
    this.start = undefined;
    this.ticks = 0;
    this.startTick = 0;
    this.lastTick = undefined;

    this.lastestPing = undefined;
    this.roundTrips = [];
  }
  setTicks(ticks, serverTime) {
    this.ticks = ticks;
    this.lastTick = new Date();

    // Adjust start time to match average ping
    const delta = this.delta();
    if (Math.abs(delta) > 0.01) {
      this.start = new Date(this.start.getTime() + Math.trunc(delta * 100));
    }
  }
  startTimer(ticks, serverTime) {
    this.start = new Date();
    this.ticks = ticks;
    this.startTick = ticks;
    this.lastTick = new Date();
  }
  delta() {
    return (new Date() - this.start - (this.ticks - this.startTick) * 100) / 1000;
  }
  roundtrip(start, end, serverTime) {
    this.latestPing = end - start;

    const trip = {
      start: start,
      end: end,
      serverTime: serverTime
    }

    this.roundTrips.unshift(trip);
    // Shave off for efficiency
    if (this.roundTrips.length > 150) this.roundTrips.length = 100;


    document.getElementById('ping').innerHTML = Math.floor(this.latestPing);
  }
}
let timer = new Timer();
// ----------------------------------------------------------------
// Initialize the scene
// ----------------------------------------------------------------
let camera, starCamera, scene, sceneStars, renderer, controls;
let stars = [];
let windowWidth = () => window.innerWidth;
let windowHeight = () => window.innerHeight;
let cameraDistance = 800;

let textureLoader = new TextureLoader();
let objLoader = new OBJLoader();
let svgLoader = new SVGLoader();
// Promisfy Loaders
const tl = promisify(textureLoader.load, textureLoader);
const ol = promisify(objLoader.load, objLoader);
const sl = promisify(svgLoader.load, svgLoader);

let cascadingShadowMap;

let assets = {};
let controlledAsset;

init();

function init() {
  scene = new Scene();
  sceneStars = new Scene();


  const fov = 70;
  const near = 0.1;
  const far = 1000000;
  camera = new PerspectiveCamera(fov, windowWidth() / windowHeight(), near, far);
  camera.position.set(0, 0, -300);

  starCamera = new PerspectiveCamera(fov, windowWidth() / windowHeight(), near, far);
  starCamera.position.set(0, 0, 0);

  renderer = new WebGLRenderer( { antialias: true } );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  cascadingShadowMap = new CSM.default({
    maxFar: camera.far,
    lightFar: 100000,
    cascades: 4,
    shadowMapSize: 1024,
    lightDirection: new Vector3(10, -1, 0).normalize(),
    lightIntensity: 2.0,
    camera: camera,
    parent: scene
  });

  createSun();
  createStars();

  renderer.setSize(windowWidth(), windowHeight());

  const gridHelper = new GridHelper( 4000, 40, 0x0000ff, 0x808080 );
  scene.add(gridHelper);

  let worldAxis = new AxesHelper(2000);
  scene.add(worldAxis);

  requestAnimationFrame(() => animate(0));
}

window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
  camera.aspect = windowWidth() / windowHeight();
  camera.updateProjectionMatrix();

  starCamera.aspect = windowWidth() / windowHeight();
  starCamera.updateProjectionMatrix();

  renderer.setSize(windowWidth(), windowHeight());
}

// ----------------------------------------------------------------
// Game Loop
// ----------------------------------------------------------------
function render() {
  // Update each asset's position and rotation by dt, the fraction of a second that has elapsed since last render()
  Object.keys(assets).forEach((id) => {
    const asset = assets[id];

    // asset.t stores the server timestamp
    let dt = timer.delta();

    let x = asset.x + asset.dx * dt + asset.ddx * dt * dt / 2;
    let y = asset.y + asset.dy * dt + asset.ddy * dt * dt / 2;
    let z = asset.z + asset.dz * dt + asset.ddz * dt * dt / 2;

    const di = asset.di*dt + asset.ddi*dt*dt/2;
    const dj = asset.dj*dt + asset.ddj*dt*dt/2;
    const dk = asset.dk*dt + asset.ddk*dt*dt/2;

    const ei = di;
    const ej = dj;
    const ek = dk;

    const orientation = new Quaternion(asset.i, asset.j, asset.k, asset.w);
    const dorientation = new Euler(ei, ej, ek, 'XYZ');
    orientation.multiply(new Quaternion().setFromEuler(dorientation));
    orientation.normalize();

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
    // Don't forget to rotate star camera (rooted at origin)
    starCamera.setRotationFromQuaternion(opposite);
  }

  // Trick to allow multiple scenes on a single renderer
  renderer.autoClear = false;
  renderer.clear();

  cascadingShadowMap.update(camera.matrix);
  renderer.render(sceneStars, starCamera);
  renderer.render(scene, camera);
}

let lastFrame = new Date();
let lastFps = new Date();
function animate(count) {
  const delta = new Date() - lastFrame;
  lastFrame = new Date();

  if (new Date() - lastFps >= 1000) {
    document.getElementById('fps').innerHTML = Math.floor(count);
    count = 0;
    lastFps = new Date();
    const workload = renderer.info.render;
    const str = `${workload.calls} calls, ${workload.triangles} triangles, ${workload.points} points, ${workload.lines} lines`;  
    document.getElementById('workload').innerHTML = str;
  }

  render();
  requestAnimationFrame(() => animate(count+1));
}


// ----------------------------------------------------------------
// Export functions
// ----------------------------------------------------------------
export function renderSpace() {
  document.getElementById("cosmosscene").appendChild( renderer.domElement );
}

export async function addAsset(asset) {
  console.log('Adding asset', asset.name);

  assets[asset.id] = asset;

  let model;
  let bump;
  let object;
  let material;
  let texture;
  let textures = [];

  // Load Material
  if (asset.material) {
    const m = asset.material;
    const o = {}

    for (let key in m) {
      if (key === 'map' || key === 'bumpMap' || key === 'displacementMap' || key === 'specularMap') {
        o[key] = await tl(m[key]);
      } else {
        o[key] = m[key];
      }
    }

    if (asset.type === 'player') {
      material = new MeshPhongMaterial(o);
      //cascadingShadowMap.setupMaterial(material); // must be called to pass all CSM-related uniforms to the shader
    } else if (asset.type === 'environment') {
      material = new MeshPhongMaterial(o);
      cascadingShadowMap.setupMaterial(material); // must be called to pass all CSM-related uniforms to the shader
    }
  }

  // Object & Geometry
  if (asset.obj) {
    if (asset.obj === 'sphere') {
      let geometry = new SphereBufferGeometry(1000, 196, 196);
      object = new Mesh(geometry, material);
    } else {
      object = await ol(asset.obj);

      // Apply material to mesh
      object.traverse(function (child) {
        if (child.isMesh) {
          child.material = material;
        }
      });
    }
  }

  object.receiveShadow = false;
  object.castShadow = false;


  if (asset.scale !== undefined) {
    object.scale.x = object.scale.y = object.scale.z = asset.scale;
  }

  asset.object = object;
  scene.add(object);
}


export {timer}

export function updateAsset(asset) {
  const existing = assets[asset.id];
  if (existing) {
    for (let key in asset) {
      if (existing[key] !== asset[key]) {
        //if (Math.abs(existing[key] - asset[key]) > 0.1) {
        //  console.log(key, existing[key] - asset[key]);
        //}
        existing[key] = asset[key];
      }
    }
  } else {
    console.log('Unable to update asset, no asset found with with the id ' + asset.id);
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
function createSun() {
  let light = new PointLight( 0xffffff, 0, 0 );
  light.castShadow = false;
  light.position.set(-800000, 80000, 0);

  let lensflare = new Lensflare();

  let textureFlare0 = textureLoader.load( "/public/lensflare0.png" );
  let textureFlare3 = textureLoader.load( "/public/lensflare3.png" );
  let textureFlare4 = textureLoader.load( "/public/lensflare4.png" );

  lensflare.addElement( new LensflareElement( textureFlare0, 1000, 0 ) );
  lensflare.addElement( new LensflareElement( textureFlare4, 10, 0.04 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 60, 0.6 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 70, 0.7 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 170, 0.9 ) );
  lensflare.addElement( new LensflareElement( textureFlare3, 70, 1 ) );

  light.add(lensflare);
  scene.add(light);
}

function createStars() {
  console.log('drawing stars');

  // https://threejs.org/examples/#webgl_buffergeometry_drawrange

  // I don't think there's any way to affect the star size without writing our own custom shader
  // https://discourse.threejs.org/t/how-to-display-points-of-different-sizes-using-three-points/4751/5
  // So instead, we're going to bucket stars into their appropriate sizes and assign them a PointsMaterial
  // with the size hardcoded. I don't think we'll ever want background stars to be bigger than 4 pixels,
  // where you start to see the square shape of the default shader.

  const materials = [new PointsMaterial({
    size: 1,
    sizeAttenuation: false,
    vertexColors: true
  }), new PointsMaterial({
    size: 2,
    sizeAttenuation: false,
    vertexColors: true
  }), new PointsMaterial({
    size: 3,
    sizeAttenuation: false,
    vertexColors: true
  }), new PointsMaterial({
    size: 4,
    sizeAttenuation: false,
    vertexColors: true
  })];

  const sizedBuckets = [[], [], [], []];
  for (let i=0; i<starsData.length; i++) {
    const data = starsData[i];

    let mag = data['Mag'];
    let rgb = approximateStarColor(Number(data['ColorIndex']));
    let colors = rgb.split('(')[1].split(')')[0].split(',');
    let pos = equitorialToCartesian(data['Dec'], data['RA']);

    const d = {colors: colors, pos: pos}
    if (mag < 0) {
      sizedBuckets[3].push(d);
    } else if (mag < 2) {
      sizedBuckets[2].push(d);
    } else if (mag < 4.5) {
      sizedBuckets[1].push(d);
    } else {
      sizedBuckets[0].push(d);
    }
  }


  for (let bucket=0; bucket<4; bucket++) {
    const stars = sizedBuckets[bucket];
    const particles = new BufferGeometry();
    const particlePositions = new Float32Array( starsData.length * 3 );
    const particleColors = new Uint8Array( starsData.length * 3 );

    for (let i=0; i<stars.length; i++) {
      const pos = stars[i].pos;
      const colors = stars[i].colors;

      particlePositions[ i * 3 ] = pos.x;
      particlePositions[ i * 3 + 1 ] = pos.y;
      particlePositions[ i * 3 + 2 ] = pos.z;

      particleColors[ i * 3 ] = Number(colors[0]);
      particleColors[ i * 3 + 1 ] = Number(colors[1]);
      particleColors[ i * 3 + 2 ] = Number(colors[2]);
    }

    particles.setAttribute( 'position', new BufferAttribute( particlePositions, 3 ).setUsage( StaticDrawUsage ) );
    particles.setAttribute( 'color', new BufferAttribute( particleColors, 3, true ) );

    // create the particle system
    const pointCloud = new Points( particles, materials[bucket] );
    sceneStars.add(pointCloud);
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
function promisify(f, that) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      f.call(that, ...args, (args2, e) => {
        if (e) {
          reject(e);
        } else {
          resolve(args2);
        }
      });
    });
  }
}

