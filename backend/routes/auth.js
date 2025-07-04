
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig"); 

// Ruta para iniciar sesion
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await poolPromise; 
    const result = await pool.request()
      .input("username", sql.VarChar, username)
      .query("SELECT * FROM Usuarios WHERE Username = @username");

    const user = result.recordset[0];
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    if (user.Clave !== password)
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });

    const { IDUsuario, Username, Rol, Ubicacion } = user;
    res.json({ success: true, user: { IDUsuario, Username, Rol, Ubicacion } });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

module.exports = router;
