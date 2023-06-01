const express = require("express");
const router = express.Router();

// Ustawienie routera dla strony logowania
router.get("/login", (req, res) => {
  res.render("login");
});

// Obsługa logowania
router.post("/login", (req, res) => {
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

// Obsługa wylogowania

router.get("/logout", (req, res) => {
  req.session.loggedIn = false;
  res.redirect("/login");
});

module.exports = router;
