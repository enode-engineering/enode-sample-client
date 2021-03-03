const config = require("config");
const got = require("got");
const { Issuer } = require("openid-client");
const uuid = require("uuid");

async function createWebhook() {
  const enodeIssuer = await Issuer.discover(config.get("oauthUrl"));
  const client = new enodeIssuer.Client({
    client_id: config.get("clientId"),
    client_secret: config.get("clientSecret"),
    redirect_uris: [config.get("callbackUrl")],
    response_types: ["code"],
  });

  const clientGrant = await client.grant({
    grant_type: "client_credentials",
  });

  const res = await got
    .put(`${config.get("apiUrl")}/webhooks/firehose`, {
      headers: {
        Authorization: `Bearer ${clientGrant.access_token}`,
      },
      json: {
        secret: uuid.v4(),
        url: config.get("webhookUrl"),
      },
    })
    .json();

  console.log("Webhook created", res);
}

async function testWebhook() {
  const enodeIssuer = await Issuer.discover(config.get("oauthUrl"));
  const client = new enodeIssuer.Client({
    client_id: config.get("clientId"),
    client_secret: config.get("clientSecret"),
    redirect_uris: [config.get("callbackUrl")],
    response_types: ["code"],
  });

  const clientGrant = await client.grant({
    grant_type: "client_credentials",
  });

  await got
    .post(`${config.get("apiUrl")}/webhooks/firehose/test`, {
      headers: {
        Authorization: `Bearer ${clientGrant.access_token}`,
      },
    })
    .json();
}

createWebhook()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.log("ERROR", err);
    process.exit(1);
  });
