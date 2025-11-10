const express = require('express');
const categoriaController = require('../controllers/categoriaController');
const { protegerRuta, restringirA } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas Públicas
// GET /api/categorias
router.get('/', categoriaController.listarCategorias);


// Rutas de Administración (Requieren Token y Rol 'administrador')
// POST /api/categorias
router.post(
    '/', 
    protegerRuta, 
    restringirA('administrador'), 
    categoriaController.crearCategoria
);

// PATCH /api/categorias/:id
router.patch(
    '/:id', 
    protegerRuta, 
    restringirA('administrador'), 
    categoriaController.actualizarCategoria
);

// DELETE /api/categorias/:id
router.delete(
    '/:id', 
    protegerRuta, 
    restringirA('administrador'), 
    categoriaController.eliminarCategoria
);

module.exports = router;

// getCategoria
// getById
// getProductosByCategoria