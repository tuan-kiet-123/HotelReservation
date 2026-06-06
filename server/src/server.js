const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Fix lỗi DNS của VNPT chặn querySrv MongoDB
const http = require('http');
const { Server } = require("socket.io");
const app = require("./app");
const env = require("./config/env");
const { connectMongo } = require("./config/mongo");
const { checkMySqlConnection } = require("./config/mysql");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Gắn io vào app để dùng trong controller
app.set("io", io);

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

async function bootstrap() {
  try {
    await connectMongo();
    await checkMySqlConnection();

    server.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

bootstrap();
