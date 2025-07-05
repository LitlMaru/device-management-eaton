const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../dbConfig");
const { pool } = require("mssql");


// Consultar empleados
router.get("/", async (req, res) => {
  const filter = req.query.filter;
  const Ubicacion = req.headers["x-ubicacion"];

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input("Ubicacion", sql.VarChar, Ubicacion);

    let query = `
      SELECT ID_Empleado, Nombre as Empleado, Departamento, Posicion, Fecha_entrada
      FROM Empleados
      WHERE Ubicacion = @Ubicacion
    `;

    if (filter) {
      request.input("Filter", sql.VarChar, `%${filter}%`);
      query += `
        AND (
          Nombre LIKE @Filter OR
          Departamento LIKE @Filter OR
          Posicion LIKE @Filter
        )
      `;
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Agregar un empleado nuevo a la base de datos
router.post("/register", async (req, res) => {
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


// Actualizar informacion de un empleado
router.put("/", async (req, res) => {
  const { ID_Empleado, Nombre, Departamento, Posicion } = req.body;

  if (!ID_Empleado) {
    return res.status(400).json({ error: "ID_Empleado es requerido" });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request();
    const updates = [];
    const inputs = [];

    if (Nombre !== undefined && Nombre !== "") {
      updates.push("Nombre = @Nombre");
      inputs.push({ name: "Nombre", type: sql.VarChar, value: Nombre });
    }

    if (Departamento !== undefined && Departamento !== "") {
      updates.push("Departamento = @Departamento");
      inputs.push({ name: "Departamento", type: sql.VarChar, value: Departamento });
    }

    if (Posicion !== undefined && Posicion.trim() !== "") {
      updates.push("Posicion = @Posicion");
      inputs.push({ name: "Posicion", type: sql.VarChar, value: Posicion.trim() });
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    let query = `UPDATE Empleados SET ${updates.join(", ")} WHERE ID_Empleado = @ID_Empleado`;

    inputs.forEach(({ name, type, value }) => {
      request.input(name, type, value);
    });
    request.input("ID_Empleado", sql.VarChar, ID_Empleado);

    await request.query(query);

    res.status(200).json({ success: true, message: "Información de empleado actualizada." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// Eliminar empleado de la base de datos
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


module.exports = router;
