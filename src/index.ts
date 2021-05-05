import config from "config";
import got from "got";
import { Issuer } from "openid-client";
import app from "./boilerplate";

interface LinkUserResponseBody {
  linkState: string;
}

interface LinkSessionDetails {
  userName: string;
  userImage: string;
  linkMultiple: boolean;
  forceLanguage?: string;
  hideBranding?: boolean;
}

async function createClient() {
  const adminUser = config.get("adminUser");
  const adminPass = config.get("adminPass");

  const clientData = {
    displayName: "CleanEnergy Inc",
    customerName: "CleanEnergy Inc",
    featureFlags: {},
    redirectUris: [config.get("callbackUrl")],
    secret: "some-secret",
  };

  return got
    .post(`${config.get("apiUrl")}/admin/clients`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${adminUser}:${adminPass}`,
        ).toString("base64")}`,
      },
      json: clientData,
    })
    .json();
}

(async () => {
  let client_id: string;
  let client_secret: string;

  if (config.has("selfProvision")) {
    const clientDetails: any = await createClient();
    client_id = clientDetails.id;
    client_secret = clientDetails.secret;
  } else {
    client_id = config.get("clientId");
    client_secret = config.get("clientSecret");
  }

  try {
    // Configure OAuth client library
    const enodeIssuer = await Issuer.discover(config.get("oauthUrl"));

    const client = new enodeIssuer.Client({
      client_id,
      client_secret,
      redirect_uris: [config.get("callbackUrl")],
      response_types: ["code"],
    });

    app.get("/link", async (req, res) => {
      const user = req.session!.user;

      const validLangs = ["en", "nb", "de", "sv"];
      const queryLang = req.query.lang as string;
      const hideBranding = req.query.hideBranding as string;

      // Create an Enode Link session for the user
      const clientGrant = await client.grant({
        grant_type: "client_credentials",
      });

      const linkSessionDetails: LinkSessionDetails = {
        userName: `${user.firstName} ${user.lastName}`,
        userImage: user.image,
        linkMultiple: false,
      };
      if (queryLang && validLangs.includes(queryLang)) {
        linkSessionDetails.forceLanguage = queryLang;
      }
      if (hideBranding) {
        linkSessionDetails.hideBranding = true;
      }

      const body: LinkUserResponseBody = await got
        .post(`${config.get("apiUrl")}/users/${user.id}/link`, {
          headers: {
            Authorization: `Bearer ${clientGrant.access_token}`,
          },
          json: linkSessionDetails,
        })
        .json();
      const linkState = body.linkState;

      // Persist linkState to user's session
      req.session!.linkState = linkState;

      const reqScope = req.query.scope as string;
      const defaultScope = "offline_access all";
      const scope = reqScope ? reqScope.split(",").join(" ") : defaultScope;

      // Construct an OAuth authorization URL
      const authorizationUrl = client.authorizationUrl({
        // scope: "offline_access all control:vehicle:charging",
        scope,
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

    app.post("/webhook", async (req, res) => {
      console.log("[webhook]", JSON.stringify(req.body));
      res.json({ logged: true });
    });

    app.listen(config.get("port"), () =>
      console.log(`Server ready on port ${config.get("port")}`),
    );
  } catch (err) {
    console.log("ERROR", err);
  }
})();
