import 'regenerator-runtime/runtime'
import createFeathersClient from '@feathersjs/feathers'
import auth from '@feathersjs/authentication-client'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

// ---- Feathers ----
export default function initializeFeathers(addAsset, updateAsset, removeAsset, setControlledAsset, timer) {

  const socket = io(document.domain + ':80');
  const feathers = createFeathersClient();
  let assets = [];
  let controlling;
  let userInputs = {};

  feathers.configure(socketio(socket));
  feathers.configure(
    auth({
      storage: window.localStorage,
      storageKey: 'access-token',
      path: '/api/authentication'
    })  
  );

  feathers.service('assets').find().then((a) => {
    for (let id in a) {
      const asset = a[id];
      const existing = assets.find(a => a.id === asset.id)
      if (!existing) {
        addAsset(asset);
        assets.push(asset);

        if (asset.socketId === socket.id) {
          controlling = asset;
          setControlledAsset(controlling);
        }
      }
    };
  });

  feathers.service('assets').on('created', (asset) => {
    console.log('Asset created', asset);
    const existing = assets.find(a => a.id === asset.id)
    if (!existing) {
      addAsset(asset);
      assets.push(asset);

      if (asset.socketId === socket.id) {
        controlling = asset;
        setControlledAsset(controlling);
      }
    }
  });

  feathers.service('assets').on('updated', (asset, b) => {
    console.log('Asset updated', asset);
    updateAsset(asset);
    const current = assets.find(a => a.id === asset.id)
    assets[assets.indexOf(current)] = asset;

    if (asset.socketId === socket.id) {
      controlling = asset;
      setControlledAsset(controlling);
    }
  });

  feathers.service('assets').on('patched', (asset, b) => {
    console.log('Asset patched', asset);
    updateAsset(asset, b);
    const current = assets.find(a => a.id === asset.id)
    assets[assets.indexOf(current)] = asset;

    if (asset.socketId === socket.id) {
      controlling = asset;
      setControlledAsset(controlling);
    }
  });

  feathers.service('assets').on('removed', (id, b) => {
    removeAsset(id);
  });

  feathers.service('assets').on('networktick', (data) => {
    const assets = data.assets;
    const ticks = data.ticks;
    const t = data.t;

    if (timer.start === undefined) {
      timer.startTimer(ticks, t);
    } else {
      timer.setTicks(ticks, t);
    }

    assets.forEach((asset) =>  {
      updateAsset(asset);
    });
  });

  socket.on('roundtrip', (data, a, b) => {
    timer.roundtrip(data.start, new Date().getTime(), data.t);
  });

  document.onkeydown = function (e) {
    if (controlling) {
      const action = keyToAction(e);

      if (action && !userInputs[action]) {
        userInputs[action] = true;

        const params = {
          [action]: true
        }

        feathers.service('userInputs').patch(new Date().getTime(), params).then((a, b) => {
        });
      }
    }
  }

  document.onkeyup = function (e) {
    if (controlling) {
      const action = keyToAction(e);

      if (action && userInputs[action]) {
        userInputs[action] = false;

        const params = {
          [action]: false
        }
        feathers.service('userInputs').patch(new Date().getTime(), params);
      }
    }
  }

  document.onmousedown = (e) => {
    const params = {
      mousedown: true
    }
    feathers.service('userInputs').patch(new Date().getTime(), params);
  };

  document.onmouseup = (e) => {
    const params = {
      mousedown: false
    }
    feathers.service('userInputs').patch(new Date().getTime(), params);
  };
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
  } else if (key === ' ') {
    action = 'space';
  }

  return action;
}
