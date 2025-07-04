const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig");
const { pool } = require("mssql");


// Obtener tipos de dispositivo
router.get("/device-types", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
    .query(
      "SELECT DISTINCT ID_Tipo, Tipo FROM TiposDispositivos"
    );
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener los modelos para un tipo de dispositivo
router.get("/models", async (req, res) => {
  const tipoDispositivo = req.query.IDTipo;
  const ubicacion = req.headers["x-ubicacion"];
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Ubicacion", sql.VarChar, ubicacion)
      .input("TipoDispositivo", sql.Int, tipoDispositivo)
      .query(
        `SELECT m.ID_Modelo, m.Modelo from Modelos m inner join TiposDispositivos t ON m.ID_Tipo = t.ID_Tipo WHERE m.ID_Tipo = @TipoDispositivo AND m.Ubicacion = @Ubicacion`
      );
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Agregar nuevo tipo de dispositivo
router.post("/add-type", async (req, res) => {
  const {tipoDispositivo} = req.body;
  
  try{
    const pool = await poolPromise();
    await pool.request()
      .input("TipoDispositivo", sql.VarChar, tipoDispositivo)
      .query(`INSERT INTO TiposDispositivos values (@TipoDispositivo)`);

    const result = await pool.request()
      .input("TipoDispositivo", sql.VarChar, tipoDispositivo)
      .query(`SELECT ID_Tipo from TiposDispositivos WHERE Tipo = @TipoDispositivo`);

    res.json(result.recordset[0].ID_Tipo)
    res.status(201).json({success: true, message: "Tipo de dispositivo nuevo añadido"})
  }
  catch(err){
    console.error(err);
    res.status(400).json({error: err.message})
  }
})

// Agregar nuevo modelo
router.post("/add-model", async (req, res) => {
 const {modelo, ID_Tipo} = req.body;
  const ubicacion = req.headers["x-ubicacion"];
  try{
    const pool = await poolPromise();
    await pool.request()
      .input("Modelo", sql.VarChar, modelo)
      .input("ID_Tipo", sql.Int, ID_Tipo)
      .input("Ubicacion", sql.VarChar, ubicacion)
      .query(`INSERT INTO Modelos values (@ID_Tipo, @Modelo, @Ubicacion)`);

    const result = await pool.request()
      .input("Modelo", sql.VarChar, modelo)
      .input("ID_Tipo", sql.Int, ID_Tipo)
      .input("Ubicacion", sql.VarChar, ubicacion)
      .query(`SELECT ID_Modelo from Modelos WHERE Modelo = @Modelo AND Ubicacion = @Ubicacion`);

    res.json(result.recordset[0].ID_Modelo)
    res.status(201).json({success: true, message: "Modelo nuevo añadido"})
  }
  catch(err){
    console.error(err);
    res.status(400).json({error: err.message})
  }
})

// Consultar el inventario agrupado por modelos
router.get("/grouped-inventory", async (req, res) => {
  const deviceType = req.query.tipoDispositivo;
  const ubicacion = req.headers["x-ubicacion"];
  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input("Ubicacion", sql.VarChar, ubicacion)
    let query = `
      SELECT 
        td.Tipo AS TipoDispositivo,
        m.ID_Modelo,
        m.Modelo,
        COUNT(d.ID_Dispositivo) AS Cantidad,
        m.Limite
      FROM Modelos m
      JOIN TiposDispositivos td ON m.ID_Tipo = td.ID_Tipo
      LEFT JOIN Dispositivos d ON m.ID_Modelo = d.ID_Modelo
      WHERE m.Ubicacion = @Ubicacion AND d.Estado = 'Disponible'
    `;

    if (deviceType) {
      request.input("deviceType", sql.VarChar, deviceType);
      query += ` AND td.ID_Tipo = @deviceType `;
    }

    query += `
      GROUP BY td.Tipo, m.Modelo, m.ID_Modelo, d.Marca, m.Limite
      ORDER BY td.Tipo, m.Modelo, d.Marca
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error en /grouped-inventory:", error);
    res.status(500).json({ error: error.message });
  }
});


// Actualizar la cantidad minima necesaria de un modelo
router.put("/limit", async (req, res) => {
  const { modelo, nuevoLimite } = req.body;

  if (!modelo || nuevoLimite == null) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input("modelo", sql.Int, modelo);
    request.input("limite", sql.Int, nuevoLimite);

    await request.query(
      "UPDATE Modelos SET Limite = @limite WHERE ID_Modelo = @modelo"
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar límite" });
  }
});

module.exports = router;
