const mongoose = require('mongoose');

const ResenaSchema = new mongoose.Schema({
    // Referencia al Usuario que realizó la reseña
    usuario: {
        type: mongoose.Schema.ObjectId,
        ref: 'Usuario',
        required: [true, 'La reseña debe pertenecer a un usuario.']
    },
    
    // Referencia al Producto que está siendo reseñado
    producto: {
        type: mongoose.Schema.ObjectId,
        ref: 'Producto',
        required: [true, 'La reseña debe ser sobre un producto.']
    },
    
    // Datos de la reseña (Requisitos del Parcial)
    calificacion: {
        type: Number,
        required: [true, 'La calificación es obligatoria.'],
        min: 1, // Calificación mínima de 1
        max: 5  // Calificación máxima de 5 (común en e-commerce)
    },
    comentario: {
        type: String,
        required: [true, 'El comentario es obligatorio.']
    }
    
}, { timestamps: true });

// Índice compuesto para asegurar que un usuario solo pueda reseñar un producto una vez (opcional pero recomendado)
ResenaSchema.index({ usuario: 1, producto: 1 }, { unique: true });

const Resena = mongoose.model('Resena', ResenaSchema);
module.exports = Resena;