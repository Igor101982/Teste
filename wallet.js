const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../utils/authMiddleware');

// Exemplo: enviar valor para outro usuário
router.post('/send', auth, async (req, res) => {
    const { valor, destino, via } = req.body;
    const remetente = await User.findById(req.user.id);
    if (remetente.saldo < valor) return res.status(400).json({ error: 'Saldo insuficiente' });
    const destinatario = await User.findOne({ username: destino });
    if (!destinatario) return res.status(404).json({ error: 'Destinatário não encontrado' });

    remetente.saldo -= valor;
    destinatario.saldo += valor;
    await remetente.save();
    await destinatario.save();

    // cria transação para ambos
    await Transaction.create({ user: remetente._id, type: 'enviar', valor, destino, via });
    await Transaction.create({ user: destinatario._id, type: 'receber', valor, origem: remetente.username, via });

    res.json({ saldo: remetente.saldo });
});

// Histórico do usuário
router.get('/history', auth, async (req, res) => {
    const trans = await Transaction.find({ user: req.user.id }).sort('-data');
    res.json(trans);
});

module.exports = router;