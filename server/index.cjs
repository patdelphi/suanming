const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { dbManager } = require('./database/index.cjs');

// 导入路由
const authRoutes = require('./routes/auth.cjs');
const analysisRoutes = require('./routes/analysis.cjs');
const historyRoutes = require('./routes/history.cjs');
const profileRoutes = require('./routes/profile.cjs');
const downloadRoutes = require('./routes/download.cjs');
const aiInterpretationRoutes = require('./routes/aiInterpretation.cjs');
const qimenRoutes = require('./routes/qimen.cjs');

// 导入中间件
const { errorHandler } = require('./middleware/errorHandler.cjs');
const { requestLogger } = require('./middleware/logger.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// 初始化数据库
try {
  dbManager.init();
  console.log('数据库连接成功');
  
  // 在生产环境中，确保管理员用户存在
  if (process.env.NODE_ENV === 'production') {
    const db = dbManager.getDatabase();
    const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@localhost');
    
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const adminPassword = bcrypt.hashSync('admin123', 12);
      
      // 创建管理员用户
      const insertAdmin = db.prepare(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)'
      );
      const adminResult = insertAdmin.run('admin@localhost', adminPassword);
      
      // 创建管理员档案
      const insertAdminProfile = db.prepare(
        'INSERT INTO user_profiles (user_id, full_name, username) VALUES (?, ?, ?)'
      );
      insertAdminProfile.run(adminResult.lastInsertRowid, '系统管理员', 'admin');
      
      console.log('✅ 管理员用户创建成功');
    }
  }
} catch (error) {
  console.error('数据库连接失败:', error);
  process.exit(1);
}

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      scriptSrc: ["'self'", "https:", "http:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://open.bigmodel.cn",
        "https://*.openai.azure.com",
        "https://api.anthropic.com",
        "https://generativelanguage.googleapis.com"
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
  // 禁用所有可能导致 HTTPS 强制的设置
  hsts: false,
}));

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (origin, callback) => {
        // 生产环境的严格检查
        const allowedOrigins = [
          'http://localhost:5173',
          'http://localhost:4173',
          ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
        ].filter(Boolean);
        
        // 允许所有.koyeb.app域名
        if (!origin || origin.endsWith('.koyeb.app') || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true, // 开发环境允许所有域名
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 基础中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// API健康检查端点（用于Koyeb监控）
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected'
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/ai-interpretation', aiInterpretationRoutes);
app.use('/api/qimen', qimenRoutes);
app.get('/api/config', (req, res) => {
  res.json({
    // AI相关配置
    ai: {
      apiKey: process.env.VITE_AI_API_KEY || '',
      apiUrl: process.env.VITE_AI_API_URL || '',
      modelName: process.env.VITE_AI_MODEL_NAME || 'GLM-4.5',
      maxTokens: process.env.VITE_AI_MAX_TOKENS || '50000',
      temperature: process.env.VITE_AI_TEMPERATURE || '0.6',
      timeout: process.env.VITE_AI_TIMEOUT || '120000',
      stream: process.env.VITE_AI_STREAM !== 'false'
    },
    // API基础URL（可选，前端通常可以自动确定）
    apiBaseUrl: process.env.VITE_API_BASE_URL || ''
  });
});

// 静态文件服务 (用于生产环境)
// 强制在 Koyeb 部署时启用静态文件服务
const isProduction = process.env.NODE_ENV === 'production' || process.env.PORT === '8000';
console.log('当前环境:', process.env.NODE_ENV);
console.log('端口:', process.env.PORT);
console.log('是否为生产环境:', isProduction);

if (isProduction) {
  const distPath = path.join(__dirname, '../dist');
  const indexPath = path.join(distPath, 'index.html');
  
  console.log('静态文件目录:', distPath);
  console.log('index.html路径:', indexPath);
  
  // 检查文件是否存在
  const fs = require('fs');
  console.log('dist目录存在:', fs.existsSync(distPath));
  console.log('index.html存在:', fs.existsSync(indexPath));
  
  if (fs.existsSync(distPath)) {
    console.log('dist目录内容:', fs.readdirSync(distPath));
  }
  
  // 配置静态文件服务，明确设置MIME类型
  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
      res.setHeader('Strict-Transport-Security', 'max-age=0');
      res.setHeader('Content-Security-Policy', "default-src 'self' http: https:");
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      } else if (path.endsWith('.woff') || path.endsWith('.woff2')) {
        res.setHeader('Content-Type', 'font/woff2');
      } else if (path.endsWith('.ttf')) {
        res.setHeader('Content-Type', 'font/ttf');
      } else if (path.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      }
    }
  }));
  
  // SPA路由处理 - 只处理非API请求
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next(); // 让后续的404处理器处理API请求
    }
    
    if (fs.existsSync(indexPath)) {
      res.setHeader('Strict-Transport-Security', 'max-age=0');
      res.setHeader('Content-Security-Policy', "default-src 'self' http: https:");
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(indexPath);
    } else {
      console.error('index.html文件不存在:', indexPath);
      res.status(404).json({ 
        error: {
          code: 'STATIC_FILE_NOT_FOUND',
          message: '静态文件不存在，请检查构建过程'
        }
      });
    }
  });
}

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: {
      code: 'NOT_FOUND',
      message: '请求的资源不存在'
    }
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`📊 数据库文件: ${path.resolve('./numerology.db')}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 健康检查: http://0.0.0.0:${PORT}/api/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  server.close(() => {
    console.log('HTTP服务器已关闭');
    dbManager.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，开始优雅关闭...');
  server.close(() => {
    console.log('HTTP服务器已关闭');
    dbManager.close();
    process.exit(0);
  });
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  dbManager.close();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  console.error('Promise:', promise);
});

module.exports = app;