#!/usr/bin/env node
// > 数据库初始化脚本：在运行时生成 bcrypt 密码哈希
// ! 用法：node scripts/init-db.js [数据库名称]；生产环境必须通过环境变量提供初始凭据

const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function main() {
  const dbArg = process.argv[2] || 'jdcf-db';

  // * 1. 写入基础表结构；后续功能表仍需按迁移文件单独执行
  console.log('Running schema...');
  execSync(`npx wrangler d1 execute ${dbArg} --file=./schema.sql`, { stdio: 'inherit' });

  // 2. 检查是否已有管理员
  const checkOutput = execSync(
    `npx wrangler d1 execute ${dbArg} --command="SELECT COUNT(*) as c FROM admins" --json`,
    { encoding: 'utf8' }
  );
  const result = JSON.parse(checkOutput);
  if (result[0]?.results?.[0]?.c > 0) {
    console.log('Admins already exist, skipping seed.');
    return;
  }

  // * 3. 生成密码哈希并写入初始管理员
  const password = process.env.INIT_ADMIN_PASSWORD || 'change_me_123';
  const hash = await bcrypt.hash(password, 10);

  const steamId = process.env.INIT_STEAM_ID || 'INIT_STEAM_ID';
  const username = process.env.INIT_ADMIN_USER || 'admin';

  const insertSql = `
INSERT INTO admins (steam_id, username, password_hash, permission_group, game_name, qq_name, position, supervisor)
VALUES ('${steamId}', '${username}', '${hash}', 'OWNER', '初始管理员', '初始管理员', '服务器主管', '全局');
`;

  fs.writeFileSync(path.join(__dirname, '..', '_tmp_seed.sql'), insertSql);
  execSync(`npx wrangler d1 execute ${dbArg} --file=./_tmp_seed.sql`, { stdio: 'inherit' });
  fs.unlinkSync(path.join(__dirname, '..', '_tmp_seed.sql'));

  console.log(`\n✅ 初始管理员已创建`);
  console.log(`   用户名: ${username}`);
  console.log(`   密码: ${password}`);
  console.log(`   Steam ID: ${steamId}`);
  console.log(`   权限组: OWNER`);
}

main().catch(console.error);
