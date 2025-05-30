const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['enviar', 'receber'], required: true },
    valor: Number,
    destino: String,
    origem: String,
    data: { type: Date, default: Date.now },
    via: { type: String, enum: ['M-PESA', 'E-Mola', 'PayPal'], required: true }
});

module.exports = mongoose.model('Transaction', transactionSchema);