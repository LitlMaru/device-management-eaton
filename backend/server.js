const express = require("express");
const cors = require("cors");
require("dotenv").config(); 
const employeeRoutes = require("./routes/employees");
const assignationRoutes = require("./routes/assignations")
const usersRoutes = require("./routes/users");
const inventoryRoutes = require("./routes/inventory");
const devicesRoutes = require("./routes/devices")
const auth = require("./routes/auth")
const log = require("./routes/logs")

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/employees", employeeRoutes);
app.use("/api/assignations", assignationRoutes)
app.use("/api/users", usersRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/devices", devicesRoutes)
app.use("/api/auth", auth);
app.use("/api/logs", log)

const HOST = process.env.HOST || "http://localhost"
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto en ${HOST}:${PORT}`);
});