const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig");
const { pool } = require("mssql");

// Get available devices by device type
router.post("/get-available-devices", async (req, res) => {
  try {
    console.log("BODY: ", req.body);
    const { deviceType } = req.body;
    const ubicacion = req.headers["x-ubicacion"];
    const pool = await poolPromise;

    const tipoResult = await pool
      .request()
      .input("deviceType", sql.VarChar, deviceType)
      .query("SELECT ID_Tipo FROM TiposDispositivos WHERE Tipo = @deviceType");

    if (tipoResult.recordset.length === 0) {
      return res
        .status(404)
        .json({ error: "Tipo de dispositivo no encontrado" });
    }

    const ID_Tipo = tipoResult.recordset[0].ID_Tipo;

    const result = await pool
      .request()
      .input("ID_Tipo", sql.Int, ID_Tipo)
      .input("Ubicacion", sql.VarChar, ubicacion).query(`
        SELECT d.ID_Dispositivo, d.Marca, m.Modelo, d.Serial_Number
        FROM Dispositivos d inner join Modelos m ON d.ID_Modelo = m.ID_Modelo
        WHERE d.ID_Tipo = @ID_Tipo AND Estado = 'Disponible' AND d.Ubicacion = @Ubicacion
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener dispositivos:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Construct the query to filter devices in Device Table
async function getDevicesFiltered(filtros, ubicacion) {
  try {
    const pool = await poolPromise;
    let baseSQL = `SELECT d.ID_Dispositivo, td.ID_Tipo, td.Tipo as TipoDispositivo, m.ID_Modelo, m.Modelo, d.Marca, d.Serial_Number, d.Estado
                   FROM Dispositivos d
                   JOIN Modelos m ON d.ID_Modelo = m.ID_Modelo
                   JOIN TiposDispositivos td ON d.ID_Tipo = td.ID_Tipo`;
    const condiciones = [];
    const inputs = {};

    if (filtros.tipoDispositivo && filtros.tipoDispositivo.trim() !== "") {
      condiciones.push("td.Tipo = @tipoDispositivo");
      inputs.tipoDispositivo = filtros.tipoDispositivo.trim();
    }
    if (filtros.estado && filtros.estado.trim() !== "") {
      condiciones.push("d.Estado = @estado +");
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

    baseSQL +=
      condiciones.length > 0 ? " AND " + condiciones.join(" AND ") : "";

    baseSQL += " ORDER BY td.Tipo, d.Marca, m.Modelo";

    const request =  await pool.request()
    for (const key in inputs) {
      request.input(key, sql.VarChar, inputs[key]);
    }
    request.input("Ubicacion", sql.VarChar, ubicacion);

    const result = await request.query(baseSQL);
    return result.recordset;
  } catch (err) {
    throw err;
  }
}

// Get devices
router.post("/", async (req, res) => {
   console.log("devices");
  const filtros = {
    tipoDispositivo: req.body.tipoDispositivo || "",
    marca: req.body.marca || "",
    modelo: req.body.modelo || "",
    serialNumber: req.body.serialNumber || "",
  };

  ubicacion = req.headers["x-ubicacion"];

  try {
    const devices = await getDevicesFiltered(filtros, ubicacion);
   
    res.json(devices);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get model list of a device type
router.get("/models/:tipoDispositivo", async (req, res) => {
  const tipoDispositivo = req.params["tipoDispositivo"];
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
    console.log(result.recordset)
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add new devices
router.post("/add-device", async (req, res) => {
  const { tipoID, marca, modeloID, cantidad, serialNumbers } = req.body;
  const ubicacion = req.headers["x-ubicacion"]; 

  try {
    const serials = Array.isArray(serialNumbers)
      ? serialNumbers
      : typeof serialNumbers === "string"
        ? serialNumbers.split(",").map(s => s.trim()).filter(Boolean)
        : [];

    for (let i = 0; i < cantidad; i++) {
      const serial = serials[i] || null;
      const pool = await poolPromise();
      await pool
        .request()
        .input("TipoDispositivo", sql.Int, tipoID)
        .input("Modelo", sql.Int, modeloID)
        .input("Marca", sql.VarChar, marca)
        .input("SerialNumber", sql.VarChar, serial)
        .input("Ubicacion", sql.VarChar, ubicacion)
        .query(`
          INSERT INTO Dispositivos (TipoDispositivo, Modelo, Marca, SerialNumber, Ubicacion)
          VALUES (@TipoDispositivo, @Modelo, @Marca, @SerialNumber, @Ubicacion)
        `);
    }

    res.status(201).json({ success: true, message: "Dispositivos añadidos correctamente." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update a device info
router.put("/", async (req, res) => {
  const { IDDispositivo, tipoDispositivo, marca, modelo, serialNumber } = req.body;

  if (!IDDispositivo) {
    return res.status(400).json({ error: "IDDispositivo es requerido" });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request();
    const updates = [];
    const inputs = [];

    if (tipoDispositivo !== undefined && tipoDispositivo !== "") {
      updates.push("ID_Tipo = @TipoDispositivo");
      inputs.push({ name: "TipoDispositivo", type: sql.Int, value: tipoDispositivo });
    }

    if (modelo !== undefined && modelo !== "") {
      updates.push("Modelo = @Modelo");
      inputs.push({ name: "Modelo", type: sql.Int, value: modelo });
    }

    if (marca !== undefined && marca.trim() !== "") {
      updates.push("Marca = @Marca");
      inputs.push({ name: "Marca", type: sql.VarChar, value: marca.trim() });
    }

    if (serialNumber !== undefined && serialNumber.trim() !== "") {
      updates.push("Serial_Number = @SerialNumber");
      inputs.push({ name: "SerialNumber", type: sql.VarChar, value: serialNumber.trim() });
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    let query = `UPDATE Dispositivos SET ${updates.join(", ")} WHERE ID_Dispositivo = @IDDispositivo`;

    inputs.forEach(({ name, type, value }) => {
      request.input(name, type, value);
    });
    request.input("IDDispositivo", sql.Int, IDDispositivo);

    await request.query(query);

    res.status(200).json({ success: true, message: "Dispositivo actualizado correctamente." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//Delete device from database
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
/*
router.post("/serialized", async (req, res) => {
  try {
    const { tipoDispositivo, modelo, marca, serial_number, ubicacion } = req.body;

    await sql.connect(dbConfig);
    const request = new sql.Request();

    const tipoResult = await request
      .input("tipo", sql.VarChar, tipoDispositivo)
      .query("SELECT ID_Tipo FROM TiposDispositivos WHERE Tipo = @tipo");
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
      .query("SELECT ID_Tipo FROM TiposDispositivos WHERE Tipo = @tipo");
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
*/

/*
router.put("/serial-number", async (req, res) => {
  try {
    const { id, newSerialNumber } = req.body;
    await sql.connect(dbConfig);
    await sql.query`UPDATE Dispositivos SET Serial_Number = ${newSerialNumber} WHERE ID_Dispositivo = ${id}`;
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
      .query("SELECT ID_Tipo FROM TiposDispositivos WHERE Tipo = @type");
    res.json(result.recordset[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});
*/
module.exports = router;

