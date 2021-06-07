class Levels {
  constructor(service, name, levelNumber, announcement, stageWidth) {
    this.name = name;
    this.level = levelNumber;
    this.announcement = announcement;
    this.stageWidth = stageWidth;

    deleteAnnouncements(service);
    createAnnouncement(service, this.name, this.announcement);
  }
}

class Level1 extends Levels {
  constructor(service) {
    super(service, 'Level 1', 1, 'Stop the asteroids from reaching Earth', 5000);
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
    return standardWinCondition(tick, 20 * 60, service);
  }
}
class Level2 extends Levels {
  constructor(service) {
    super(service, 'Level 2', 2, 'Stop the asteroids from reaching Earth', 7500);
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
    return standardWinCondition(tick, 20 * 60, service);
  }
}
class End extends Levels {
  constructor(service) {
    super(service, 'End', 0, "Congratulations! You've beaten the game", 100000);
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
      return true;
    }
  }
  return false;
}

function standardWinCondition(tick, earliestVictoryTick, service) {
  if (tick > earliestVictoryTick && tick % 20 === 0) {
    // When there are no asteroids left
    if (Object.values(service.assets).find(a => a.type === 'asteroid') === undefined) {
      return true;
    }
  }
  return false;
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
function createAnnouncement(service, title, text) {
  const announcement = {
    name: title,
    text: text,
    type: 'announcement',
  }

  service.create(announcement).then((a) => {
    currentAnnouncement = a;
  });
}

function deleteAnnouncements(service) {
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

exports.levels = function () {
  return [
    Level1, 
    Level2, 
    End,
  ];
}
