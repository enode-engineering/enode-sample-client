const _ = require('lodash');
const app = require('./boilerplate');
const config = require('config');
const {Issuer} = require('openid-client');
const got = require('got');

const main = async () => {
  // Configure OAuth client library
  const enodeIssuer = await Issuer.discover(config.get('oauthUrl'));
  const client = new enodeIssuer.Client({
    client_id: config.get('clientId'),
    client_secret: config.get('clientSecret'),
    redirect_uris: [config.get('callbackUrl')],
    response_types: ['code'],
  });

  app.get('/connect-your-car', async (req, res) => {
    const user = _.get(req, "session.user");

    // Create an Enode Link session for the user
    const clientGrant = await client.grant({grant_type: "client_credentials"});
    const response = await got.post(`${config.get('apiUrl')}/users/${user.id}/link`, {
      headers: {
        'Authorization': `Bearer ${clientGrant.access_token}`
      },
      responseType: "json",
      json: {
        userName: `${user.firstName} ${user.lastName}`,
        userImage: "https://picsum.photos/id/1005/400/400.jpg"
      }
    });
    const linkState = response.body.linkState;

    // Persist linkState to user's session
    req.session.linkState = linkState;

    // Construct an OAuth authorization URL
    const authorizationUrl = client.authorizationUrl({
      scope: "offline_access all control:vehicle:charging",
      state: linkState
    });

    // Redirect user to authorization URL
    res.redirect(authorizationUrl);
  })

  app.get('/callback', async (req, res) => {
    // Fetch linkState from user session
    const linkState = _.get(req, 'session.linkState');

    // Parse relevant parameters from request URL
    const params = client.callbackParams(req);

    // Exchange authorization code for access and refresh tokens
    try {
      const tokenSet = await client.oauthCallback(config.get('callbackUrl'), params, {state: linkState})
      req.session.tokenSet = tokenSet;
    } catch (e) {
      req.session.tokenSet = e;
    }
    res.redirect("/");
  });

  app.post('/token', async (req, res) => {
  });

  app.listen(config.get('port'), () => console.log(`Server listening on ${config.get('port')}`))
}

main();
