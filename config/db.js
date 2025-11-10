const mongoose = require('mongoose');

// Función que conecta la aplicación a MongoDB
const conectarDB = async () => {
    try {
        // Mongoose lee la URL desde las variables de entorno
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Opciones recomendadas por Mongoose para evitar warnings
            // Las versiones modernas de Mongoose ya no necesitan estas opciones.
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error de conexión a MongoDB: ${error.message}`);
        // Detener la aplicación si la conexión falla (es un error crítico)
        process.exit(1); 
    }
};

module.exports = conectarDB;