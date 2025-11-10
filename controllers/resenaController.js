const Resena = require('../models/Resena'); // Modelo de Reseñas
const Producto = require('../models/Producto'); // Modelo de Productos (para update)

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