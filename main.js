/* === main.js === */
require('electron-reload')(__dirname, {
  electron: require(`${__dirname}/node_modules/electron`)
});

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
/*const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.db');*/

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    },
  });

  win.loadFile('src/hr/query.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Hash a sample user password (run once to insert into DB)
/*const setup = async () => {
  const hash = await bcrypt.hash('admin123', 10);
  db.run("CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS Employees (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, department TEXT, email TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS AssignedDevices (id INTEGER PRIMARY KEY AUTOINCREMENT, employeeId INTEGER, deviceType TEXT, brand TEXT, model TEXT, serialNumber TEXT, computerName TEXT, FOREIGN KEY(employeeId) REFERENCES Employees(id))");
  db.run("INSERT INTO Users (username, password, role) VALUES (?, ?, ?)", ['admin', hash, 'IT']);
};
setup();
// Login handler
ipcMain.handle('login-request', async (event, { username, password }) => {
  return new Promise((resolve) => {
    db.get('SELECT password, role FROM Users WHERE username = ?', [username], async (err, row) => {
      if (err || !row) return resolve({ success: false });
      const match = await bcrypt.compare(password, row.password);
      resolve(match ? { success: true, role: row.role } : { success: false });
    });
  });
});

// Register new employee
ipcMain.handle('register-employee', async (event, { name, department, email }) => {
  return new Promise((resolve) => {
    db.run("INSERT INTO Employees (name, department, email) VALUES (?, ?, ?)", [name, department, email], function(err) {
      if (err) return resolve({ success: false });
      resolve({ success: true, employeeId: this.lastID });
    });
  });
});

// Query devices assigned to an employee
ipcMain.handle('query-employee-devices', async (event, { employeeId }) => {
  return new Promise((resolve) => {
    db.all("SELECT * FROM AssignedDevices WHERE employeeId = ?", [employeeId], (err, rows) => {
      if (err) return resolve([]);
      resolve(rows);
    });
  });
});
*/