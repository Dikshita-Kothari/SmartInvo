const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, createdBy } = req.body;
    const user = new User({ name, email, password, role, createdBy });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// Session validation
router.get('/validate-session', async (req, res) => {
  try {
    // For now, we'll use a simple approach - check if user exists
    // In a real app, you'd validate JWT tokens or session cookies
    const { userId } = req.query;
    if (!userId) {
      return res.status(401).json({ error: 'No user ID provided' });
    }
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    // In a real app, you'd invalidate JWT tokens or clear session cookies
    // For now, we'll just return success
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 