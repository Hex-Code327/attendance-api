// server.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ===== ROUTES =====
const attendanceRoute = require("./routes/attendance");
const authRoute = require("./routes/auth");

// Integrasikan route
app.use("/api/attendance", attendanceRoute);
app.use("/api/auth", authRoute);

// ===== SOCKET.IO REAL-TIME =====
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("absen", (data) => {
    console.log("Absen diterima:", data);

    const { employee_no, type } = data;

    // Ambil tanggal dan waktu WIB
    const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Jakarta' }); // yyyy-MM-dd
    const now = new Date().toLocaleTimeString('id-ID', { hour12: false, timeZone: 'Asia/Jakarta' }); // HH:mm:ss WIB

    // Cari employee_id dari employee_no
    const queryEmp = "SELECT id FROM employees WHERE employee_no = ?";
    db.query(queryEmp, [employee_no], (err, result) => {
      if (err) return console.error("❌ DB error:", err);
      if (result.length === 0) return console.log("❌ Karyawan tidak ditemukan");

      const employee_id = result[0].id;

      if (type === "masuk") {
        db.query(
          "INSERT INTO attendance (employee_id, date, time_in) VALUES (?, ?, ?)",
          [employee_id, today, now],
          (err) => {
            if (err) console.error("❌ Error insert absen:", err);
          }
        );
      } else if (type === "pulang") {
        db.query(
          "UPDATE attendance SET time_out = ? WHERE employee_id = ? AND date = ?",
          [now, employee_id, today],
          (err) => {
            if (err) console.error("❌ Error update absen pulang:", err);
          }
        );
      }

      // BROADCAST REALTIME KE SEMUA CLIENT
      io.emit("absen_update", {
        date: today,
        time: now,
        employee_no,
        type
      });

      console.log("✅ Broadcast realtime terkirim:", { employee_no, type, date: today, time: now });
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ===== SERVER LISTEN =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server berjalan di port ${PORT}`));
