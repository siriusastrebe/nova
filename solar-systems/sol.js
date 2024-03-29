exports.assets = function () {
  return [{
    name: 'Earth',
    type: 'environment',
    subtype: 'planet',
    obj: 'sphere',
    material: {
      map: '/public/land_ocean_ice_cloud_2048.png',
      specularMap: '/public/ocean_1024.png',
      specular: 0x404040,
    },
    dj: 0.003,
    x: 0,
    y: 0,
    z: -5200000,
    scale: 3200000,
  }, {
    name: 'Moon',
    type: 'environment',
    subtype: 'moon',
    obj: 'sphere',
    material: {
      map: '/public/lroc_color_poles_2k.png',
      bumpMap: '/public/ldem_16_uint.png',
      displacementMap: '/public/ldem_16_uint.png',
      specular: 0x000000,
      bumpScale: 200,
      shininess: 1,
      displacementScale: 20
    },
    w: -0.5407575913134989,
    i: 0,
    j: -0.8411784753765537,
    k: 0,
    x: 4000000,
    y: 0,
    z: 8800000,
    scale: 1600000
  }/*, {
    name: 'Sun',
    type: 'environment',
    subtype: 'star',
    obj: 'sphere',
    textures: ['/public/lensflare0.png', '/public/lensflare3.png', '/public/lensflare4.png'],
    x: 0,
    y: 0,
    z: 10000000,
    scale: 1,
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
  }*/]
}
