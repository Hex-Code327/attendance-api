// routes/attendance.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================
// Absen Datang (Check-in)
// =====================
router.post("/checkin", (req, res) => {
  const { employee_no } = req.body;
  if (!employee_no) return res.status(400).json({ message: "employee_no wajib diisi" });

  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('id-ID', { hour12: false });

  // Ambil employee_id
  db.query("SELECT id FROM employees WHERE employee_no = ?", [employee_no], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length === 0) return res.status(404).json({ message: "Karyawan tidak ditemukan" });

    const employee_id = result[0].id;

    const query = "INSERT INTO attendance (employee_id, date, time_in) VALUES (?, ?, ?)";
    db.query(query, [employee_id, date, time], (err) => {
      if (err) return res.status(500).json({ message: "Sudah absen hari ini atau terjadi error" });
      res.json({ message: "Absen datang berhasil", date, time, employee_no });
    });
  });
});

// =====================
// Absen Pulang (Check-out)
// =====================
router.post("/checkout", (req, res) => {
  const { employee_no } = req.body;
  if (!employee_no) return res.status(400).json({ message: "employee_no wajib diisi" });

  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('id-ID', { hour12: false });

  // Ambil employee_id
  db.query("SELECT id FROM employees WHERE employee_no = ?", [employee_no], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length === 0) return res.status(404).json({ message: "Karyawan tidak ditemukan" });

    const employee_id = result[0].id;

    const query = "UPDATE attendance SET time_out = ? WHERE employee_id = ? AND date = ?";
    db.query(query, [time, employee_id, date], (err, result) => {
      if (err) return res.status(500).json({ message: "Terjadi error saat absen pulang" });
      if (result.affectedRows === 0) return res.status(400).json({ message: "Belum absen datang hari ini" });
      res.json({ message: "Absen pulang berhasil", date, time, employee_no });
    });
  });
});

// =====================
// Riwayat Absen
// =====================
router.get("/history/:employee_no", (req, res) => {
  const { employee_no } = req.params;
  if (!employee_no) return res.status(400).json({ message: "employee_no wajib diisi" });

  const query = `
    SELECT a.date, a.time_in, a.time_out, e.employee_no
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE e.employee_no = ?
    ORDER BY a.date DESC
  `;
  db.query(query, [employee_no], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
});

module.exports = router;
