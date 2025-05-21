require('electron-reload')(__dirname, {
  electron: require(`${__dirname}/node_modules/electron`)
})

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sql = require('mssql');
const { electron } = require('process');

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

/*ipcMain.handle('query-employee-devices', async (event, filters) => {
  try {
    const pool = await sql.connect(dbConfig);
    if(filters.employee_name == "" && filters.employee_id == ""){
      const result = await sql.query(`SELECT e.ID_Empleado, e.Nombre, i.Tipo_Dispositivo, i.Serial_Number, d.Fecha_asignacion, d.Fecha_cambio
         FROM Inventario i INNER JOIN DispositivosAsignados d ON i.ID_Dispositivo = d.ID_Dispositivo  INNER JOIN Empleados ON e.ID_Empleado = d.ID_Empleado
         WHERE d.ID_Dispositivo = ${filters.serial_number} `)
    }
    else if(filters.employee_id == ""){
  const result = await sql.query(`SELECT e.ID_Empleado, e.Nombre, i.Tipo_Dispositivo, i.Serial_Number, d.Fecha_asignacion, d.Fecha_cambio
         FROM Inventario i INNER JOIN DispositivosAsignados d ON i.ID_Dispositivo = d.ID_Dispositivo  INNER JOIN Empleados ON e.ID_Empleado = d.ID_Empleado
         WHERE d.ID_Dispositivo = ${filters.employee_name} `)
    }
    else{
  const result = await sql.query(`SELECT e.ID_Empleado, e.Nombre, i.Tipo_Dispositivo, i.Serial_Number, d.Fecha_asignacion, d.Fecha_cambio
         FROM Inventario i INNER JOIN DispositivosAsignados d ON i.ID_Dispositivo = d.ID_Dispositivo  INNER JOIN Empleados ON e.ID_Empleado = d.ID_Empleado
         WHERE d.ID_Dispositivo = ${filters.employee_id} `)    }
    event.reply("query-processed", result);
  }
 catch(error) {
  console.error("Error en la consulta: ", error.message);
  event.reply("query-error", error.message)
} })
*/

ipcMain.handle('query-employee-devices', async (event, filter) => {
  try{
    const pool = await sql.connect(dbConfig);
    const result = await sql.query(`SELECT e.ID_Empleado, e.Nombre, i.Tipo_Dispositivo, i.Serial_Number, d.Fecha_asignacion, d.Fecha_cambio
      FROM Inventario i INNER JOIN DispositivosAsignados d ON i.ID_Dispositivo = d.ID_Dispositivo  INNER JOIN Empleados ON e.ID_Empleado = d.ID_Empleado
      WHERE e.ID_Empleado = ${filter.employeeInfo} OR e.Nombre = ${filter.employeeInfo} `)
      
      return result.recordset;
  }
  catch(error) {
    console.error("Error en la consulta: ", error.message);
  }
})

ipcMain.handle('get-grouped-inventory', async () => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT 
        dt.Name AS DeviceType,
        m.Brand,
        m.Model,
        COUNT(i.Id) AS Quantity,
        m.Threshold
      FROM Models m
      JOIN DeviceTypes dt ON dt.Id = m.DeviceTypeId
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
