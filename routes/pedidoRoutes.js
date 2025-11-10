const express = require('express');
const pedidoController = require('../controllers/pedidoController');
const { protegerRuta, restringirA } = require('../middleware/authMiddleware');

const router = express.Router();

// Ruta Protegida: Crear un pedido (Cliente o Admin)
router.post(
    '/', 
    protegerRuta, 
    pedidoController.crearPedido
);

// Ruta Protegida: Listar pedidos de un usuario (Dueño o Admin)
// Nota: La verificación de Dueño/Admin se hace dentro del controlador 'getPedidosUsuario'
router.get(
    '/user/:userId', 
    protegerRuta, 
    pedidoController.getPedidosUsuario
);

// cancelarPedido

// Rutas de Administración (Requieren Rol 'administrador')
router.get(
    '/stats', 
    protegerRuta, 
    restringirA('administrador'), 
    pedidoController.getStatsPedidos
);

router.patch(
    '/:id/status', 
    protegerRuta, 
    restringirA('administrador'), 
    pedidoController.cambiarEstado
);

// getPedidoByID
// actualizarEstado


module.exports = router;