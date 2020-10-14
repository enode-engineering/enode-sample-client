import config from "config";
import got from "got";
import { Issuer } from "openid-client";
import app from "./boilerplate";

interface LinkUserResponseBody {
  linkState: string;
}

(async () => {
  // Configure OAuth client library
  const enodeIssuer = await Issuer.discover(config.get("oauthUrl"));
  const client = new enodeIssuer.Client({
    client_id: config.get("clientId"),
    client_secret: config.get("clientSecret"),
    redirect_uris: [config.get("callbackUrl")],
    response_types: ["code"],
  });

  app.get("/link", async (req, res) => {
    const user = req.session!.user;

    // Create an Enode Link session for the user
    const clientGrant = await client.grant({
      grant_type: "client_credentials",
    });
    const body: LinkUserResponseBody = await got
      .post(`${config.get("apiUrl")}/users/${user.id}/link`, {
        headers: {
          Authorization: `Bearer ${clientGrant.access_token}`,
        },
        json: {
          userName: `${user.firstName} ${user.lastName}`,
          userImage: user.image,
          linkMultiple: false,
        },
      })
      .json();
    const linkState = body.linkState;

    // Persist linkState to user's session
    req.session!.linkState = linkState;

    // Construct an OAuth authorization URL
    const authorizationUrl = client.authorizationUrl({
      scope: "offline_access all control:vehicle:charging",
      state: linkState,
    });

    // Redirect user to authorization URL
    res.redirect(authorizationUrl);
  });

  app.get("/callback", async (req, res) => {
    // Fetch linkState previously store in user session
    const linkState = req.session!.linkState;

    // Use authorization code to obtain an access_token and refresh_token
    try {
      const params = client.callbackParams(req);
      const tokenSet = await client.oauthCallback(
        config.get("callbackUrl"),
        params,
        { state: linkState },
      );
      req.session!.tokens = tokenSet;
    } catch (e) {
      req.session!.tokens = e;
    }
    res.redirect("/");
  });

  app.post("/refresh", async (req, res) => {
    // Use refresh_token to obtain a new access_token and refresh_token
    const refreshToken = req.body.refreshToken;
    try {
      const tokenSet = await client.refresh(refreshToken);
      req.session!.tokens = tokenSet;
    } catch (e) {
      req.session!.tokens = e;
    }
    res.redirect("/");
  });

  app.listen(config.get("port"), () =>
    console.log(`Server ready on port ${config.get("port")}`),
  );
})();
