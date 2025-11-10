const mongoose = require('mongoose');

// Sub-esquema para los ítems del pedido (CAPTURA DE DATOS)
const PedidoItemSchema = new mongoose.Schema({
    // Datos críticos del producto EMBEBIDOS (NO se usa ref: 'Producto')
    // Esto asegura que si el precio del producto cambia, el pedido NO se altera.
    nombreProducto: String,
    precioUnitario: Number,
    
    // Referencia opcional para auditoría o enlazar a la reseña
    productoId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Producto',
        required: true
    },
    
    cantidad: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    }
}, { _id: false });

const PedidoSchema = new mongoose.Schema({
    // Referencia al Usuario (cliente que realiza la compra)
    usuario: {
        type: mongoose.Schema.ObjectId,
        ref: 'Usuario',
        required: true
    },
    
    // Ítems del Pedido: Array de objetos embebidos (la "captura" de la compra)
    items: [PedidoItemSchema],
    
    // Información general del pedido
    fecha: {
        type: Date,
        default: Date.now
    },
    estado: {
        type: String,
        enum: ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'],
        default: 'pendiente'
    },
    total: {
        type: Number,
        required: true
    },
    metodoPago: {
        type: String,
        required: true
    }
    
}, { timestamps: true });

const Pedido = mongoose.model('Pedido', PedidoSchema);
module.exports = Pedido;