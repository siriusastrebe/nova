const { authenticate } = require('@feathersjs/authentication').hooks
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks
const { iff, isProvider, discard } = require('feathers-hooks-common')

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [ hashPassword('password') ],
    update: [ hashPassword('password'),  authenticate('jwt') ],
    patch: [ hashPassword('password'),  authenticate('jwt') ],
    remove: [ authenticate('jwt') ]
  },
  after: {
    all: [
      protect('password')
    ]
  }
}
