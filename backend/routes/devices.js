const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig");

// Obtener los dispositivos disponibles de un tipo
router.post("/get-available-devices", async (req, res) => {
  try {
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

// Construccion de la consulta para filtrar dispositivos
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
    if (filtros.marca && filtros.marca.trim() !== "") {
      condiciones.push("d.Marca = @marca");
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

    const request = await pool.request();
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

// Consultar todos los dispositivos
router.post("/", async (req, res) => {
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

// Agregar nuevos dispositivos
router.post("/add-device", async (req, res) => {
  const { tipoID, marca, modeloID, cantidad, serialNumbers } = req.body;
  const ubicacion = req.headers["x-ubicacion"];

  try {
    const serials = Array.isArray(serialNumbers)
      ? serialNumbers
      : typeof serialNumbers === "string"
      ? serialNumbers
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const pool = await poolPromise();
    for (let i = 0; i < cantidad; i++) {
      const serial = serials[i] || null;
      await pool
        .request()
        .input("TipoDispositivo", sql.Int, tipoID)
        .input("Modelo", sql.Int, modeloID)
        .input("Marca", sql.VarChar, marca)
        .input("SerialNumber", sql.VarChar, serial)
        .input("Ubicacion", sql.VarChar, ubicacion).query(`
          INSERT INTO Dispositivos (ID_Tipo, ID_Modelo, Marca, Serial_Number, Ubicacion)
          VALUES (@TipoDispositivo, @Modelo, @Marca, @SerialNumber, @Ubicacion)
        `);
    }

    res
      .status(201)
      .json({ success: true, message: "Dispositivos añadidos correctamente." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar informacion de un dispositivo
router.put("/", async (req, res) => {
  const { IDDispositivo, tipoDispositivo, marca, modelo, serialNumber } =
    req.body;

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
      inputs.push({
        name: "TipoDispositivo",
        type: sql.Int,
        value: tipoDispositivo,
      });
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
      inputs.push({
        name: "SerialNumber",
        type: sql.VarChar,
        value: serialNumber.trim(),
      });
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    let query = `UPDATE Dispositivos SET ${updates.join(
      ", "
    )} WHERE ID_Dispositivo = @IDDispositivo`;

    inputs.forEach(({ name, type, value }) => {
      request.input(name, type, value);
    });
    request.input("IDDispositivo", sql.Int, IDDispositivo);

    await request.query(query);

    res
      .status(200)
      .json({
        success: true,
        message: "Dispositivo actualizado correctamente.",
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar dispositivo de la base de datos
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("ID_Dispositivo", sql.Int, ID_Dispositivo)
      .query("DELETE FROM Dispositivos WHERE ID_Dispositivo = @ID_Dispositivo");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;