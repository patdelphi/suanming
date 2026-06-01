/**
 * Swagger API文档配置
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '神机阁 API',
      version: '3.1.0',
      description: 'AI驱动的中华传统命理分析平台API文档',
      contact: {
        name: '神机阁团队',
        url: 'https://github.com/patdelphi/suanming',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: '开发环境',
      },
      {
        url: 'https://your-production-domain.com',
        description: '生产环境',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        BirthData: {
          type: 'object',
          required: ['name', 'birth_date'],
          properties: {
            name: { type: 'string', description: '姓名' },
            birth_date: { type: 'string', format: 'date', description: '出生日期 (YYYY-MM-DD)' },
            birth_time: { type: 'string', format: 'time', description: '出生时间 (HH:MM)' },
            gender: { type: 'string', enum: ['male', 'female', '男', '女'], description: '性别' },
            birth_place: { type: 'string', description: '出生地点' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./server/routes/*.cjs'], // 从路由文件读取注释
};

const specs = swaggerJsdoc(options);

module.exports = specs;
