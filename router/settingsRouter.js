const express = require("express");
const router = express.Router();
const { execSync } = require("child_process");

// Obsługa żądania GET na stronę ustawień
router.get("/", (req, res) => {
  const hostname = getHostname(req);
  const lanAddress = getLanAddress(req);
  const dhcpEnabled = getServiceStatus("dhcpd");
  const dnsEnabled = getServiceStatus("unbound");
  const sambaEnabled = getServiceStatus("smbd");
  const mysqlEnabled = getServiceStatus("mysqld");
  const nginxEnabled = getServiceStatus("nginx");
  const sshEnabled = getServiceStatus("sshd");

  res.render("settings", {
    hostname: hostname || "",
    lanAddress: lanAddress || "",
    dhcpEnabled: dhcpEnabled || false,
    dnsEnabled: dnsEnabled || false,
    sambaEnabled: sambaEnabled || false,
    mysqlEnabled: mysqlEnabled || false,
    nginxEnabled: nginxEnabled || false,
    sshEnabled: sshEnabled || false,
  });
});

// Obsługa żądania POST z formularza ustawień
router.post("/", (req, res) => {
  const {
    hostname,
    lanAddress,
    dhcpEnabled,
    dnsEnabled,
    sambaEnabled,
    mysqlEnabled,
    nginxEnabled,
    sshEnabled,
  } = req.body;

  // Ustaw wartości ustawień
  setHostname(req, hostname);
  setLanAddress(req, lanAddress);
  setServiceStatus("dhcpd", dhcpEnabled);
  setServiceStatus("unbound", dnsEnabled);
  setServiceStatus("smbd", sambaEnabled);
  setServiceStatus("mysqld", mysqlEnabled);
  setServiceStatus("nginx", nginxEnabled);
  setServiceStatus("sshd", sshEnabled);

  res.redirect("/settings");
});

// Funkcje get i set dla poszczególnych zmiennych
function getHostname(req) {
  const hostname = execSync("hostname").toString().trim();
  return hostname;
}

function setHostname(req, hostname) {
  req.session.hostname = hostname;
}

function getLanAddress(req) {
  const networkAddress = execSync(
    'ifconfig | grep "vether0" -A 7 | grep "inet " | awk \'{print $2}\''
  )
    .toString()
    .trim();
  return networkAddress;
}

function setLanAddress(req, lanAddress) {
  req.session.lanAddress = lanAddress;
  const broadcastAddress = `${lanAddress.split(".")[0]}.${
    lanAddress.split(".")[1]
  }.${lanAddress.split(".")[2]}.255`;
  const fileContent = `inet ${lanAddress} 255.255.255.0 ${broadcastAddress}\nup`;
  execSync(`echo "${fileContent}" | tee /etc/hostname.vether0`);
  execSync(`sh /etc/netstart`);
}

function getServiceStatus(serviceName) {
  const output = execSync(`rcctl ls on`).toString();
  const services = output.split("\n");
  return services.includes(serviceName);
}

function setServiceStatus(serviceName, isEnabled) {
  if (isEnabled) {
    execSync(`rcctl enable ${serviceName}`);
    execSync(`rcctl start ${serviceName}`);
  } else {
    execSync(`rcctl disable ${serviceName}`);
    execSync(`rcctl stop ${serviceName}`);
  }
}

module.exports = router;
