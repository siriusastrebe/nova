class Level1 {
  constructor(service) {
    this.name = 'Level 1';
    this.level = 1;
    this.announcement = 'Stop the asteroids from reaching Earth';
    this.stageWidth = 5000;

    deleteAnnouncement(service);
    createAnnouncement(service, this.announcement);
  }
  tick (tick, service) {
    if (tick % 20 === 0 && tick < 20 * 60) {
      service.create(randomlyGeneratedAsteroid(this.stageWidth)).then((a) => {});
    }
  }
  levelLost(tick, service) {
    return standardLossCondition(tick, service);
  }
  levelEnd(tick, service) {
    if (tick > 20 * 60 && tick % 20 === 0) {
      // When there are no asteroids left
      if (Object.values(service.assets).find(a => a.type === 'asteroid') === undefined) {
        deleteAnnouncement(service);
        return true;
      }
    }
    return false;
  }
}
class Level2 {
  constructor(service) {
    this.name = 'Level 2';
    this.level = 2;
    this.announcement = 'Stop the asteroids from reaching Earth';
    this.stageWidth = 7500;

    deleteAnnouncement(service);
    createAnnouncement(service, this.announcement);
  }
  tick (tick, service) {
    if (tick % 20 === 0 && tick < 20 * 60) {
      service.create(randomlyGeneratedAsteroid(this.stageWidth)).then((a) => {
      });
    }
  }
  levelLost(tick, service) {
    return standardLossCondition(tick, service);
  }
  levelEnd(tick, service) {
    if (tick > 20 * 60 && tick % 20 === 0) {
      // When there are no asteroids left
      if (Object.values(service.assets).find(a => a.type === 'asteroid') === undefined) {
        return true;
      }
    }
    return false;
  }
}
class End {
  constructor(service) {
    this.name = 'End';
    this.level = 0;
    this.announcement = "Congratulations! You've beaten the game";
    this.stageWidth = 10000;

    deleteAnnouncement(service);
    createAnnouncement(service, this.announcement);
  }
  tick() {
  }
  levelLost(tick, service) {
    return false;
  }
  levelEnd(tick, service) {
    return false
  }
}

function standardLossCondition(tick, service) {
  // Give the users plenty of leeway
  if (tick % 100 === 0) {
    const escaped = Object.values(service.assets).find(a => a.type === 'asteroid' && a.z < -110000)
    if (escaped !== undefined) {
console.log(escaped);
      return true;
    }
  }
  return false;
}


exports.levels = function () {
  return [
    Level1, 
    Level2, 
    End,
  ];
}

function randomlyGeneratedAsteroid(stageWidth) {
  const props = {
    x: stageWidth * Math.random() * (Math.sign(Math.random() - 0.5)),
    y: 1000 + Math.random() * 9000,
    z: 100000,
    size: 1200,
    health: 100
  }

  return createAsteroid(props);
}

function createAsteroid(props) {
  const size = props.size || 1000;
  const x = props.x;
  const y = props.y;
  const z = 120000;
  const health = props.health;

  return {
    name: 'Asteroid',
    obj: 'sphere',
    w: 1,
    i: 0,
    j: 0,
    k: 0,
    x: x,
    y: y,
    z: z,
    dx: 0,
    dy: 0,
    dz: -200 - Math.random() * 4800,
    scale: size,
    radius: size,
    t: new Date(),
    interactive: true,
    vitals: {
      birth: new Date().getTime(),
      lifespan: 3 * 60 * 1000,
      health: health,
      maxHealth: health
    },
    type: 'asteroid',
    material: {
      color: 0x202020,
      emissive: 0x111111,
      displacementMap: randomAsteroidMap(),
      displacementScale: 10 + Math.random()*240,
      bumpMap: randomAsteroidMap(),
      bumpScale: 10 + Math.random()*240,
      shininess: 0,
    }
  }
}

let currentAnnouncement;
function createAnnouncement(service, message) {
  const announcement = {
    name: message,
    type: 'announcement',
  }

  service.create(announcement).then((a) => {
    currentAnnouncement = a;
  });
}

function deleteAnnouncement(service) {
  const announcement = currentAnnouncement;
  if (announcement) {
    service.remove(announcement.id).then(() => {
      if (currentAnnouncement === announcement) {
        currentAnnouncement = undefined;
      }
    });
  }
}

function randomAsteroidMap() {
  const options = ['/public/13302-normal.jpg', '/public/3215-bump.jpg', '/public/12253.jpg', '/public/12098.jpg'];
  return options[Math.floor(Math.random() * options.length)]
}
