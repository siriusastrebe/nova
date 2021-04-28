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
const Three           = require('three'); 
const sol             = require('./solar-systems/sol.js');
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
      vitals: data.vitals,
      weapons: data.weapons,
      scale: data.scale,
      type: data.type,
      subtype: data.subtype,
      socketId: data.socketId
    }

    this.assets[id] = asset;
    this.idcounter = this.idcounter + 1;
    if (data.socketId) {
      this.assetsBySocket[data.socketId] = asset;
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
    name: 'Pilum',
    material: {
      map: ship.texture,
      specular: 0x222222,
    },
    weapons: ship.weapons,
    obj: ship.obj,
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 100,
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

  if (assets.length > 0) {
    const allChanges = assets.map((asset) => {
      let forces = {};

      const changes = calculateAssetTick(asset);
      const userInput = userInputs[asset.socketId];
      if (userInput) {
        forces = calculateAssetForces(asset, userInput);
        const actions = assetActions(asset, userInput);
      }
      const vitals = calculateAssetVitals(asset);

      Object.keys(forces).map((key) => { changes[key] = forces[key] });

      changes.id = asset.id;

      return changes;
    });

    const timestamp = new Date().getTime();

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

  // Shooting gun
  if (input.mousedown) {
    for (let weapon of asset.weapons) {
      if (weapon === 'charger') {
        if (asset.vitals.charge >  12) {

          const orientation = new Three.Quaternion(asset.i, asset.j, asset.k, asset.w);
          const v = new Three.Vector3(0, 0, 10000);
          v.applyQuaternion(orientation);


          if (asset.vitals.weaponCooldown === undefined || asset.vitals.weaponCooldown < new Date().getTime()) {

            const props = {
              obj: 'sphere',
              x: asset.x,
              y: asset.y,
              z: asset.z,
              w: asset.w,
              i: asset.i,
              j: asset.j,
              k: asset.k,
              dx: v.x + asset.dx,
              dy: v.y + asset.dy,
              dz: v.z + asset.dz,
              vitals: {
                birth: new Date(),
                lifespan: 6000,
              },
              type: 'projectile',
              material: {
                color: 0xFF0000,
              }
            }

            if (asset.vitals.charge >= 100) {
              asset.vitals.charge -= 40;
              props.name = 'Charge shot';
              props.scale = 120;
              asset.vitals.weaponCooldown = new Date().getTime() + 300;
            } else {
              props.name = 'Rapid shot';
              asset.vitals.charge -= 7;
              props.scale = 20;
            }

            app.service('assets').create(props).then((a, b) => {
            });
          }
        }
      }
    }
  }
}

function calculateAssetVitals(asset) {
  if (asset.vitals) {
    // Charge
    if (asset.vitals.charge < 100) asset.vitals.charge += 3;
    if (asset.vitals.charge > 100) asset.vitals.charge = 100;

    // Lifespan
    if (asset.vitals.lifespan && asset.vitals.birth) {
      if (asset.vitals.birth.getTime() + asset.vitals.lifespan < new Date().getTime()) {
        app.service('assets').remove(asset.id).then((a, b) => {
          console.log('Deleted', asset.name, asset.id);
        });
      }
    }
  }
}


function calculateAssetForces(asset, userInput) {
  const angularDrag = 3;
  const torqueRadians = 4;
  const dragRatio = 0.0001;
  const engineSpeed = 20000;

  // Position/Velocity/Acceleration
  const orientation = new Three.Quaternion(asset.i, asset.j, asset.k, asset.w);
  let force = new Three.Vector3(0, 0, 0);
  force = new Three.Vector3(0, 0, userInput.space ? 1 : 0);
  force.applyQuaternion(orientation);

  // Automatic space drag (lol not a real thing)
  const velocity = new Three.Vector3(asset.dx, asset.dy, asset.dz);
  const magnitude = velocity.length();
  const drag = new Three.Vector3().copy(velocity).negate();
  drag.multiplyScalar(dragRatio);
  force.add(drag);


  // Orientation/Rotation/Torque
  const xInput = (userInput.back - userInput.forward) * torqueRadians;
  const yInput = (userInput.left - userInput.right) * torqueRadians;
  const zInput = (userInput.clockwise - userInput.counterclockwise) * torqueRadians;

  const eulerTorque = new Three.Euler(xInput, yInput, zInput, 'XYZ');

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

  // const torque = new Three.Quaternion(asset.ddi, asset.ddj, asset.ddk, asset.ddw);
  const orientation = new Three.Quaternion(asset.i, asset.j, asset.k, asset.w);
  const di = asset.di*dt + asset.ddi*dt*dt/2;
  const dj = asset.dj*dt + asset.ddj*dt*dt/2;
  const dk = asset.dk*dt + asset.ddk*dt*dt/2;

  const ei = di;
  const ej = dj;
  const ek = dk;

  const dorientation = new Three.Euler(ei, ej, ek, 'XYZ');
  orientation.multiply(new Three.Quaternion().setFromEuler(dorientation));
  orientation.normalize();

  asset.w = orientation._w;
  asset.i = orientation._x;
  asset.j = orientation._y;
  asset.k = orientation._z;

  asset.di = asset.di + asset.ddi * dt;
  asset.dj = asset.dj + asset.ddj * dt;
  asset.dk = asset.dk + asset.ddk * dt;

  asset.t = new Date().getTime();

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
    weapons: ['charger'],
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
