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

// Ścieżka do ustawień firewalla
router.get("/", requireLogin, (req, res) => {
  // Pobierz informacje o firewallu z systemu OpenBSD
  const firewallEnabled = isFirewallEnabled();
  const firewallRules = getFirewallRules();

  res.render("firewall", { firewallEnabled, firewallRules });
});

// Obsługa zapisu ustawień firewalla
router.post("/", (req, res) => {
  const { enable, rules } = req.body;

  // Wykonaj odpowiednie operacje zapisu ustawień firewalla

  res.redirect("/firewall");
});

// Funkcja pomocnicza do sprawdzania czy firewall jest włączony
function isFirewallEnabled() {
  const output = execSync("pfctl -si").toString();
  return output.includes("Status: Enabled");
}

// Funkcja pomocnicza do pobierania reguł firewalla
function getFirewallRules() {
  const output = execSync("pfctl -sr").toString();
  return output;
}

module.exports = router;
