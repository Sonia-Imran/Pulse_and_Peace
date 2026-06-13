const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const User = require("./models/User");

dotenv.config();

const seedAdmin = async () => {
  const exists = await User.findOne({ email: "admin@gmail.com" });
  if (!exists) {
    await User.create({
      fullName: "Admin",
      email: "admin@gmail.com",
      password: "admin123@",
      role: "admin",
    });
    console.log("Admin created: admin@gmail.com / admin123@");
  }
};

connectDB().then(seedAdmin);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patient", require("./routes/patientRoutes"));
app.use("/api/doctor", require("./routes/doctorRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/booking", require("./routes/bookingRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/review", require("./routes/reviewRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use("/api/reviews", require("./routes/reviewRoutes"));

app.get("/", (req, res) => {
  res.json({ message: "Pulse & Peace API is running!" });
});

io.on("connection", (socket) => {
  socket.on("join_room", (roomId) => { socket.join(roomId); });
  socket.on("send_message", (data) => { io.to(data.roomId).emit("receive_message", data); });
  socket.on("end_consultation", (roomId) => { io.to(roomId).emit("consultation_ended"); });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io };