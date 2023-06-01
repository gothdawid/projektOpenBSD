const express = require("express");
const router = express.Router();
const { execSync } = require("child_process");

router.get("/", (req, res) => {
  try {
    const output = execSync("ifconfig").toString();
    const networkInterfaces = processIfconfigOutput(output);
    res.render("network", { networkInterfaces });
  } catch (error) {
    console.error("Błąd podczas wykonania polecenia ifconfig:", error);
    res.render("error", { message: "Wystąpił błąd", error });
  }
});

function processIfconfigOutput(output) {
  const interfaces = [];
  const lines = output.split("\n");
  let interfaceData = null;

  for (const line of lines) {
    // if line match /flags=(?<flags>.*)\smtu\s(?<mtu>\d+)/
    // em3: flags=808843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST,AUTOCONF4> mtu 1500

    const match = line.match(
      /(?<interfaceName>\w+):\sflags=\d+<(?<flags>.*)>\smtu\s(?<mtu>\d+)/
    );
    if (match) {
      if (interfaceData) {
        interfaces.push(interfaceData);
        //console.log(interfaceData);
        interfaceData = null;
      }
      interfaceData = {
        name: match.groups.interfaceName,
        flags: match.groups.flags.split(","),
        mtu: match.groups.mtu,
      };
    } else {
      const lladdrMatch = line.match(/\t*lladdr\s(?<mac>.*)/);
      const speedMatch = line.match(
        /\t*media:\sEth.+\((?<speed>\d*)\w*\s(?<duplex>\w+)-duplex\)/
      );
      const inetMatch = line.match(
        /\t*inet\s(?<address>[\d|\.]+)\snetmask\s(?<netmask>\w+)/
      );
      const inet6Match = line.match(
        /\t*inet6\s(?<address>.*)\sprefixlen\s(?<prefix>\d+)/
      );
      const statusMatch = line.match(/\t*status:\s(?<status>.+)/);

      if (lladdrMatch) {
        interfaceData.mac = lladdrMatch.groups.mac;
      }
      if (speedMatch) {
        interfaceData.speed = speedMatch.groups.speed;
        interfaceData.duplex = speedMatch.groups.duplex;
      }
      if (inetMatch) {
        interfaceData.address = inetMatch.groups.address;
        // netmax hex string (0xff000000) to ip4
        const netmask = parseInt(inetMatch.groups.netmask, 16);
        const netmaskBinary = netmask.toString(2);
        const netmaskParts = netmaskBinary.match(/.{1,8}/g);
        const netmaskIp4 = netmaskParts
          .map((part) => parseInt(part, 2))
          .join(".");
        interfaceData.netmask = netmaskIp4;
      }
      if (inet6Match) {
        interfaceData.address6 = inet6Match.groups.address;
        interfaceData.prefix6 = inet6Match.groups.prefix;
      }
      if (statusMatch) {
        interfaceData.status = statusMatch.groups.status;
      }
    }
  }
  interfaces.push(interfaceData);
  return interfaces;
}

module.exports = router;
