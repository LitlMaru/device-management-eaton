const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig");

// Obtener todos los usuarios
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Usuarios");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Agregar nuevo usuario
router.post("/", async (req, res) => {
  const { username, clave, rol, ubicacion } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("username", sql.VarChar, username)
      .input("clave", sql.VarChar, clave)
      .input("rol", sql.VarChar, rol)
      .input("ubicacion", sql.VarChar, ubicacion)
      .query(`
        INSERT INTO Usuarios (Username, Clave, Rol, Ubicacion)
        VALUES (@username, @clave, @rol, @ubicacion)
      `);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Actualizar usuario
router.put("/", async (req, res) => {
  const { username, clave, rol, ubicacion } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("username", sql.VarChar, username)
      .input("clave", sql.VarChar, clave)
      .input("rol", sql.VarChar, rol)
      .input("ubicacion", sql.VarChar, ubicacion)
      .query(`
        UPDATE Usuarios
        SET Clave = @clave, Rol = @rol, Ubicacion = @ubicacion
        WHERE Username = @username
      `);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Eliminar usuario
router.delete("/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("username", sql.VarChar, username)
      .query(`DELETE FROM Usuarios WHERE Username = @username`);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
