const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig");

// Consultar usuarios
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Usuarios");
    res.json(result.recordset);
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

// Actualizar usuario (campos permitidos: clave, rol, ubicacion)
router.put("/", async (req, res) => {
  const { idUsuario, campo, valor } = req.body;

  const camposPermitidos = ["Clave", "Rol", "Ubicacion"];
  if (!camposPermitidos.includes(campo)) {
    return res.status(400).json({ success: false, message: "Campo no permitido." });
  }

  try {
    const pool = await poolPromise;
    const query = `
      UPDATE Usuarios
      SET ${campo} = @valor
      WHERE ID_Usuario = @idUsuario
    `;
    await pool.request()
      .input("valor", sql.VarChar, valor)
      .input("idUsuario", sql.Int, idUsuario)
      .query(query);

    res.json({ success: true });
  } catch (err) {
    console.error("Error actualizando usuario:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Eliminar usuario (por nombre de usuario)
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
