import config from "config";
import got from "got";


const get =  async <T> (path: string, accessToken: string) => {

  const res = await client.get(path, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  return res.body as any as T
}

const prefixUrl = config.get("apiUrl") as string;
const client = got.extend({
  prefixUrl,
  responseType: "json",
});

export const listVehicles = async (accessToken: string) => 
  get<any[]>(`vehicles?field[]=smartChargingPolicy&field[]=information&field[]=chargeState&field[]=location`, accessToken); 


export const listChargers = async (accessToken: string) => 
  get<any[]>("chargers", accessToken); 

export const getCharger = async (accessToken: string, chargerId: string) => 
  get<any>(`chargers/${chargerId}?field[]=information&field[]=chargeState`, accessToken);