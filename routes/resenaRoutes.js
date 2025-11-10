const express = require('express');
const resenaController = require('../controllers/resenaController');
const { protegerRuta } = require('../middleware/authMiddleware'); // Si usas JWT

const router = express.Router();

// FALTA getReseña = no protegida


// Ejemplo de otra ruta de reseña que sí requiere token:
// POST /api/resenas → crear reseña solo si el usuario compró el producto 
router.post('/', protegerRuta, resenaController.crearResena); 

// Ruta pública para obtener el promedio de calificaciones 
// No requiere protección JWT
router.get('/top', resenaController.getTopCalificaciones); 


// GET /api/resenas/product/:productId → reseñas de un producto 
router.get('/product/:productId', resenaController.getResenasProducto);

module.exports = router;

// eliminarReseña
// actualizarReseña