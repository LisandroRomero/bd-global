// controllers/usuarioController.js
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

// Función auxiliar para generar el token (la misma que ya habíamos definido)
const firmarToken = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN 
    });
};

// ==============================
// POST: Registrar Usuario (Login/Registro)
// ==============================
exports.registrarUsuario = async (req, res, next) => {
    try {
        // Mongoose y el hook 'pre-save' se encargan de encriptar la contraseña
        const usuario = await Usuario.create(req.body);
        
        // Generar JWT
        const token = firmarToken(usuario._id, usuario.rol);

        res.status(201).json({
            success: true,
            data: {
                token,
                usuario: { id: usuario._id, nombre: usuario.nombre, rol: usuario.rol }
            }
        });
    } catch (err) {
        // Capturamos errores de validación (ej: email duplicado)
        next(err);
    }
};

// ==============================
// POST: Login (Login/Registro)
// ==============================
exports.login = async (req, res, next) => {
    try {
        const { email, contrasena } = req.body;
        // 1. Buscamos usuario y seleccionamos la contraseña
        const usuario = await Usuario.findOne({ email }).select('+contrasena');

        // 2. Comparamos contraseña usando el método del modelo
        if (!usuario || !(await usuario.compararContrasena(contrasena))) {
            return res.status(401).json({ success: false, error: { message: 'Email o contraseña incorrectos.' } });
        }

        // 3. Generamos token
        const token = firmarToken(usuario._id, usuario.rol);

        res.status(200).json({
            success: true,
            data: { token, usuario: { id: usuario._id, nombre: usuario.nombre, rol: usuario.rol } }
        });

    } catch (err) {
        next(err);
    }
};

// ==============================
// GET: Listar Todos los Usuarios (REQUIERE ADMIN - Requisito del parcial)
// ==============================
exports.listarUsuarios = async (req, res, next) => {
    try {
        // La protección de rol 'administrador' debe estar en la ruta.
        const usuarios = await Usuario.find().select('-direccion -telefono'); // Ocultamos campos menos relevantes

        res.status(200).json({
            success: true,
            count: usuarios.length,
            data: usuarios
        });
    } catch (err) {
        next(err);
    }
};


// ==============================
// GET: Listar Todos los Usuarios (SOLO ADMIN)
// ===================================
exports.listarUsuarios = async (req, res, next) => {
    try {
        // La protección de rol 'administrador' ocurre en la ruta.
        
        // 1. Buscamos todos los usuarios.
        // Usamos .select('-campo') para excluir la contraseña y otros datos sensibles.
        const usuarios = await Usuario.find().select('-contrasena'); 

        res.status(200).json({
            success: true,
            count: usuarios.length,
            data: usuarios
        });
    } catch (err) {
        next(err);
    }
};

// ... Aquí irían las funciones de actualizar y eliminar usuario (CRUD)