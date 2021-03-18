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
      } else if (key === 'q') {
        direction = 'counterclockwise';
      } else if (key === 'e') {
        direction = 'clockwise';
      }

      if (direction === 'left' && controlling.vyaw !== 1) {
        feathers.service('assets').patch(controlling.id, {
          vyaw: 1
        });
      } else if (direction === 'right' && controlling.vyaw !== -1) {
        feathers.service('assets').patch(controlling.id, {
          vyaw: -1
        });
      } else if (direction === 'forward' && controlling.vpitch !== 1) {
        feathers.service('assets').patch(controlling.id, {
          vpitch: 1
        });
      } else if (direction === 'back' && controlling.vpitch !== -1) {
        feathers.service('assets').patch(controlling.id, {
          vpitch: -1
        });
      } else if (direction === 'counterclockwise' && controlling.vroll !== -1) {
        feathers.service('assets').patch(controlling.id, {
          vroll: -1
        });
      } else if (direction === 'clockwise' && controlling.vroll !== -1) {
        feathers.service('assets').patch(controlling.id, {
          vroll: 1
        });
      }
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
    } else if (key === 'q') {
      direction = 'counterclockwise';
    } else if (key === 'e') {
      direction = 'clockwise';
    }

    if ((direction === 'left' || direction === 'right') && controlling.vyaw !== 0) {
      feathers.service('assets').patch(controlling.id, {
        vyaw: 0
      });
    }

    if ((direction === 'forward' || direction === 'back') && controlling.vpitch !== 0) {
      feathers.service('assets').patch(controlling.id, {
        vpitch: 0
      });
    }

    if ((direction === 'counterclockwise' || direction === 'clockwise') && controlling.vroll !== 0) {
      feathers.service('assets').patch(controlling.id, {
        vroll: 0
      });
    }
  }
}
