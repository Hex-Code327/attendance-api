// routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Secret JWT (sebaiknya simpan di .env)
const SECRET = process.env.JWT_SECRET || "secret123";

// =====================
// Login
// =====================
router.post("/login", (req, res) => {
  const { employee_no, password } = req.body;

  if (!employee_no || !password) {
    return res.status(400).json({ message: "employee_no dan password wajib diisi" });
  }

  const query = "SELECT * FROM employees WHERE employee_no = ?";
  db.query(query, [employee_no], async (err, results) => {
    if (err) return res.status(500).json({ message: "Terjadi error di server" });
    if (results.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });

    const user = results[0];

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ message: "Password salah" });

      const token = jwt.sign({ id: user.id, employee_no: user.employee_no }, SECRET, { expiresIn: "1d" });

      // Hapus password dari user sebelum dikirim ke client
      const { password: _, ...userData } = user;

      res.json({ token, user: userData });
    } catch (error) {
      res.status(500).json({ message: "Terjadi error saat login" });
    }
  });
});

module.exports = router;
