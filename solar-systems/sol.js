exports.assets = function () {
  return [{
    name: 'Earth',
    type: 'environment',
    subtype: 'planet',
    obj: 'sphere',
    texture: '/public/land_ocean_ice_cloud_1024.jpg',
    x: 0,
    y: 0,
    z: -10000,
    scale: 200,
  }, {
    name: 'Moon',
    type: 'environment',
    subtype: 'moon',
    obj: 'sphere',
    texture: '/public/usgsmoon.jpg',
    x: 0,
    y: 0,
    z: 2000,
    scale: 30,
  }, {
    name: 'Sun',
    type: 'environment',
    subtype: 'star',
    obj: 'sphere',
    textures: ['/public/lensflare0.png', '/public/lensflare3.png', '/public/lensflare4.png'],
    x: 0,
    y: 0,
    z: 100000,
    scale: 300,
    lensflares: [{
      texture: 0,
      size: 700,
      distance: 0,
      color: undefined
    }, {
      texture: 1,
      size: 60,
      distance: 0.6,
      color: undefined
    }, {
      texture: 1,
      size: 70,
      distance: 0.7,
      color: undefined
    }, {
      texture: 1,
      size: 120,
      distance: 0.9,
      color: undefined
    }, {
      texture: 2,
      size: 70,
      distance: 1,
      color: undefined
    }]
  }]
}