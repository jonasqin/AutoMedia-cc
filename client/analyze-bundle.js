const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const analyzeBundle = () => {
  console.log('🔍 Analyzing bundle size...\n');

  try {
    // Build the application
    console.log('📦 Building application...');
    execSync('npm run build', { stdio: 'inherit' });

    // Get bundle stats
    const distPath = path.join(__dirname, 'dist');
    const assetsPath = path.join(distPath, 'assets');

    if (!fs.existsSync(assetsPath)) {
      console.error('❌ Build output not found');
      return;
    }

    const files = fs.readdirSync(assetsPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    const cssFiles = files.filter(file => file.endsWith('.css'));

    console.log('📊 Bundle Analysis Results:');
    console.log('─'.repeat(50));

    // JavaScript bundles
    console.log('\n🟦 JavaScript Bundles:');
    let totalJsSize = 0;
    jsFiles.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      const sizeInKB = (stats.size / 1024).toFixed(2);
      totalJsSize += stats.size;

      console.log(`  • ${file}: ${sizeInKB} KB`);
    });

    console.log(`  Total JS: ${(totalJsSize / 1024).toFixed(2)} KB`);

    // CSS bundles
    console.log('\n🟩 CSS Bundles:');
    let totalCssSize = 0;
    cssFiles.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      const sizeInKB = (stats.size / 1024).toFixed(2);
      totalCssSize += stats.size;

      console.log(`  • ${file}: ${sizeInKB} KB`);
    });

    console.log(`  Total CSS: ${(totalCssSize / 1024).toFixed(2)} KB`);

    // Total bundle size
    const totalSize = totalJsSize + totalCssSize;
    console.log(`\n📈 Total Bundle Size: ${(totalSize / 1024).toFixed(2)} KB`);

    // Recommendations
    console.log('\n💡 Optimization Recommendations:');

    if (totalSize > 1000000) {
      console.log('  ⚠️  Bundle size exceeds 1MB. Consider:');
      console.log('     • Code splitting for larger chunks');
      console.log('     • Tree shaking unused code');
      console.log('     • Lazy loading heavy components');
    }

    if (totalJsSize > 500000) {
      console.log('  ⚠️  JavaScript bundle is large. Consider:');
      console.log('     • Using dynamic imports');
      console.log('     • Implementing route-based code splitting');
      console.log('     • Compressing with Brotli');
    }

    if (totalCssSize > 200000) {
      console.log('  ⚠️  CSS bundle is large. Consider:');
      console.log('     • Purge unused CSS');
      console.log('     • Minifying CSS files');
      console.log('     • Using CSS modules');
    }

    // Check for large files
    const largeFiles = jsFiles.filter(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      return stats.size > 200000; // Larger than 200KB
    });

    if (largeFiles.length > 0) {
      console.log('\n🔍 Large files identified:');
      largeFiles.forEach(file => {
        const filePath = path.join(assetsPath, file);
        const stats = fs.statSync(filePath);
        console.log(`  • ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
      });
    }

    console.log('\n✅ Bundle analysis complete!');
  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
    process.exit(1);
  }
};

analyzeBundle();