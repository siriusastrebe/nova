exports.assets = function () {
  return [{
    name: 'Earth',
    type: 'environment',
    subtype: 'planet',
    obj: 'sphere',
    material: {
      map: '/public/land_ocean_ice_2048.png',
      specularMap: '/public/ocean_2048.png',
      specular: 0x222222,
    },
    x: 0,
    y: 0,
    z: -52000,
    scale: 32,
  }, {
    name: 'Moon',
    type: 'environment',
    subtype: 'moon',
    obj: 'sphere',
    material: {
      map: '/public/lroc_color_poles_2k_blur.png',
      bumpMap: '/public/ldem_16_uint.png',
      displacementMap: '/public/ldem_16_uint.png',
      bumpScale: 200,
      shininess: 1,
      displacementScale: 20
    },
    x: 0,
    y: 0,
    z: 88000,
    scale: 16
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
