const express = require("express");
const router = express.Router();
const os = require("os");
const app = express();
const { exec } = require("child_process");

// Ustawienie ścieżki dla strony statystyk
router.get("/", (req, res) => {
  exec("netstat -rnB", (error, stdout, stderr) => {
    if (error) {
      console.error(`Błąd podczas wykonania polecenia: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Błąd podczas wykonania polecenia: ${stderr}`);
      return;
    }

    // Przetworzenie danych na odpowiednią strukturę
    const networkStats = processNetstatOutput(stdout);

    res.render("statistics", { networkStats });
  });
});

function processNetstatOutput(output) {
  const lines = output.trim().split("\n");
  const internetStats = [];
  const internet6Stats = [];

  let section = null;

  for (const line of lines) {
    //console.log("'" + line + "'");
    if (line.includes("net:")) {
      section = internetStats;
    } else if (line.includes("net6")) {
      section = internet6Stats;
    } else if (section && line.includes(" ")) {
      const [destination, gateway, flags, refs, use, mtu, prio, iface] = line
        .trim()
        .split(/\s+/);

      section.push({
        destination,
        gateway,
        flags,
        refs,
        use,
        mtu,
        prio,
        iface,
      });
    }
  }

  return { internet: internetStats, internet6: internet6Stats };
}

module.exports = router;
