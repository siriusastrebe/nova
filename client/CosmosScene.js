import { TextureLoader, BufferGeometry, BufferAttribute, Scene, PerspectiveCamera, Vector2, Vector3, WebGLRenderer, PCFSoftShadowMap, SphereBufferGeometry, Mesh, LineBasicMaterial, AmbientLight, Line, MeshBasicMaterial, MeshPhongMaterial, MeshLambertMaterial, Euler, Quaternion, PointsMaterial, Points, PointLight, StaticDrawUsage, Color, Float32BufferAttribute, Group, ConeGeometry, RepeatWrapping } from 'three';
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
      let shift = Math.trunc(delta * 100);
      // Clamp, but bias towards lower ping
      shift = shift > 10 ? 10 : shift;
      this.start = new Date(this.start.getTime() + shift);
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
let introFrames = 100;

init();

function init() {
  scene = new Scene();
  sceneStars = new Scene();

  const fov = 70;
  const near = 0.1;
  const far = 10000000;
  camera = new PerspectiveCamera(fov, windowWidth() / windowHeight(), near, far);
  camera.position.set(0, 0, -1);
  camera.lookAt(new Vector3(0, 0, -1));

  starCamera = new PerspectiveCamera(fov, windowWidth() / windowHeight(), near, far);
  starCamera.position.set(0, 0, 0);
  starCamera.lookAt(new Vector3(0, 0, 1));

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


  const color1 = new Color( 0x357585 );
  const color2 = new Color( 0x232393 );

  const xoffset = columns % 2 === 1 ? 0 : 500;
  const columns = 10;
  for ( let i=0; i<columns; i++) {
    const vertices = [], colors = [];
    let a = 0;

    const x = i - Math.floor(columns/2);
    vertices.push( x * 1000 + xoffset, 0, -100000, x * 1000 + xoffset, 0, 100000 );
    //vertices.push( 50000, 0, 0, 50000, 0, 0 );

    const color = color1;
    color.toArray( colors, a ); a += 3;
    color.toArray( colors, a ); a += 3;
    color.toArray( colors, a ); a += 3;
    color.toArray( colors, a ); a += 3;
    
    const geometry = new BufferGeometry();
    geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

    const material = new LineBasicMaterial( { vertexColors: true } );

    const line = new Line( geometry, material );
    scene.add(line);
  }

  const rows = 100;
  for ( let j=0; j<=rows; j++) {
    const vertices = [], colors = [];
    let a = 0;
    const x = -Math.floor(columns/2) * 1000 + xoffset;
    const zSubdivision = (j * 200000 / rows);
    const z = -100000 + zSubdivision;
    vertices.push( x, 0, z, -x, 0, z );

    const color = color2;
    color.toArray( colors, a ); a += 3;
    color.toArray( colors, a ); a += 3;
    color.toArray( colors, a ); a += 3;
    color.toArray( colors, a ); a += 3;
    
    const geometry = new BufferGeometry();
    geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

    const material = new LineBasicMaterial( { vertexColors: true } );

    const line = new Line( geometry, material );
    scene.add(line);
  }

  
  //const gridHelper = new GridHelper( 500000, 50, 0x0000ff, 0x808080 );
  //scene.add(gridHelper);

  //let worldAxis = new AxesHelper(2000);
  //scene.add(worldAxis);

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
    const position = new Vector3(controlledAsset.object.position.x, controlledAsset.object.position.y, controlledAsset.object.position.z);
    const orientation = controlledAsset.object.quaternion;

    // For some reason the camera is flipped 180° and mirrored
    const opposite = new Quaternion(1, 0, 0, 0).premultiply(orientation).multiply(new Quaternion(0, 0, 1, 0)).normalize();

    // Adjust so we're kinda looking down on the ship
    const downwardsAdjustment = new Quaternion().setFromEuler(new Euler(-0.4, 0, 0));
    const upwardsAdjustment = new Quaternion().setFromEuler(new Euler(0.4, 0, 0));
    opposite.multiply(downwardsAdjustment);

    const vectorOrientation = new Vector3(0, 0, 1).applyQuaternion(opposite);

    camera.position.x = position.x + vectorOrientation.x * cameraDistance;
    camera.position.y = position.y + vectorOrientation.y * cameraDistance;
    camera.position.z = position.z + vectorOrientation.z * cameraDistance;

    opposite.multiply(upwardsAdjustment);
    camera.setRotationFromQuaternion(opposite);
    // Don't forget to rotate star camera (rooted at origin)
    starCamera.setRotationFromQuaternion(opposite);

    // Ignition
    if (ignition.children.length > 0) {
      ignition.position.x = position.x + -1+Math.random()*2;
      ignition.position.y = position.y + -1+Math.random()*2;
      ignition.position.z = position.z + -1+Math.random()*2;
      ignition.setRotationFromQuaternion(orientation);

      const ignitionAmount = Math.min(((new Date() - ignitionTime) / 200), 1);

      for (let i=0; i<ignition.children.length; i++) {
        const child = ignition.children[i];
        child.scale.x = child.scale.y = child.scale.z = ignitionAmount;
        child.position.z = -i*40 -160 + (1-ignitionAmount)*(60+i*40); // Relative to the group
      }

      if (ignitionLight) {
        const behindOffset = new Vector3(0, 20+Math.random()*8, -160 + -40*ignitionAmount).applyQuaternion(orientation);
        ignitionLight.position.x = position.x + behindOffset.x;
        ignitionLight.position.y = position.y + behindOffset.y;
        ignitionLight.position.z = position.z + behindOffset.z;
      }

    }
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
  if (asset[asset.id] === undefined) {
    let model;
    let bump;
    let object;
    let material;

    // Load Material
    if (asset.material) {
      const m = asset.material;
      const o = {}

      for (let key in m) {
        if (key === 'map' || key === 'bumpMap' || key === 'displacementMap' || key === 'specularMap' || key === 'normalMap') {

          o[key] = await tl(m[key]);

          if (asset.type === 'asteroid') {
            const texture = o[key];
            // Randomize mapping so each asteroid looks unique
            texture.offset = new Vector2(Math.random(), Math.random());
            texture.wrapS = RepeatWrapping;
            texture.wrapT = RepeatWrapping;
            //texture.rotation = Math.random()*Math.pi;
          }
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
      } else if (asset.type === 'projectile') {
        material = new MeshBasicMaterial(o);
      } else if (asset.type === 'asteroid') {
        material = new MeshPhongMaterial(o);
      }
    }

    // Object & Geometry
    if (asset.obj) {
      if (asset.obj === 'sphere') {
        const widthSegments = asset.scale > 1000 ? 196 : 12;
        const heightSegments = widthSegments;
        let geometry = new SphereBufferGeometry(asset.scale, widthSegments, heightSegments);
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

    asset.object = object;
    scene.add(object);
  } else {
    console.log('attempting to add asset that already exists.');
  }
}

export function updateAsset(asset) {
  if (asset.vitals === undefined || asset.vitals.removed !== true) {
    const existing = assets[asset.id];
    if (existing) {
      for (let key in asset) {
        if (existing[key] !== asset[key]) {
          existing[key] = asset[key];
        }
      }
    } else {
      console.error('Unable to update asset, no asset found with with the id ' + asset.id);
    }
  }
}

export function removeAsset(id) {
  const existing = assets[id];
  if (existing) {
    console.log('removed asset', id);
    scene.remove(existing.object);
    delete(assets[id]);
  } else {
    console.error('Unable to remove asset, no asset found with with the id ' + id);
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

let ignition = new Group();
let ignitionLight = new PointLight( 0xff3322, 5, 500 );
let ignitionTime;
scene.add(ignition);
export function ignite() {
  const colors = [0xffff00, 0xff1200];
  const opacities = [0.8, 0.6];
  for (let i=0; i<2; i++) {
    const geometry = new ConeGeometry( 8+i*2, 120+i*80, 12, 1, true );
    const material = new MeshBasicMaterial({color: colors[i], transparent: true, opacity: opacities[i]});
    const cone = new Mesh(geometry, material);
    cone.setRotationFromEuler(new Euler(-Math.PI/2, 0, 0, 'XYZ'));
    cone.position.z = -i*40 -160;
    cone.position.y = 24;
    ignition.add(cone);
  }

  if (controlledAsset) {
    scene.add(ignitionLight);
  }

  ignitionTime = new Date();
}

export function quench() {
  while(ignition.children.length > 0) {
    const child = ignition.children[0];
    scene.remove(child);
    ignition.remove(child);
  }

  if (ignitionLight !== undefined) {
    scene.remove(ignitionLight);
  }
}


export {timer}



// ----------------------------------------------------------------
// Environmental 
// ----------------------------------------------------------------
function createSun() {
  let light = new PointLight( 0xffffff, 0, 0 );
  light.castShadow = false;
  light.position.set(-8000000, 800000, 0);

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
  pos.z = Math.cos(raR) * Math.cos(decR)  * 10000000;
  pos.x = Math.sin(raR) * Math.cos(decR) * 10000000;
  pos.y = Math.sin(decR) * 10000000;
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

