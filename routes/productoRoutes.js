const express = require('express');
const productoController = require('../controllers/productoController');
const { protegerRuta, restringirA } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas Públicas (Cualquiera puede leer)
router.get('/', productoController.listarProductos); //getProductos

// Rutas Protegidas (Requieren Token, Cliente o Admin)
router.patch('/:id/stock', protegerRuta, productoController.actualizarStock); 

// Rutas de Administración (Requieren Token y Rol 'administrador')
// Esto cubre el requisito de protección de POST, PUT, DELETE.
router.post(
    '/', 
    protegerRuta, 
    restringirA('administrador'), 
    productoController.crearProducto
);

router.patch(
    '/:id', 
    protegerRuta, 
    restringirA('administrador'), 
    productoController.actualizarProducto
);

router.delete(
    '/:id', 
    protegerRuta, 
    restringirA('administrador'), 
    productoController.eliminarProducto
);

module.exports = router;

// filtrarProductos
// getProductosById