const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
    // Información básica del producto [cite: 9]
    nombre: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio.'],
        trim: true,
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria.'],
    },
    precio: {
        type: Number,
        required: [true, 'El precio es obligatorio.'],
        min: 0
    },
    stock: {
        type: Number,
        required: [true, 'El stock es obligatorio.'],
        default: 0,
        min: 0
    },

    // RELACIÓN CLAVE: Referencia a la Categoría (One-to-Many) [cite: 13]
    // Esto es un ejemplo de 'referencia' o 'populate' en Mongoose.
    categoria: {
        type: mongoose.Schema.ObjectId, // Tipo para referencias
        ref: 'Categoria',               // Nombre del modelo al que se refiere
        required: [true, 'El producto debe pertenecer a una categoría.']
    },

    // Campo para reseñas o calificaciones [cite: 10]
    // En este diseño, NO EMBEDIMOS las reseñas, sino que las REFERENCIAMOS para
    // poder manejarlas en su propia colección (/api/resenas) y hacer agregaciones complejas (top reseñas)[cite: 62].
    // Si bien el documento menciona 'un campo de reseñas o calificaciones'[cite: 10], 
    // la existencia del modelo 'Reseñas' y su ruta de CRUD [cite: 21, 56] sugiere 
    // una colección separada, que referenciaríamos.
    
    // Opcional: Campo para almacenar el promedio de calificaciones (para consultas rápidas sin Agregación)
    promedioCalificacion: {
        type: Number,
        default: 0
    },
    totalResenas: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

// Middleware/Método para la ruta GET /api/productos listar productos con su categoría [cite: 37]
// Usarás .populate('categoria') en tus controladores para obtener el nombre y la descripción de la categoría.

const Producto = mongoose.model('Producto', ProductoSchema);
module.exports = Producto;