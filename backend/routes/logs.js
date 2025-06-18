// routes/logs.js
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig");

router.get("/", async (req, res) => {
  const {
    fromDate,
    toDate,
    user,
    location,
    action,
    search
  } = req.query;

  try {
    const pool = await poolPromise;

    let query = "SELECT * FROM Logs WHERE 1=1"; // base
    const inputs = [];

    if (fromDate) {
      query += " AND Fecha >= @fromDate";
      inputs.push({ name: "fromDate", type: sql.DateTime, value: new Date(fromDate) });
    }

    if (toDate) {
      query += " AND Fecha <= @toDate";
      inputs.push({ name: "toDate", type: sql.DateTime, value: new Date(toDate) });
    }

    if (user) {
      query += " AND Usuario = @user";
      inputs.push({ name: "user", type: sql.VarChar, value: user });
    }

    if (location) {
      query += " AND Ubicacion = @location";
      inputs.push({ name: "location", type: sql.VarChar, value: location });
    }

    if (action) {
      query += " AND Accion = @action";
      inputs.push({ name: "action", type: sql.VarChar, value: action });
    }

    if (search) {
      query += " AND Detalles LIKE @search";
      inputs.push({ name: "search", type: sql.VarChar, value: `%${search}%` });
    }

    let request = pool.request();
    inputs.forEach(input => request.input(input.name, input.type, input.value));

    const result = await request.query(query);
    res.json({ success: true, logs: result.recordset });

  } catch (err) {
    console.error("Error al consultar logs:", err);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

module.exports = router;
