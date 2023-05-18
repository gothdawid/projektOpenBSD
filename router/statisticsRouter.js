const express = require("express");
const router = express.Router();
const os = require("os");
const app = express();

// Ustawienie ścieżki dla strony statystyk
router.get("/", (req, res) => {
  res.render("statistics");
});

module.exports = router;
