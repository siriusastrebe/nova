const authentication = require('@feathersjs/authentication')
const authenticationLocal = require('@feathersjs/authentication-local')
// const authenticationOauth = require('@feathersjs/authentication-oauth')

const { AuthenticationService, JWTStrategy } = authentication
const { LocalStrategy } = authenticationLocal
// const { express: oauth, OAuthStrategy } = authenticationOauth

module.exports = function auth(app) {
  const authService  = new AuthenticationService(app)

  // register all of the strategies with authentication service
  authService.register('local', new LocalStrategy())
  authService.register('jwt', new JWTStrategy())
  // authService.register('google', new OAuthStrategy())

  // register the authentication service with your app
  app.use('/api/authentication', authService)

  // register the oauth middleware with your app
  // app.configure(oauth())
}
