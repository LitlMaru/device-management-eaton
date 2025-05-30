
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig");

router.post("/register", async (req, res) => {
  const data = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("ID_Empleado", sql.VarChar, data.id)
      .input("Nombre", sql.VarChar, data.name)
      .input("Departamento", sql.VarChar, data.dept)
      .input("Posicion", sql.VarChar, data.position)
      .input("Email", sql.VarChar, data.email)
      .input("Ubicacion", sql.VarChar, data.ubicacion)
      .input("Fecha_Entrada", sql.Date, data.currentDate)
      .query(`INSERT INTO Empleados (ID_Empleado, Nombre, Departamento, Posicion, Email, Ubicacion, Fecha_Entrada)
              VALUES (@ID_Empleado, @Nombre, @Departamento, @Posicion, @Email, @Ubicacion, @Fecha_Entrada)`);

    res.json({ success: true });
  } catch (error) {
    console.error("Error insertando empleado:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/devices", async (req, res) => {
  const { employeeInfo, ubicacion } = req.body;
  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input("employeeInfo", sql.VarChar, employeeInfo)
      .input("ubicacion", sql.VarChar, ubicacion);

    const result = await request.query(`
      SELECT e.ID_Empleado, e.Nombre, i.Tipo_Dispositivo, i.Serial_Number, d.Fecha_asignacion, d.Fecha_cambio
      FROM Inventario i
      INNER JOIN DispositivosAsignados d ON i.ID_Dispositivo = d.ID_Dispositivo
      INNER JOIN Empleados e ON e.ID_Empleado = d.ID_Empleado
      WHERE (e.ID_Empleado = @employeeInfo OR e.Nombre = @employeeInfo)
        AND d.Ubicacion = @ubicacion
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error en la consulta: ", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/assign-device", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { Info_empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Cambio } = req.body;
    const ubicacion = req.headers["x-ubicacion"];

    let ID_Empleado;

    if (Number.isInteger(Number(Info_empleado))) {
      ID_Empleado = Info_empleado;
    } else {
      const result = await pool.request()
        .input("Nombre", sql.VarChar, Info_empleado)
        .query("SELECT ID_Empleado FROM Empleados WHERE Nombre = @Nombre");
      
      ID_Empleado = result.recordset[0]?.ID_Empleado;
      if (!ID_Empleado) return res.status(404).json({ error: "Empleado no encontrado" });
    }

    await pool.request()
      .input("ID_Empleado", sql.VarChar, ID_Empleado)
      .input("ID_Dispositivo", sql.VarChar, ID_Dispositivo)
      .input("Fecha_Asignacion", sql.Date, Fecha_Asignacion)
      .input("Fecha_Cambio", sql.Date, Fecha_Cambio)
      .input("Ubicacion", sql.VarChar, ubicacion)
      .query(`
        INSERT INTO DispositivosAsignados 
        (ID_Empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Cambio, Ubicacion)
        VALUES (@ID_Empleado, @ID_Dispositivo, @Fecha_Asignacion, @Fecha_Cambio, @Ubicacion)
      `);

    res.json({ success: true });
  } catch (error) {
    console.error("Error al asignar dispositivo:", error.message);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
