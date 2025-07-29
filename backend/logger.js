const { sql, poolPromise } = require("../dbConfig");

const { authenticateToken} = require('../middleware/auth');
router.use(authenticateToken);

// Guardar accion en el Historial de Acciones 
async function logAction({ IDUsuario, Username, Ubicacion, Accion, Detalles }) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("IDUsuario", sql.Int, IDUsuario)
      .input("Username", sql.VarChar, Username)
      .input("Ubicacion", sql.VarChar, Ubicacion)
      .input("Accion", sql.VarChar, Accion)
      .input("Detalles", sql.Text, Detalles)
      .query(`INSERT INTO Logs (IDUsuario, Username, Ubicacion, Accion, Detalles)
              VALUES (@IDUsuario, @Username, @Ubicacion, @Accion, @Detalles)`);
  } catch (err) {
    console.error("Error al registrar en Logs:", err);
  }
}

module.exports = { logAction };
