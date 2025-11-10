// Este es el middleware central para manejar todos los errores
const errorMiddleware = (err, req, res, next) => {
    // 1. Establecer el código de estado por defecto
    // Si el error ya tiene un código (ej: 401 de JWT), lo usa. Si no, usa 500.
    let statusCode = err.statusCode || 500;
    
    // 2. Manejo de Errores Específicos de Mongoose y MongoDB
    // Estos errores no siempre vienen con un statusCode, por lo que los identificamos:

    // Error de validación de Mongoose (ej: faltan campos 'required', tipo incorrecto)
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join('. ');
        statusCode = 400; // 400 Bad Request
        err.message = `Datos inválidos: ${message}`;
    }

    // Error de clave duplicada de MongoDB (ej: dos usuarios con el mismo email, o índice único)
    if (err.code === 11000) {
        // Obtenemos el campo que causó la duplicidad (ej: email)
        const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
        statusCode = 400; // 400 Bad Request
        err.message = `Valor duplicado en el campo ${value}. Por favor use otro valor.`;
    }

    // Error de JWT inválido o expirado
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401; // 401 Unauthorized
        err.message = 'Token no válido. Por favor, inicie sesión de nuevo.';
        if (err.name === 'TokenExpiredError') {
            err.message = 'Su sesión ha expirado. Por favor, inicie sesión de nuevo.';
        }
    }

    // 3. Respuesta Final JSON
    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || 'Error interno del servidor',
            // En entorno de producción, no se debe enviar el stack
            // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
};

module.exports = errorMiddleware;