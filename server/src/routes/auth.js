const express = require('express');
const passport = require('../config/passport');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const User = require('../models/User');

const router = express.Router();

// Initialize passport middleware
router.use(passport.initialize());

// Success redirect helper for OAuth
const createOAuthResponse = (user, res) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  // Redirect to frontend with tokens as URL parameters
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const redirectUrl = `${clientUrl}/auth/callback?accessToken=${token}&refreshToken=${refreshToken}`;
  
  return res.redirect(redirectUrl);
};

// Success response helper for regular login/register
const createAuthResponse = (user, res) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  return res.json({
    success: true,
    message: 'Authentication successful',
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      preferences: user.preferences
    },
    tokens: {
      accessToken: token,
      refreshToken: refreshToken
    }
  });
};

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    createOAuthResponse(req.user, res);
  }
);

// GitHub OAuth routes
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'] 
  })
);

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  (req, res) => {
    createOAuthResponse(req.user, res);
  }
);

// Discord OAuth routes
router.get('/discord',
  passport.authenticate('discord', { 
    scope: ['identify', 'email'] 
  })
);

router.get('/discord/callback',
  passport.authenticate('discord', { session: false }),
  (req, res) => {
    createOAuthResponse(req.user, res);
  }
);

// Local login route (for testing or email/password auth)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login
    await user.updateLastLogin();
    
    createAuthResponse(user, res);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Register route (for email/password auth)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      name,
      emailVerified: false
    });
    
    await user.save();
    await user.updateLastLogin();
    
    createAuthResponse(user, res);
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  // For JWT, logout is handled client-side by removing the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Refresh token route
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    const jwt = require('jsonwebtoken');
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate new tokens
    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    
    res.json({
      success: true,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Get current user info
router.get('/me', 
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar,
        preferences: req.user.preferences,
        emailVerified: req.user.emailVerified,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  }
);

// Update user preferences
router.put('/preferences',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { preferences } = req.body;
      
      req.user.preferences = { ...req.user.preferences, ...preferences };
      await req.user.save();
      
      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: req.user.preferences
      });
      
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

module.exports = router;
