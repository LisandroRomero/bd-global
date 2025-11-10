const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware para proteger todas las rutas que requieren un token
exports.protegerRuta = async (req, res, next) => {
    try {
        let token;
        
        // 1. Obtener el token y verificar si existe (Bearer Token)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // Ejemplo: 'Bearer asdf.qwer.zxcv' -> extraemos solo el token
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            // 401 Unauthorized
            return res.status(401).json({ success: false, error: { message: 'Acceso denegado: No ha iniciado sesión o no hay token.' } });
        }

        // 2. Verificar el token (validar firma y expiración)
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
        // 3. Buscar el usuario por ID (excluyendo la contraseña)
        // El token contiene el ID y el ROL del usuario
        const usuarioActual = await Usuario.findById(decoded.id);

        if (!usuarioActual) {
            return res.status(401).json({ success: false, error: { message: 'El usuario del token ya no existe.' } });
        }

        // 4. Adjuntar el usuario al objeto 'req' para usarlo en controladores posteriores
        req.usuario = usuarioActual;
        next();

    } catch (err) {
        // Manejo de expiración de token o firma inválida
        next(err); 
    }
};


// Middleware para restringir el acceso a ciertos roles (ej: solo 'administrador')
// roles es un array: ej: restringirA('administrador', 'empleado')
exports.restringirA = (...roles) => {
    return (req, res, next) => {
        // req.usuario.rol fue adjuntado por el middleware 'protegerRuta'
        if (!roles.includes(req.usuario.rol)) {
            // 403 Forbidden
            return res.status(403).json({ success: false, error: { message: 'No tiene permiso para realizar esta acción.' } });
        }
        next();
    };
};