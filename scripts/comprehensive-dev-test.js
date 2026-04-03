#!/usr/bin/env node
"use strict";
/**
 * Comprehensive Dev Mode Test Script
 * Tests complete progress, quickstart, engine processings and counts for prehistoric data,
 * processings, results, ratios, indications with results, strategies with results,
 * database loads, server loads, and overall infos for processed data.
 *
 * Shows detailed results after prehistoric processed + 1min realtime progress.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const http = __importStar(require("http"));
class ComprehensiveTestRunner {
    constructor() {
        this.devProcess = null;
        this.results = [];
        this.startTime = new Date();
        this.baseUrl = 'http://localhost:3001';
        console.log('\n🚀 CTS v3.1 Comprehensive Dev Mode Test Suite\n');
        console.log('═════════════════════════════════════════════════════════\n');
    }
    /**
     * Make HTTP request to API endpoint
     */
    async makeRequest(path, method = 'GET', body, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const postData = body ? JSON.stringify(body) : null;
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method,
                timeout,
                headers: {
                    'User-Agent': 'ComprehensiveTestRunner/1.0',
                    'Accept': 'application/json',
                    ...(postData && {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    })
                }
            };
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk.toString());
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    }
                    catch (e) {
                        resolve(data);
                    }
                });
            });
            req.on('error', (error) => reject(error));
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            if (postData) {
                req.write(postData);
            }
            req.end();
        });
    }
    /**
     * Wait for server to be ready
     */
    async waitForServer(maxWaitSeconds = 60) {
        console.log('⏳ Waiting for dev server to start...');
        for (let i = 0; i < maxWaitSeconds; i++) {
            try {
                await this.makeRequest('/api/system/health', 'GET', 1000);
                console.log('✅ Dev server is ready!');
                return true;
            }
            catch (error) {
                if (i % 10 === 0) {
                    console.log(`   Still waiting... (${i}/${maxWaitSeconds}s)`);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        console.log('❌ Dev server failed to start within timeout');
        return false;
    }
    /**
     * Start dev server
     */
    async startDevServer() {
        console.log('🔧 Starting Next.js dev server...');
        return new Promise((resolve) => {
            this.devProcess = (0, child_process_1.spawn)('npm', ['run', 'dev'], {
                stdio: ['inherit', 'pipe', 'pipe'],
                cwd: process.cwd(),
                env: { ...process.env, NODE_ENV: 'development' }
            });
            let outputBuffer = '';
            const checkReady = (data) => {
                outputBuffer += data.toString();
                if (outputBuffer.includes('Ready') || outputBuffer.includes('started server on')) {
                    resolve(true);
                }
            };
            if (this.devProcess.stdout) {
                this.devProcess.stdout.on('data', checkReady);
            }
            if (this.devProcess.stderr) {
                this.devProcess.stderr.on('data', checkReady);
            }
            this.devProcess.on('error', (error) => {
                console.error('Failed to start dev server:', error);
                resolve(false);
            });
            // Timeout after 30 seconds
            setTimeout(() => resolve(false), 30000);
        });
    }
    /**
     * Stop dev server
     */
    stopDevServer() {
        if (this.devProcess) {
            console.log('🛑 Stopping dev server...');
            this.devProcess.kill('SIGTERM');
            this.devProcess = null;
        }
    }
    /**
     * Test system health
     */
    async testSystemHealth() {
        const startTime = Date.now();
        try {
            console.log('🔍 Testing system health...');
            const health = await this.makeRequest('/api/system/health');
            return {
                section: 'System Health',
                status: health.status === 'healthy' ? 'PASS' : 'WARN',
                data: health,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                section: 'System Health',
                status: 'FAIL',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Test complete system verification
     */
    async testCompleteVerification() {
        const startTime = Date.now();
        try {
            console.log('🔍 Testing complete system verification...');
            const result = await this.makeRequest('/api/system/verify-complete');
            return {
                section: 'Complete Verification',
                status: result.status === 'success' ? 'PASS' : result.status === 'partial' ? 'WARN' : 'FAIL',
                data: result,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                section: 'Complete Verification',
                status: 'FAIL',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Test system monitoring
     */
    async testSystemMonitoring() {
        const startTime = Date.now();
        try {
            console.log('📊 Testing system monitoring...');
            const monitoring = await this.makeRequest('/api/system/monitoring');
            return {
                section: 'System Monitoring',
                status: 'PASS',
                data: monitoring,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                section: 'System Monitoring',
                status: 'FAIL',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Test prehistoric data verification
     */
    async testPrehistoricData() {
        const startTime = Date.now();
        try {
            console.log('📈 Testing prehistoric data verification...');
            // First, trigger prehistoric data loading for demo connection
            try {
                const loadResult = await this.makeRequest('/api/symbol-data/load', 'POST', {
                    connection_id: 'demo-mode',
                    symbols: ['BTCUSDT', 'ETHUSDT'],
                    timeframes: ['1h', '4h'],
                    days_back: 7,
                    batch_size: 2
                });
                console.log('   Symbol data load initiated:', loadResult);
            }
            catch (e) {
                console.log('   Symbol data load not available or failed, continuing...');
            }
            // Wait a moment for processing
            await new Promise(resolve => setTimeout(resolve, 3000));
            // Verify engine status (includes prehistoric data)
            const result = await this.makeRequest('/api/system/verify-engine');
            return {
                section: 'Prehistoric Data',
                status: result.status === 'success' ? 'PASS' : result.status === 'partial' ? 'WARN' : 'FAIL',
                data: result,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                section: 'Prehistoric Data',
                status: 'FAIL',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Test indications data
     */
    async testIndicationsData() {
        const startTime = Date.now();
        try {
            console.log('📊 Testing indications data...');
            const result = await this.makeRequest('/api/data/indications?connectionId=demo-mode');
            return {
                section: 'Indications Data',
                status: result.success ? 'PASS' : 'FAIL',
                data: {
                    count: result.count,
                    isDemo: result.isDemo,
                    sample: result.data?.slice(0, 3)
                },
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                section: 'Indications Data',
                status: 'FAIL',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Test strategies data
     */
    async testStrategiesData() {
        const startTime = Date.now();
        try {
            console.log('🎯 Testing strategies data...');
            const result = await this.makeRequest('/api/data/strategies?connectionId=demo-mode');
            return {
                section: 'Strategies Data',
                status: result.success ? 'PASS' : 'FAIL',
                data: {
                    count: result.count,
                    isDemo: result.isDemo,
                    sample: result.data?.slice(0, 3)
                },
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                section: 'Strategies Data',
                status: 'FAIL',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Test processing metrics
     */
    async testProcessingMetrics() {
        const startTime = Date.now();
        try {
            console.log('⚙️ Testing processing metrics...');
            const result = await this.makeRequest('/api/metrics/processing?connectionId=demo-mode');
            return {
                section: 'Processing Metrics',
                status: result.success ? 'PASS' : 'WARN',
                data: result.data,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                section: 'Processing Metrics',
                status: 'FAIL',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Test engine metrics
     */
    async testEngineMetrics() {
        const startTime = Date.now();
        try {
            console.log('🚀 Testing engine metrics...');
            const result = await this.makeRequest('/api/engine-metrics');
            return {
                section: 'Engine Metrics',
                status: 'PASS',
                data: result,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                section: 'Engine Metrics',
                status: 'FAIL',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Test trade engine quick start
     */
    async testTradeEngineQuickStart() {
        const startTime = Date.now();
        try {
            console.log('⚡ Testing trade engine quick start...');
            const result = await this.makeRequest('/api/trade-engine/quick-start');
            return {
                section: 'Trade Engine Quick Start',
                status: result.success ? 'PASS' : 'WARN',
                data: result,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                section: 'Trade Engine Quick Start',
                status: 'FAIL',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Monitor system for specified duration
     */
    async monitorSystem(durationSeconds) {
        console.log(`⏱️ Monitoring system for ${durationSeconds} seconds...`);
        const monitoringResults = [];
        const startTime = Date.now();
        const endTime = startTime + (durationSeconds * 1000);
        while (Date.now() < endTime) {
            const monitoringStart = Date.now();
            try {
                const monitoring = await this.makeRequest('/api/system/monitoring');
                monitoringResults.push({
                    section: 'Realtime Monitoring',
                    status: 'PASS',
                    data: monitoring,
                    duration: Date.now() - monitoringStart
                });
            }
            catch (error) {
                monitoringResults.push({
                    section: 'Realtime Monitoring',
                    status: 'FAIL',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - monitoringStart
                });
            }
            // Wait 5 seconds between checks
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        return monitoringResults;
    }
    /**
     * Display detailed results
     */
    displayResults(results) {
        console.log('\n\n📋 DETAILED TEST RESULTS\n');
        console.log('═════════════════════════════════════════════════════════\n');
        // Summary
        const passCount = results.filter(r => r.status === 'PASS').length;
        const warnCount = results.filter(r => r.status === 'WARN').length;
        const failCount = results.filter(r => r.status === 'FAIL').length;
        const totalCount = results.length;
        console.log(`Total Tests: ${totalCount}`);
        console.log(`✅ Passed: ${passCount}`);
        console.log(`⚠️ Warnings: ${warnCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`⏱️ Total Duration: ${(Date.now() - this.startTime.getTime()) / 1000}s\n`);
        // Detailed results
        results.forEach((result, index) => {
            const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
            console.log(`${index + 1}. ${statusIcon} ${result.section}`);
            console.log(`   Duration: ${result.duration}ms`);
            if (result.data) {
                console.log(`   Data: ${JSON.stringify(result.data, null, 2).split('\n').map(line => `   ${line}`).join('\n')}`);
            }
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            console.log('');
        });
        // Performance analysis
        const monitoringResults = results.filter(r => r.section === 'Realtime Monitoring' && r.status === 'PASS');
        if (monitoringResults.length > 0) {
            console.log('\n📈 PERFORMANCE ANALYSIS\n');
            console.log('───────────────────────\n');
            const metrics = monitoringResults.map(r => r.data);
            // CPU and Memory trends
            const avgCpu = metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length;
            const avgMemory = metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length;
            const maxCpu = Math.max(...metrics.map(m => m.cpu));
            const maxMemory = Math.max(...metrics.map(m => m.memory));
            console.log(`Average CPU Usage: ${avgCpu.toFixed(1)}%`);
            console.log(`Peak CPU Usage: ${maxCpu}%`);
            console.log(`Average Memory Usage: ${avgMemory.toFixed(1)}%`);
            console.log(`Peak Memory Usage: ${maxMemory}%`);
            // Database metrics
            const avgKeys = metrics.reduce((sum, m) => sum + m.database.keys, 0) / metrics.length;
            const avgRequests = metrics.reduce((sum, m) => sum + m.database.requestsPerSecond, 0) / metrics.length;
            console.log(`Average Database Keys: ${Math.round(avgKeys)}`);
            console.log(`Average Redis Requests/sec: ${avgRequests.toFixed(1)}`);
            // Engine status
            const indicationsRunning = metrics.some(m => m.engines.indications.running);
            const strategiesRunning = metrics.some(m => m.engines.strategies.running);
            console.log(`Indications Engine Active: ${indicationsRunning ? 'Yes' : 'No'}`);
            console.log(`Strategies Engine Active: ${strategiesRunning ? 'Yes' : 'No'}`);
            if (indicationsRunning || strategiesRunning) {
                const avgIndicationCycles = metrics.reduce((sum, m) => sum + m.engines.indications.cycleCount, 0) / metrics.length;
                const avgStrategyCycles = metrics.reduce((sum, m) => sum + m.engines.strategies.cycleCount, 0) / metrics.length;
                console.log(`Average Indication Cycles: ${Math.round(avgIndicationCycles)}`);
                console.log(`Average Strategy Cycles: ${Math.round(avgStrategyCycles)}`);
            }
        }
    }
    /**
     * Run comprehensive test suite
     */
    async runComprehensiveTest() {
        try {
            // 1. Start dev server
            const serverStarted = await this.startDevServer();
            if (!serverStarted) {
                throw new Error('Failed to start dev server');
            }
            // 2. Wait for server to be ready
            const serverReady = await this.waitForServer();
            if (!serverReady) {
                throw new Error('Server failed to become ready');
            }
            // 3. Run initial tests
            console.log('\n🧪 Running comprehensive test suite...\n');
            this.results.push(await this.testSystemHealth());
            this.results.push(await this.testCompleteVerification());
            this.results.push(await this.testSystemMonitoring());
            this.results.push(await this.testPrehistoricData());
            this.results.push(await this.testIndicationsData());
            this.results.push(await this.testStrategiesData());
            this.results.push(await this.testProcessingMetrics());
            this.results.push(await this.testEngineMetrics());
            this.results.push(await this.testTradeEngineQuickStart());
            // 4. Monitor system for 1 minute after prehistoric processing
            console.log('\n⏱️ Starting 1-minute realtime monitoring...\n');
            const monitoringResults = await this.monitorSystem(60);
            this.results.push(...monitoringResults);
            // 5. Display results
            this.displayResults(this.results);
            console.log('\n🎉 Comprehensive test completed!\n');
        }
        catch (error) {
            console.error('❌ Test suite failed:', error);
            this.results.push({
                section: 'Test Suite',
                status: 'FAIL',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            this.displayResults(this.results);
        }
        finally {
            this.stopDevServer();
        }
    }
}
// Run the test suite
const testRunner = new ComprehensiveTestRunner();
testRunner.runComprehensiveTest().catch(console.error);
