/**
 * 图片优化脚本
 * 压缩public目录下的JPG/PNG图片，生成WebP格式
 */
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminWebp = require('imagemin-webp');
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist');

async function optimizeImages() {
  console.log('🖼️  开始优化图片资源...\n');

  // 确保dist目录存在
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  try {
    // 1. 压缩JPG图片
    console.log('📦 压缩JPG图片...');
    const jpgResult = await imagemin([`${PUBLIC_DIR}/*.jpg`, `${PUBLIC_DIR}/*.jpeg`], {
      destination: PUBLIC_DIR,
      plugins: [
        imageminMozjpeg({
          quality: 75,
          progressive: true,
        }),
      ],
    });
    console.log(`✅ 已优化 ${jpgResult.length} 张JPG图片\n`);

    // 2. 压缩PNG图片
    console.log('📦 压缩PNG图片...');
    const pngResult = await imagemin([`${PUBLIC_DIR}/*.png`], {
      destination: PUBLIC_DIR,
      plugins: [
        imageminPngquant({
          quality: [0.6, 0.8],
          speed: 4,
        }),
      ],
    });
    console.log(`✅ 已优化 ${pngResult.length} 张PNG图片\n`);

    // 3. 生成WebP版本
    console.log('🔄 生成WebP格式...');
    const webpJpgResult = await imagemin([`${PUBLIC_DIR}/*.jpg`, `${PUBLIC_DIR}/*.jpeg`], {
      destination: PUBLIC_DIR,
      plugins: [
        imageminWebp({
          quality: 75,
        }),
      ],
    });
    
    const webpPngResult = await imagemin([`${PUBLIC_DIR}/*.png`], {
      destination: PUBLIC_DIR,
      plugins: [
        imageminWebp({
          quality: 75,
        }),
      ],
    });
    console.log(`✅ 已生成 ${webpJpgResult.length + webpPngResult.length} 张WebP图片\n`);

    // 4. 统计优化效果
    let totalSaved = 0;
    [...jpgResult, ...pngResult].forEach(file => {
      const originalPath = file.sourcePath;
      const optimizedPath = file.destinationPath;
      
      if (fs.existsSync(originalPath)) {
        const originalSize = fs.statSync(originalPath).size;
        const optimizedSize = fs.statSync(optimizedPath).size;
        const saved = originalSize - optimizedSize;
        totalSaved += saved;
        
        if (saved > 0) {
          const percent = ((saved / originalSize) * 100).toFixed(1);
          console.log(`  📉 ${path.basename(originalPath)}: -${(saved/1024).toFixed(1)}KB (${percent}%)`);
        }
      }
    });

    console.log(`\n🎉 图片优化完成！共节省 ${(totalSaved/1024).toFixed(1)}KB`);

  } catch (error) {
    console.error('❌ 图片优化失败:', error.message);
    process.exit(1);
  }
}

// 执行优化
optimizeImages();
