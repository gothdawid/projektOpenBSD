const express = require("express");
const router = express.Router();
const os = require("os");
const server = require("http").Server(router);
const io = require("socket.io")(server);

// Sprawdzanie czy użytkownik jest zalogowany
const requireLogin = (req, res, next) => {
  if (!req.session.loggedIn) {
    res.redirect("/login");
  } else {
    next();
  }
};

// Ustawienie ścieżki dla strony statystyk
router.get("/", (req, res) => {
  res.render("statistics");
});

// Rozpoczęcie nasłuchiwania na połączenia socket.io
io.on("connection", (socket) => {
  const networkInterface = os.networkInterfaces().em0;

  setInterval(() => {
    const rxBytes = networkInterface[0].rx_bytes;
    const txBytes = networkInterface[0].tx_bytes;

    // Obliczenie prędkości w kilobitach na sekundę
    const rxSpeed = Math.round((rxBytes * 8) / 1024);
    const txSpeed = Math.round((txBytes * 8) / 1024);

    // Wysłanie danych do przeglądarki
    socket.emit("networkTraffic", { rxSpeed, txSpeed });
  }, 1000); // Aktualizacja co sekundę
});

module.exports = router;
