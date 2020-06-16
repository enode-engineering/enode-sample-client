const express = require('express')
const session = require('express-session');
const faker = require('faker');
const path = require("path");

const app = express()
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(session({
  secret: 'cookie top secret',
  resave: false,
  saveUninitialized: true
}))

app.use((req, res, next) => {
  if (!req.session.user) {
    req.session.user = {
      id: faker.random.uuid(),
      firstName: faker.name.firstName(),
      lastName: "Nordmann"
    };
  }
  next();
});

app.get('/', async (req, res) => {
  res.render("index", {
    id: req.session.user.id,
    firstName: req.session.user.firstName,
    lastName: req.session.user.lastName,
    tokens: JSON.stringify(req.session.tokenSet, null, 4)
  });
});

module.exports = app;
