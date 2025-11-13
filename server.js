// server.js

const express = require('express');
require('dotenv').config(); 
const conectarDB = require('./config/db'); 
const errorMiddleware = require('./middleware/errorMiddleware'); 

// 1. Inicializar la app
const app = express();

// Middlewares estándar de Express
app.use(express.json());

// 2. Definición de Rutas
app.use('/api/usuarios', require('./routes/usuarioRoutes'));
app.use('/api/productos', require('./routes/productoRoutes'));
app.use('/api/ordenes', require('./routes/pedidoRoutes'));
app.use('/api/categorias', require('./routes/categoriaRoutes'))
app.use('/api/carrito', require('./routes/carritoRoutes'))

// 3. MIDDLEWARE DE MANEJO GLOBAL DE ERRORES (al final de las rutas)
app.use(errorMiddleware); 

// 🎯 FUNCIÓN PRINCIPAL ASÍNCRONA PARA CONECTAR DB Y LUEGO INICIAR SERVER
const startServer = async () => {
    try {
        // 1. Esperar la conexión a la DB
        await conectarDB(); // 👈 Ahora el servidor esperará aquí

        // 2. Iniciar el servidor SOLO después de que la DB esté conectada
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });

    } catch (err) {
        console.error("Error crítico al iniciar la aplicación:", err.message);
        process.exit(1);
    }
}

// 4. Iniciar la aplicación llamando a la función asíncrona
startServer(); // 👈 ¡ESTA LLAMADA ES LA QUE FALTABA!

// ⚠️ ¡ELIMINA EL BLOQUE QUE ESTABA AQUÍ ABAJO!
/*
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
*/
