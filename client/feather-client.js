import 'regenerator-runtime/runtime'
import createFeathersClient from '@feathersjs/feathers'
import auth from '@feathersjs/authentication-client'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

// ---- Feathers ----
export default function initializeFeathers(addAsset, updateAsset) {

  const socket = io(document.domain + ':80');
  const feathers = createFeathersClient();
  let assets = [];
  let controlling;

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
      assets.push(asset);

      if (asset.socketId === socket.id) {
        controlling = asset;
      }
    });
  });

  feathers.service('assets').on('created', (asset) => {
    addAsset(asset);
    assets.push(asset);

    if (asset.socketId === socket.id) {
      controlling = asset;
    }
  });

  feathers.service('assets').on('updated', (asset, b) => {
    console.log('Updated', asset, b);
    updateAsset(asset);
    const current = assets.find(a => a.id === asset.id)
    assets[assets.indexOf(current)] = asset;

    if (asset.socketId === socket.id) {
      controlling = asset;
    }
  });

  feathers.service('assets').on('patched', (asset, b) => {
    updateAsset(asset, b);
    const current = assets.find(a => a.id === asset.id)
    assets[assets.indexOf(current)] = asset;

    if (asset.socketId === socket.id) {
      controlling = asset;
    }
  });

  document.onkeydown = function (e) {
    if (controlling) {
      const action = keyToAction(e);

      if (action) {
        const params = {
          [action]: true
        }
        feathers.service('userInputs').patch(null, params);
      }
    }
  }

  document.onkeyup = function (e) {
    if (controlling) {
      const action = keyToAction(e);

      if (action) {
        const params = {
          [action]: false
        }
        feathers.service('userInputs').patch(null, params);
      }
    }
  }
}

function keyToAction(e) {
  const key = e.key.toLowerCase();
  let action;
  if (key === 'w' || key === 'arrowup') {
    action = 'forward';
  } else if (key === 'a' || key === 'arrowleft') {
    action = 'left';
  } else if (key === 's' || key === 'arrowdown') {
    action = 'back';
  } else if (key === 'd' || key === 'arrowright') {
    action = 'right';
  } else if (key === 'q') {
    action = 'counterclockwise';
  } else if (key === 'e') {
    action = 'clockwise';
  }
  return action;
}
