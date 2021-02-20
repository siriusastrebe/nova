const { Service } = require('feathers-knex')
const hooks = require('./accounts.hooks')
const feathersKnex = require('feathers-knex')

module.exports = function accounts(app, knex) {
  const options = {
    Model: knex,
    name: 'accounts'
    // paginate: app.get('pagination')
  }

  app.use('/accounts', feathersKnex(options))

  app.service('accounts').hooks(hooks)
}


// Initializes the `users` service on path `/users`
// const { Users } = require('./users.class');
// const createModel = require('../../models/users.model');
// const hooks = require('./users.hooks');
// 
// module.exports = function (app) {
//   const Model = createModel(app);
//   const paginate = app.get('paginate');
// 
//   const options = {
//     Model,
//     paginate
//   };
// 
//   // Initialize our service with any options it requires
//   app.use('/users', new Users(options, app));
// 
//   // Get our initialized service so that we can register hooks
//   const service = app.service('users');
// 
//   service.hooks(hooks);
// };
