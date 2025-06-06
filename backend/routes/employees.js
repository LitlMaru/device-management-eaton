const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig");

//Add a new employee to the database 
router.post("/add-employee", async (req, res) => {
  const data = req.body;
  const ubicacion = req.headers["x-ubicacion"];
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("ID_Empleado", sql.VarChar, data.id)
      .input("Nombre", sql.VarChar, data.name)
      .input("Departamento", sql.VarChar, data.dept)
      .input("Posicion", sql.VarChar, data.position)
      .input("Ubicacion", sql.VarChar, ubicacion)
      .input("Fecha_Entrada", sql.Date, data.currentDate)
      .query(`INSERT INTO Empleados (ID_Empleado, Nombre, Departamento, Posicion, Ubicacion, Fecha_Entrada)
              VALUES (@ID_Empleado, @Nombre, @Departamento, @Posicion, @Ubicacion, @Fecha_Entrada)`);

    res.json({ success: true });
  } catch (error) {
    console.error("Error insertando empleado:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

//Delete employee from the database
router.delete("/:IDEmpleado", async (req, res) => {
  const IDEmpleado = req.params["IDEmpleado"];
  try{
    const pool = await poolPromise();
    await pool.request()
      .input("ID_Empleado", sql.Int, IDEmpleado)
      .query(`DELETE FROM Empleados WHERE ID_Empleado = @ID_Empleado`);
    res.status(100);
  }
  catch(err){
    console.error(err);
    res.status(500).json({error: err.message});
  }
})

//Reassign devices from an old employee to a new one (in case of a replacement from the Register view)
router.put("/reassign-devices", async (req, res) => {
  const {IDEmpleadoAnterior, IDEmpleadoNuevo } = req.body;
  try{
    const pool = await poolPromise();
    await pool.request()
      .input("ID_EmpleadoAnt", sql.Int, IDEmpleadoAnterior)
      .input("ID_EmpleadoNuevo", sql.Int, IDEmpleadoNuevo)
      .query(`UPDATE DispositivosAsignados SET ID_Empleado = @ID_EmpleadoNuevo WHERE ID_Empleado = @ID_EmpleadoAnt`)
    res.status(100);
  }
  catch(err){
    console.error(err);
    res.status(500).json({error: err.message});
  }
})

//Get the devices assigned to an employee
router.post("/devices", async (req, res) => {
  const { employeeInfo } = req.body;
  const ubicacion = req.headers["x-ubicacion"];
  try {
    const pool = await poolPromise;
    const request = pool
      .request()
      .input("employeeInfoID", sql.VarChar, `${employeeInfo}%`)
      .input("employeeInfoName", sql.VarChar, `%${employeeInfo}%`)
      .input("ubicacion", sql.VarChar, ubicacion);

    const result = await request.query(`
       SELECT 
    e.ID_Empleado, 
    e.Nombre, 
    t.Tipo AS TipoDispositivo,    
    i.Serial_Number, 
    d.Fecha_asignacion, 
    d.Fecha_cambio
  FROM Dispositivos i
  INNER JOIN DispositivosAsignados d ON i.ID_Dispositivo = d.ID_Dispositivo
  INNER JOIN Empleados e ON e.ID_Empleado = d.ID_Empleado
  INNER JOIN TiposDispositivos t ON i.ID_Tipo = t.ID_Tipo  
  WHERE (e.ID_Empleado LIKE @employeeInfoID OR e.Nombre LIKE @employeeInfoName)
    AND i.Ubicacion = @ubicacion
    `);

    console.log(result.recordset);
    const formatDate = (date) => {
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const formattedData = result.recordset.map((row) => ({
      ...row,
      Fecha_asignacion: formatDate(row.Fecha_asignacion),
      Fecha_cambio: formatDate(row.Fecha_cambio),
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error en la consulta: ", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

//Assign a device to an employee
router.post("/assign-device", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { Info_empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Cambio } =
      req.body;
    const ubicacion = req.headers["x-ubicacion"];

    let ID_Empleado;

    if (Number.isInteger(Number(Info_empleado))) {
      ID_Empleado = Info_empleado;
    } else {
      const result = await pool
        .request()
        .input("Nombre", sql.VarChar, Info_empleado)
        .query("SELECT ID_Empleado FROM Empleados WHERE Nombre = @Nombre");

      ID_Empleado = result.recordset[0]?.ID_Empleado;
      if (!ID_Empleado)
        return res.status(404).json({ error: "Empleado no encontrado" });
    }

    await pool
      .request()
      .input("ID_Empleado", sql.Int, ID_Empleado)
      .input("ID_Dispositivo", sql.Int, ID_Dispositivo)
      .input("Fecha_Asignacion", sql.Date, Fecha_Asignacion)
      .input("Fecha_Cambio", sql.Date, Fecha_Cambio)
      .input("Ubicacion", sql.VarChar, ubicacion).query(`
        INSERT INTO DispositivosAsignados 
        (ID_Empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Cambio, Ubicacion)
        VALUES (@ID_Empleado, @ID_Dispositivo, @Fecha_Asignacion, @Fecha_Cambio, @Ubicacion)
      `);

      await pool  
        .request()
        .input("ID_Dispositivo", sql.Int, ID_Dispositivo)
        .query(`
          UPDATE Dispositivos
          SET Estado = 'Asignado'
          WHERE ID_Dispositivo = @ID_Dispositivo`)

    res.json({ success: true });
  } catch (error) {
    console.error("Error al asignar dispositivo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
