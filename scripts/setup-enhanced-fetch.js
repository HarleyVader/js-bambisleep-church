#!/usr/bin/env node
/**
 * Install Python dependencies for Enhanced Fetch Agent
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

async function installPythonDependencies() {
    console.log('🐍 Installing Python dependencies for Enhanced Fetch Agent...');
    
    const requirementsPath = path.join(__dirname, '..', 'src', 'mcp', 'requirements.txt');
    
    try {
        // Check if requirements.txt exists
        await fs.access(requirementsPath);
        console.log('📋 Found requirements.txt');
        
        // Try pip install
        console.log('📦 Installing packages with pip...');
        
        return new Promise((resolve, reject) => {
            const pip = spawn('pip', ['install', '-r', requirementsPath], {
                stdio: 'inherit'
            });
            
            pip.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Python dependencies installed successfully!');
                    resolve();
                } else {
                    console.log('⚠️ pip install failed, trying python -m pip...');
                    
                    // Try with python -m pip
                    const pipModule = spawn('python', ['-m', 'pip', 'install', '-r', requirementsPath], {
                        stdio: 'inherit'
                    });
                    
                    pipModule.on('close', (moduleCode) => {
                        if (moduleCode === 0) {
                            console.log('✅ Python dependencies installed successfully with python -m pip!');
                            resolve();
                        } else {
                            reject(new Error('Failed to install Python dependencies with both pip and python -m pip'));
                        }
                    });
                    
                    pipModule.on('error', (error) => {
                        reject(new Error(`Failed to run python -m pip: ${error.message}`));
                    });
                }
            });
            
            pip.on('error', (error) => {
                console.log('⚠️ pip command failed, trying python -m pip...');
                
                // Try with python -m pip
                const pipModule = spawn('python', ['-m', 'pip', 'install', '-r', requirementsPath], {
                    stdio: 'inherit'
                });
                
                pipModule.on('close', (moduleCode) => {
                    if (moduleCode === 0) {
                        console.log('✅ Python dependencies installed successfully with python -m pip!');
                        resolve();
                    } else {
                        reject(new Error('Failed to install Python dependencies'));
                    }
                });
                
                pipModule.on('error', (moduleError) => {
                    reject(new Error(`Failed to run both pip and python -m pip: ${error.message}, ${moduleError.message}`));
                });
            });
        });
        
    } catch (error) {
        console.error('💥 Error installing Python dependencies:', error.message);
        console.log('\n📝 Manual installation instructions:');
        console.log('1. Make sure Python 3.7+ is installed');
        console.log('2. Run: pip install httpx markdownify beautifulsoup4 lxml html5lib');
        console.log('3. Or run: python -m pip install httpx markdownify beautifulsoup4 lxml html5lib');
    }
}

async function verifyInstallation() {
    console.log('\n🔍 Verifying Python dependencies...');
    
    const packages = ['httpx', 'markdownify', 'bs4', 'lxml', 'html5lib'];
    
    for (const pkg of packages) {
        try {
            await new Promise((resolve, reject) => {
                const python = spawn('python', ['-c', `import ${pkg}`]);
                
                python.on('close', (code) => {
                    if (code === 0) {
                        console.log(`✅ ${pkg} is installed`);
                        resolve();
                    } else {
                        console.log(`❌ ${pkg} is not installed`);
                        reject(new Error(`${pkg} not found`));
                    }
                });
                
                python.on('error', (error) => {
                    reject(error);
                });
            });
        } catch (error) {
            console.log(`❌ ${pkg} verification failed`);
        }
    }
}

async function testPythonServer() {
    console.log('\n🧪 Testing Python fetch server...');
    
    const pythonServerPath = path.join(__dirname, '..', 'src', 'mcp', 'python_fetch_server.py');
    
    try {
        await fs.access(pythonServerPath);
        console.log('📄 Python fetch server found');
        
        // Test with a simple URL
        return new Promise((resolve, reject) => {
            const python = spawn('python', [pythonServerPath, '--url', 'https://httpbin.org/json', '--max-length', '500']);
            
            let output = '';
            
            python.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            python.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output);
                        if (result.success) {
                            console.log('✅ Python fetch server test successful!');
                            console.log(`   Fetched ${result.length} characters from ${result.url}`);
                        } else {
                            console.log('❌ Python fetch server test failed:', result.error);
                        }
                        resolve();
                    } catch (parseError) {
                        console.log('❌ Failed to parse test output');
                        reject(parseError);
                    }
                } else {
                    console.log('❌ Python fetch server test failed with code:', code);
                    reject(new Error(`Test failed with code ${code}`));
                }
            });
            
            python.on('error', (error) => {
                reject(error);
            });
        });
        
    } catch (error) {
        console.error('💥 Python server test failed:', error.message);
    }
}

async function main() {
    console.log('🎯 Enhanced Fetch Agent Setup');
    console.log('═════════════════════════════');
    
    try {
        await installPythonDependencies();
        await verifyInstallation();
        await testPythonServer();
        
        console.log('\n🎉 Enhanced Fetch Agent setup complete!');
        console.log('You can now use the enhanced fetch capabilities.');
        
    } catch (error) {
        console.error('\n💥 Setup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { installPythonDependencies, verifyInstallation, testPythonServer };
