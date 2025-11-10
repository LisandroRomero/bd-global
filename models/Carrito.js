const mongoose = require('mongoose');

// Sub-esquema para los ítems dentro del carrito
const CarritoItemSchema = new mongoose.Schema({
    // Referencia al Producto: Necesaria para obtener el nombre, descripción y precio actual
    producto: {
        type: mongoose.Schema.ObjectId,
        ref: 'Producto',
        required: true
    },
    // Cantidad seleccionada por el usuario
    cantidad: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false }); // No necesitamos un ID separado para cada item del carrito

const CarritoSchema = new mongoose.Schema({
    // RELACIÓN CLAVE: Referencia al Usuario (relación 1:1, cada carrito pertenece a 1 usuario)
    usuario: {
        type: mongoose.Schema.ObjectId,
        ref: 'Usuario',
        required: true,
        unique: true // Asegura que 1 usuario solo tenga 1 carrito (activo)
    },
    
    // Ítems Embebidos: Array de objetos que contiene los productos y sus cantidades
    items: [CarritoItemSchema]

}, { timestamps: true });

const Carrito = mongoose.model('Carrito', CarritoSchema);
module.exports = Carrito;