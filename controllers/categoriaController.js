const Categoria = require('../models/Categoria');

// ==============================
// POST: Crear Categoría (SOLO ADMIN)
// ==============================
exports.crearCategoria = async (req, res, next) => {
    try {
        // La protección de rol ocurre en la ruta
        const nuevaCategoria = await Categoria.create(req.body);

        res.status(201).json({ 
            success: true, 
            data: nuevaCategoria 
        });
    } catch (err) {
        // next(err) para manejo de errores global (ej: validación de Mongoose)
        next(err);
    }
};

// ==============================
// GET: Listar Categorías (PÚBLICO)
// ==============================
exports.listarCategorias = async (req, res, next) => {
    try {
        const categorias = await Categoria.find();

        res.status(200).json({ 
            success: true, 
            count: categorias.length,
            data: categorias 
        });
    } catch (err) {
        next(err);
    }
};

// ==============================
// PATCH: Actualizar Categoría (SOLO ADMIN)
// ==============================
exports.actualizarCategoria = async (req, res, next) => {
    try {
        const categoria = await Categoria.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { 
                new: true, 
                runValidators: true 
            }
        );

        if (!categoria) {
            return res.status(404).json({ success: false, error: { message: 'Categoría no encontrada.' } });
        }

        res.status(200).json({ 
            success: true, 
            data: categoria 
        });
    } catch (err) {
        next(err);
    }
};

// ==============================
// DELETE: Eliminar Categoría (SOLO ADMIN)
// ==============================
exports.eliminarCategoria = async (req, res, next) => {
    try {
        const categoria = await Categoria.findByIdAndDelete(req.params.id);

        if (!categoria) {
            return res.status(404).json({ success: false, error: { message: 'Categoría no encontrada.' } });
        }
        
        // ⚠️ Nota: En un sistema real, aquí deberías manejar la eliminación o reasignación 
        // de los productos que pertenecían a esta categoría.

        res.status(204).json({ // 204 No Content
            success: true, 
            data: null 
        });
    } catch (err) {
        next(err);
    }
};