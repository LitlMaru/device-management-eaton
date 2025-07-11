const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig");

const { authenticateToken, authorize } = require('../middleware/auth');
router.use(authenticateToken)
//Reasignar todos los dispositivos de un empleado a otro
router.post("/reassign-devices", authorize('IT_EDITOR', 'IT_MASTER'), async (req, res) => {
  const { empleadoOrigen, empleadoDestino } = req.body;

  if (!empleadoOrigen || !empleadoDestino) {
    return res
      .status(400)
      .json({ success: false, message: "Faltan IDs de empleados." });
  }

  try {
    const pool = await poolPromise;

    // Chequear si el ID del empleado destino existe
    const employeeExists = await pool
      .request()
      .input("empleadoDestino", sql.Int, empleadoDestino)
      .query(`SELECT 1 FROM Empleados WHERE ID_Empleado = @empleadoDestino`);

    if (employeeExists.recordset.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "El empleado destino no existe." });
    }

    // Consultar todos los dispositivos asignados al empleado origen
    const assignedDevices = await pool
      .request()
      .input("empleadoOrigen", sql.Int, empleadoOrigen).query(`
        SELECT ID_Dispositivo
        FROM DispositivosAsignados
        WHERE ID_Empleado = @empleadoOrigen AND Fecha_Fin IS NULL
      `);

    if (assignedDevices.recordset.length === 0) {
      return res.json({
        success: false,
        message: "Este empleado no tiene dispositivos asignados.",
      });
    }

    // Iniciar una transacción
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = transaction.request();

    for (const device of assignedDevices.recordset) {
      const idDispositivo = device.ID_Dispositivo;

      // Cerrar asignación actual
      await request
        .input("idDispositivo", sql.Int, idDispositivo)
        .input("empleadoOrigen", sql.Int, empleadoOrigen).query(`
          UPDATE DispositivosAsignados
          SET Fecha_Fin = GETDATE()
          WHERE ID_Empleado = @empleadoOrigen AND ID_Dispositivo = @idDispositivo AND Fecha_Fin IS NULL
        `);

      // Nueva asignación
      await request
        .input("empleadoDestino", sql.Int, empleadoDestino)
        .input("idDispositivo", sql.Int, idDispositivo) // <-- esto también faltaba
        .query(`
          INSERT INTO DispositivosAsignados (ID_Empleado, ID_Dispositivo, Fecha_Inicio)
          VALUES (@empleadoDestino, @idDispositivo, GETDATE())
        `);
    }

    await transaction.commit();
    res.json({ success: true, message: "Dispositivos reasignados con éxito." });
  } catch (err) {
    console.error("Error en la reasignación:", err);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor." });
  }
});

// Reasignar unico dispositivo de un empleado a otro
router.post("/reassign", authorize('IT_EDITOR', 'IT_MASTER'), async (req, res) => {
  const { empleadoOrigen, empleadoDestino, ID_Dispositivo } = req.body;
  const ubicacion = req.headers["x-ubicacion"];

  try {
    const pool = await poolPromise;

    // 1. Cerrar asignación anterior
    await pool
      .request()
      .input("ID_Dispositivo", sql.Int, ID_Dispositivo)
      .input("empleadoOrigen", sql.Int, empleadoOrigen).query(`
        UPDATE DispositivosAsignados
        SET Fecha_Fin = GETDATE()
        WHERE ID_Empleado = @empleadoOrigen 
          AND ID_Dispositivo = @ID_Dispositivo 
          AND Fecha_Fin IS NULL
      `);

    // 2. Insertar nueva asignación
    await pool
      .request()
      .input("ID_Empleado", sql.Int, empleadoDestino)
      .input("ID_Dispositivo", sql.Int, ID_Dispositivo)
      .input("Ubicacion", sql.VarChar, ubicacion).query(`
        INSERT INTO DispositivosAsignados 
        (ID_Empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Fin, Ubicacion)
        VALUES (@ID_Empleado, @ID_Dispositivo, GETDATE(), NULL, @Ubicacion)
      `);

    // 3. Cambiar estado del dispositivo
    await pool.request().input("ID_Dispositivo", sql.Int, ID_Dispositivo)
      .query(`
        UPDATE Dispositivos
        SET Estado = 'Asignado'
        WHERE ID_Dispositivo = @ID_Dispositivo
      `);

    res.json({ success: true, message: "Dispositivo reasignado con éxito." });
  } catch (error) {
    console.error("Error al asignar dispositivo:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

//Consultar los empleados a los cuales un dispositivo ha sido asignado ahora o antes
router.get("/employees-assigned", authorize('IT_QUERY', 'IT_EDITOR', 'IT_MASTER'), async (req, res) => {
  const ID_Dispositivo = req.query.ID_Dispositivo;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("ID_Dispositivo", sql.Int, ID_Dispositivo).query(`
        SELECT 
    e.ID_Empleado, 
    e.Nombre as Empleado,
    e.Departamento, 
    t.Tipo AS TipoDispositivo,    
    i.Marca,
    i.Serial_Number, 
    d.Fecha_asignacion, 
    d.Fecha_Fin
  FROM Dispositivos i
  INNER JOIN DispositivosAsignados d ON i.ID_Dispositivo = d.ID_Dispositivo
  INNER JOIN Empleados e ON e.ID_Empleado = d.ID_Empleado
  INNER JOIN TiposDispositivos t ON i.ID_Tipo = t.ID_Tipo  
  WHERE i.ID_Dispositivo = @ID_Dispositivo`);

  console.log(result.recordset)
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.json({ status: 500, message: "Error al obtener empleados." });
  }
});

//Filtrar dispositivos por informacion del empleado
router.post("/filter-devices", authorize('IT_QUERY', 'IT_EDITOR', 'IT_MASTER'), async (req, res) => {
  const { employeeInfo } = req.body;
  const ubicacion = req.headers["x-ubicacion"];

  const employeeIDPattern = employeeInfo ? `${employeeInfo}%` : "%";
  const employeeNamePattern = employeeInfo ? `%${employeeInfo}%` : "%";

  try {
    const pool = await poolPromise;
    const request = pool
      .request()
      .input("employeeInfoID", sql.VarChar, employeeIDPattern)
      .input("employeeInfoName", sql.VarChar, employeeNamePattern)
      .input("ubicacion", sql.VarChar, ubicacion);

    const result = await request.query(`
      SELECT 
        e.ID_Empleado, 
        e.Nombre, 
        t.Tipo AS TipoDispositivo,    
        i.Marca,
        m.Modelo,
        i.Serial_Number, 
        d.Fecha_Asignacion, 
        d.Fecha_Fin
      FROM Modelos m INNER JOIN Dispositivos i ON i.ID_MOdelo = m.ID_Modelo
      INNER JOIN DispositivosAsignados d ON i.ID_Dispositivo = d.ID_Dispositivo
      INNER JOIN Empleados e ON e.ID_Empleado = d.ID_Empleado
      INNER JOIN TiposDispositivos t ON i.ID_Tipo = t.ID_Tipo  
      WHERE (e.ID_Empleado LIKE @employeeInfoID OR e.Nombre LIKE @employeeInfoName)
        AND i.Ubicacion = @ubicacion 
        AND d.Fecha_Fin IS NULL
    `);

    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const formattedData = result.recordset.map((row) => ({
      ...row,
      Fecha_Asignacion: formatDate(row.Fecha_Asignacion),
      Fecha_Fin: formatDate(row.Fecha_Fin),
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error en la consulta: ", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

//Consultar los dispositivos de un empleado
router.post("/devices", authorize('IT_QUERY', 'IT_EDITOR', 'IT_MASTER'), async (req, res) => {
  const { IDEmpleado } = req.body;
  const ubicacion = req.headers["x-ubicacion"];
  try {
    const pool = await poolPromise;
    const request = pool
      .request()
      .input("ID_Empleado", sql.VarChar, IDEmpleado)
      .input("ubicacion", sql.VarChar, ubicacion);

    const result = await request.query(`
      SELECT 
        e.ID_Empleado, 
        e.Nombre, 
        t.Tipo AS TipoDispositivo,    
        i.Marca,
        i.Serial_Number, 
        d.Fecha_Asignacion, 
        d.Fecha_Fin
      FROM Dispositivos i
      INNER JOIN DispositivosAsignados d ON i.ID_Dispositivo = d.ID_Dispositivo
      INNER JOIN Empleados e ON e.ID_Empleado = d.ID_Empleado
      INNER JOIN TiposDispositivos t ON i.ID_Tipo = t.ID_Tipo  
      WHERE e.ID_Empleado = @ID_Empleado
        AND i.Ubicacion = @ubicacion 
        AND d.Fecha_Fin IS NULL
    `);

    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const formattedData = result.recordset.map((row) => ({
      ...row,
      Fecha_Asignacion: formatDate(row.Fecha_Asignacion),
      Fecha_Fin: formatDate(row.Fecha_Fin),
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Asignar dispositivos a un empleado
router.post("/assign-devices", authorize('IT_EDITOR', 'IT_MASTER'), async (req, res) => {
  const { Info_empleado, dispositivos, Fecha_Asignacion } = req.body;
  const ubicacion = req.headers["x-ubicacion"];

  if (
    !Info_empleado ||
    !Array.isArray(dispositivos) ||
    dispositivos.length === 0 ||
    !Fecha_Asignacion
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Faltan datos requeridos." });
  }

  try {
    const pool = await poolPromise;
    let ID_Empleado;

    // Validar si es ID o nombre
    if (Number.isInteger(Number(Info_empleado))) {
      ID_Empleado = Number(Info_empleado);
    } else {
      const result = await pool
        .request()
        .input("Nombre", sql.VarChar, Info_empleado)
        .query("SELECT ID_Empleado FROM Empleados WHERE Nombre = @Nombre");

      ID_Empleado = result.recordset[0]?.ID_Empleado;
      if (!ID_Empleado) {
        return res.status(404).json({ error: "Empleado no encontrado" });
      }
    }

    // Iniciar transacción
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = transaction.request();

    for (const id of dispositivos) {
      await request
        .input("ID_Empleado", sql.Int, ID_Empleado)
        .input("ID_Dispositivo", sql.Int, id)
        .input("Fecha_Asignacion", sql.Date, Fecha_Asignacion)
        .input("Ubicacion", sql.VarChar, ubicacion).query(`
          INSERT INTO DispositivosAsignados 
          (ID_Empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Fin, Ubicacion)
          VALUES (@ID_Empleado, @ID_Dispositivo, @Fecha_Asignacion, NULL, @Ubicacion)
        `);

      await request.input("ID_Dispositivo", sql.Int, id).query(`
          UPDATE Dispositivos
          SET Estado = 'Asignado'
          WHERE ID_Dispositivo = @ID_Dispositivo
        `);
    }

    await transaction.commit();
    res.json({ success: true, cantidad: dispositivos.length });
  } catch (error) {
    console.error("Error al asignar dispositivos:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Obtener dispositivos pendientes (fecha de cambio pasada)
router.get("/pending-devices", authorize('IT_QUERY', 'IT_EDITOR', 'IT_MASTER'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const ubicacion = req.headers["x-ubicacion"];

    const result = await pool
      .request()
      .input("ubicacion", sql.VarChar, ubicacion).query(`
        SELECT 
          d.ID_Dispositivo,
          e.ID_Empleado,
          e.Nombre AS Empleado,
          t.Tipo AS TipoDispositivo,
          i.Marca,
          m.Modelo,
          i.Serial_Number,
          d.Fecha_Asignacion,
          DATEADD(YEAR, 1, d.Fecha_Asignacion) AS Fecha_Cambio
        FROM DispositivosAsignados d
        INNER JOIN Dispositivos i ON d.ID_Dispositivo = i.ID_Dispositivo
        INNER JOIN Modelos m ON i.ID_Modelo = m.ID_Modelo
        INNER JOIN Empleados e ON d.ID_Empleado = e.ID_Empleado
        INNER JOIN TiposDispositivos t ON i.ID_Tipo = t.ID_Tipo
        WHERE d.Fecha_Fin IS NULL
          AND i.Ubicacion = @ubicacion
          AND DATEADD(YEAR, 1, d.Fecha_Asignacion) <= GETDATE()
      `);

    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const formatted = result.recordset.map((row) => ({
      ...row,
      Fecha_Asignacion: formatDate(row.Fecha_Asignacion),
      Fecha_Cambio: formatDate(row.Fecha_Cambio),
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error al obtener dispositivos por cambiar:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
