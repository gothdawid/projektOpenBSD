const express = require("express");
const router = express.Router();
const { execSync } = require("child_process");

// Ścieżka do ustawień firewalla
router.get("/", (req, res) => {
  // Pobierz informacje o firewallu z systemu OpenBSD
  const firewallEnabled = isFirewallEnabled();
  const firewallNatEnabled = isFirewallNatEnabled();
  const openPorts = getOpenPorts();

  res.render("firewall", {
    firewallEnabled,
    firewallNatEnabled,
    openPorts,
  });
});

// Obsługa zapisu ustawień firewalla
router.post("/", (req, res) => {
  const { enable, nat, securityLevel, sshAccess, customRules } = req.body;

  // Wykonaj odpowiednie operacje zapisu ustawień firewalla

  res.redirect("/firewall");
});

// Funkcja pomocnicza do sprawdzania czy firewall jest włączony
function isFirewallEnabled() {
  const output = execSync("pfctl -si").toString();
  return output.includes("Status: Enabled");
}

// Funkcja pomocnicza do sprawdzania czy NAT jest włączony
function isFirewallNatEnabled() {
  // jeśli plik /etc/pf.conf zawiera wpis
  // match in all scrub (no-df random-id max-mss 1440)
  // match out on em0 inet from !(em0:network) to any nat-to (em0)
  // to NAT jest włączony
  // jeśli przed tymi niniami jest # to jest wyłączony

  const output = execSync("cat /etc/pf.conf").toString().split("\n");
  let natEnabled = 0;

  if (isFirewallEnabled()) natEnabled++;

  output.forEach((line) => {
    if (
      line.includes("match in all scrub (no-df random-id max-mss 1440)") &&
      !line.includes("#match in all scrub (no-df random-id max-mss 1440)")
    ) {
      natEnabled++;
    }
    if (
      line.includes(
        "match out on em0 inet from !(em0:network) to any nat-to (em0)"
      ) &&
      !line.includes(
        "#match out on em0 inet from !(em0:network) to any nat-to (em0)"
      )
    ) {
      natEnabled++;
    }
  });

  let Enabled = false;
  if (natEnabled == 3) {
    Enabled = true;
  }

  return Enabled;
}

// Funkcja pomocnicza do pobierania dostępu SSH
function getOpenPorts() {
  // pass in on $wan proto tcp from any to any port { ssh, https, http, ftp, sftp, 3000 } keep state
  // pass in on $wan proto udp from any to any port { domain, ntp, http, 3000 } keep state

  const output = execSync("cat /etc/pf.conf").toString().split("\n");
  let openPorts = {
    tcp: [],
    udp: []
  };
  output.forEach((line) => {
    if (line.includes("pass in on $wan proto tcp from any to any port")) {
      openTCPports = line.split("{ ")[1].split(" }")[0].split(", ");
      openPorts.tcp = openTCPports;
    }
    if (line.includes("pass in on $wan proto udp from any to any port")) {
      openUDPports = line.split("{ ")[1].split(" }")[0].split(", ");
      openPorts.udp = openUDPports;
    }
  });
  return openPorts;
}

module.exports = router;
