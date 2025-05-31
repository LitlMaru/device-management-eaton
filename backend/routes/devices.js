
const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbConfig = require("../dbConfig"); 

router.post("/get-available-devices", async (req, res) => {
  try {
    const { deviceType} = req.body; 
    const ubicacion = req.headers["x-ubicacion"];
    const pool = await poolPromise;

    const tipoResult = await pool.request()
      .input("deviceType", sql.VarChar, deviceType)
      .query("SELECT ID_Tipo FROM TiposDispositivo WHERE Tipo = @deviceType");

    if (tipoResult.recordset.length === 0) {
      return res.status(404).json({ error: "Tipo de dispositivo no encontrado" });
    }

    const ID_Tipo = tipoResult.recordset[0].ID_Tipo;

    const result = await pool.request()
      .input("ID_Tipo", sql.Int, ID_Tipo)
      .input("Ubicacion", sql.VarChar, ubicacion) 
      .query(`
        SELECT ID_Dispositivo, Marca, Modelo, Serial_Number
        FROM Dispositivos
        WHERE ID_Tipo = @ID_Tipo AND Estado = 'Disponible' AND Ubicacion = @Ubicacion
      `);

    res.json({ success: true, devices: result.recordset });
  } catch (error) {
    console.error("Error al obtener dispositivos:", error.message);
    res.status(500).json({ error: error.message });
  }
});

async function getDevicesFiltered(filtros) {
  try {
    await sql.connect(dbConfig);
    let baseSQL = `SELECT d.ID_Dispositivo, td.Tipo, m.Modelo, d.Marca, d.Serial_Number, d.Ubicacion
                   FROM Dispositivos d
                   JOIN Modelos m ON d.ID_Modelo = m.ID_Modelo
                   JOIN TiposDispositivo td ON d.ID_Tipo = td.ID_Tipo`;
    const condiciones = [];
    const inputs = {};

    if (filtros.tipoDispositivo && filtros.tipoDispositivo.trim() !== "") {
      condiciones.push("td.Tipo = @tipoDispositivo");
      inputs.tipoDispositivo = filtros.tipoDispositivo.trim();
    }
    if (filtros.marca && filtros.marca.trim() !== "") {
      condiciones.push("d.Marca LIKE '%' + @marca + '%'");
      inputs.marca = filtros.marca.trim();
    }
    if (filtros.modelo && filtros.modelo.trim() !== "") {
      condiciones.push("m.Modelo LIKE '%' + @modelo + '%'");
      inputs.modelo = filtros.modelo.trim();
    }
    if (filtros.serialNumber && filtros.serialNumber.trim() !== "") {
      condiciones.push("d.Serial_Number LIKE '%' + @serialNumber + '%'");
      inputs.serialNumber = filtros.serialNumber.trim();
    }

    if (condiciones.length > 0) {
      baseSQL += " WHERE " + condiciones.join(" AND ");
    }

    baseSQL += " ORDER BY td.Tipo, d.Marca, m.Modelo";

    const request = new sql.Request();
    for (const key in inputs) {
      request.input(key, sql.VarChar, inputs[key]);
    }

    const result = await request.query(baseSQL);
    return result.recordset;
  } catch (err) {
    throw err;
  }
}

router.get("/", async (req, res) => {
  const filtros = {
    tipoDispositivo: req.query.tipoDispositivo || "",
    marca: req.query.marca || "",
    modelo: req.query.modelo || "",
    serialNumber: req.query.serialNumber || "",
  };

  try {
    const devices = await getDevicesFiltered(filtros);
    res.json(devices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/serialized", async (req, res) => {
  try {
    const { tipoDispositivo, modelo, marca, serial_number, ubicacion } = req.body;

    await sql.connect(dbConfig);
    const request = new sql.Request();

    const tipoResult = await request
      .input("tipo", sql.VarChar, tipoDispositivo)
      .query("SELECT ID_Tipo FROM TiposDispositivo WHERE Tipo = @tipo");
    const ID_Tipo = tipoResult.recordset[0]?.ID_Tipo;

    const modeloResult = await request
      .input("modelo", sql.VarChar, modelo)
      .query("SELECT ID_Modelo FROM Modelos WHERE Modelo = @modelo");
    const ID_Modelo = modeloResult.recordset[0]?.ID_Modelo;

    if (!ID_Tipo || !ID_Modelo) {
      return res.status(400).json({ error: "Tipo o Modelo no encontrado" });
    }

    await request
      .input("ID_Tipo", sql.Int, ID_Tipo)
      .input("ID_Modelo", sql.Int, ID_Modelo)
      .input("marca", sql.VarChar, marca)
      .input("serial_number", sql.VarChar, serial_number)
      .input("ubicacion", sql.VarChar, ubicacion)
      .query(
        `INSERT INTO Dispositivos (ID_Tipo, ID_Modelo, Marca, Serial_Number, Ubicacion)
         VALUES (@ID_Tipo, @ID_Modelo, @marca, @serial_number, @ubicacion)`
      );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/generic", async (req, res) => {
  try {
    const { tipoDispositivo, modelo, marca, cantidad, ubicacion } = req.body;

    await sql.connect(dbConfig);
    const request = new sql.Request();

    const tipoResult = await request
      .input("tipo", sql.VarChar, tipoDispositivo)
      .query("SELECT ID_Tipo FROM TiposDispositivo WHERE Tipo = @tipo");
    const ID_Tipo = tipoResult.recordset[0]?.ID_Tipo;

    const modeloResult = await request
      .input("modelo", sql.VarChar, modelo)
      .query("SELECT ID_Modelo FROM Modelos WHERE Modelo = @modelo");
    const ID_Modelo = modeloResult.recordset[0]?.ID_Modelo;

    if (!ID_Tipo || !ID_Modelo) {
      return res.status(400).json({ error: "Tipo o Modelo no encontrado" });
    }

    for (let i = 0; i < cantidad; i++) {
      await request
        .input("ID_Tipo", sql.Int, ID_Tipo)
        .input("ID_Modelo", sql.Int, ID_Modelo)
        .input("marca", sql.VarChar, marca)
        .input("ubicacion", sql.VarChar, ubicacion)
        .query(
          `INSERT INTO Dispositivos (ID_Tipo, ID_Modelo, Marca, Ubicacion)
           VALUES (@ID_Tipo, @ID_Modelo, @marca, @ubicacion)`
        );
    }

    res.json({ success: true, cantidad });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const ID_Dispositivo = req.params.id;
    await sql.connect(dbConfig);
    await sql.query`DELETE FROM Dispositivos WHERE ID_Dispositivo = ${ID_Dispositivo}`;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/serial-number", async (req, res) => {
  try {
    const { old_sn, new_sn } = req.body;
    await sql.connect(dbConfig);
    await sql.query`UPDATE Dispositivos SET Serial_Number = ${new_sn} WHERE Serial_Number = ${old_sn}`;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/type-id", async (req, res) => {
  try {
    const type = req.query.type;
    await sql.connect(dbConfig);
    const result = await sql
      .request()
      .input("type", sql.VarChar, type)
      .query("SELECT ID_Tipo FROM TiposDispositivo WHERE Tipo = @type");
    res.json(result.recordset[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

module.exports = router;
