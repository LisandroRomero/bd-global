const Producto = require('../models/Producto'); // Modelo de Producto

// ==============================
// CREATE: Crear Producto (SOLO ADMIN)
// ==============================
exports.crearProducto = async (req, res, next) => {
    try {
        // La validación de rol de admin ocurre en la ruta, antes de llegar aquí.
        const nuevoProducto = await Producto.create(req.body);
        
        res.status(201).json({ 
            success: true, 
            data: nuevoProducto 
        });
    } catch (err) {
        // Si falla la validación de Mongoose (ej: falta nombre), next(err) lo atrapa.
        next(err);
    }
};

// ==============================
// READ: Listar Productos con Categoría (PÚBLICO)
// ==============================
exports.listarProductos = async (req, res, next) => {
    try {
        // Crucial: Usar .populate('categoria') para incluir los detalles de la categoría
        // en lugar de solo el ID (referencia).
        const productos = await Producto.find().populate({
            path: 'categoria', // Nombre del campo de referencia en el modelo Producto
            select: 'nombre descripcion' // Solo incluimos nombre y descripción de la categoría
        });

        res.status(200).json({ 
            success: true, 
            count: productos.length,
            data: productos 
        });
    } catch (err) {
        next(err);
    }
};

// ==============================
// UPDATE: Actualizar Producto (SOLO ADMIN)
// ==============================
exports.actualizarProducto = async (req, res, next) => {
    try {
        const producto = await Producto.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { 
                new: true, // Devuelve el documento actualizado
                runValidators: true // Ejecuta las validaciones del Schema
            }
        );

        if (!producto) {
            return res.status(404).json({ success: false, error: { message: 'Producto no encontrado.' } });
        }

        res.status(200).json({ 
            success: true, 
            data: producto 
        });
    } catch (err) {
        next(err);
    }
};


// ==============================
// PATCH: Actualizar Stock (Uso del Operador $set)
// ==============================
exports.actualizarStock = async (req, res, next) => {
    try {
        const { stock } = req.body;
        
        if (typeof stock !== 'number' || stock < 0) {
            return res.status(400).json({ success: false, error: { message: 'El stock debe ser un número positivo.' } });
        }

        const producto = await Producto.findByIdAndUpdate(
            req.params.id, 
            // Uso del operador de Modificación $set:
            { $set: { stock: stock } }, 
            { new: true, runValidators: true }
        );

        if (!producto) {
            return res.status(404).json({ success: false, error: { message: 'Producto no encontrado.' } });
        }

        res.status(200).json({ 
            success: true, 
            data: { 
                id: producto._id, 
                nombre: producto.nombre, 
                stock: producto.stock 
            } 
        });

    } catch (err) {
        next(err);
    }
};

// ==============================
// DELETE: Eliminar Producto (SOLO ADMIN)
// ==============================
exports.eliminarProducto = async (req, res, next) => {
    try {
        const producto = await Producto.findByIdAndDelete(req.params.id);

        if (!producto) {
            return res.status(404).json({ success: false, error: { message: 'Producto no encontrado.' } });
        }
        
        // Nota: En un proyecto real, también deberías eliminar las reseñas y
        // los ítems de carrito/pedido relacionados (o desvincularlos).

        res.status(204).json({ // 204 No Content para eliminaciones exitosas
            success: true, 
            data: null 
        });
    } catch (err) {
        next(err);
    }
};


// ==============================
// READ: Filtrar Productos por Rango de Precio (Uso de $gte, $lte, $and)
// ==============================
exports.filtrarProductos = async (req, res, next) => {
    try {
        const { precioMin, precioMax } = req.query; // Leer de la query string: /filtro?precioMin=10&precioMax=50

        let filtro = {};

        // Construir el objeto de filtro para el precio
        if (precioMin || precioMax) {
            filtro.precio = {};
            // Uso de operador de Comparación $gte (Greater Than or Equal)
            if (precioMin) filtro.precio.$gte = parseFloat(precioMin);
            // Uso de operador de Comparación $lte (Less Than or Equal)
            if (precioMax) filtro.precio.$lte = parseFloat(precioMax);
        }
        
        // Mongoose usa implícitamente $and cuando se combinan múltiples condiciones
        // Ej: { precio: { $gte: 10, $lte: 50 }, stock: { $gt: 0 } }
        
        const productosFiltrados = await Producto.find(filtro).populate({
            path: 'categoria', 
            select: 'nombre'
        });

        res.status(200).json({ 
            success: true, 
            count: productosFiltrados.length,
            data: productosFiltrados
        });

    } catch (err) {
        next(err);
    }
};