// Importowanie wymaganych modułów
const express = require("express");
const path = require("path");

// Inicjalizacja aplikacji Express
const app = express();

// Ustawienie silnika widoku EJS
app.set("view engine", "ejs");

// Ustawienie ścieżki dla plików statycznych
app.use(express.static(path.join(__dirname, "public")));

// Ustawienie routera dla strony głównej
app.get("/", (req, res) => {
  res.render("index");
});

// Start serwera
const port = 3000;
app.listen(port, () => {
  console.log(`Serwer działa na porcie ${port}`);
});
