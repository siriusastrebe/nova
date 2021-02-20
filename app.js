const port            = 80;
const fs              = require('fs');
const ejs             = require('ejs');
const path            = require('path');
const feathers        = require('@feathersjs/feathers');
const express         = require('@feathersjs/express');
const socketio        = require('@feathersjs/socketio');
const configuration   = require('@feathersjs/configuration');
const feathersKnex    = require('feathers-knex');
const feathersMemory  = require('feathers-memory');
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


app.use('/assets', feathersMemory());

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
    z: Math.random() * 100
  }).then(asset => console.log('Created asset ', asset));
});
app.service('assets').publish((data, hook) => {
  return app.channel('everybody');
});


// ---- Running the app ----
app.listen(port, () => console.log(`Nova running on http://0.0.0.0:${port}`))
