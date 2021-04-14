exports.assets = function () {
  return [{
    name: 'Earth',
    type: 'environment',
    subtype: 'planet',
    obj: 'sphere',
    material: {
      map: '/public/land_ocean_ice_2048.png',
      specularMap: '/public/ocean_1024.png',
      specular: 0x333333,
    },
    x: 0,
    y: 0,
    z: -52000,
    scale: 32,
  }, {
    name: 'Earth Atmosphere',
    type: 'environment',
    subtype: 'planet',
    obj: 'sphere',
    material: {
      map: '/public/cloud_combined_2048_transparent.png',
      transparent: true,
      specular: 0x222222,
    },
    x: 0,
    y: 0,
    dj: 0.003,
    z: -52000,
    scale: 32.4,
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
    w: -0.7071067811865475,
    i: 0,
    j: -0.7071067811865475,
    k: 0,
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
