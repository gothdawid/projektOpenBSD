const express = require("express");
const router = express.Router();
const { execSync } = require("child_process");

// Sprawdzanie czy użytkownik jest zalogowany
const requireLogin = (req, res, next) => {
  if (!req.session.loggedIn) {
    res.redirect("/login");
  } else {
    next();
  }
};

// Obsługa żądania GET na stronę ustawień
router.get("/", requireLogin, (req, res) => {
  const hostname = execSync("hostname").toString().trim();
  const networkAddress = execSync(
    'ifconfig | grep "em0" -A 7 | grep "inet " | awk \'{print $2}\''
  )
    .toString()
    .trim();

  res.render("settings", {
    hostname: hostname || "",
    lanAddress: networkAddress || "",
    wanMode: req.session.wanMode || "",
    staticWanAddress: req.session.staticWanAddress || "",
    dnsServers: req.session.dnsServers || "",
    dhcpEnabled: req.session.dhcpEnabled || false,
    dnsEnabled: req.session.dnsEnabled || false,
  });
});

// Obsługa żądania POST z formularza ustawień
router.post("/", requireLogin, (req, res) => {
  const {
    hostname,
    lanAddress,
    wanMode,
    staticWanAddress,
    dnsServers,
    dhcpEnabled,
    dnsEnabled,
  } = req.body;

  // Zapisz wartości ustawień w sesji
  req.session.hostname = hostname;
  req.session.lanAddress = lanAddress;
  req.session.wanMode = wanMode;
  req.session.staticWanAddress = staticWanAddress;
  req.session.dnsServers = dnsServers;
  req.session.dhcpEnabled = !!dhcpEnabled;
  req.session.dnsEnabled = !!dnsEnabled;

  res.redirect("/settings");
});

module.exports = router;
