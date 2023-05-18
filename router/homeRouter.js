const express = require("express");
const router = express.Router();
const os = require("os");

// Ustawienie routera dla strony głównej
router.get("/", (req, res) => {
  const hostname = os.hostname();
  const serverInfo = {
    hostname: hostname,
    platform: os.platform(),
    release: os.release(),
    uptime: os.uptime(),
    cpu: os.cpus(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
  };
  res.render("index", { serverInfo });
});

module.exports = router;
