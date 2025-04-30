require("dotenv").config();
const { client } = require("./src/config/redis");
const helmet = require("helmet");
const IndexRoute = require("./src/routers/IndexRoute");
const Express = require("express");
const http = require("http");
const app = Express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const initializeSocket = require("./src/modules/message/socketHandler"); // Import socket logic
const { connectQueue } = require("./src/config/queue-config");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// defining port
const port = process.env.PORT || 7000;

// CORS and security setup
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections
      },
    },
  })
);

app.use(
  cors({
    origin: ["http://192.168.1.212:3000", "http://localhost:3000"], // Replace with the origin of your frontend
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use("/", IndexRoute);

// Initialize socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://192.168.1.212:3000", "http://localhost:3000"], // Allow requests from the frontend
    methods: ["GET", "POST"], // Allowed HTTP methods
    credentials: true, // Allow credentials (e.g., cookies)
  },
});
initializeSocket(io); // Pass the `io` instance to the socket logic

// Connect to Redis first, then start the server
client
  .connect()
  .then(() => {
    server.listen(port, () => {
      console.log("Server started on port", port);
      console.log("DB connected to", process.env.DB_HOST);
      connectQueue();
    });
  })
  .catch((err) => {
    console.log("Error while connecting to redis:", err);
  });
