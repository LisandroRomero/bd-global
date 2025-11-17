// routes/usuarioRoutes.js
const express = require('express');
const {
    registrarUsuario,
    login,
    listarUsuarios,
    getMiPerfil,
    actualizarUsuario,
    eliminarUsuario
} = require('../controllers/usuarioController');
const { protegerRuta, restringirA } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas de Autenticación (Públicas)
// POST /api/usuarios (Registrar usuario)
router.post('/', registrarUsuario); 
// POST /api/usuarios/login (Iniciar sesión)
router.post('/login', login); 

// Rutas Protegidas (Requieren Token)
// GET /api/usuarios/me -> Obtener mi propio perfil
router.get('/me', protegerRuta, getMiPerfil);

// PATCH /api/usuarios/:id -> Actualizar usuario (propio perfil o admin)
router.patch('/:id', protegerRuta, actualizarUsuario);

// DELETE /api/usuarios/:id -> Eliminar usuario (propia cuenta o admin)
router.delete('/:id', protegerRuta, eliminarUsuario);

// Rutas de Administración (Requieren Token y Rol Admin)
// GET /api/usuarios -> Listar todos los usuarios (REQUIERE ADMIN)
router.get(
    '/', 
    protegerRuta, // 👈 1. Requiere un token válido
    restringirA('administrador'), // 👈 2. Requiere el rol 'administrador'
    listarUsuarios
);

module.exports = router;
