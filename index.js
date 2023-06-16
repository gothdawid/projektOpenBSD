// Importowanie wymaganych modułów
const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const http = require("http");
const app = express();
const HTTPserver = http.createServer(app);
const { Server } = require("socket.io");
const os = require("os");
const routes = require("./router");

const io = new Server(HTTPserver);

app.set("view engine", "ejs");

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
  "/socket.io",
  express.static(path.join(__dirname, "node_modules/socket.io/client-dist"))
);

app.use("/img", express.static("img"));

app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));

const port = 3000;
HTTPserver.listen(port, () => {
  console.log(`Serwer działa na porcie ${port}`);
});

const stopSending = false;

io.on("connection", (socket) => {
  console.log("connected");
  const networkInterface = os.networkInterfaces().em0;
  // console.log(os.freemem());
  // console.log(os.totalmem());
  // console.log(os.uptime());
  // console.log(os.cpus());
  // console.log(os.loadavg());
  // console.log(os.hostname());

  setInterval(() => {
    if (stopSending) return;

    const rxBytes = networkInterface[0].rx_bytes;
    const txBytes = networkInterface[0].tx_bytes;

    const rxSpeed = Math.round((rxBytes * 8) / 1024);
    const txSpeed = Math.round((txBytes * 8) / 1024);

    socket.emit("networkTraffic", { rxSpeed, txSpeed });
  }, 1000);
});

io.on("disconnect", (socket) => {
  console.log("disconnected");
  stopSending = true;
});

app.use("/", routes);
