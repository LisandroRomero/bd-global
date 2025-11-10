const express = require('express');
const carritoController = require('../controllers/carritoController');
const { protegerRuta } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas estas rutas están protegidas por el token JWT
router.use(protegerRuta); 

// GET /api/carrito
router.get('/', carritoController.getCarrito);

// POST /api/carrito (Añadir un ítem)
router.post('/', carritoController.agregarItem);

// DELETE /api/carrito/:productoId (Eliminar un ítem específico)
router.delete('/:productoId', carritoController.eliminarItem);

// DELETE /api/carrito/vaciar (Vaciar todo el carrito)
router.delete('/vaciar', carritoController.vaciarCarrito);

module.exports = router;


// actualizar item
// calcTotal
// getMiCarrito