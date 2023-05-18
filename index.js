// Importowanie wymaganych modułów
const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser"); // Dodany moduł body-parser
const settingsRouter = require("./settingsRouter");
const firewallRouter = require("./firewallRouter");
const statisticsRouter = require("./statisticsRouter");

// Inicjalizacja aplikacji Express
const app = express();

// Ustawienie silnika widoku EJS
app.set("view engine", "ejs");

// Ustawienie ścieżki dla plików statycznych
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/bootstrap",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/"))
);
app.use(
  "/jquery",
  express.static(path.join(__dirname, "node_modules/jquery/dist"))
);
app.use(
  "/socketio",
  express.static(path.join(__dirname, "node_modules/"))
);

// Konfiguracja sesji
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Dodanie parsera dla danych żądania typu 'application/x-www-form-urlencoded'
app.use(bodyParser.urlencoded({ extended: true }));

// Sprawdzanie czy użytkownik jest zalogowany
const requireLogin = (req, res, next) => {
  if (!req.session.loggedIn) {
    res.redirect("/login");
  } else {
    next();
  }
};

// Ustawienie routera dla strony głównej
app.get("/", requireLogin, (req, res) => {
  res.redirect("statistics");
});

// Ustawienie routera dla strony logowania
app.get("/login", (req, res) => {
  res.render("login");
});

// Obsługa logowania
app.post("/login", (req, res) => {
  const { username, password } = req.body; // Poprawnie odczytujemy dane z formularza logowania

  // Tutaj można dodać logikę weryfikacji danych logowania

  // Przykładowe uwierzytelnienie - zawsze poprawne dane logowania
  if (username === "admin" && password === "admin") {
    req.session.loggedIn = true;
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.session.loggedIn = false;
  res.redirect("/login");
});

// Start serwera
const port = 3000;
app.listen(port, () => {
  console.log(`Serwer działa na porcie ${port}`);
});

app.use("/settings", settingsRouter);
app.use("/firewall", firewallRouter);
app.use("/statistics", statisticsRouter);
