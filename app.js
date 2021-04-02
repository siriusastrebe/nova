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
    }
    this.users[data.id] = userInput;
  }
  patch(id, params, c) {
    return new Promise(async (resolve, reject) => { 
    // Ignore user provided ID, use socket id instead
    const socketId = c.connection.socketId;
    const userInput = this.users[socketId];

    for (let key in params) {
      const value = params[key];
      if (key in userInput) {
        userInput[key] = value;
      }
    }


    // Send the changes immediately
    //if (asset) {
    //  const changes = calculateAssetTick(asset);
    //setTimeout(async() => {
    //  await app.service('assets').patch(asset.id, changes);
    //  }, 100);
    //}

    resolve(userInput);
    })
  }
}

class AssetsService {
  constructor() {
    this.assets = {};
    this.assetsBySocket = {};
    this.idcounter = 0;
    this.events = ['networktick'];
  }
  async create(data, params) {
    const id = this.idcounter;
    const asset = {
      id: id,
      t: new Date(),
      obj: data.obj,
      texture: data.texture,
      x: data.x,
      y: data.y,
      z: data.z,
      dx: data.dx,
      dy: data.dy,
      dz: data.dz,
      ddx: data.ddx,
      ddy: data.ddy,
      ddz: data.ddz,
      w: data.w,
      i: data.i,
      j: data.j,
      k: data.k,
      di: data.di,
      dj: data.dj,
      dk: data.dk,
      ddi: data.ddi,
      ddj: data.ddj,
      ddk: data.ddk,
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
    texture: ship.texture,
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
    socketId: connection.socketId
  }).then(asset => console.log('New socket with id: ', connection.socketId, asset));
});
app.service('assets').publish((data, hook) => {
  return app.channel('everybody');
});

// ---- Game Loop ----
let t = new Date();

const gameLoop = setInterval(async () => {
  const assets = await app.service('assets').find();
  const userInputs = await app.service('userInputs').find();

  if (assets.length > 0) {
    const allChanges = assets.map((asset) => {
      const changes = calculateAssetTick(asset);
      const forces = calculateAssetForces(asset, userInputs[asset.socketId]);

      Object.keys(forces).map((key) => { changes[key] = forces[key] });
      changes.id = asset.id;

      return changes;
    });

    setTimeout(() => {
      app.service('assets').emit('networktick', allChanges);
    }, 100)//(Math.random() * 50) + 50);
  }
}, 200);

function calculateAssetForces(asset, userInput) {
  const angularDrag = 1;
  const torqueRadians = 2;
  const dragRatio = 0.001;
  const engineSpeed = 1000;

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


/*
  // Orientation/Rotation/Torque
  const rotation = new Three.Quaternion(asset.di, asset.dj, asset.dk, asset.dw);
  // let torque = new Three.Quaternion(asset.ddi, asset.ddj, asset.ddk, asset.ddw);

  const ninetyDegreeUserInputs = new Three.Quaternion().setFromEuler(new Three.Euler(userInput.back - userInput.forward, userInput.left - userInput.right, userInput.clockwise - userInput.counterclockwise, 'XYZ'));
  const torque = new Three.Quaternion().identity().rotateTowards(ninetyDegreeUserInputs, userInputTorqueRadians);

  // Automatic rotational drag
  const rotationRadians = rotation.angleTo(new Three.Quaternion().identity());
  const smallInverseRotation = new Three.Quaternion().identity().rotateTowards(rotation.conjugate(), dragRadians);
  torque.multiply(smallInverseRotation);
  torque.normalize();
*/


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
  const dorientation = new Three.Euler(asset.di*dt + asset.ddi*1/2*dt*dt, 
                                       asset.dj*dt + asset.ddj*1/2*dt*dt,
                                       asset.dk*dt + asset.ddk*1/2*dt*dt);
  orientation.multiply(new Three.Quaternion().setFromEuler(dorientation));

  asset.w = orientation._w;
  asset.i = orientation._x;
  asset.j = orientation._y;
  asset.k = orientation._z;

  asset.di = asset.di + asset.ddi * dt;
  asset.dj = asset.dj + asset.ddj * dt;
  asset.dk = asset.dk + asset.ddk * dt;

  asset.t = new Date();

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
    k: asset.k
  }
}

//function calculateAssetChanges(asset, userInput, ignoreUserInputForces) {
//
//  const orientation = new Three.Quaternion(asset.i, asset.j, asset.k, asset.w);
//
//  let rotation = new Three.Quaternion(asset.vi, asset.vj, asset.vk, asset.vw);
//  let force = new Three.Vector3(0, 0, 0);
//  if (!ignoreUserInputForces) {
//    const drotation = new Three.Quaternion().identity().rotateTowards(rotation, rotation.angleTo(new Three.Quaternion().identity()) * dt);
//    orientation.multiply(drotation);
//    orientation.normalize();
//  }
//
//  // TODO: Use pythagorean distance
//  const changes = {
//    vx: asset.vx * 0.98 + force.x * 80,
//    vy: asset.vy * 0.98 + force.y * 80,
//    vz: asset.vz * 0.98 + force.z * 80,
//
//    x: asset.x + asset.vx * dt,
//    y: asset.y + asset.vy * dt,
//    z: asset.z + asset.vz * dt,
//
//    w: orientation._w,
//    i: orientation._x,
//    j: orientation._y,
//    k: orientation._z,
//
//    vw: rotation._w,
//    vi: rotation._x,
//    vj: rotation._y,
//    vk: rotation._z
//  };
//
//  return changes;
//}


//function calculateUserInputTorque(userInput, asset) {
//  const rotation = new Three.Quaternion(asset.vi, asset.vj, asset.vk, asset.vw);
//  const identity = new Three.Quaternion().identity();
//
//  if (userInput) {
//    const quarterRotations = new Three.Quaternion().setFromEuler(new Three.Euler(userInput.back - userInput.forward, userInput.left - userInput.right, userInput.clockwise - userInput.counterclockwise, 'XYZ'));
//    const nudge = new Three.Quaternion().identity().rotateTowards(quarterRotations, quarterRotations.angleTo(identity) / 30);
//    rotation.multiply(nudge);
//  }
//
//  // Dampening effect to set a max rotation speed
//  rotation.rotateTowards(identity, rotation.angleTo(identity) / 50);
//
//  rotation.normalize();
//
//  return rotation;
//}
//function calculateUserInputForce(userInput, asset) {
//  const orientation = new Three.Quaternion(asset.i, asset.j, asset.k, asset.w);
//  let force = new Three.Vector3(0, 0, 0);
//  force = new Three.Vector3(0, 0, userInput.space ? 1 : 0);
//  force.applyQuaternion(orientation);
//  return force;
//}


// ---- Running the app ----
app.listen(port, () => console.log(`Nova running on http://0.0.0.0:${port}`))


// ---- Helper functions ----
function randomSpaceship() {
  const options = [{
//    obj: '/public/SpaceFighter01/SpaceFighter01.obj',
//    texture: '/public/SpaceFighter01/F01_512.jpg'
//  }, {
    obj: '/public/SpaceFighter02/SpaceFighter02.obj',
    texture: '/public/SpaceFighter02/F02_512.jpg'
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
