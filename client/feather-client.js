import 'regenerator-runtime/runtime'
import createFeathersClient from '@feathersjs/feathers'
import auth from '@feathersjs/authentication-client'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

// ---- Feathers ----

export default function initializeFeathers(addAsset, updateAsset) {

  const socket = io(document.domain + ':80');
  const feathers = createFeathersClient();

  feathers.configure(socketio(socket));
  feathers.configure(
    auth({
      storage: window.localStorage,
      storageKey: 'access-token',
      path: '/api/authentication'
    })  
  );

  feathers.service('assets').find().then((assets) => {
    assets.forEach((asset) => {
      addAsset(asset);
    });
  });

  feathers.service('assets').on('created', (asset) => {
    addAsset(asset);
  });

  feathers.service('assets').on('update', (asset) => {
    updateAsset(asset);
  });
}
