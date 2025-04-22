require("dotenv").config();
const { client } = require("./src/config/redis");
const helmet = require("helmet");
const IndexRoute = require("./src/routers/IndexRoute");
const Express = require("express");
const app = Express();
const { connectQueue } = require("./src/config/queue-config");

// defining port
const port = process.env.PORT || 7000;

// For parsing the express payloads
app.use(helmet());
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

// CORS permission
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  next();
});

app.use("/", IndexRoute);

client
  .connect()
  .then(() => {
    app.listen(port, () => {
      console.log("Server started on port ", port);
      console.log("DB connected to ", process.env.DB_HOST);
      connectQueue();
    });
  })
  .catch((err) => {
    console.log("Error while connecting to redis: ", err);
  });
