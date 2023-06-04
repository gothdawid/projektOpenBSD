const express = require("express");
const router = express.Router();
const { execSync, exec } = require("child_process");

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

// Obsługa formularza firewalla
router.post("/", (req, res) => {
  const { enable, nat, tcpPort, udpPort } = req.body;

  // Zapisz ustawienia firewalla
  setFirewallNatEnabled(nat === "on");
  setOpenPorts(tcpPort, udpPort);
  setFirewallEnabled(enable === "on");

  res.redirect("/firewall");
});

// Funkcja pomocnicza do sprawdzania czy firewall jest włączony
function isFirewallEnabled() {
  const output = execSync("pfctl -si").toString();
  return output.includes("Status: Enabled");
}

// Funkcja pomocnicza do ustawiania włączenia/wyłączenia firewalla
function setFirewallEnabled(enabled) {
  const firewallStatus = isFirewallEnabled();
  if (enabled && !firewallStatus) {
    const configStatus = execSync("pfctl -nf /etc/pf.conf");
    if (configStatus.toString() === "") {
      execSync("pfctl -f /etc/pf.conf");
      execSync("pfctl -e");
    }
  }
  if (!enabled && firewallStatus) {
    execSync("pfctl -d");
  }
}

// Funkcja pomocnicza do sprawdzania czy NAT jest włączony
function isFirewallNatEnabled() {
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

  return natEnabled === 3;
}

// Funkcja pomocnicza do ustawiania włączenia/wyłączenia NAT
function setFirewallNatEnabled(enabled) {
  const natStatus = isFirewallNatEnabled();
  let pfConf = execSync("cat /etc/pf.conf").toString();
  pfConf = pfConf.replaceAll("$", "\\$");

  if (enabled && !natStatus) {
    pfConf = pfConf.replace(
      "#match in all scrub (no-df random-id max-mss 1440)",
      "match in all scrub (no-df random-id max-mss 1440)"
    );
    pfConf = pfConf.replace(
      "#match out on em0 inet from !(em0:network) to any nat-to (em0)",
      "match out on em0 inet from !(em0:network) to any nat-to (em0)"
    );
  }
  if (!enabled && natStatus) {
    pfConf = pfConf.replace(
      "match in all scrub (no-df random-id max-mss 1440)",
      "#match in all scrub (no-df random-id max-mss 1440)"
    );
    pfConf = pfConf.replace(
      "match out on em0 inet from !(em0:network) to any nat-to (em0)",
      "#match out on em0 inet from !(em0:network) to any nat-to (em0)"
    );
  }
  execSync(`echo "${pfConf}" > /etc/pf.conf`);
  //execSync("pfctl -f /etc/pf.conf");
}

// Funkcja pomocnicza do ustawiania otwartych portów
function setOpenPorts(tcpPorts, udpPorts) {
  let pfConf = execSync("cat /etc/pf.conf").toString();

  pfConf = pfConf.replaceAll("$", "\\$");
  const tcpPattern = /.*proto tcp from any to any port { (.*?) }.*/g;
  const udpPattern = /.*proto udp from any to any port { (.*?) }.*/g;

  const tcpMatch = tcpPattern.exec(pfConf);
  const udpMatch = udpPattern.exec(pfConf);

  console.log(tcpMatch[0]);
  console.log(udpMatch[0]);

  const tcpPortString = tcpPorts.join(", ");
  const udpPortString = udpPorts.join(", ");

  pfConf = pfConf.replace(
    tcpPattern,
    `pass in on \\$wan proto tcp from any to any port { ${tcpPortString.trim()} }`
  );
  pfConf = pfConf.replace(
    udpPattern,
    `pass in on \\$wan proto udp from any to any port { ${udpPortString.trim()} }`
  );

  //save file to /etc/pf.conf
  //console.log(`${pfConf}`);
  //console.log(`echo "${pfConf}`);
  execSync(`echo "${pfConf}" > /etc/pf.conf`);
  //execSync("pfctl -f /etc/pf.conf");
}
// Funkcja pomocnicza do pobierania otwartych portów
function getOpenPorts() {
  const output = execSync("cat /etc/pf.conf").toString().split("\n");
  let openPorts = {
    tcp: [],
    udp: [],
  };

  output.forEach((line) => {
    if (line.includes("pass in on $wan proto tcp from any to any port")) {
      openPorts.tcp = extractPortsFromLine(line);
    }
    if (line.includes("pass in on $wan proto udp from any to any port")) {
      openPorts.udp = extractPortsFromLine(line);
    }
  });

  return openPorts;
}

// Funkcja pomocnicza do ekstrakcji portów z linii
function extractPortsFromLine(line) {
  const portString = line.split("{")[1].split("}")[0];
  return portString.split(", ").filter((port) => port !== "");
}

module.exports = router;
