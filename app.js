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

let t = new Date();

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

    const asset = await app.service('assets').getBySocket(socketId);
    if (asset) {
      const torque = calculateUserInputTorque(userInput, asset);
      const force = calculateUserInputForce(userInput, asset);

      // TODO: Use pythagorean distance
      const patch = {
        vx: asset.vx + force.x * 200,
        vy: asset.vy + force.y * 200,
        vz: asset.vz + force.z * 200,
        vw: torque._w,
        vi: torque._x,
        vj: torque._y,
        vk: torque._z
      }
console.log('patching asset', asset.id);

      app.service('assets').patch(asset.id, patch);
    }

    return userInput;
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
      obj: data.obj,
      texture: data.texture,
      x: data.x,
      y: data.y,
      z: data.z,
      vx: data.vx,
      vy: data.vy,
      vz: data.vz,
      w: data.w,
      i: data.i,
      j: data.j,
      k: data.k,
      vw: data.vw,
      vi: data.vi,
      vj: data.vj,
      vk: data.vk,
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
      return 'No asset by id ' + id;
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
    vx: 0,
    vy: 0,
    vz: 0,
    w: 1,
    i: 0,
    j: 0,
    k: 0,
    vw: 1,
    vi: 0,
    vj: 0,
    vk: 0,
    socketId: connection.socketId
  }).then(asset => console.log('New socket with id: ', connection.socketId));
});
app.service('assets').publish((data, hook) => {
  return app.channel('everybody');
});

// ---- Game Loop ----
const gameLoop = setInterval(async () => {
  const assets = await app.service('assets').find();
  const userInputs = await app.service('userInputs').find();

  let dt = (new Date() - t) / 1000;

  const allChanges = [];

  assets.forEach((asset, i) => {
    const orientation = new Three.Quaternion(asset.i, asset.j, asset.k, asset.w);
    const userInput = userInputs[asset.socketId];

    const torque = calculateUserInputTorque(userInput, asset);
    const force = calculateUserInputForce(userInput, asset);

    const targetOrientation = new Three.Quaternion(asset.i, asset.j, asset.k, asset.w).multiply(torque).normalize();
    orientation.rotateTowards(targetOrientation, dt);
    orientation.normalize();

    // TODO: Use pythagorean distance
    asset.vx = asset.vx * 0.9 + force.x * 200;
    asset.vy = asset.vy * 0.9 + force.y * 200;
    asset.vz = asset.vz * 0.9 + force.z * 200;

    asset.x = asset.x + asset.vx * dt;
    asset.y = asset.y + asset.vy * dt;
    asset.z = asset.z + asset.vz * dt;

    asset.w = orientation._w;
    asset.i = orientation._x;
    asset.j = orientation._y;
    asset.k = orientation._z;

    asset.vw = torque._w;
    asset.vi = torque._x;
    asset.vj = torque._y;
    asset.vk = torque._z;

    const changes = {
      id: asset.id,
      x: asset.x,
      y: asset.y,
      z: asset.z,
      vx: asset.vx,
      vy: asset.vy,
      vz: asset.vz,
      w: asset.w,
      i: asset.i,
      j: asset.j,
      k: asset.k,
      vw: asset.vw,
      vi: asset.vi,
      vk: asset.vk,
      vj: asset.vj,
    }

    allChanges.push(changes);
  });

  app.service('assets').emit('networktick', allChanges);

  t = new Date();
}, 100);


function calculateUserInputTorque(userInput, asset) {
  const orientation = new Three.Quaternion(asset.i, asset.j, asset.k, asset.w);
  let torque = new Three.Quaternion().identity();
  if (userInput) {
    torque = new Three.Quaternion().setFromEuler(new Three.Euler(userInput.back - userInput.forward, userInput.left - userInput.right, userInput.clockwise - userInput.counterclockwise, 'XYZ'));
  }
  return torque;
}
function calculateUserInputForce(userInput, asset) {
  const orientation = new Three.Quaternion(asset.i, asset.j, asset.k, asset.w);
  let force = new Three.Vector3(0, 0, 0);
  force = new Three.Vector3(0, 0, userInput.space ? 1 : 0);
  force.applyQuaternion(orientation);
  return force;
}


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
