require('electron-reload')(__dirname, {
  electron: require(`${__dirname}/node_modules/electron`)
})

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sql = require('mssql');
const { electron } = require('process');
const { serialize } = require('v8');

let mainWindow;
global.currentUser = null;

const dbConfig = {
  user: 'enmanuel',
  password: 'L3tItG0',
  server: 'localhost\\MSSQLSERVER', 
  database: 'ProgramaEATON',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
       devTools: true,
      nodeIntegration: false,
     
    },
  });

  mainWindow.loadFile('src/login.html');
}

app.whenReady().then(async () => {
  try {
    await sql.connect(dbConfig);
    console.log('Conectado a la base de datos');
  } catch (err) {
    console.error('Error conectando a la base de datos:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.minimize();
});

ipcMain.on('maximize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.close();
});

ipcMain.handle('login-user', async (event, { username, password }) => {
  try {
    const result = await sql.query`SELECT * FROM Usuarios WHERE Username = ${username}`;
    const user = result.recordset[0];

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    const match = password == user.Clave;
    if (!match) {
      return { success: false, message: 'Contraseña incorrecta' };
    }

    const { IDUsuario, Username, Rol, Ubicacion } = user;
    global.currentUser = { IDUsuario, Username, Rol, Ubicacion };

    console.log(global.currentUser.Ubicacion)
    return { success: true, user: global.currentUser };
  } catch (err) {
    console.error('Error en login:', err);
    return { success: false, message: 'Error en el servidor' };
  }
});

ipcMain.handle('get-current-user', () => {
  return global.currentUser;
});


//----------------REGISTRO DE NUEVOS EMPLEADOS----------------------------
ipcMain.on('register-employee', async (event, data) => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("ID_Empleado", sql.VarChar, data.id)
      .input("Nombre", sql.VarChar, data.name)
      .input("Departamento", sql.VarChar, data.dept)
      .input("Posicion", sql.VarChar, data.position)
      .input("Email", sql.VarChar, data.email)
      .input("Ubicacion", sql.VarChar, global.currentUser?.Ubicacion || '')
      .input("Fecha_Entrada", sql.Date, data.currentDate)
      .query(`INSERT INTO Empleados (ID_Empleado, Nombre, Departamento, Posicion, Email, Ubicacion, Fecha_Entrada)
              VALUES (@ID_Empleado, @Nombre, @Departamento, @Posicion, @Email, @Ubicacion, @Fecha_Entrada)`);

    event.reply("employee-added");
  } catch (error) {
    console.error("Error insertando empleado:", error.message);
    event.reply("employee-error", error.message);
  }
});

//--------------CONSULTA DE DISPOSITIVOS ASIGNADOS--------------------
ipcMain.handle('query-employee-devices', async (event, filter) => {
  try{
    const pool = await sql.connect(dbConfig);
    const result = await sql.query(`SELECT e.ID_Empleado, e.Nombre, i.Tipo_Dispositivo, i.Serial_Number, d.Fecha_asignacion, d.Fecha_cambio
      FROM Inventario i INNER JOIN DispositivosAsignados d ON i.ID_Dispositivo = d.ID_Dispositivo  INNER JOIN Empleados ON e.ID_Empleado = d.ID_Empleado
      WHERE (e.ID_Empleado = ${filter.employeeInfo} OR e.Nombre = ${filter.employeeInfo}) AND d.Ubicacion = ${global.currentUser.Ubicacion}`)
      
      return result.recordset;
  }
  catch(error) {
    console.error("Error en la consulta: ", error.message);
  }
})


//----------------CONFIGURACION DE USUARIOS ----------------------------

//OBTENER USUARIOS
ipcMain.handle('get-users', async (event) => {
  try{
    await sql.connect(dbConfig);
    const result = await sql.query('SELECT * from Usuarios');
    return result.recordset;
  }
  catch(err){
    console.error(err.message);
    return {error:err.message};
  }
})

//ELIMINAR USUARIO
ipcMain.handle('delete-user', async (event, username) => {
  try {
    await sql.connect(dbConfig);
    await sql.query`DELETE FROM Usuarios WHERE Username = ${username}`;
    return { success: true };
  } catch (err) {
    console.error(err.message);
    return { error: err.message };
  }
});

//ACTUALIZAR USUARIO
ipcMain.handle('update-user', async (event, user) => {
  try {
    const { username, clave, rol, ubicacion } = user;
    await sql.connect(dbConfig);
    await sql.query`
      UPDATE Usuarios
      SET Clave = ${clave}, Rol = ${rol}, Ubicacion = ${ubicacion}
      WHERE Username = ${username}
    `;
    return { success: true };
  } catch (err) {
    console.error(err.message);
    return { error: err.message };
  }
});

//AGREGAR USUARIO
ipcMain.handle('add-user', async (event, user) => {
  try {
    const { username, clave, rol, ubicacion } = user;
    await sql.connect(dbConfig);
    await sql.query`
      INSERT INTO Usuarios (Username, Clave, Rol, Ubicacion)
      VALUES (${username}, ${clave}, ${rol}, ${ubicacion})
    `;
    return { success: true };
  } catch (err) {
    console.error(err.message);
    return { error: err.message };
  }
});

//--------------------ASIGNAR DISPOSITIVO-----------------------
ipcMain.handle('assign-device', async(event, data) => {
  try{
    await sql.connect(dbConfig);
    const {Info_empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Cambio} = data;

    if(Number.isInteger(Info_empleado)){
      await sql.query(`INSERT INTO DispositivosAsignados (ID_Empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Cambio, Ubicacin)
        VALUES (${Info_empleado}, ${ID_Dispositivo}, ${Fecha_Asignacion}, ${Fecha_Cambio}, ${global.currentUser.Ubicacion})`)
    }
    else{
      const ID_Empleado = (await sql.query(`SELECT * FROM Empleados WHERE Nombre = ${Info_empleado}`)).recordset[0]?.ID_Empleado;
       await sql.query(`INSERT INTO DispositivosAsignados (ID_Empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Cambio, Ubicacion)
        VALUES (${ID_Empleado}, ${ID_Dispositivo}, ${Fecha_Asignacion}, ${Fecha_Cambio}, ${global.currentUser.Ubicacion})`)
    }

    event.reply('device-assigned-succesfully');
  }
  catch(error){
    console.error(error.message);
    event.reply('device-assign-error');
  }
})

ipcMain.handle('get-available-devices', async (event, deviceType) => {
  try {
    await sql.connect(dbConfig);

    const ID_Tipo = await sql.query(`SELECT ID_Tipo FROM TiposDispositivo where Tipo = ${deviceType}`)
    const result = await sql.query(
      `SELECT ID_Dispositivo, Marca, Modelo, Serial_Number
      FROM Dispositivos
      WHERE ID_Tipo = ${ID_Tipo} AND Estado = 'Disponible' AND Ubicacion = ${global.currentUser.Ubicacion}`
    )

    return result.recordset;
  }
  catch(error){
    console.error("Error al obtener dispositivos: ", error);
    return{error: error.message};
  }
})
//--------------------------INVENTARIO-----------------------
// Obtener tipos de dispositivo
ipcMain.handle('get-device-types', async () => {
  try {
    console.log("WORKING");
    await sql.connect(config);
    const result = await sql.query('SELECT DISTINCT Tipo FROM TiposDispositivo');
    return result.recordset;
  } catch (e) {
    console.error(e);
    return [];
  }
});

// Ya te pasé este antes (para inventario agrupado)
ipcMain.handle('get-grouped-inventory', async (event, deviceType) => {
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
      request.input('deviceType', sql.VarChar, deviceType);
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
ipcMain.handle('update-limit', async (event, modelo, nuevoLimite) => {
  try {
    await sql.connect(config);
    const request = new sql.Request();
    request.input('modelo', sql.VarChar, modelo);
    request.input('limite', sql.Int, nuevoLimite);
    await request.query('UPDATE Modelos SET Limite = @limite WHERE Modelo = @modelo');
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
});



//--------------------------DISPOSITIVOS--------------------------

const filtros = {
  tipoDispositivo: '',   // puede venir vacío o string, e.g. 'Laptop'
  marca: '',             // igual, e.g. 'Dell'
  modelo: '',            // igual, e.g. 'XPS 13'
  serialNumber: ''       // igual, e.g. 'SN1234'
};

function getDevicesFiltered(filtros) {
  return new Promise((resolve, reject) => {
    let baseSQL = 'SELECT * FROM dispositivos';
    const condiciones = [];
    const params = [];

    if (filtros.tipoDispositivo && filtros.tipoDispositivo.trim() !== '') {
      condiciones.push('Tipo = ?');
      params.push(filtros.tipoDispositivo.trim());
    }
    if (filtros.marca && filtros.marca.trim() !== '') {
      condiciones.push('Marca LIKE ?');
      params.push(`%${filtros.marca.trim()}%`);
    }
    if (filtros.modelo && filtros.modelo.trim() !== '') {
      condiciones.push('Modelo LIKE ?');
      params.push(`%${filtros.modelo.trim()}%`);
    }
    if (filtros.serialNumber && filtros.serialNumber.trim() !== '') {
      condiciones.push('Serial_Number LIKE ?');
      params.push(`%${filtros.serialNumber.trim()}%`);
    }

    if (condiciones.length > 0) {
      baseSQL += ' WHERE ' + condiciones.join(' AND ');
    }

    baseSQL += ' ORDER BY Tipo, Marca, Modelo';

    db.all(baseSQL, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

ipcMain.handle('get-devices', async (event, filtros) => {
  try {
    const devices = await getDevicesFiltered(filtros);
    return devices;
  } catch (error) {
    return { error: error.message };
  }
});

//Agregar dispositivo con numero de serie
ipcMain.handle('add-serialized-device', async (event, device) => {
  try{
    await sql.connect(config);
    const {tipoDispositivo, modelo, marca, serial_number} = device;

    const ID_Tipo = (await sql.query(`SELECT ID_Dispositivo FROM TiposDispositivo WHERE Tipo = ${tipoDispositivo}`)).recordset[0]?.ID_Tipo
    const ID_Modelo = (await sql.query(`SELECT ID_Modelo FROM Modelos WHERE Modelo = ${modelo}`)).recordset[0]?.ID_Modelo;


    await sql.query
    `INSERT INTO Dispositivos (ID_Tipo, ID_Modelo, Marca, Serial_Number, Ubicacion)
    Values (${ID_Tipo}, ${ID_Modelo}, ${marca}, ${serial_number}, ${global.currentUser.Ubicacion})
    `
  }
  catch(err){
    console.error(err.message);
    return {error:err.message};
  }
})

//Agregar dispositivos genericos
ipcMain.handle('add-devices', async (event, devices) => {
  try{
    await sql.connect(dbConfig);
    const {tipoDispositivo, modelo, marca, cantidad} = devices;

    const ID_Tipo = (await sql.query(`SELECT ID_Dispositivo FROM TiposDispositivo WHERE Tipo = ${tipoDispositivo}`)).recordset[0]?.ID_Tipo
    const ID_Modelo = (await sql.query(`SELECT ID_Modelo FROM Modelos WHERE Modelo = ${modelo}`)).recordset[0]?.ID_Modelo;

    for(let i = 0; i < cantidad; i++){
      await sql.query
    `INSERT INTO Dispositivos (ID_Tipo, ID_Modelo, Marca, Serial_Number, Ubicacion)
    Values (${ID_Tipo}, ${ID_Modelo}, ${marca}, ${global.currentUser.Ubicacion})
    `
    }
  }
  catch(err){
    console.error(err.message);
    return {error:err.message};
  }
})

//ELIMINAR DISPOSITIVO
ipcMain.handle('delete-device', async (event, ID_Dispositivo) => {
  try{
    await sql.connect(dbConfig);
    await sql.query `DELETE FROM Dispositivos WHERE ID_Dispositivo = ${ID_Dispositivo}`;
  }
  catch(err){
    console.error(err.message);
     return {error:err.message};
  }
})

//ACTUALIZAR SERIAL NUMBER
ipcMain.handle('modify-sn', async(event, serial_numbers) => {
  try{
    await sql.connect(dbConfig);
    const {old_sn, new_sn} = serial_numbers;
    await sql.query `UPDATE Dispositivos SET Serial_Number = ${new_sn} WHERE Serial_Number = ${old_sn} `;
  }
  catch(err){
    console.error(err.message);
    return {error:err.message};
  }
})

//-------------------CONSULTAS----------------------------


//OBTENER ID DE TIPO DE DISPOSITIVO
ipcMain.handle('get-type-id', async(event, type) => {
  try{
    await sql.connect(dbConfig);
    const result = await sql.query(`SELECT ID_Tipo from TiposDispositivo WHERE Tipo = ${type}`.recordset[0]?.ID_Tipo);
    return result;
  }
  catch(err){
    console.error(err.message);
    return []
  }
})

//OBTENER MODELOS
ipcMain.handle('get-models', async () => {
  try {
    await sql.connect(dbConfig);
    const result = await sql.query`SELECT t.ID_Tipo AS ID_Tipo, t.Tipo AS Tipo, m.Modelo As Modelo FROM TiposDispositivo t INNER JOIN Modelos m ON t.ID_Tipo = M.ID_Tipo`;
    return result.recordset; 
  } catch (err) {
    console.error('Error consultando los modelos', err);
    return []; 
  }
});