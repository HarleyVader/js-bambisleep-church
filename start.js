#!/usr/bin/env node
// Pre-flight Check and Auto-Start
import { spawn } from 'child_process';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const LMSTUDIO_URL = process.env.LMSTUDIO_URL || 'http://192.168.0.118:7777';
const MODEL_NAME = 'llama-3.2-8x3b-moe-dark-champion-instruct-uncensored-abliterated-18.4b';

console.log('\n🚀 BambiSleep Church - Pre-Flight Check\n');
console.log('=' .repeat(70));

async function preFlightCheck() {
    let canStart = true;

    // Check 1: .env file
    console.log('\n1️⃣ Checking configuration...');
    if (fs.existsSync('.env')) {
        console.log('   ✅ .env file found');
        const envContent = fs.readFileSync('.env', 'utf-8');
        if (envContent.includes('LMSTUDIO_URL')) {
            console.log('   ✅ LMSTUDIO_URL configured');
        } else {
            console.log('   ⚠️  LMSTUDIO_URL not found in .env');
        }
    } else {
        console.log('   ⚠️  .env file not found (using defaults)');
    }

    // Check 2: LMStudio Server
    console.log('\n2️⃣ Checking LMStudio server...');
    const baseUrl = LMSTUDIO_URL.replace('/v1/chat/completions', '');
    console.log(`   Server: ${baseUrl}`);
    
    try {
        const response = await axios.get(`${baseUrl}/v1/models`, { timeout: 5000 });
        console.log('   ✅ Server is reachable');
        
        const models = response.data.data;
        if (models.length === 0) {
            console.log('   ⚠️  NO MODELS LOADED!');
            console.log('   \n   📝 TO FIX THIS:');
            console.log('      1. Open LMStudio on 192.168.0.118');
            console.log('      2. Go to "Local Server" tab');
            console.log(`      3. Load: ${MODEL_NAME}`);
            console.log('      4. Wait for model to load');
            console.log('      5. Re-run: npm start\n');
            console.log('   ⏳ Server will start anyway and auto-retry connection...');
        } else {
            console.log(`   ✅ ${models.length} model(s) loaded:`);
            models.forEach(model => {
                console.log(`      • ${model.id}`);
            });
        }
    } catch (error) {
        console.log(`   ❌ Cannot reach server: ${error.message}`);
        console.log('   ⚠️  Agent features will not work until LMStudio is available');
        console.log('   ⏳ Server will start anyway and auto-retry connection...');
    }

    // Check 3: Node modules
    console.log('\n3️⃣ Checking dependencies...');
    if (fs.existsSync('node_modules')) {
        console.log('   ✅ node_modules found');
    } else {
        console.log('   ❌ node_modules not found');
        console.log('   📝 Run: npm install');
        canStart = false;
    }

    // Check 4: Required files
    console.log('\n4️⃣ Checking required files...');
    const requiredFiles = [
        'src/server.js',
        'src/mcp/McpAgent.js',
        'views/pages/agents.ejs',
        'src/knowledge/knowledge.json'
    ];
    
    let allFilesExist = true;
    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`   ✅ ${file}`);
        } else {
            console.log(`   ❌ ${file} - MISSING!`);
            allFilesExist = false;
            canStart = false;
        }
    });

    return canStart;
}

async function startServer() {
    console.log('\n' + '=' .repeat(70));
    console.log('🎬 Starting servers...\n');

    const serverProcess = spawn('npm', ['start'], {
        stdio: 'inherit',
        shell: true
    });

    serverProcess.on('error', (error) => {
        console.error('❌ Failed to start servers:', error.message);
        process.exit(1);
    });

    serverProcess.on('exit', (code) => {
        if (code !== 0) {
            console.error(`\n❌ Server exited with code ${code}`);
            process.exit(code);
        }
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down...');
        serverProcess.kill('SIGINT');
        process.exit(0);
    });
}

// Run pre-flight check
preFlightCheck().then(canStart => {
    if (canStart) {
        console.log('\n' + '=' .repeat(70));
        console.log('✅ All checks passed! Starting servers...');
        startServer();
    } else {
        console.log('\n' + '=' .repeat(70));
        console.log('❌ Pre-flight check failed!');
        console.log('\n📝 Fix the issues above and try again.\n');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
});
