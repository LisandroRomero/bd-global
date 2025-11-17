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
// GET: Listar Todos los Usuarios (SOLO ADMIN)
// ==============================
exports.listarUsuarios = async (req, res, next) => {
    try {
        // La protección de rol 'administrador' ocurre en la ruta.
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

// ==============================
// GET: Obtener Perfil del Usuario (Requiere Token)
// ==============================
exports.getMiPerfil = async (req, res, next) => {
    try {
        const usuarioId = req.usuario._id; // Obtenido del JWT
        
        const usuario = await Usuario.findById(usuarioId).select('-contrasena');

        if (!usuario) {
            return res.status(404).json({
                success: false,
                error: { message: 'Usuario no encontrado.' }
            });
        }

        res.status(200).json({
            success: true,
            data: usuario
        });
    } catch (err) {
        next(err);
    }
};

// ==============================
// PATCH: Actualizar Usuario (Requiere Token - Solo propio perfil o Admin)
// ==============================
exports.actualizarUsuario = async (req, res, next) => {
    try {
        const usuarioId = req.usuario._id; // Usuario del token
        const { id } = req.params; // ID del usuario a actualizar
        const usuarioRol = req.usuario.rol; // Rol del usuario del token

        // Verificar permisos: solo puede actualizar su propio perfil o ser admin
        if (usuarioId.toString() !== id && usuarioRol !== 'administrador') {
            return res.status(403).json({
                success: false,
                error: { message: 'No tienes permiso para actualizar este usuario.' }
            });
        }

        // Preparar campos a actualizar (excluir campos sensibles)
        const camposPermitidos = ['nombre', 'direccion', 'telefono'];
        const camposActualizar = {};

        // Si es admin, también puede actualizar el rol
        if (usuarioRol === 'administrador') {
            camposPermitidos.push('rol');
        }

        // Construir objeto de actualización solo con campos permitidos
        Object.keys(req.body).forEach(key => {
            if (camposPermitidos.includes(key)) {
                camposActualizar[key] = req.body[key];
            }
        });

        // Verificar que se proporcionó al menos un campo para actualizar
        if (Object.keys(camposActualizar).length === 0) {
            return res.status(400).json({
                success: false,
                error: { 
                    message: 'Debes proporcionar al menos un campo para actualizar.',
                    camposPermitidos: camposPermitidos
                }
            });
        }

        // Actualizar el usuario
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            id,
            { $set: camposActualizar },
            { new: true, runValidators: true }
        ).select('-contrasena');

        if (!usuarioActualizado) {
            return res.status(404).json({
                success: false,
                error: { message: 'Usuario no encontrado.' }
            });
        }

        res.status(200).json({
            success: true,
            data: usuarioActualizado
        });

    } catch (err) {
        next(err);
    }
};

// ==============================
// DELETE: Eliminar Usuario (Requiere Token - Solo Admin o propio usuario)
// ==============================
exports.eliminarUsuario = async (req, res, next) => {
    try {
        const usuarioId = req.usuario._id; // Usuario del token
        const { id } = req.params; // ID del usuario a eliminar
        const usuarioRol = req.usuario.rol; // Rol del usuario del token

        // Verificar permisos: solo puede eliminar su propia cuenta o ser admin
        if (usuarioId.toString() !== id && usuarioRol !== 'administrador') {
            return res.status(403).json({
                success: false,
                error: { message: 'No tienes permiso para eliminar este usuario.' }
            });
        }

        // Prevenir que un admin se elimine a sí mismo (opcional pero recomendado)
        if (usuarioId.toString() === id && usuarioRol === 'administrador') {
            return res.status(400).json({
                success: false,
                error: { message: 'Un administrador no puede eliminar su propia cuenta desde esta ruta.' }
            });
        }

        const usuarioEliminado = await Usuario.findByIdAndDelete(id);

        if (!usuarioEliminado) {
            return res.status(404).json({
                success: false,
                error: { message: 'Usuario no encontrado.' }
            });
        }

        // ⚠️ Nota: En un sistema real, aquí deberías manejar la eliminación o desvinculación
        // de los carritos, pedidos y reseñas relacionados con este usuario.

        res.status(200).json({
            success: true,
            data: null,
            message: 'Usuario eliminado correctamente.'
        });

    } catch (err) {
        next(err);
    }
};
