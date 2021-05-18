const port            = 80;
const fs              = require('fs');
const ejs             = require('ejs');
const path            = require('path');
const feathers        = require('@feathersjs/feathers');
const express         = require('@feathersjs/express');
const socketio        = require('@feathersjs/socketio');
const configuration   = require('@feathersjs/configuration');
const feathersKnex    = require('feathers-knex');
const authService     = require('./feathers/auth');
const accountsService = require('./feathers/services/accounts/accounts.service.js');
const sol             = require('./solar-systems/sol.js');

THREE           = require('three'); 
require('three/examples/js/loaders/OBJLoader');// Requires THREE to be a global variable
const objLoader = new THREE.OBJLoader();
const ol              = promisify(objLoader.load, objLoader);
//const OBJLoader       = require('three/examples/jsm/loaders/OBJLoader.js');

const knex            = require('knex')({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'sirius',
    database: 'feathers'
  }
});

// ---- Feathers App ----
const app = express(feathers());                 // Creates an ExpressJS compatible Feathers application
app.use(express.json());                         // Parse HTTP JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded params
app.configure(express.rest());                   // Add REST API support
app.configure(socketio((io) => {                 // Configure Socket.io real-time APIs
  io.use((socket, next) => {
    socket.feathers.socketId = socket.id;        // Provides socketId as an attribute of connection
    socket.feathers.socket = socket;             // Lets us access and emit to the socket directly
    next();
  });
}));
app.configure(configuration());                  // Apply configuration located in default/config.json
app.use(express.errorHandler());                 // Register a nicer error handler than the default Express one
app.use(express.static(__dirname));              // Host static files from the current folder
app.configure(authService);


// ---- Feathers Services ----
accountsService(app, knex);
class UserInputsService {
  constructor() {
    this.users = {}
  }
  async find() {
    return this.users;
  }
  async create(data, params) {
    const userInput = {
      id: data.id,
      forward: false,
      back: false,
      left: false,
      right: false,
      clockwise: false,
      counterclockwise: false,
      space: false,
      mousedown: false,
    }
    this.users[data.id] = userInput;
  }
  async patch(id, params, c) {
    // Ignore user provided ID, use socket id instead
    const socketId = c.connection.socketId;
    const userInput = this.users[socketId];

    for (let key in params) {
      const value = params[key];
      if (key in userInput) {
        userInput[key] = value;
      }
    }

    //setTimeout(async () => {
      c.connection.socket.emit('roundtrip', {t: new Date().getTime(), start: id});
    //}, 100);

    return userInput;
  }
}

class AssetsService {
  constructor() {
    this.assets = {};
    this.interactiveAssets = [];
    this.assetsBySocket = {};
    this.idcounter = 0;
    this.events = ['networktick', 'roundtrip'];
  }
  async create(data, params) {
    const id = this.idcounter;

    const asset = {
      id: id,
      name: data.name,
      t: new Date().getTime(),
      obj: data.obj,
      material: data.material,
      bump: data.bump,
      attached: data.attached,
      x: data.x !== undefined ? data.x : 0,
      y: data.y !== undefined ? data.y : 0,
      z: data.z !== undefined ? data.z : 0,
      dx: data.dx !== undefined ? data.dx : 0,
      dy: data.dy !== undefined ? data.dy : 0,
      dz: data.dz !== undefined ? data.dz : 0,
      ddx: data.ddx !== undefined ? data.ddx : 0,
      ddy: data.ddy !== undefined ? data.ddy : 0,
      ddz: data.ddz !== undefined ? data.ddz : 0,
      w: data.w !== undefined ? data.w : 1,
      i: data.i !== undefined ? data.i : 0,
      j: data.j !== undefined ? data.j : 0,
      k: data.k !== undefined ? data.k : 0,
      di: data.di !== undefined ? data.di : 0,
      dj: data.dj !== undefined ? data.dj : 0,
      dk: data.dk !== undefined ? data.dk : 0,
      ddi: data.ddi !== undefined ? data.ddi : 0,
      ddj: data.ddj !== undefined ? data.ddj : 0,
      ddk: data.ddk !== undefined ? data.ddk : 0,
      radius: data.radius,
      interactive: data.interactive,
      vitals: data.vitals,
      weapons: data.weapons,
      scale: data.scale,
      type: data.type,
      subtype: data.subtype,
      socketId: data.socketId
    }

    this.assets[id] = asset;
    if (data.interactive) {
      this.interactiveAssets.push(asset);
    }
    this.idcounter = this.idcounter + 1;
    if (data.socketId) {
      this.assetsBySocket[data.socketId] = asset;
    }

    if (asset.obj) {
      let object;
      if (asset.obj === 'sphere') {
        const widthSegments = asset.scale > 1000 ? 196 : 6;
        const heightSegments = widthSegments;
        let geometry = new SphereBufferGeometry(asset.scale, widthSegments, heightSegments);
        object = new Mesh(geometry);
      } else if (asset.obj !== 'line') {
        object = await ol(asset.obj);
      }

      asset.object = object;
    }

    return asset;
  }
  async find(params) {
    return Object.keys(this.assets).map(id => this.assets[id]);
  }
  async get(id, params) {
    return this.assets[id];
  }
  async remove(id, params) {
    const asset = this.assets[id];
    if (asset) {
      if (asset.socketId && this.assetsBySocket[asset.socketId]) {
        delete this.assetsBySocket[asset.socketId]
      }
      delete this.assets[id];

      if (asset.interactive) {
        this.interactiveAssets.splice(this.interactiveAssets.indexOf(asset), 1);
      }
    }
    return id;
  }
  async patch(id, params) {
    const asset = this.assets[id];
    if (asset) {
      // TODO: Verify keys are legitimate
      for (let key in params) {
        asset[key] = params[key];
      }

      return asset;
    } else {
      throw 'No asset by id ' + id;
    }
  }
  async getBySocket(socketId, params) {
    return this.assetsBySocket[socketId];
  }
}
app.use('/assets', new AssetsService());
app.use('/userInputs', new UserInputsService());

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static('dist'));

app.get('/cosmos', (req, res) => {
  res.sendFile(path.join(__dirname, './dist/index.html'));
});

app.get('*', async (req, res) => {
  res.sendStatus(404);
});

// ---- Feathers Real-Time Support ----
app.on('connection', (connection, b) => {
  app.channel('everybody').join(connection);

  app.service('userInputs').create({
    id: connection.socketId,
  });

  const ship = randomSpaceship();

  app.service('assets').create({
    name: 'Panther',
    material: {
      map: ship.texture,
      specular: 0x222222,
    },
    weapons: ship.weapons,
    obj: ship.obj,
    radius: ship.radius,
    x: 0,
    y: 1200,
    z: 0,
    dx: 0,
    dy: 0,
    dz: 0,
    ddx: 0,
    ddy: 0,
    ddz: 0,
    w: 1,
    i: 0,
    j: 0,
    k: 0,
    di: 0,
    dj: 0,
    dk: 0,
    ddi: 0,
    ddj: 0,
    ddk: 0,
    interactive: true,
    vitals: {charge: 100},
    type: 'player',
    subtype: 'ship',
    socketId: connection.socketId
  }).then(asset => console.log('New socket with id: ', connection.socketId));
});
app.service('assets').publish((data, hook) => {
  return app.channel('everybody');
});

// ---- Initializing environment ----
const solarSystem = sol.assets();
solarSystem.map(async (i) => {
  const asset = await app.service('assets').create(i);
});

// ---- Game Loop ----
let t = new Date();

let gameLoopStart = new Date();
let gameLoopTicks = 0;
const gameLoop = async () => {
  // Javascript's setInterval and setTimeout doesn't guarantee timing
  gameLoopTicks++;
  const expected = gameLoopTicks * 100;

  const drift = new Date() - gameLoopStart - expected;

  const assets = await app.service('assets').find();
  const userInputs = await app.service('userInputs').find();

  const collisions = calculateCollisions();

  if (assets.length > 0) {
    const allChanges = assets.map((asset) => {
      let forces = {};
      const changes = calculateAssetTick(asset);
      const userInput = userInputs[asset.socketId];
      if (userInput) {
        forces = calculateAssetForces(asset, userInput);
        const actions = assetActions(asset, userInput);
      }
      Object.keys(forces).map((key) => { changes[key] = forces[key] });

      changes.vitals = calculateAssetVitals(asset);

      changes.id = asset.id;

      return changes;
    });

    const timestamp = new Date().getTime();

    // Timed game events
    calculateTimedEvents(gameLoopTicks);

    // Simulate lag
    let currenttick = gameLoopTicks;
    setTimeout(() => {
      app.service('assets').emit('networktick', {t: timestamp, assets: allChanges, ticks: currenttick});
    }, 0); //(Math.random() * 200) + 200);
  }

  // Account for the time drift 
  setTimeout(gameLoop, 100 - drift)
}

function assetActions(asset, input) {
  if (input.mousedown) {
    // Shooting Weapons
    for (let weapon of asset.weapons) {
      if (weapon.name === 'charger') {
        if (asset.vitals.charge >  12) {

          const orientation = new Three.Quaternion(asset.i, asset.j, asset.k, asset.w);

          const positions = [];
          for (let i=0; i<weapon.positions.length; i++) {
            const p = weapon.positions[i];
            const w = new THREE.Vector3(p[0], p[1], p[2]);
            positions[i] = w.applyQuaternion(orientation);
          }

          if (asset.vitals.weaponCooldown === undefined || asset.vitals.weaponCooldown < new Date().getTime()) {
            if (asset.vitals.charge >= 100) {
              const v = new THREE.Vector3(0, 0, 10000);
              v.applyQuaternion(orientation);

              const props = {
                obj: 'sphere',
                w: asset.w,
                i: asset.i,
                j: asset.j,
                k: asset.k,
                dx: v.x + asset.dx,
                dy: v.y + asset.dy,
                dz: v.z + asset.dz,
                interactive: true,
                radius: 120,
                t: new Date(),
                vitals: {
                  birth: new Date().getTime(),
                  lifespan: 6000,
                },
                type: 'projectile',
                material: {
                  color: 0xFF0000,
                }
              }
              props.name = 'Charge shot';
              props.scale = 120;
              props.x = asset.x + positions[0].x;
              props.y = asset.y + positions[0].y;
              props.z = asset.z + positions[0].z;

              asset.vitals.charge -= 40;
              asset.vitals.weaponCooldown = new Date().getTime() + 300;

              app.service('assets').create(props).then((a, b) => {
              });
            } else if (asset.attached === undefined || asset.attached.length === 0) {
              const l1 = {
                obj: 'line',
                name: 'laser',
                attached: asset.id,
                type: 'attached',
                x: weapon.positions[1][0],
                y: weapon.positions[1][1],
                z: weapon.positions[1][2]
              }

              const l2 = {
                obj: 'line',
                name: 'laser',
                attached: asset.id,
                type: 'attached',
                x: weapon.positions[2][0],
                y: weapon.positions[2][1],
                z: weapon.positions[2][2]
              }

              asset.vitals.charge -= 4;

              if (asset.attached === undefined) asset.attached = [];
              app.service('assets').create(l1).then((a, b) => {
                asset.attached.push(a);
              });
              app.service('assets').create(l2).then((a, b) => {
                asset.attached.push(a);
              });
            } else {
              // Drain laser energy
              asset.vitals.charge -= 4;
            }
          }
        }
      }
    }
  } else {
    if (asset.attached && asset.attached.length > 0) {
      for (let i=0; i<asset.attached.length; i++) {
        const a = asset.attached[i];
        // Shutting weapon off
        if (a.name === 'laser') {
          app.service('assets').remove(a.id);
          asset.attached.splice(i, 1);
          i--;
        }
      }
    }
  }
}

function calculateAssetVitals(asset) {
  if (asset.vitals && asset.removed !== true) {
    // Charge
    if (asset.vitals.charge < 100) asset.vitals.charge += 3;
    if (asset.vitals.charge > 100) asset.vitals.charge = 100;

    // Lifespan
    if (asset.vitals.lifespan && asset.vitals.birth) {
      if (asset.vitals.birth + asset.vitals.lifespan < new Date().getTime()) {
        app.service('assets').remove(asset.id).then((a, b) => {
        });
        asset.vitals.removed = true;
      }
    }
  }
  return asset.vitals;
}

function calculateCollisions() {
  const interactiveAssets = app.service('assets').interactiveAssets;

  interactiveAssets.sort((a, b) => a.z - b.z);

  for (let i=0; i<interactiveAssets.length; i++) {
    const asset = interactiveAssets[i];

    // Instead of using an octree which I can't find for js, we're just sorting by Z value to group 
    // items that might need to be collion detection paired. It's a primitive solution.
    const buffer = asset.radius + 10;
    const dt = (new Date() - asset.t) / 100;

    let start = new THREE.Vector3(asset.x, asset.y, asset.z);
    let end = new THREE.Vector3(asset.x + asset.dx * dt + 0.5 * asset.ddx * dt * dt,
                                asset.y + asset.dy * dt + 0.5 * asset.ddy * dt * dt,
                                asset.z + asset.dz * dt + 0.5 * asset.ddz * dt * dt);

    let lowX = Math.min(start.x, end.x) - buffer;
    let lowY = Math.min(start.y, end.y) - buffer;
    let lowZ = Math.min(start.z, end.z) - buffer;
    let highX = Math.max(start.x, end.x) + buffer;
    let highY = Math.max(start.y, end.y) + buffer;
    let highZ = Math.max(start.z, end.z) + buffer;

    let leftIndex = -1;
    let rightIndex = 1;

    const compareThese = [];

    while (i+leftIndex >= 0 && interactiveAssets[i+leftIndex].z > lowZ) {
      const a = interactiveAssets[i+leftIndex];
      if (a.x + a.radius > lowX && a.x - a.radius < highX && a.y + a.radius > lowY && a.y - a.radius < highY) {
        compareThese.push(interactiveAssets[i+leftIndex]);
      }
      leftIndex--;
    }

    while (i+rightIndex < interactiveAssets.length && interactiveAssets[i+rightIndex].z < highZ) {
      const a = interactiveAssets[i+rightIndex];
      if (a.x + a.radius > lowX && a.x - a.radius < highX && a.y + a.radius > lowY && a.y - a.radius < highY) {
        compareThese.push(interactiveAssets[i+rightIndex]);
      }
      rightIndex++;
    }

    if (compareThese.length > 0) {
      if (asset.name === 'Panther' || asset.name === 'Charge shot') {
        //console.log('collision with ' + asset.namep );//, asset.x+','+asset.y+','+asset.z + '   ' + end.x+','+end.y+','+end.z);//, '\n', a.name + ' ' + a.x + ',' + a.y + ',' + a.z, '\n');
        console.log('collision with ' + asset.name, compareThese.map((a) => a.name + a.id));
      }
    }
  }

  return [];

  // Raycasts
  for (let i=0; i<interactiveAssets.length; i++) {
    // Detect laser collision and damage
    if (asset.attached && asset.attached.length > 0) {
      for (let i=0; i<asset.attached.length; i++) {
        const a = asset.attached[i];
        if (a.name === 'laser') {
          const intersects = raycaster.intersectObjects(interactiveAssets.map(a => a.object));

          for (let j=0; j<intersects.length; j++) {
            const intersection = intersects[j];
            console.log('Raycast intersection with ', intersection);
          }
        }
      }
    }
  }
}


function calculateAssetForces(asset, userInput) {
  const angularDrag = 3;
  const torqueRadians = 4;
  const dragRatio = 0.00007;
  const engineSpeed = 5000;

  // Position/Velocity/Acceleration
  const orientation = new THREE.Quaternion(asset.i, asset.j, asset.k, asset.w);
  let force = new THREE.Vector3(0, 0, 0);
  force = new THREE.Vector3(0, 0, userInput.space ? 1 : 0);
  force.applyQuaternion(orientation);

  // Automatic space drag (lol not a real thing)
  const velocity = new THREE.Vector3(asset.dx, asset.dy, asset.dz);
  const magnitude = velocity.length();
  const drag = new THREE.Vector3().copy(velocity).negate();
  drag.multiplyScalar(dragRatio);
  force.add(drag);


  // Orientation/Rotation/Torque
  const xInput = (userInput.back - userInput.forward) * torqueRadians;
  const yInput = (userInput.left - userInput.right) * torqueRadians;
  const zInput = (userInput.clockwise - userInput.counterclockwise) * torqueRadians;

  const eulerTorque = new THREE.Euler(xInput, yInput, zInput, 'XYZ');

  // Automatic Rotational drag
  eulerTorque.x = eulerTorque.x - asset.di * angularDrag;
  eulerTorque.y = eulerTorque.y - asset.dj * angularDrag;
  eulerTorque.z = eulerTorque.z - asset.dk * angularDrag;

  asset.ddx = force.x * engineSpeed;
  asset.ddy = force.y * engineSpeed;
  asset.ddz = force.z * engineSpeed;

  asset.ddi = eulerTorque.x;
  asset.ddj = eulerTorque.y;
  asset.ddk = eulerTorque.z;

  return changes = {
    ddx: asset.ddx,
    ddy: asset.ddy,
    ddz: asset.ddz,
    ddi: asset.ddi,
    ddj: asset.ddj,
    ddk: asset.ddk
  }
}

function calculateAssetTick(asset) {
  // Ideally, a tick can occur at any time and give a time-dependent snapshot of continuous position and rotation vectors.
  let dt = (new Date() - asset.t) / 1000;

  asset.x = asset.x + asset.dx * dt + 1/2 * asset.ddx * dt * dt;
  asset.y = asset.y + asset.dy * dt + 1/2 * asset.ddy * dt * dt;
  asset.z = asset.z + asset.dz * dt + 1/2 * asset.ddz * dt * dt;

  asset.dx = asset.dx + asset.ddx * dt;
  asset.dy = asset.dy + asset.ddy * dt;
  asset.dz = asset.dz + asset.ddz * dt;

  // const torque = new THREE.Quaternion(asset.ddi, asset.ddj, asset.ddk, asset.ddw);
  const orientation = new THREE.Quaternion(asset.i, asset.j, asset.k, asset.w);
  const di = asset.di*dt + asset.ddi*dt*dt/2;
  const dj = asset.dj*dt + asset.ddj*dt*dt/2;
  const dk = asset.dk*dt + asset.ddk*dt*dt/2;

  const ei = di;
  const ej = dj;
  const ek = dk;

  const dorientation = new THREE.Euler(ei, ej, ek, 'XYZ');
  orientation.multiply(new THREE.Quaternion().setFromEuler(dorientation));
  orientation.normalize();

  asset.w = orientation._w;
  asset.i = orientation._x;
  asset.j = orientation._y;
  asset.k = orientation._z;

  asset.di = asset.di + asset.ddi * dt;
  asset.dj = asset.dj + asset.ddj * dt;
  asset.dk = asset.dk + asset.ddk * dt;

  asset.t = new Date().getTime();

  if (asset.object) {
    asset.object.position.x = asset.x;
    asset.object.position.y = asset.y;
    asset.object.position.z = asset.z;
    const newOrientation = new THREE.Quaternion(asset.i, asset.j, asset.k, asset.w);
    asset.object.setRotationFromQuaternion(newOrientation);
  }

  return {
    x: asset.x,
    y: asset.y,
    z: asset.z,

    dx: asset.dx,
    dy: asset.dy,
    dz: asset.dz,

    di: asset.di,
    dj: asset.dj,
    dk: asset.dk,

    w: asset.w,
    i: asset.i,
    j: asset.j,
    k: asset.k,

    t: asset.t
  }
}

function calculateTimedEvents(tick) {
  if (tick % 20 === 0) {
    app.service('assets').create({
      name: 'Asteroid',
      obj: 'sphere',
      w: 1,
      i: 0,
      j: 0,
      k: 0,
      x: 0,
      y: 1000 + Math.random() * 9000,
      z: 20000,
      dx: 0,
      dy: 0,
      dz: -100 - Math.random() * 2000,
      scale: 1000,
      radius: 1000,
      t: new Date(),
      interactive: true,
      vitals: {
        birth: new Date().getTime(),
        lifespan: 60 * 1000,
      },
      type: 'asteroid',
      material: {
        color: 0x202020,
        emissive: 0x111111,
        displacementMap: randomAsteroidMap(),
        displacementScale: 10 + Math.random()*240,
        //normalMap: '/public/13302-normal.jpg',
        //normalScale: 100,
        bumpMap: randomAsteroidMap(),
        bumpScale: 10 + Math.random()*240,
        shininess: 0,
      }
    });
  }
}


// ---- Running the app ----
app.listen(port, () => console.log(`Nova running on http://0.0.0.0:${port}`))
gameLoopStart = new Date();
gameLoop().then(() => {});


// ---- Helper functions ----
function randomSpaceship() {
  const options = [{
//    obj: '/public/SpaceFighter01/SpaceFighter01.obj',
//    texture: '/public/SpaceFighter01/F01_512.jpg'
//  }, {
    obj: '/public/SpaceFighter02/SpaceFighter02.obj',
    texture: '/public/SpaceFighter02/F02_512.jpg',
    radius: 100,
    weapons: [{
      name: 'charger',
      positions: [[0, 50, 250], [80, 0, 80], [-80, 0, 80]],
    }],
//  }, {
//    obj: '/public/SpaceFighter03/SpaceFighter03.obj',
//    texture: '/public/SpaceFighter03/F03_512.jpg'
//  }, {
//    obj: '/public/Shuttle01/Shuttle01.obj',
//    texture: '/public/Shuttle01/S01_512.jpg'
//  }, {
//    obj: '/public/Shuttle02/Shuttle02.obj',
//    texture: '/public/Shuttle02/S02_512.jpg'
  }];

  return options[Math.floor(Math.random() * options.length)];
}
function randomAsteroidMap() {
  const options = ['/public/13302-normal.jpg', '/public/3215-bump.jpg', '/public/12253.jpg', '/public/12098.jpg'];
  return options[Math.floor(Math.random() * options.length)]
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
