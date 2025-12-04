const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // 彻底删掉 ssl 相关代码，不要留任何判断逻辑
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool: pool
};