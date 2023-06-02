const express = require("express");
const router = express.Router();
const { execSync } = require("child_process");

router.get("/", (req, res) => {
  const networkInterfaces = processNetworks();
  console.log(networkInterfaces);
  res.render("network", { networkInterfaces });
});

function processNetworks() {
  // List interfaces
  // ls /etc/hostname.* | sed -n 's/.etc.hostname.//p'
  const interfaces = execSync(
    "ls /etc/hostname.* | sed -n 's/.etc.hostname.//p'"
  )
    .toString()
    .trim()
    .split("\n");

  const networkInterfaces = [];

  // Find bridge interfaces in list
  // And find members
  interfaces.forEach((interface) => {
    const details = execSync(`ifconfig ${interface}`).toString();

    // if bridge
    if (interface.startsWith("br")) {
      /*
bridge0: flags=41<UP,RUNNING> mtu 1500
        index 7 llprio 3
        groups: bridge
        priority 32768 hellotime 2 fwddelay 15 maxage 20 holdcnt 6 proto rstp
        designated: id 00:00:00:00:00:00 priority 0
        vether0 flags=3<LEARNING,DISCOVER>
                port 8 ifpriority 0 ifcost 0
        em1 flags=3<LEARNING,DISCOVER>
                port 2 ifpriority 0 ifcost 0
        em2 flags=3<LEARNING,DISCOVER>
                port 3 ifpriority 0 ifcost 0
        em3 flags=3<LEARNING,DISCOVER>
                port 4 ifpriority 0 ifcost 0
        Addresses (max cache: 100, timeout: 240):
                08:00:27:21:1b:69 em2 1 flags=0<>
                0a:00:27:00:00:10 em3 1 flags=0<>
*/
      const bridge = {
        name: interface,
        members: [],
        flags: [],
      };
      //console.log(details);
      const lines = details.split("\n");
      lines.forEach((line) => {
        if (line.startsWith("bridge")) {
          //flags
          bridge.flags = line.split("<")[1].split(">")[0].split(",");
        }
        if (
          line.startsWith("\t") &&
          !line.includes("vether") &&
          line.includes("em") &&
          !line.includes(":")
        ) {
          //members
          const member = line.trim().split(" ")[0];
          bridge.members.push(member);
        }
        // if vether
        if (line.startsWith("\t") && line.includes("vether")) {
          // get ip
          const networkName = line.trim().split(" ")[0];
          const ipDetails = execSync(`ifconfig ${networkName}`)
            .toString()
            .split("\n");
          ipDetails.forEach((ipLine) => {
            if (ipLine.includes("inet")) {
              const inetLine = ipLine.trim().split(" ");

              const ip = inetLine[1];
              const mask = inetLine[3];
              const broadcast = inetLine[5];

              bridge.ip = ip;
              bridge.mask = mask;
              bridge.broadcast = broadcast;
            }
          });
        }
      });
      networkInterfaces.push(bridge);
    }
    // if em0
    else if (interface.startsWith("em0")) {
      /*
        ROUTER# ifconfig em0
        em0: flags=808843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST,AUTOCONF4> mtu 1500
        lladdr 08:00:27:48:1d:3e
        index 1 priority 0 llprio 3
        groups: egress
        media: Ethernet autoselect (1000baseT full-duplex)
        status: active
        inet 192.168.1.180 netmask 0xffffff00 broadcast 192.168.1.255
        */
      const lines = details.split("\n");
      const line = lines[0];
      const name = line.split(":")[0];
      const flags = line.split("<")[1].split(">")[0].split(",");
      const mtu = line.split("mtu ")[1].split(" ")[0];
      let lladdr, speed, duplex, status, address, mask, broadcast;

      lines.forEach((line) => {
        if (line.match(/lladdr/)) {
          lladdr = line.split("lladdr ")[1];
        }
        if (line.match(/media/)) {
          speed = line.split(" (")[1].split("base")[0];
          duplex = line.split("baseT ")[1].replace(")", "");
        }
        if (line.match(/status/)) {
          status = line.split("status: ")[1];
        }
        if (line.match(/inet/)) {
          address = line.split("inet ")[1].split(" ")[0];
          // mask to ipv4
          mask = line.split("netmask ")[1].split(" ")[0];
          broadcast = line.split("broadcast ")[1];
        }
      });

      const networkInterface = {
        name,
        flags,
        mtu,
        lladdr,
        speed,
        duplex,
        status,
        address,
        mask,
        broadcast,
      };

      networkInterfaces.push(networkInterface);
    } else {
      //console.log("Unknown interface: " + interface);
    }
  });
  return networkInterfaces;
}

module.exports = router;
