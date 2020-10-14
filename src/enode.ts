import config from "config";
import got from "got";

const prefixUrl = config.get("apiUrl") as string;
const client = got.extend({
  prefixUrl,
  responseType: "json",
});

export const listVehicles = async (accessToken: string) => {
  const path = `vehicles?field[]=smartChargingPolicy&field[]=information&field[]=chargeState&field[]=location`;
  const res = await client.get(path, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  return res.body as any;
};
