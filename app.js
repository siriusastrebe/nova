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
app.configure(socketio());                       // Configure Socket.io real-time APIs
app.configure(configuration());                  // Apply configuration located in default/config.json
app.use(express.errorHandler());                 // Register a nicer error handler than the default Express one
app.use(express.static(__dirname));              // Host static files from the current folder
app.configure(authService);


// ---- Feathers Services ----
accountsService(app, knex);

class AssetsService {
  constructor() {
    this.assets = {}
    this.idcounter = 0
  }
  async create(data, params) {
    const id = this.idcounter;
    const asset = {
      id: id,
      model: data.model,
      x: data.x,
      y: data.y,
      z: data.z,
      roll: data.roll,
      yaw: data.yaw,
      pitch: data.pitch,
      vx: data.vx,
      vy: data.vy,
      vz: data.vz,
      vroll: data.vroll,
      vpitch: data.vpitch,
      vyaw: data.vyaw
    }

    this.assets[id] = asset;
    this.idcounter = this.idcounter + 1;

    return Promise.resolve(asset);
  }
  find(params) {
    return Promise.resolve(Object.keys(this.assets).map(id => this.assets[id]));
  }
  get(id, params) {
    return this.assets[id];
  }
  remove(id, params) {
   delete this.assets[id]
  }
  patch(id, params) {
    const asset = this.assets[id];
    if (asset) {
      // TODO: Verify keys are legitimate
      for (let key in params) {
        asset[key] = params[key];
      }

      return Promise.resolve(asset);
    } else {
      return Promise.reject('No asset by id ' + id);
    }
  }
}
app.use('/assets', new AssetsService());

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static('dist'));

app.get('/cosmos', (req, res) => {
  res.sendFile(path.join(__dirname, './dist/index.html'));
});

app.get('*', async (req, res) => {
  res.sendStatus(404);
});

// ---- Feathers Real-Time Support ----
app.on('connection', connection => {
  app.channel('everybody').join(connection);

  app.service('assets').create({
    model: 'shuttle',
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 100,
    roll: 0,
    pitch: 0,
    yaw: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    vroll: 0,
    vpitch: 0,
    vyaw: 0
  }).then(asset => console.log('Created asset ', asset));
});
app.service('assets').publish((data, hook) => {
  return app.channel('everybody');
});


// ---- Game loop ----
let t = new Date();
const gameLoop = setInterval(async () => {
  const assets = await app.service('assets').find()

  let dt = (new Date() - t) / 1000;
  assets.forEach((asset, i) => {
    const changes = {
      x: asset.x + asset.vx * dt,
      y: asset.y + asset.vy * dt,
      z: asset.z + asset.vz * dt,
      yaw: asset.yaw + asset.vyaw * dt,
      pitch: asset.pitch + asset.vpitch * dt,
      roll: asset.roll + asset.vroll * dt,
    }

    app.service('assets').patch(asset.id, changes);
  });

  t = new Date();
}, 100);


// ---- Running the app ----
app.listen(port, () => console.log(`Nova running on http://0.0.0.0:${port}`))
