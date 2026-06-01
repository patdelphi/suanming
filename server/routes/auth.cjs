const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../database/index.cjs');
const { 
  generateToken, 
  authenticate, 
  createSession, 
  deleteSession, 
  deleteAllSessions 
} = require('../middleware/auth.cjs');
const { AppError, asyncHandler } = require('../middleware/errorHandler.cjs');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               full_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *                     token:
 *                       type: string
 *       400:
 *         description: 请求错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, full_name } = req.body;
  
  // 输入验证
  if (!email || !password) {
    throw new AppError('邮箱和密码不能为空', 400, 'MISSING_FIELDS');
  }
  
  if (password.length < 6) {
    throw new AppError('密码长度至少6位', 400, 'PASSWORD_TOO_SHORT');
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('邮箱格式不正确', 400, 'INVALID_EMAIL');
  }
  
  const db = getDB();
  
  // 检查邮箱是否已存在
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    throw new AppError('该邮箱已被注册', 400, 'EMAIL_EXISTS');
  }
  
  // 加密密码
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  // 创建用户
  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)'
  );
  
  const result = insertUser.run(email, passwordHash);
  const userId = result.lastInsertRowid;
  
  // 创建用户档案
  if (full_name) {
    const insertProfile = db.prepare(
      'INSERT INTO user_profiles (user_id, full_name) VALUES (?, ?)'
    );
    insertProfile.run(userId, full_name);
  }
  
  // 生成JWT token
  const token = generateToken(userId);
  
  // 创建会话
  createSession(userId, token);
  
  res.status(201).json({
    data: {
      user: {
        id: userId,
        email: email
      },
      token: token
    }
  });
}));

// 用户登录
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // 输入验证
  if (!email || !password) {
    throw new AppError('邮箱和密码不能为空', 400, 'MISSING_FIELDS');
  }
  
  const db = getDB();
  
  // 查找用户
  const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email);
  if (!user) {
    throw new AppError('邮箱或密码错误', 401, 'INVALID_CREDENTIALS');
  }
  
  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('邮箱或密码错误', 401, 'INVALID_CREDENTIALS');
  }
  
  // 生成JWT token
  const token = generateToken(user.id);
  
  // 创建会话
  createSession(user.id, token);
  
  res.json({
    data: {
      user: {
        id: user.id,
        email: user.email
      },
      token: token
    }
  });
}));

// 获取当前用户信息
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  
  // 获取用户基本信息
  const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(req.user.id);
  
  // 获取用户档案信息
  const profile = db.prepare(
    'SELECT username, full_name, birth_date, birth_time, birth_location, gender, avatar_url FROM user_profiles WHERE user_id = ?'
  ).get(req.user.id);
  
  res.json({
    data: {
      user: {
        ...user,
        profile: profile || null
      }
    }
  });
}));

// 用户登出
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // 删除当前会话
  deleteSession(req.user.id, req.token);
  
  res.json({
    data: {
      message: '登出成功'
    }
  });
}));

// 登出所有设备
router.post('/logout-all', authenticate, asyncHandler(async (req, res) => {
  // 删除用户所有会话
  const result = deleteAllSessions(req.user.id);
  
  res.json({
    data: {
      message: `已登出 ${result.changes} 个设备`
    }
  });
}));

// 修改密码
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  
  // 输入验证
  if (!current_password || !new_password) {
    throw new AppError('当前密码和新密码不能为空', 400, 'MISSING_FIELDS');
  }
  
  if (new_password.length < 6) {
    throw new AppError('新密码长度至少6位', 400, 'PASSWORD_TOO_SHORT');
  }
  
  const db = getDB();
  
  // 获取用户当前密码
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  
  // 验证当前密码
  const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
  if (!isCurrentPasswordValid) {
    throw new AppError('当前密码错误', 401, 'INVALID_CURRENT_PASSWORD');
  }
  
  // 加密新密码
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(new_password, saltRounds);
  
  // 更新密码
  const updatePassword = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
  updatePassword.run(newPasswordHash, req.user.id);
  
  // 删除所有会话（强制重新登录）
  deleteAllSessions(req.user.id);
  
  res.json({
    data: {
      message: '密码修改成功，请重新登录'
    }
  });
}));

// 验证token有效性
router.get('/verify', authenticate, asyncHandler(async (req, res) => {
  res.json({
    data: {
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email
      }
    }
  });
}));

module.exports = router;