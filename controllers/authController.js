const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario'); // El modelo que creaste

// Función para firmar/generar el token
const firmarToken = (id, rol) => {
    // Utilizamos jwt.sign para crear el token
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN // Ej: '90d' o '1s' para probar expiración
    });
};

exports.login = async (req, res, next) => {
    try {
        const { email, contrasena } = req.body;

        // 1. Verificar si el email y la contraseña existen
        if (!email || !contrasena) {
            return res.status(400).json({ success: false, error: { message: 'Por favor, ingrese email y contraseña.' } });
        }

        // 2. Buscar usuario por email (y seleccionar la contraseña oculta)
        const usuario = await Usuario.findOne({ email }).select('+contrasena');

        // 3. Verificar si el usuario existe y si la contraseña es correcta
        // Usamos el método 'compararContrasena' que definiste en el modelo Usuario
        if (!usuario || !(await usuario.compararContrasena(contrasena))) {
            return res.status(401).json({ success: false, error: { message: 'Email o contraseña incorrectos.' } });
        }

        // 4. Generar el JWT con el ID y ROL
        const token = firmarToken(usuario._id, usuario.rol);

        // 5. Enviar respuesta exitosa con el token
        res.status(200).json({
            success: true,
            data: {
                token,
                usuario: {
                    id: usuario._id,
                    nombre: usuario.nombre,
                    rol: usuario.rol
                }
            }
        });

    } catch (err) {
        next(err); // Manejo de errores con middleware global
    }
};