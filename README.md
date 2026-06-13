# 神机阁 - AI驱动的智能命理分析平台

[![Version](https://img.shields.io/badge/version-3.3.0-blue.svg)](https://github.com/patdelphi/suanming)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.6.2-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![Koyeb](https://img.shields.io/badge/deploy-koyeb-green.svg)](https://www.koyeb.com/)

一个集成AI智能解读的中华传统命理分析平台，提供八字命理、紫微斗数、易经占卜等专业分析服务，支持多种AI模型深度解读。

## ✨ 核心功能

### 🔮 命理分析服务
- 🎯 **八字命理分析** - 四柱排盘、五行分析、格局判断、大运流年
- 🌟 **紫微斗数分析** - 星盘排布、十二宫位、四化飞星、详细解读
- 🔮 **易经占卜分析** - 梅花易数、卦象解读、人生指导

### 🤖 AI智能解读
- 🧠 **多模型支持** - OpenAI GPT、智谱AI、Azure OpenAI、Claude等主流AI模型
- 📝 **深度解读** - 将传统命理术语转换为现代语言，提供实用人生指导
- ⚙️ **灵活配置** - 自定义API密钥、模型参数、提示词模板
- 💾 **结果缓存** - 自动保存解读结果，避免重复调用节省费用
- 🔄 **流式输出** - 支持实时流式显示，提升用户体验

### 💡 智能特性
- 📊 **星曜强度解释** - 旺、得地、平、不得地、陷的详细说明
- 🎨 **命宫位置详解** - 五行属性、深层含义、性格影响分析
- 📈 **数据可视化** - 五行分布图表、运势趋势分析
- 📱 **移动优化** - 完美适配手机端操作和显示

### 🛠️ 系统功能
- 👤 **完整用户系统** - 注册登录、个人资料、分析历史管理
- 📊 **历史记录分页** - 智能分页显示，支持大量历史数据浏览
- 📥 **多格式导出** - 支持PDF、Markdown、TXT格式导出分析报告
- 📱 **响应式设计** - 完美支持桌面端、平板和移动端
- 🎨 **中国风UI** - 传统文化与现代设计的完美融合
- 🔒 **数据安全** - JWT认证、SQLite本地存储、数据持久化保护

## 🚀 快速开始

### 🐳 Docker 部署（推荐）

```bash
# 使用 Docker Compose 一键启动
git clone https://github.com/patdelphi/suanming.git
cd suanming
cp .env.example .env
# 编辑 .env 文件，设置 JWT_SECRET
docker-compose up -d

# 访问应用
# http://localhost:8000
```

### 📦 传统部署

#### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

#### 安装依赖

```bash
# 克隆项目
git clone https://github.com/patdelphi/suanming.git
cd suanming

# 安装依赖
npm install
```

#### 启动开发服务器

```bash
# 启动开发服务器（前后端同时启动）
npm run dev

# 或分别启动
npm run server  # 后端服务器 (端口 3001)
npm run dev     # 前端开发服务器 (端口 5173)
```

#### 配置AI解读功能（可选）

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加AI配置
# VITE_AI_API_KEY=your-openai-api-key
# VITE_AI_API_URL=https://api.openai.com/v1/chat/completions
# VITE_AI_MODEL_NAME=gpt-3.5-turbo
```

#### 访问应用

- 🌐 前端应用: http://localhost:5173
- 🔌 后端API: http://localhost:3001/api
- 🏥 健康检查: http://localhost:3001/api/health

## 🏗️ 项目架构 (v3.3)

### 架构特点

- **精确算法引擎**: 基于天文计算的精确节气、日柱、月柱算法，多轮交叉验证
- **AI集成架构**: 完整的AI解读服务集成，支持多种AI模型
- **容器化部署**: Docker + Docker Compose 一键部署
- **云原生支持**: Koyeb、Railway等云平台部署优化
- **数据持久化**: SQLite + 持久化卷，确保数据安全
- **分离关注点**: 分析计算与历史记录存储完全分离
- **API去重**: 防止重复调用的请求去重机制
- **性能优化**: useMemo缓存和useEffect依赖优化
- **错误隔离**: 历史记录保存失败不影响分析功能
- **安全防护**: CSP策略、CORS配置、JWT认证

### 技术栈

**前端技术**
- React 18.3.1 + TypeScript 5.6.2
- Vite 6.0.1 (构建工具)
- Tailwind CSS 3.4.16 (中国风主题)
- React Router 6 (路由管理)
- Radix UI (组件库)
- React Hook Form + Zod (表单验证)
- Recharts (数据可视化)
- Lucide React (图标库)
- React Markdown (AI解读渲染)
- Sonner (通知组件)

**后端技术**
- Node.js + Express 4.18.2
- Better-SQLite3 12.2.0 (数据库)
- JWT + bcryptjs (身份认证)
- Helmet (安全中间件，CSP配置)
- CORS (跨域处理)
- 分层架构设计

**AI集成**
- OpenAI GPT 系列模型
- 智谱AI (GLM系列)
- Azure OpenAI Service
- Anthropic Claude
- Google Generative AI
- 流式响应支持

**部署工具**
- Docker + Docker Compose
- Koyeb 云部署配置
- 数据持久化卷
- 健康检查机制

**开发工具**
- ESLint + TypeScript ESLint (代码检查)
- Concurrently (并发运行)
- Nodemon (开发热重载)
- npm (包管理器)

### 目录结构

```
├── src/                    # 前端源码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── lib/               # 工具库
│   ├── contexts/          # React Context
│   └── types/             # TypeScript类型
├── server/                # 后端源码
│   ├── routes/            # API路由
│   ├── services/          # 业务服务
│   ├── middleware/        # 中间件
│   └── database/          # 数据库配置
├── docs/                  # 项目文档
└── public/                # 静态资源
```

## 🔄 v3.3 重大更新

### 🆕 新增功能

1. **AI智能解读系统** - 集成多种AI模型，提供深度个性化解读
2. **Docker容器化部署** - 一键部署，环境一致性保障
3. **云平台部署支持** - Koyeb等云平台优化配置
4. **数据持久化保护** - 解决部署更新时数据丢失问题
5. **历史记录分页** - 支持大量历史数据的高效浏览
6. **CSP安全策略** - 增强Web安全防护

### 🔧 核心算法修复 (v3.3)

经过多轮交叉验证，修复了 **16个** 影响算命准确性的核心算法Bug：

**八字命理**
- 日柱计算改用UTC日期 + 2000-01-07甲子日基准
- 五虎遁月公式修正：`((yearStemIndex%5)*2 + lunarMonth + 1) % 10`
- 月柱使用年柱有效年干（已含立春调整）
- 年柱立春判断统一UTC时间比较
- 节气计算牛顿迭代角度差改用(-180°,180°]范围
- 节气查找扩展跨年列表（含上年大雪/冬至）

**紫微斗数**
- 紫微星位置查找表全部重写（基于《紫微斗数全书》）
- 添加缺失的廉贞星，修正天同偏移
- 四化改用年柱天干（已含立春调整）
- 五行局月干公式修正

**奇门遁甲**
- 月柱改用节气确定（新增`getMonthGanZhiByDate`）
- 日柱改用UTC日期计算
- 修复时干为甲时地盘定位崩溃（甲隐遁）

### ✅ 算法验证

经过 **14个** 测试用例交叉验证，覆盖立春前后、冬至、子时跨日、年末等边界情况：

| 模块 | 验证状态 | 说明 |
|------|---------|------|
| 八字四柱 | ✅ 通过 | 年柱/月柱/日柱/时柱全部正确 |
| 紫微斗数 | ✅ 通过 | 14主星分布正确 |
| 奇门遁甲 | ✅ 通过 | 节气/局数/值符值使正确 |
| 易经占卜 | ✅ 通过 | 上下卦/卦号/动爻正确 |

### 🔧 核心改进

1. **重复历史记录**: 一次分析产生多条记录 → 确保每次只产生1条记录
2. **架构耦合**: 分析与存储混合 → 完全分离，职责清晰
3. **性能问题**: 重复渲染和API调用 → 优化减少60%+重复调用
4. **部署复杂**: 手动配置环境 → Docker一键部署
5. **数据丢失**: 更新时数据重置 → 持久化卷保护
6. **AI集成**: 无AI功能 → 完整AI解读系统

### 版本对比

| 方面 | v1.0 (初版) | v2.0 (重构) | v3.0 (优化) | v3.1 | v3.3 (当前) |
|------|-------------|-------------|-------------|------|-------------|
| 分析接口 | 分析+存储耦合 | 纯分析计算 | AI增强分析 | 多模型AI解读 | 精确算法+AI |
| 历史记录 | 自动存储 | 专门接口存储 | 优化存储 | 分页+持久化 | 分页+持久化 |
| 部署方式 | 手动部署 | 手动部署 | 手动部署 | Docker+云部署 | Docker+云部署 |
| 数据安全 | 基础保护 | JWT认证 | 全面容错 | 持久化+CSP | 持久化+CSP |
| AI功能 | 无 | 无 | 基础AI | 完整AI系统 | 完整AI系统 |
| 算法精度 | 基础实现 | 基础实现 | 部分修复 | 部分修复 | 16个Bug修复 |
| 用户体验 | 术语晦涩 | 改进显示 | 详细解释 | AI深度解读 | AI深度解读 |

## 📚 文档

- [API文档](docs/API.md) - 详细的API接口说明
- [本地部署指南](docs/LOCAL_DEPLOYMENT.md) - 本地化部署和运行说明
- [Docker部署指南](DOCKER_DEPLOYMENT.md) - Docker容器化部署完整指南
- [Koyeb部署指南](KOYEB_DEPLOYMENT.md) - 云平台部署配置说明
- [AI解读使用指南](AI_INTERPRETATION_GUIDE.md) - AI功能配置和使用教程
- [更新日志](CHANGELOG.md) - 版本更新记录

## 🧪 测试

```bash
# 运行前端测试
npm run test

# 运行后端测试
cd server && npm run test

# 运行端到端测试
npm run test:e2e
```

## 🚀 部署

### 🐳 Docker 部署（推荐）

```bash
# 使用 Docker Compose
docker-compose up -d

# 或使用 Docker 命令
docker build -t suanming-app .
docker run -d -p 8000:8000 \
  -e JWT_SECRET=your-secret-key \
  -v suanming-data:/app/data \
  suanming-app
```

### ☁️ 云平台部署

**Koyeb 部署**
```bash
# 推送到 master 分支，Koyeb 自动部署
git push origin master
```

**其他云平台**
- Railway: 支持自动检测和部署
- Render: 支持 Docker 部署
- Heroku: 支持 Node.js 应用部署

### 📦 传统部署

```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

### 📖 详细指南

- [Docker部署指南](DOCKER_DEPLOYMENT.md) - 完整的容器化部署说明
- [Koyeb部署指南](KOYEB_DEPLOYMENT.md) - 云平台部署配置
- [本地部署指南](docs/LOCAL_DEPLOYMENT.md) - 传统部署方式

## 🤝 贡献

我们欢迎所有形式的贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解如何参与项目开发。

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 感谢所有贡献者的辛勤工作
- 感谢开源社区提供的优秀工具和库
- 感谢中华传统文化的深厚底蕴

## 📞 联系我们

- 项目主页: [GitHub Repository](https://github.com/patdelphi/suanming)
- 问题反馈: [GitHub Issues](https://github.com/patdelphi/suanming/issues)
- 在线演示: [Koyeb部署版本](https://suanming-app-patdelphi.koyeb.app)
- 邮箱: contact@shenjige.com

---

**神机阁** - 传承千年智慧，拥抱现代科技 🌟
