const routes = require("express").Router();

const homeRouter = require("./homeRouter");
const firewallRouter = require("./firewallRouter");
const networkRouter = require("./networkRouter");
const statisticsRouter = require("./statisticsRouter");
const settingsRouter = require("./settingsRouter");
const loginRouter = require("./loginRouter");

// Sprawdzanie czy użytkownik jest zalogowany
const requireLogin = (req, res, next) => {
  if (!req.session.loggedIn) {
    res.redirect("/login");
  } else {
    next();
  }
};

routes.use("/firewall", requireLogin, firewallRouter);
routes.use("/network", requireLogin, networkRouter);
routes.use("/statistics", requireLogin, statisticsRouter);
routes.use("/settings", requireLogin, settingsRouter);
routes.use("/", loginRouter);
routes.use("/", requireLogin, homeRouter);

module.exports = routes;
