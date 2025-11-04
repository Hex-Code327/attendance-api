// routes/history.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // pastikan path ke db.js sesuai

// GET /api/history/:employee_no
router.get("/:employee_no", (req, res) => {
    const employee_no = req.params.employee_no;

    // Cari employee_id dari employee_no
    const queryEmp = "SELECT id FROM employees WHERE employee_no = ?";
    db.query(queryEmp, [employee_no], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ error: "Karyawan tidak ditemukan" });

        const employee_id = result[0].id;

        // Ambil data absen
        const query = "SELECT date, time_in, time_out FROM attendance WHERE employee_id = ? ORDER BY date DESC";
        db.query(query, [employee_id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            // Format data agar client bisa pakai langsung
            const data = rows.map(r => ({
                date: r.date,
                time: r.time_out ? r.time_out : r.time_in,
                type: r.time_out ? "pulang" : "masuk",
            }));

            res.json(data);
        });
    });
});

module.exports = router;
