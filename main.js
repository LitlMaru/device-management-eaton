require("electron-reload")(__dirname, {
  electron: require(`${__dirname}/node_modules/electron`),
});

const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");
const { electron } = require("process");
const { exec } = require("child_process");

let mainWindow;
global.currentUser = null;

function createWindow(bounds = null) {
    const windowOptions = {
    width: 900,
    height: 600,
    frame: true,
    titleBarStyle: "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      devTools: true,
      nodeIntegration: false,
    },
  }

  if (bounds) {
    Object.assign(windowOptions, bounds);
  }

  mainWindow = new BrowserWindow(windowOptions);
  mainWindow.webContents.session
    .clearCache()
    .then(() => console.log("Succesfully emptied cache"))
    .catch((err) => {
      console.error("Error clearing cache ", err.message);
    });

  mainWindow.loadFile("src/login.html");
}

const { spawn } = require("child_process");

app.whenReady().then(async () => {
  const serverProcess = spawn("node", [
    path.join(__dirname, "backend/server.js"),
  ]);

  serverProcess.stdout.on("data", (data) => {
    console.log(`Backend: ${data}`);
  }); 

  serverProcess.stderr.on("data", (data) => {
    console.error(`Backend error: ${data}`);
  });

  serverProcess.on("exit", (code, signal) => {
    console.error(
      `Backend server exited with code ${code} and signal ${signal}`
    );
  });
  serverProcess.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
  });

  serverProcess.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection:", reason);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("minimize-window", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.minimize();
});

ipcMain.on("maximize-window", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on("close-window", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.close();
});

const HOST = process.env.HOST || "http://localhost";
const PORT = process.env.PORT || 3000;

ipcMain.handle("login-user", async (event, credentials) => {
  try {
    console.log(`${HOST}:${PORT}/api/auth/login`);
    const response = await fetch(`${HOST}:${PORT}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const result = await response.json();
    if (result.success) {
      global.currentUser = result.user;
      /* global.sharedObject = {
        userLocation: result.user.Ubicacion,
      };*/
      return { success: true, user: result.user };
    } else {
      return { success: false, message: result.message };
    }
  } catch (err) {
    console.error("Error comunicando con el backend:", err);
    return { success: false, message: "No se pudo conectar con el servidor" };
  }
});

ipcMain.handle("get-current-user", () => {
  return global.currentUser;
});

ipcMain.handle("logout", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const bounds = win.getBounds();
  win.close();
  createWindow(bounds);
});

ipcMain.handle("register-employee", async (event, data) => {
  try {
    const user = global.currentUser;
    const response = await fetch(
      "http://localhost:3000/api/employees/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ubicacion: user?.Ubicacion || "" }),
      }
    );

    const result = await response.json();
    if (result.success) return { success: true };
    return { success: false, message: result.message };
  } catch (error) {
    console.error("Error registrando empleado:", error.message);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("query-employee-devices", async (event, filter) => {
  try {
    const response = await fetch(
      "http://localhost:3000/api/employees/devices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeInfo: filter.employeeInfo,
          ubicacion: global.currentUser?.Ubicacion || "",
        }),
      }
    );

    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error("Error consultando dispositivos:", error.message);
    return [];
  }
});

//----------------CONFIGURACION DE USUARIOS ----------------------------

//OBTENER USUARIOS
ipcMain.handle("get-users", async () => {
  try {
    const res = await fetch("http://localhost:3000/api/users");
    const data = await res.json();
    return data.success ? data.data : { error: data.message };
  } catch (err) {
    console.error(err.message);
    return { error: err.message };
  }
});

//ELIMINAR USUARIO
ipcMain.handle("delete-user", async (event, username) => {
  try {
    const res = await fetch(`http://localhost:3000/api/users/${username}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (err) {
    console.error(err.message);
    return { error: err.message };
  }
});

//ACTUALIZAR USUARIO
ipcMain.handle("update-user", async (event, user) => {
  try {
    const res = await fetch("http://localhost:3000/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    return await res.json();
  } catch (err) {
    console.error(err.message);
    return { error: err.message };
  }
});

//AGREGAR USUARIO
ipcMain.handle("add-user", async (event, user) => {
  try {
    const res = await fetch("http://localhost/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    return await res.json();
  } catch (err) {
    console.error(err.message);
    return { error: err.message };
  }
});

//--------------------ASIGNAR DISPOSITIVO-----------------------
ipcMain.handle("assign-device", async (event, data) => {
  try {
    await sql.connect(dbConfig);
    const { Info_empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Cambio } =
      data;

    if (Number.isInteger(Info_empleado)) {
      await sql.query(`INSERT INTO DispositivosAsignados (ID_Empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Cambio, Ubicacin)
        VALUES (${Info_empleado}, ${ID_Dispositivo}, ${Fecha_Asignacion}, ${Fecha_Cambio}, ${global.currentUser.Ubicacion})`);
    } else {
      const ID_Empleado = (
        await sql.query(
          `SELECT * FROM Empleados WHERE Nombre = ${Info_empleado}`
        )
      ).recordset[0]?.ID_Empleado;
      await sql.query(`INSERT INTO DispositivosAsignados (ID_Empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Cambio, Ubicacion)
        VALUES (${ID_Empleado}, ${ID_Dispositivo}, ${Fecha_Asignacion}, ${Fecha_Cambio}, ${global.currentUser.Ubicacion})`);
    }

    event.reply("device-assigned-succesfully");
  } catch (error) {
    console.error(error.message);
    event.reply("device-assign-error");
  }
});

ipcMain.handle("get-available-devices", async (event, deviceType) => {
  try {
    await sql.connect(dbConfig);

    const ID_Tipo = await sql.query(
      `SELECT ID_Tipo FROM TiposDispositivo where Tipo = ${deviceType}`
    );
    const result = await sql.query(
      `SELECT ID_Dispositivo, Marca, Modelo, Serial_Number
      FROM Dispositivos
      WHERE ID_Tipo = ${ID_Tipo} AND Estado = 'Disponible' AND Ubicacion = ${global.currentUser.Ubicacion}`
    );

    return result.recordset;
  } catch (error) {
    console.error("Error al obtener dispositivos: ", error);
    return { error: error.message };
  }
});
//--------------------------INVENTARIO-----------------------
ipcMain.handle("get-device-types", async () => {
  try {
    console.log("WORKING");
    await sql.connect(config);
    const result = await sql.query(
      "SELECT DISTINCT Tipo FROM TiposDispositivo"
    );
    return result.recordset;
  } catch (e) {
    console.error(e);
    return [];
  }
});

ipcMain.handle("get-grouped-inventory", async (event, deviceType) => {
  try {
    await sql.connect(config);
    const request = new sql.Request();

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
    `;

    if (deviceType) {
      request.input("deviceType", sql.VarChar, deviceType);
      query += ` WHERE td.Tipo = @deviceType `;
    }

    query += `
      GROUP BY td.Tipo, m.Modelo, d.Marca, m.Limite
      ORDER BY td.Tipo, m.Modelo, d.Marca
    `;

    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error(err);
    return [];
  }
});

// Actualizar límite
ipcMain.handle("update-limit", async (event, modelo, nuevoLimite) => {
  try {
    await sql.connect(config);
    const request = new sql.Request();
    request.input("modelo", sql.VarChar, modelo);
    request.input("limite", sql.Int, nuevoLimite);
    await request.query(
      "UPDATE Modelos SET Limite = @limite WHERE Modelo = @modelo"
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
});

//--------------------------DISPOSITIVOS--------------------------

const filtros = {
  tipoDispositivo: "",
  marca: "",
  modelo: "",
  serialNumber: "",
};

function getDevicesFiltered(filtros) {
  return new Promise((resolve, reject) => {
    let baseSQL = "SELECT * FROM dispositivos";
    const condiciones = [];
    const params = [];

    if (filtros.tipoDispositivo && filtros.tipoDispositivo.trim() !== "") {
      condiciones.push("Tipo = ?");
      params.push(filtros.tipoDispositivo.trim());
    }
    if (filtros.marca && filtros.marca.trim() !== "") {
      condiciones.push("Marca LIKE ?");
      params.push(`%${filtros.marca.trim()}%`);
    }
    if (filtros.modelo && filtros.modelo.trim() !== "") {
      condiciones.push("Modelo LIKE ?");
      params.push(`%${filtros.modelo.trim()}%`);
    }
    if (filtros.serialNumber && filtros.serialNumber.trim() !== "") {
      condiciones.push("Serial_Number LIKE ?");
      params.push(`%${filtros.serialNumber.trim()}%`);
    }

    if (condiciones.length > 0) {
      baseSQL += " WHERE " + condiciones.join(" AND ");
    }

    baseSQL += " ORDER BY Tipo, Marca, Modelo";

    db.all(baseSQL, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

ipcMain.handle("get-devices", async (event, filtros) => {
  try {
    const devices = await getDevicesFiltered(filtros);
    return devices;
  } catch (error) {
    return { error: error.message };
  }
});

//Agregar dispositivo con numero de serie
ipcMain.handle("add-serialized-device", async (event, device) => {
  try {
    await sql.connect(config);
    const { tipoDispositivo, modelo, marca, serial_number } = device;

    const ID_Tipo = (
      await sql.query(
        `SELECT ID_Dispositivo FROM TiposDispositivo WHERE Tipo = ${tipoDispositivo}`
      )
    ).recordset[0]?.ID_Tipo;
    const ID_Modelo = (
      await sql.query(`SELECT ID_Modelo FROM Modelos WHERE Modelo = ${modelo}`)
    ).recordset[0]?.ID_Modelo;

    await sql.query`INSERT INTO Dispositivos (ID_Tipo, ID_Modelo, Marca, Serial_Number, Ubicacion)
    Values (${ID_Tipo}, ${ID_Modelo}, ${marca}, ${serial_number}, ${global.currentUser.Ubicacion})
    `;
  } catch (err) {
    console.error(err.message);
    return { error: err.message };
  }
});

//Agregar dispositivos genericos
ipcMain.handle("add-devices", async (event, devices) => {
  try {
    await sql.connect(dbConfig);
    const { tipoDispositivo, modelo, marca, cantidad } = devices;

    const ID_Tipo = (
      await sql.query(
        `SELECT ID_Dispositivo FROM TiposDispositivo WHERE Tipo = ${tipoDispositivo}`
      )
    ).recordset[0]?.ID_Tipo;
    const ID_Modelo = (
      await sql.query(`SELECT ID_Modelo FROM Modelos WHERE Modelo = ${modelo}`)
    ).recordset[0]?.ID_Modelo;

    for (let i = 0; i < cantidad; i++) {
      await sql.query`INSERT INTO Dispositivos (ID_Tipo, ID_Modelo, Marca, Serial_Number, Ubicacion)
    Values (${ID_Tipo}, ${ID_Modelo}, ${marca}, ${global.currentUser.Ubicacion})
    `;
    }
  } catch (err) {
    console.error(err.message);
    return { error: err.message };
  }
});

//ELIMINAR DISPOSITIVO
ipcMain.handle("delete-device", async (event, ID_Dispositivo) => {
  try {
    await sql.connect(dbConfig);
    await sql.query`DELETE FROM Dispositivos WHERE ID_Dispositivo = ${ID_Dispositivo}`;
  } catch (err) {
    console.error(err.message);
    return { error: err.message };
  }
});

//ACTUALIZAR SERIAL NUMBER
ipcMain.handle("modify-sn", async (event, serial_numbers) => {
  try {
    await sql.connect(dbConfig);
    const { old_sn, new_sn } = serial_numbers;
    await sql.query`UPDATE Dispositivos SET Serial_Number = ${new_sn} WHERE Serial_Number = ${old_sn} `;
  } catch (err) {
    console.error(err.message);
    return { error: err.message };
  }
});

//-------------------CONSULTAS----------------------------

//OBTENER ID DE TIPO DE DISPOSITIVO
ipcMain.handle("get-type-id", async (event, type) => {
  try {
    await sql.connect(dbConfig);
    const result = await sql.query(
      `SELECT ID_Tipo from TiposDispositivo WHERE Tipo = ${type}`.recordset[0]
        ?.ID_Tipo
    );
    return result;
  } catch (err) {
    console.error(err.message);
    return [];
  }
});

//OBTENER MODELOS
ipcMain.handle("get-models", async () => {
  try {
    await sql.connect(dbConfig);
    const result =
      await sql.query`SELECT t.ID_Tipo AS ID_Tipo, t.Tipo AS Tipo, m.Modelo As Modelo FROM TiposDispositivo t INNER JOIN Modelos m ON t.ID_Tipo = M.ID_Tipo`;
    return result.recordset;
  } catch (err) {
    console.error("Error consultando los modelos", err);
    return [];
  }
});
