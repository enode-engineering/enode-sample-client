import express from "express";
import session from "express-session";
import faker from "faker";
import path from "path";

const app = express();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../", "views"));

app.use(
  express.urlencoded({
    extended: false,
  }),
);
app.use(
  session({
    secret: "cookie top secret",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use((req, res, next) => {
  if (req.session === undefined || req.session.user) {
    return next();
  }
  req.session.user = {
    id: faker.random.uuid(),
    firstName: faker.name.firstName(),
    lastName: "Nordmann",
    image: `https://picsum.photos/seed/${new Date().valueOf()}/200/200`,
  };
  next();
});

app.get("/", async (req, res) => {
  res.render("index", {
    id: req.session!.user.id,
    firstName: req.session!.user.firstName,
    lastName: req.session!.user.lastName,
    image: req.session!.user.image,
    tokens: req.session!.tokens,
  });
});

export default app;
