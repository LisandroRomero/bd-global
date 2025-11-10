const Pedido = require('../models/Pedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto'); // Necesario para actualizar stock

// ==============================
// POST: Crear Pedido (REQUIERE TOKEN - Cliente o Admin)
// ==============================
exports.crearPedido = async (req, res, next) => {
    try {
        const usuarioId = req.usuario._id; // Obtenido del JWT
        
        // 1. Obtener el carrito del usuario y poblar los productos
        const carrito = await Carrito.findOne({ usuario: usuarioId }).populate('items.producto');
        
        if (!carrito || carrito.items.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'El carrito está vacío. Agregue productos para crear una orden.' } });
        }

        let totalPedido = 0;
        const itemsPedido = [];
        const updatesStock = [];

        // 2. Iterar sobre los ítems del carrito y preparar la data del pedido (EMBEDIDOS)
        for (const item of carrito.items) {
            const productoDetalle = item.producto; // Producto populado

            // Verificar stock antes de crear el pedido
            if (productoDetalle.stock < item.cantidad) {
                return res.status(400).json({ success: false, error: { message: `Stock insuficiente para ${productoDetalle.nombre}.` } });
            }

            const subtotal = productoDetalle.precio * item.cantidad;
            totalPedido += subtotal;

            // Almacenar los datos del producto EMBEBIDOS en el Pedido (inmutabilidad)
            itemsPedido.push({
                productoId: productoDetalle._id,
                nombreProducto: productoDetalle.nombre,
                precioUnitario: productoDetalle.precio,
                cantidad: item.cantidad,
                subtotal: subtotal
            });

            // Preparar la actualización de stock para el Producto (Operador $set)
            updatesStock.push({
                updateOne: {
                    filter: { _id: productoDetalle._id },
                    // Usamos $set para actualizar el campo stock
                    update: { $set: { stock: productoDetalle.stock - item.cantidad } } 
                }
            });
        }
        
        // 3. Crear el nuevo documento de Pedido
        const nuevoPedido = await Pedido.create({
            usuario: usuarioId,
            items: itemsPedido,
            total: totalPedido,
            metodoPago: req.body.metodoPago || 'Efectivo'
            // El estado por defecto es 'pendiente'
        });

        // 4. Actualizar el stock de todos los productos (Operador de Mongoose BulkWrite)
        await Producto.bulkWrite(updatesStock);
        
        // 5. Vaciar el carrito del usuario (Operador de Modificación $set)
        await Carrito.findOneAndUpdate({ usuario: usuarioId }, { $set: { items: [] } });

        res.status(201).json({ 
            success: true, 
            data: nuevoPedido 
        });

    } catch (err) {
        next(err);
    }
};


// ==============================
// GET: Listar Pedidos del Usuario (SOLO DUEÑO o ADMIN)
// ==============================
exports.getPedidosUsuario = async (req, res, next) => {
    try {
        const userIdRuta = req.params.userId;
        const usuarioJWT = req.usuario; // Obtenido del JWT (ID y ROL)
        
        // Verificación de Dueño o Admin
        // Esto cubre el requisito: GET /api/ordenes/user/:userId (solo dueño o admin)
        if (usuarioJWT.rol !== 'administrador' && usuarioJWT._id.toString() !== userIdRuta) {
            return res.status(403).json({ success: false, error: { message: 'No tiene permiso para ver estos pedidos.' } });
        }
        
        const pedidos = await Pedido.find({ usuario: userIdRuta })
                                    .sort('-fecha'); // Ordenar por fecha descendente

        res.status(200).json({ 
            success: true, 
            count: pedidos.length,
            data: pedidos 
        });

    } catch (err) {
        next(err);
    }
};


// ==============================
// PATCH: Cambiar Estado de Orden (SOLO ADMIN)
// ==============================
exports.cambiarEstado = async (req, res, next) => {
    try {
        // La verificación de rol de Admin ocurre en la ruta, antes de llegar aquí.
        const { estado } = req.body;
        
        if (!['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'].includes(estado)) {
            return res.status(400).json({ success: false, error: { message: 'Estado de pedido no válido.' } });
        }
        
        const pedido = await Pedido.findByIdAndUpdate(
            req.params.id, 
            // Uso del operador de Modificación $set
            { $set: { estado: estado } }, 
            { new: true, runValidators: true }
        );

        if (!pedido) {
            return res.status(404).json({ success: false, error: { message: 'Pedido no encontrado.' } });
        }

        res.status(200).json({ 
            success: true, 
            data: pedido 
        });

    } catch (err) {
        next(err);
    }
};


// ==============================
// GET: Estadísticas de Pedidos (SOLO ADMIN - Agregación)
// ==============================
exports.getStatsPedidos = async (req, res, next) => {
    try {
        // La verificación de rol de Admin ocurre en la ruta, antes de llegar aquí.
        const stats = await Pedido.aggregate([
            // 1. $group: Agrupar por estado y contar
            {
                $group: {
                    _id: '$estado', // Agrupamos por el campo 'estado'
                    count: { $count: {} }, // Operador $count para contar documentos por grupo
                    totalIngreso: { $sum: '$total' } // Operador $sum para sumar el campo 'total'
                }
            },
            
            // 2. $sort: Ordenar por total de ingresos
            {
                $sort: { totalIngreso: -1 } 
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (err) {
        next(err);
    }
};