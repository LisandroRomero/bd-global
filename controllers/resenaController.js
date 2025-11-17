const Resena = require('../models/Resena'); // Modelo de Reseñas
const Producto = require('../models/Producto'); // Modelo de Productos (para update)
const Pedido = require('../models/Pedido'); // Modelo de Pedidos (para validar compra)

// ==============================
// POST: Crear Reseña (REQUIERE TOKEN - Solo si compró el producto)
// ==============================
exports.crearResena = async (req, res, next) => {
    try {
        const usuarioId = req.usuario._id; // Obtenido del JWT
        const { producto, calificacion, comentario } = req.body;

        // Validar que se proporcionen todos los campos requeridos
        if (!producto || !calificacion || !comentario) {
            return res.status(400).json({
                success: false,
                error: { message: 'Faltan campos requeridos: producto, calificacion, comentario.' }
            });
        }

        // Validar que la calificación esté en el rango válido
        if (calificacion < 1 || calificacion > 5) {
            return res.status(400).json({
                success: false,
                error: { message: 'La calificación debe estar entre 1 y 5.' }
            });
        }

        // Verificar que el producto existe
        const productoExiste = await Producto.findById(producto);
        if (!productoExiste) {
            return res.status(404).json({
                success: false,
                error: { message: 'Producto no encontrado.' }
            });
        }

        // Verificar que el usuario haya comprado el producto (tiene un pedido con ese producto)
        const pedidoConProducto = await Pedido.findOne({
            usuario: usuarioId,
            'items.productoId': producto,
            estado: { $in: ['pagado', 'enviado', 'entregado'] } // Solo pedidos completados
        });

        if (!pedidoConProducto) {
            return res.status(403).json({
                success: false,
                error: { message: 'Solo puedes reseñar productos que hayas comprado.' }
            });
        }

        // Verificar que el usuario no haya reseñado ya este producto
        const reseñaExistente = await Resena.findOne({
            usuario: usuarioId,
            producto: producto
        });

        if (reseñaExistente) {
            return res.status(400).json({
                success: false,
                error: { message: 'Ya has reseñado este producto. Puedes actualizar tu reseña existente.' }
            });
        }

        // Crear la reseña
        const nuevaResena = await Resena.create({
            usuario: usuarioId,
            producto,
            calificacion,
            comentario
        });

        // Poblar los datos del usuario y producto para la respuesta
        await nuevaResena.populate('usuario', 'nombre email');
        await nuevaResena.populate('producto', 'nombre');

        res.status(201).json({
            success: true,
            data: nuevaResena
        });

    } catch (err) {
        next(err);
    }
};

// ==============================
// GET: Obtener Reseñas de un Producto (PÚBLICO)
// ==============================
exports.getResenasProducto = async (req, res, next) => {
    try {
        const { productId } = req.params;

        // Verificar que el producto existe
        const producto = await Producto.findById(productId);
        if (!producto) {
            return res.status(404).json({
                success: false,
                error: { message: 'Producto no encontrado.' }
            });
        }

        // Obtener todas las reseñas del producto y poblar datos del usuario
        const resenas = await Resena.find({ producto: productId })
            .populate('usuario', 'nombre email')
            .sort({ createdAt: -1 }); // Más recientes primero

        res.status(200).json({
            success: true,
            count: resenas.length,
            data: resenas
        });

    } catch (err) {
        next(err);
    }
};

// ==============================
// PATCH: Actualizar Reseña (REQUIERE TOKEN - Solo el dueño puede actualizar)
// ==============================
exports.actualizarResena = async (req, res, next) => {
    try {
        const usuarioId = req.usuario._id; // Obtenido del JWT
        const { id } = req.params;
        const { calificacion, comentario } = req.body;

        // Buscar la reseña
        const resena = await Resena.findById(id);

        if (!resena) {
            return res.status(404).json({
                success: false,
                error: { message: 'Reseña no encontrada.' }
            });
        }

        // Verificar que el usuario es el dueño de la reseña
        if (resena.usuario.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                success: false,
                error: { message: 'No tienes permiso para actualizar esta reseña.' }
            });
        }

        // Validar calificación si se proporciona
        if (calificacion !== undefined) {
            if (calificacion < 1 || calificacion > 5) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'La calificación debe estar entre 1 y 5.' }
                });
            }
        }

        // Preparar los campos a actualizar
        const camposActualizar = {};
        if (calificacion !== undefined) camposActualizar.calificacion = calificacion;
        if (comentario !== undefined) camposActualizar.comentario = comentario;

        // Verificar que se proporcionó al menos un campo para actualizar
        if (Object.keys(camposActualizar).length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'Debes proporcionar al menos un campo para actualizar (calificacion o comentario).' }
            });
        }

        // Actualizar la reseña usando $set
        const resenaActualizada = await Resena.findByIdAndUpdate(
            id,
            { $set: camposActualizar },
            { new: true, runValidators: true }
        ).populate('usuario', 'nombre email').populate('producto', 'nombre');

        res.status(200).json({
            success: true,
            data: resenaActualizada
        });

    } catch (err) {
        next(err);
    }
};

// ==============================
// GET: Top Calificaciones (PÚBLICO)
// ==============================
exports.getTopCalificaciones = async (req, res, next) => {
    try {
        const stats = await Resena.aggregate([
            // 1. $group: Agrupar todas las reseñas por 'producto' y calcular el promedio.
            {
                $group: {
                    _id: '$producto', // Agrupamos por el ID del producto
                    numResenas: { $sum: 1 }, // Contamos el número de reseñas
                    promedio: { $avg: '$calificacion' } // Calculamos el promedio de calificaciones usando $avg
                }
            },
            
            // 2. $sort: Ordenar los resultados para ver los productos mejor calificados primero.
            {
                $sort: { promedio: -1 } // Ordenar de mayor a menor promedio
            },
            
            // 3. $limit (Opcional): Limitar a, por ejemplo, los 10 mejores.
            {
                $limit: 10
            },
            
            // 4. $lookup: Adjuntar los datos del producto usando el ID agrupado.
            // Esto es necesario para obtener el nombre, precio, etc., del producto.
            {
                $lookup: {
                    from: 'productos', // Nombre de la colección en MongoDB (Mongoose lo pluraliza)
                    localField: '_id', // El ID del producto en el resultado del $group
                    foreignField: '_id', // El ID del producto en la colección 'productos'
                    as: 'productoDetalle' // Nombre del nuevo campo que contendrá los detalles
                }
            },
            
            // 5. $unwind: Desestructurar el array 'productoDetalle' (asumimos que solo hay 1)
            {
                $unwind: '$productoDetalle'
            },
            
            // 6. $project: Formatear la salida y seleccionar solo los campos que nos interesan
            {
                $project: {
                    _id: 0, // Ocultar el ID del grupo
                    productoId: '$_id',
                    nombre: '$productoDetalle.nombre',
                    promedio: { $round: ['$promedio', 2] }, // Redondear a 2 decimales
                    numResenas: 1
                }
            }
        ]);

        // Respuesta JSON bien formateada [cite: 77]
        res.status(200).json({
            success: true,
            data: stats
        });
        
    } catch (err) {
        // Atrapar errores con try/catch y middleware global de error [cite: 81]
        next(err);
    }
};
