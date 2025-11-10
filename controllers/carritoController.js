const Carrito = require('../models/Carrito');

// ==============================
// GET: Obtener Carrito del Usuario (REQUIERE TOKEN)
// ==============================
exports.getCarrito = async (req, res, next) => {
    try {
        const usuarioId = req.usuario._id; // Obtenido del JWT

        // Buscar el carrito y poblar los detalles del producto
        const carrito = await Carrito.findOne({ usuario: usuarioId }).populate({
            path: 'items.producto',
            select: 'nombre precio stock'
        });

        if (!carrito) {
            // Si no existe, lo creamos para el usuario.
            const nuevoCarrito = await Carrito.create({ usuario: usuarioId, items: [] });
            return res.status(200).json({ success: true, data: nuevoCarrito });
        }

        res.status(200).json({ 
            success: true, 
            data: carrito 
        });

    } catch (err) {
        next(err);
    }
};

// ==============================
// POST: Agregar Ítem al Carrito (Uso del Operador $push)
// ==============================
exports.agregarItem = async (req, res, next) => {
    try {
        const usuarioId = req.usuario._id;
        const { productoId, cantidad } = req.body;
        
        if (!productoId || !cantidad || cantidad < 1) {
            return res.status(400).json({ success: false, error: { message: 'ID de producto y cantidad válidos son obligatorios.' } });
        }

        // Buscar el carrito o crearlo si no existe
        let carrito = await Carrito.findOne({ usuario: usuarioId });
        if (!carrito) {
            carrito = await Carrito.create({ usuario: usuarioId, items: [] });
        }

        // 1. Verificar si el producto ya está en el carrito
        const itemExistente = carrito.items.find(
            item => item.producto.toString() === productoId
        );

        if (itemExistente) {
            // Si existe, solo actualizamos la cantidad
            itemExistente.cantidad += cantidad;
            await carrito.save();
        } else {
            // Si no existe, usamos $push para añadir el nuevo ítem
            carrito = await Carrito.findOneAndUpdate(
                { usuario: usuarioId },
                { 
                    $push: { 
                        items: { producto: productoId, cantidad: cantidad } 
                    } 
                },
                { new: true, runValidators: true }
            );
        }

        res.status(200).json({ 
            success: true, 
            data: carrito 
        });

    } catch (err) {
        next(err);
    }
};

// ==============================
// DELETE: Eliminar Ítem del Carrito (Uso del Operador $pull)
// ==============================
exports.eliminarItem = async (req, res, next) => {
    try {
        const usuarioId = req.usuario._id;
        const { productoId } = req.params; // ID del producto a eliminar

        // Usamos el operador $pull para remover un elemento de un array
        const carrito = await Carrito.findOneAndUpdate(
            { usuario: usuarioId },
            { 
                $pull: { 
                    items: { producto: productoId } // Criterio para el pull: el ID del producto
                } 
            },
            { new: true } // Devolver el documento actualizado
        );

        if (!carrito) {
            return res.status(404).json({ success: false, error: { message: 'Carrito no encontrado.' } });
        }

        res.status(200).json({ 
            success: true, 
            data: carrito 
        });

    } catch (err) {
        next(err);
    }
};

// ==============================
// DELETE: Vaciar Carrito (Uso del Operador $set)
// ==============================
exports.vaciarCarrito = async (req, res, next) => {
    try {
        const usuarioId = req.usuario._id;
        
        // Usamos $set para reemplazar el array de 'items' con un array vacío
        const carrito = await Carrito.findOneAndUpdate(
            { usuario: usuarioId },
            { $set: { items: [] } },
            { new: true }
        );

        if (!carrito) {
            return res.status(404).json({ success: false, error: { message: 'Carrito no encontrado.' } });
        }
        
        res.status(200).json({ 
            success: true, 
            data: carrito 
        });

    } catch (err) {
        next(err);
    }
};