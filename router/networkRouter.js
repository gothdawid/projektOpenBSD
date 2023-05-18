const express = require("express");
const router = express.Router();
const os = require("os");
const app = express();
const { execSync } = require("child_process");

// Ustawienie ścieżki dla strony statystyk
router.get("/", (req, res) => {
  const networkInterfaces = os.networkInterfaces();

  //remove lo0
  delete networkInterfaces.lo0;

  res.render("network", { networkInterfaces });
});

module.exports = router;
