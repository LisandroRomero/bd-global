const Carrito = require('../models/Carrito');
const mongoose = require('mongoose');

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
// POST: Agregar Ítem(s) al Carrito (Acepta objeto individual o array)
// ==============================
exports.agregarItem = async (req, res, next) => {
    try {
        const usuarioId = req.usuario._id;
        const body = req.body;
        
        // Determinar si es un array o un objeto individual
        const items = Array.isArray(body) ? body : [body];
        
        // Validar cada item
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const { productoId, cantidad } = item;
            
            // Validar que productoId exista y no esté vacío
            if (!productoId || (typeof productoId === 'string' && productoId.trim() === '')) {
                return res.status(400).json({ 
                    success: false, 
                    error: { message: `ID de producto es obligatorio en el item ${i + 1}.` } 
                });
            }

            // Validar que cantidad exista y sea un número válido
            const cantidadNum = Number(cantidad);
            if (!cantidad || isNaN(cantidadNum) || cantidadNum < 1 || !Number.isInteger(cantidadNum)) {
                return res.status(400).json({ 
                    success: false, 
                    error: { message: `Cantidad debe ser un número entero mayor a 0 en el item ${i + 1}.` } 
                });
            }

            // Validar que productoId sea un ObjectId válido
            if (!mongoose.Types.ObjectId.isValid(productoId)) {
                return res.status(400).json({ 
                    success: false, 
                    error: { message: `ID de producto inválido en el item ${i + 1}. Debe ser un ObjectId válido de MongoDB.` } 
                });
            }
        }

        // Buscar el carrito o crearlo si no existe
        let carrito = await Carrito.findOne({ usuario: usuarioId });
        if (!carrito) {
            carrito = await Carrito.create({ usuario: usuarioId, items: [] });
        }

        // Procesar cada item
        for (const item of items) {
            const { productoId, cantidad } = item;
            const cantidadNum = Number(cantidad);
            
            // Verificar si el producto ya está en el carrito
            const itemExistente = carrito.items.find(
                itemCarrito => itemCarrito.producto.toString() === productoId.toString()
            );

            if (itemExistente) {
                // Si existe, solo actualizamos la cantidad
                itemExistente.cantidad += cantidadNum;
            } else {
                // Si no existe, añadimos el nuevo ítem usando push del array (Mongoose hace el cast automático)
                carrito.items.push({ producto: productoId, cantidad: cantidadNum });
            }
        }

        await carrito.save();

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
