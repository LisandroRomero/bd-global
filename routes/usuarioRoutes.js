// routes/usuarioRoutes.js
const express = require('express');
const {
    registrarUsuario,
    login,
    listarUsuarios
} = require('../controllers/usuarioController');
const { protegerRuta, restringirA } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas de Autenticación (Públicas)
// POST /api/usuarios (Registrar usuario)
router.post('/', registrarUsuario); 
// POST /api/usuarios/login (Iniciar sesión)
router.post('/login', login); 

// !!!!!!!!!!! 
// GET /api/usuarios -> Listar todos los usuarios (REQUIERE ADMIN)
router.get(
    '/', 
    protegerRuta, // 👈 1. Requiere un token válido
    restringirA('administrador'), // 👈 2. Requiere el rol 'administrador'
    listarUsuarios
);


module.exports = router;

// getMiPerfil
// eliminarUsuario