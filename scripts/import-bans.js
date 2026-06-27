#!/usr/bin/env node
/**
 * 封禁列表 Excel → D1 数据库 导入脚本
 *
 * 用法:
 *   CLOUDFLARE_API_TOKEN="xxx" node scripts/import-bans.js
 *
 * 支持的数据格式:
 *   - 处理结果: 30M, 1H, 3H, 5H, 8H, 1D, 3D, 7D, 14D, 30D, 1Y, 50Y (大小写不敏感)
 *   - 特殊值: 永久, 禁言<时长>, 警告处理, CFBA BAN
 *   - 封禁时间: Excel 序列号 (如 45508), 文本格式 (如 "8/5-8/7")
 *   - Steam ID: 自动去除 "@steam" 后缀
 *   - 违规等级: 1/2/3 → level1/level2/level3, 不适用 → CFBA_BAN
 */

const XLSX = require('xlsx');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── 配置 ───────────────────────────────────────────────
const DB_NAME = process.argv[2] || 'jdcf-db';
const EXCEL_FILE = path.join(__dirname, '..', '鸡蛋肠粉服务器封禁列表.xlsx');
const TMP_SQL = path.join(__dirname, '..', '_tmp_import.sql');
const ADMIN_ID = 1; // 默认导入管理员 ID（初始 OWNER）

// ─── 工具函数 ──────────────────────────────────────────

/** Excel 序列号 → ISO 日期 */
function excelDateToISO(serial) {
  if (!serial || serial === 'N/A') return null;
  const d = new Date((serial - 25569) * 86400 * 1000);
  return d.toISOString().split('T')[0];
}

/** 解析形如 "8/5-8/7" 的文本日期 → 取起始日 */
function parseTextDate(text) {
  if (!text || text === 'N/A') return null;
  // "8/5-8/7" → 取 "8/5"
  const match = text.match(/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    // 假设为 2024 年，因为 Excel 日期最小是 2024-08
    return `2024-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
  }
  return null;
}

/** 统一处理封禁时间字段 */
function parseBanTime(val) {
  if (typeof val === 'number') return excelDateToISO(val);
  if (typeof val === 'string') return parseTextDate(val);
  return null;
}

/** 统一处理封禁时长字段 → 标准化格式 */
function normalizeDuration(val) {
  const s = String(val).trim();
  if (!s || s === 'N/A') return null;

  // 永久
  if (s === '永久' || s === 'permanent') return 'permanent';

  // CFBA 封禁
  if (s === 'CFBA BAN' || s === 'CFBA') return 'cfba';

  // 警告处理
  if (s === '警告处理' || s === '警告') return 'warning';

  // 禁言处理: "禁言3d" → "mute-3d", "禁言30M" → "mute-30m"
  const muteMatch = s.match(/^禁言(\d+)([dDmM])$/);
  if (muteMatch) {
    return `mute-${muteMatch[1]}${muteMatch[2].toLowerCase()}`;
  }
  if (s === '禁言') return 'mute-30m'; // 无时长默认为 30m

  // 标准时长: "30M" → "30m", "1Y" → "1y", "7D" → "7d"
  const durationMatch = s.match(/^(\d+)([dDhHmMyY])$/);
  if (durationMatch) {
    let unit = durationMatch[2].toLowerCase();
    // 统一单位: h → d（Excel 误用的 h 当做 d 处理，因为游戏封禁通常以天为单位）
    // 但 "30M" 中的 M 是分钟，所以保留
    if (unit === 'h') unit = 'h';
    return `${durationMatch[1]}${unit}`;
  }

  // 非标准文本直接返回（暂时标记）
  return s;
}

/** 违规等级映射 */
function normalizeLevel(val) {
  const s = String(val).trim();
  if (s === '1') return 'level1';
  if (s === '2') return 'level2';
  if (s === '3') return 'level3';
  if (s === '不适用' || s === 'N/A' || s === '') return 'cfba_ban';
  return s;
}

/** 清洗 Steam ID: 去除 "@steam" 后缀 */
function cleanSteamID(val) {
  const s = String(val).trim();
  if (s === 'N/A' || s === '') return null;
  return s.replace(/@steam$/i, '');
}

/** SQL 转义 */
function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ─── 主流程 ─────────────────────────────────────────────

function main() {
  // 读取 Excel
  const wb = XLSX.readFile(EXCEL_FILE);
  const ws = wb.Sheets['Sheet1'];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  console.log(`📋 读取 ${rows.length} 条记录`);

  const sqlLines = [];
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const nickname = String(row['Nickname'] || '').trim() || '未知玩家';
    const steamID = cleanSteamID(row['Steam UserID']);
    const ip = String(row['IP Address'] || '').trim() === 'N/A' ? '' : String(row['IP Address'] || '').trim();
    const reason = String(row['原因'] || '').trim() || '未注明原因';
    const banTime = parseBanTime(row['封禁时间']);
    const duration = normalizeDuration(row['处理结果']);
    const level = normalizeLevel(row['违规等级']);
    const notes = String(row['备注'] || '').trim() === 'NONE' ? '' : String(row['备注'] || '').trim();

    // 跳过完全无效的记录
    if (!steamID && !duration) {
      skipped++;
      continue;
    }

    // 对于 CFBA 封禁和 N/A duratio 的记录，使用占位符
    const finalDuration = duration || 'cfba';
    const finalLevel = level;

    // 组装 INSERT
    const banTimeStr = banTime ? esc(banTime) : "datetime('now')";

    sqlLines.push(
      `INSERT INTO bans (nickname, steam_id, ip_address, reason, ban_time, ban_duration, violation_level, notes, handled_by, created_at, updated_at) ` +
      `VALUES (${esc(nickname)}, ${esc(steamID || 'N/A')}, ${esc(ip)}, ${esc(reason)}, ${banTimeStr}, ${esc(finalDuration)}, ${esc(finalLevel)}, ${esc(notes)}, 1, datetime('now'), datetime('now'));`
    );
    inserted++;
  }

  if (sqlLines.length === 0) {
    console.log('⚠️  没有可导入的数据');
    return;
  }

  // 写入临时 SQL 文件
  fs.writeFileSync(TMP_SQL, sqlLines.join('\n'), 'utf8');
  console.log(`📝 写入 ${sqlLines.length} 条 INSERT 语句到临时文件`);

  // 执行远程 D1
  console.log(`🚀 正在导入到远程 D1 数据库 ${DB_NAME}...`);
  try {
    const output = execSync(
      `npx wrangler d1 execute ${DB_NAME} --remote --file="${TMP_SQL}"`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    console.log(output);

    // 验证
    const verify = execSync(
      `npx wrangler d1 execute ${DB_NAME} --remote --command="SELECT COUNT(*) as total FROM bans"`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    console.log('✅ 导入完成！验证结果:');
    console.log(verify);
  } catch (err) {
    console.error('❌ 导入失败:', err.stderr || err.message);
    // 保留临时文件供调试
    console.log(`临时 SQL 文件保留在: ${TMP_SQL}`);
    return;
  }

  // 清理
  fs.unlinkSync(TMP_SQL);
  console.log(`📊 汇总: 成功导入 ${inserted} 条，跳过 ${skipped} 条`);
}

main();
