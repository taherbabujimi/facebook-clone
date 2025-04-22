const amqplib = require("amqplib");

let channel = null;

async function connectQueue() {
  try {
    const connection = await amqplib.connect("amqp://localhost");
    channel = await connection.createChannel();

    console.log("RabbitMQ channel connected successfully.");
  } catch (error) {
    console.log("Error connecting to RabbitMQ:", error);
  }
}

module.exports = {
  getChannel: () => channel,
  connectQueue,
};
