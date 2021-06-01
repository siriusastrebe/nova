class Level1 {
  constructor() {
    this.name = 'Level 1';
    this.level = 1;
    this.announcement = 'Stop the asteroids from reaching Earth';
    this.stageWidth = 5000;
  }
  tick (tick, assetCreate, that) {
    if (tick % 20 === 0) {
      assetCreate.call(that, randomlyGeneratedAsteroid(this.stageWidth)).then((a) => {
        console.log('Created asset...', a);
      });
    }
  }
  levelEnd(tick) {
    return false
  }
}

exports.levels = function () {
  return [
    new Level1(), 
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
  const z = 100000;
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
    dz: -200 - Math.random() * 2400,
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
function randomAsteroidMap() {
  const options = ['/public/13302-normal.jpg', '/public/3215-bump.jpg', '/public/12253.jpg', '/public/12098.jpg'];
  return options[Math.floor(Math.random() * options.length)]
}
