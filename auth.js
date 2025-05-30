const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (await User.findOne({ email })) return res.status(400).json({ error: 'Email já cadastrado' });
        const user = new User({ username, email, password });
        await user.save();
        res.status(201).json({ message: 'Usuário criado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Senha incorreta' });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { username: user.username, email: user.email, saldo: user.saldo } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Implemente rota de recuperar senha conforme desejado

module.exports = router;