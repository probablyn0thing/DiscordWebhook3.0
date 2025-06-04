#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateDeployment() {
  console.log('🔍 Validating deployment configuration...\n');
  
  const checks = [];
  
  // Check if required files exist
  const requiredFiles = [
    'dist/index.js',
    'dist/api/health.js',
    'dist/api/start.js',
    'dist/src/bot.js',
    'dist/src/webhook.js',
    'dist/src/serverless.js',
    'vercel.json',
    'netlify.toml',
    '.env.example'
  ];
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    checks.push({
      name: `File exists: ${file}`,
      status: exists ? 'PASS' : 'FAIL',
      required: true
    });
  });
  
  // Check TypeScript compilation
  const hasDistFolder = fs.existsSync('dist') && fs.statSync('dist').isDirectory();
  checks.push({
    name: 'TypeScript compilation completed',
    status: hasDistFolder ? 'PASS' : 'FAIL',
    required: true
  });
  
  // Check package.json dependencies
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredDeps = ['discord.js', 'axios', 'dotenv'];
    const hasDeps = requiredDeps.every(dep => 
      pkg.dependencies && pkg.dependencies[dep]
    );
    checks.push({
      name: 'Required dependencies installed',
      status: hasDeps ? 'PASS' : 'FAIL',
      required: true
    });
  }
  
  // Display results
  console.log('📋 Deployment Validation Results:\n');
  let allPassed = true;
  
  checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${check.name}: ${check.status}`);
    if (check.required && check.status === 'FAIL') {
      allPassed = false;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 Deployment validation PASSED!');
    console.log('📦 Your Discord bot is ready for deployment to:');
    console.log('   • Vercel (recommended)');
    console.log('   • Netlify');
    console.log('\n💡 Next steps:');
    console.log('   1. Push code to GitHub');
    console.log('   2. Connect repository to hosting platform');
    console.log('   3. Configure environment variables:');
    console.log('      - DISCORD_TOKEN');
    console.log('      - WEBHOOK_URL');
    console.log('   4. Deploy and test endpoints:');
    console.log('      - GET /health (health check)');
    console.log('      - GET /start (initialize bot)');
  } else {
    console.log('❌ Deployment validation FAILED!');
    console.log('🔧 Please fix the issues above before deploying.');
  }
  
  return allPassed;
}

if (require.main === module) {
  const success = validateDeployment();
  process.exit(success ? 0 : 1);
}

module.exports = { validateDeployment };