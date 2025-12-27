/**
 * 测试脚本：查看解密后的数据库配置结构
 */

const { loadConfig } = require('../../server/utils/config-crypto');
const path = require('path');

const configPath = path.join(__dirname, '../../config/db-config.json');
const dbConfig = loadConfig(configPath);

console.log('解密后的配置结构:');
console.log(JSON.stringify(dbConfig, null, 2));
