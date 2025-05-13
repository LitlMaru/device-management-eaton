
CREATE DATABASE ProgramaEATON;
GO


USE ProgramaEATON;
GO

 
CREATE TABLE Empleados (
    ID_Empleado INT PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Departamento NVARCHAR(100),
    Posicion NVARCHAR(100),
    Email NVARCHAR(150),
    Fecha_entrada DATE
);

go



CREATE TABLE Inventario (
    Serial_Number NVARCHAR(50) PRIMARY KEY,
    Tipo_dispositivo NVARCHAR(50),
    Marca NVARCHAR(50),
    Modelo NVARCHAR(50),
    Computer_name NVARCHAR(100),
    Estado NVARCHAR(20) CHECK (Estado IN ('Disponible', 'Asignado'))
);

go

CREATE TABLE DispositivosAsignados (
    Id_asignacion INT PRIMARY KEY IDENTITY(1,1),
    ID_Empleado INT,
    ID_Dispositivo NVARCHAR(50),
    Fecha_asignacion DATE,
    Fecha_cambio DATE,
    FOREIGN KEY (ID_Empleado) REFERENCES Empleados(ID_Empleado),
    FOREIGN KEY (ID_Dispositivo) REFERENCES Inventario(Serial_Number)
);

go

CREATE TABLE Limites (
    ID_limite INT PRIMARY KEY IDENTITY(1,1),
    Tipo_dispositivo NVARCHAR(50),
    Marca NVARCHAR(50),
    Modelo NVARCHAR(50),
    Limite INT
);

go

CREATE TABLE Usuarios (
    ID_Usuario INT PRIMARY KEY,
    Usuario NVARCHAR(50) UNIQUE,
    Contrasena NVARCHAR(100),
    Rol NVARCHAR(50) CHECK (Rol IN ('ADMIN', 'RRHH'))
);

go

-----------Empleado/Dispositivo--------------
SELECT *
FROM Empleados e
INNER JOIN  DispositivosAsignados da ON da.ID_Empleado = e.ID_Empleado;

------------Disposi/Inventario------------

SELECT *
FROM DispositivosAsignados da
INNER JOIN Inventario i ON da.ID_Dispositivo = i.Serial_Number;


---------Empleados,dispositivo e inventario
	SELECT 
    da.Id_asignacion,
    e.Nombre AS NombreEmpleado,
    i.Marca,
    i.Modelo,
    da.Fecha_asignacion,
    da.Fecha_cambio
FROM 
    DispositivosAsignados da
INNER JOIN Empleados e ON da.ID_Empleado = e.ID_Empleado
INNER JOIN Inventario i ON da.ID_Dispositivo = i.Serial_Number;
