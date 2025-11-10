const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Necesitarás instalar bcryptjs: npm install bcryptjs

const UsuarioSchema = new mongoose.Schema({
    // Datos básicos del cliente
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio.'],
        unique: true, // Crucial para el login
        trim: true,
        lowercase: true
    },
    contrasena: {
        type: String,
        required: [true, 'La contraseña es obligatoria.'],
        minlength: 8,
        select: false // IMPORTANTE: No retornar la contraseña en las consultas
    },
    // Información opcional (dirección, teléfono) [cite: 5, 6]
    direccion: {
        type: String,
        trim: true,
    },
    telefono: String,
    
    // Campo Clave: Define el rol del usuario para la autorización (JWT) 
    rol: {
        type: String,
        enum: ['cliente', 'administrador'], // Solo permite estos dos valores 
        default: 'cliente' // Por defecto, es un cliente
    }
}, { timestamps: true });


UsuarioSchema.pre('save', async function(next) {
    // 1. Solo encriptar si la contraseña fue modificada (ej: en la creación o un cambio)
    if (!this.isModified('contrasena')) {
        return next();
    }

    // 2. Generar un "salt" (dato aleatorio para hacer la encriptación más segura)
    const salt = await bcrypt.genSalt(10); 

    // 3. Encriptar la contraseña y reemplazarla en el documento
    this.contrasena = await bcrypt.hash(this.contrasena, salt);

    next();
});

UsuarioSchema.methods.compararContrasena = async function(contrasenaIngresada) {
    // 'this.contrasena' es la contraseña encriptada de la DB
    return await bcrypt.compare(contrasenaIngresada, this.contrasena);
};

const Usuario = mongoose.model('Usuario', UsuarioSchema);
module.exports = Usuario;