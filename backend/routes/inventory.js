const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig");

router.get("/available/:deviceType", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { deviceType } = req.params;
    const ubicacion = req.headers["x-ubicacion"]; // Usa un header personalizado para enviar la ubicación

    const tipo = await pool
      .request()
      .input("deviceType", sql.VarChar, deviceType)
      .query("SELECT ID_Tipo FROM TiposDispositivo WHERE Tipo = @deviceType");

    const ID_Tipo = tipo.recordset[0]?.ID_Tipo;
    if (!ID_Tipo) return res.status(404).json({ error: "Tipo no encontrado" });

    const result = await pool
      .request()
      .input("ID_Tipo", sql.Int, ID_Tipo)
      .input("Ubicacion", sql.VarChar, ubicacion).query(`
        SELECT ID_Dispositivo, Marca, Modelo, Serial_Number
        FROM Dispositivos
        WHERE ID_Tipo = @ID_Tipo AND Estado = 'Disponible' AND Ubicacion = @Ubicacion
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener dispositivos disponibles:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/types", async (req, res) => {
  try {
    await sql.connect(dbConfig);
    const result = await sql.query(
      "SELECT DISTINCT Tipo FROM TiposDispositivo"
    );
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener tipos de dispositivo" });
  }
});

router.get("/grouped-inventory", async (req, res) => {
  const deviceType = req.query.deviceType;
  const ubicacion = req.headers["x-ubicacion"];
console.log(ubicacion)
  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input("Ubicacion", sql.VarChar, ubicacion)
    let query = `
      SELECT 
        td.Tipo AS TipoDispositivo,
        m.Modelo,
        d.Marca,
        COUNT(d.ID_Dispositivo) AS Cantidad,
        m.Limite
      FROM Modelos m
      JOIN TiposDispositivo td ON m.ID_Tipo = td.ID_Tipo
      LEFT JOIN Dispositivos d ON m.ID_Modelo = d.ID_Modelo
      WHERE m.Ubicacion = @Ubicacion
    `;

    if (deviceType) {
      request.input("deviceType", sql.VarChar, deviceType);
      query += ` AND td.Tipo = @deviceType `;
    }

    query += `
      GROUP BY td.Tipo, m.Modelo, d.Marca, m.Limite
      ORDER BY td.Tipo, m.Modelo, d.Marca
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error en /grouped-inventory:", error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar límite de modelo
router.put("/limit", async (req, res) => {
  const { currentModel, nuevoLimite } = req.body;

  if (!modelo || nuevoLimite == null) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  try {
    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input("modelo", sql.VarChar, currentModel);
    request.input("limite", sql.Int, nuevoLimite);

    await request.query(
      "UPDATE Modelos SET Limite = @limite WHERE Modelo = @modelo"
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar límite" });
  }
});

module.exports = router;
