import express from "express";
import cookieSession from "cookie-session";
import faker from "faker";
import path from "path";
import { listVehicles } from "./enode";

const app = express();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../", "views"));

app.use(
  express.urlencoded({
    extended: false,
  }),
);

app.use(
  cookieSession({
    name: "session",
    secret: "2EbmNv78fEqBr23ZaKzs",
    maxAge: 24 * 60 * 60 * 1000 * 180,
    sameSite: true,
  }),
);

app.use((req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  req.session!.user = {
    id: faker.random.uuid(),
    firstName: faker.name.firstName(),
    lastName: "Nordmann",
    image: `https://picsum.photos/seed/${new Date().valueOf()}/200/200`,
  };
  next();
});

app.get("/", async (req, res) => {
  let vehicles: any[] | null = null;
  let vehiclesError: any = null;

  if (req.session?.tokens) {
    try {
      vehicles = await listVehicles(req.session.tokens.access_token);
    } catch (e) {
      console.error(e);
      vehiclesError = e.toString();
    }
  }

  res.render("index", {
    id: req.session?.user.id,
    firstName: req.session?.user.firstName,
    lastName: req.session?.user.lastName,
    image: req.session?.user.image,
    tokens: req.session?.tokens,
    vehicles,
    vehiclesError,
  });
});

export default app;
