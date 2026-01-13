const fs = require('fs');
try {
    const config = JSON.parse(fs.readFileSync('../config/db-config.json', 'utf8'));
    console.log('Redis Host:', config.redis?.host);
    console.log('Redis Port:', config.redis?.port);
    console.log('Redis Pass length:', config.redis?.password ? config.redis.password.length : 0);
    console.log('Redis Pass first char:', config.redis?.password ? config.redis.password[0] : 'none');
} catch (e) {
    console.error('Error reading config:', e.message);
}
