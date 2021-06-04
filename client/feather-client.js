import 'regenerator-runtime/runtime'
import createFeathersClient from '@feathersjs/feathers'
import auth from '@feathersjs/authentication-client'
import socketio from '@feathersjs/socketio-client'
import io from 'socket.io-client'

// ----------------------------------------------------------------
// Feathers
// ----------------------------------------------------------------
export default function initializeFeathers(addAsset, updateAsset, removeAsset, setControlledAsset, ignite, quench, timer) {

  const socket = io(document.domain + ':80');
  const feathers = createFeathersClient();
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
    for (let asset of a) {
      addAsset(asset);
      controlCheck(asset, socket);
    };
  });

  feathers.service('assets').on('created', (asset) => {
    addAsset(asset);
    controlCheck(asset, socket);
  });

  feathers.service('assets').on('updated', (asset, b) => {
    console.log('Asset updated', asset);
    updateAsset(asset);
    controlCheck(asset, socket);
  });

  feathers.service('assets').on('patched', (asset, b) => {
    console.log('Asset patched', asset);
    updateAsset(asset, b);
    controlCheck(asset, socket);
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

  // ----------------------------------------------------------------
  // User Inputs
  // ----------------------------------------------------------------
  document.onkeydown = function (e) {
    if (controlling) {
      const action = keyToAction(e);

      if (action && !userInputs[action]) {
        userInputs[action] = true;

        const params = {
          [action]: true
        }

        if (action === 'space' || action === 'shift') {
          ignite(userInputs['shift'] === true);
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

        if ((action === 'space' || action === 'shift')) {
          if (userInputs['shift'] === true || userInputs['space'] === true) {
            ignite(userInputs['shift'] === true);
          } else {
            quench();
          }
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

  // Helper Functions
  function controlCheck(asset, socket) {
    if (asset.socketId === socket.id) {
      controlling = asset;
      setControlledAsset(controlling);
    }
  }
}


function keyToAction(e) {
  const key = e.key.toLowerCase();
  let action;
  if (key === 'w' || key === 'arrowup' || key === 'i') {
    action = 'forward';
  } else if (key === 'a' || key === 'arrowleft' || key === 'j') {
    action = 'left';
  } else if (key === 's' || key === 'arrowdown' || key === 'k') {
    action = 'back';
  } else if (key === 'd' || key === 'arrowright' || key === 'l') {
    action = 'right';
  } else if (key === 'q' || key === 'u') {
    action = 'counterclockwise';
  } else if (key === 'e' || key === 'o') {
    action = 'clockwise';
  } else if (key === ' ') {
    action = 'space';
  } else if (key === 'shift') {
    action = 'shift';
  }

  return action;
}
