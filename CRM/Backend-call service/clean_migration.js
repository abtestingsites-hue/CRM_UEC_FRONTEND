const fs = require('fs');
const sql = fs.readFileSync('migration_utf8.sql', 'utf8');
const lines = sql.split('\n');

const createEnumLine = '-- CreateEnum';
const createEnumEnd = 'CREATE TYPE "UserRole" AS ENUM (\'SUPER_ADMIN\', \'ADMIN\', \'SUPERVISOR\', \'AGENT\', \'SALES_AGENT\', \'EMERGENCY_TEAM\');';

const startIndex = lines.findIndex(l => l.includes('CREATE TABLE "Billing"')) - 1;
const cleanLines = lines.slice(startIndex);

const finalSql = createEnumLine + '\n' + createEnumEnd + '\n\n' + cleanLines.join('\n');
fs.writeFileSync('clean_migration.sql', finalSql);
