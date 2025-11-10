const mongoose = require('mongoose');

const CategoriaSchema = new mongoose.Schema({
    // Nombre de la categoría (ej: 'Electrónica', 'Ropa', 'Hogar').
    nombre: {
        type: String,
        required: [true, 'El nombre de la categoría es obligatorio.'],
        trim: true,
        unique: true
    },
    // Descripción de la categoría[cite: 12].
    descripcion: {
        type: String,
        required: false,
        trim: true
    }
}, { timestamps: true }); // 'timestamps' agrega campos 'createdAt' y 'updatedAt' automáticamente

const Categoria = mongoose.model('Categoria', CategoriaSchema);
module.exports = Categoria;