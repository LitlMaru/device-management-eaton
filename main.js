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
      WHERE e.ID_Empleado = ${filter.employeeInfo} OR e.Nombre = ${filter.employeeInfo} AND d.Ubicacion = ${global.currentUser.Ubicacion}`)
      
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
    alert(err.message);
  }
})

//ELIMINAR USUARIO
ipcMain.handle('delete-user', async (event, username) => {
  try{
    await sql.connect(dbConfig);
    await sql.query `DELETE FROM Usuarios WHERE username = ${username}`;
  }
  catch(err){
    console.error(err.message);
    alert(err.message)
  }
})

//ACTUALIZAR USUARIO
ipcMain.handle('update-user', async(event, user) => {
  try{
    const {username, clave, rol, ubicacion} = user;
    await sql.connect(dbConfig);
    await sql.query
    `UPDATE Usuarios
    SET Clave = ${clave}, Rol= ${rol}, Ubicacion =  ${ubicacion}
    WHERE username = ${username} 
    `;
   }
   catch(err){
    console.error(err.message);
    alert(err.message);
   }
})

//AGREGAR USUARIO
ipcMain.handle('add-user', async(event, user) => {
  try{
    const {username, clave, rol, ubicacion} = user;
    await sql.connect(dbConfig);
    await sql.query
    `INSERT INTO Usuarios (Username, Clave, Rol, Ubicacion)
    values (${username}, ${clave}, ${rol}, ${ubicacion})
    `;
  }
  catch(err){
    console.error(err.message);
    alert(err.message);
  }
})

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
       await sql.query(`INSERT INTO DispositivosAsignados (ID_Empleado, ID_Dispositivo, Fecha_Asignacion, Fecha_Cambio, Ubicacin)
        VALUES (${ID_Empleado}, ${ID_Dispositivo}, ${Fecha_Asignacion}, ${Fecha_Cambio}, ${global.currentUser.Ubicacion})`)
    }

    event.reply('device-assigned-succesfully');
  }
  catch(error){
    console.error(error.message);
    event.reply('device-assign-error');
  }
})


//--------------------------INVENTARIO-----------------------
ipcMain.handle('get-grouped-inventory', async () => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT 
        dt.Tipo,
        m.Modelo,
        COUNT(i.ID) AS Cantidad,
        m.Limite
      FROM Modelos m
      JOIN TiposDispositivo dt ON dt.ID_Dispositivo = m.ID_Dispositivo
      LEFT JOIN Inventory i ON i.ModelId = m.Id
      GROUP BY dt.Name, m.Brand, m.Model, m.Threshold
      ORDER BY dt.Name, m.Brand, m.Model;
    `);

    return result.recordset;
  } catch (err) {
    console.error(err);
    return [];
  }
});


//--------------------------DISPOSITIVOS--------------------------

//Consultar dispositivos
ipcMain.handle('get-devices', async (event) => {
  try{
    await sql.connect(dbConfig);
    const result = await sql.query(`SELECT * FROM Dispositivos WHERE Ubicacion = ${global.currentUser.Ubicacion}`)

    return result.recordset;
  }
  catch(err){
    console.error(err.message);
    alert(err.message);
  }
})

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
    alert(err.message);
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
    alert(err.message);
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
    alert(err.message);
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
    alert(err.message);
  }
})

//-------------------CONSULTAS----------------------------
//OBTENER TIPOS DE DISPOSITIVO
ipcMain.handle('get-device-types', async () => {
  try {
    await sql.connect(dbConfig);
    const result = await sql.query`SELECT ID_Tipo, Tipo FROM TiposDispositivo`;
    return result.recordset; 
  } catch (err) {
    console.error('Error consultando los tipos de dispositivo', err);
    return []; 
  }
});

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