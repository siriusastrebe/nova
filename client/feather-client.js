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
    });
  });

  feathers.service('assets').on('created', (asset) => {
console.log('Asset created', asset);
    addAsset(asset);
    assets.push(asset);
  });

  feathers.service('assets').on('updated', (asset, b) => {
    console.log('Updated', asset, b);
    updateAsset(asset);
    const current = assets.find(a => a.id === asset.id)
    assets[assets.indexOf(current)] = asset;
  });

  feathers.service('assets').on('patched', (asset, b) => {
    updateAsset(asset, b);
    const current = assets.find(a => a.id === asset.id)
    assets[assets.indexOf(current)] = asset;
  });

  document.onkeydown = function (e) {
    const key = e.key.toLowerCase();
    let direction;
    if (key === 'w' || key === 'arrowup') {
      direction = 'forward';
    } else if (key === 'a' || key === 'arrowleft') {
      direction = 'left';
    } else if (key === 's' || key === 'arrowdown') {
      direction = 'back';
    } else if (key === 'd' || key === 'arrowright') {
      direction = 'right';
    }

    if (direction === 'left' && assets[0].vyaw !== -1) {
      feathers.service('assets').patch(assets[0].id, {
        vyaw: -1
      });
    } else if (direction === 'right' && assets[0].vyaw !== 1) {
      feathers.service('assets').patch(assets[0].id, {
        vyaw: 1
      });
    } else if (direction === 'forward' && assets[0].vpitch !== 1) {
      feathers.service('assets').patch(assets[0].id, {
        vpitch: 1
      });
    } else if (direction === 'back' && assets[0].vpitch !== -1) {
      feathers.service('assets').patch(assets[0].id, {
        vpitch: -1
      });
    }
  }

  document.onkeyup = function (e) {
    const key = e.key.toLowerCase();
    let direction;
    if (key === 'w' || key === 'arrowup') {
      direction = 'forward';
    } else if (key === 'a' || key === 'arrowleft') {
      direction = 'left';
    } else if (key === 's' || key === 'arrowdown') {
      direction = 'back';
    } else if (key === 'd' || key === 'arrowright') {
      direction = 'right';
    }

    if (direction === 'left' || direction === 'right' && assets[0].vyaw !== 0) {
      feathers.service('assets').patch(assets[0].id, {
        vyaw: 0
      });
    }

    if (direction === 'forward' || direction === 'back' && assets[0].vpitch !== 0) {
      feathers.service('assets').patch(assets[0].id, {
        vpitch: 0
      });
    }
  }
}
