import "dotenv/config";

/**
 * 生产环境启动验证脚本
 * 验证 JWT_SECRET 配置、数据库连接、必要环境变量
 */
const checks: { name: string; pass: boolean; message: string }[] = [];

// 1. JWT_SECRET
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-me-in-production") {
  checks.push({ name: "JWT_SECRET", pass: false, message: "JWT_SECRET 必须设置为安全随机串" });
} else {
  checks.push({ name: "JWT_SECRET", pass: true, message: `✓ 已设置 (${process.env.JWT_SECRET.substring(0, 8)}...)` });
}

// 2. NODE_ENV
if (process.env.NODE_ENV !== "production") {
  checks.push({ name: "NODE_ENV", pass: false, message: "NODE_ENV 必须设置为 production" });
} else {
  checks.push({ name: "NODE_ENV", pass: true, message: "✓ NODE_ENV=production" });
}

// 3. DATABASE_URL
if (!process.env.DATABASE_URL) {
  checks.push({ name: "DATABASE_URL", pass: false, message: "DATABASE_URL 未设置" });
} else {
  checks.push({ name: "DATABASE_URL", pass: true, message: "✓ 已设置" });
}

// 4. CORS_ORIGIN
if (!process.env.CORS_ORIGIN) {
  checks.push({ name: "CORS_ORIGIN", pass: false, message: "CORS_ORIGIN 未设置" });
} else {
  checks.push({ name: "CORS_ORIGIN", pass: true, message: `✓ ${process.env.CORS_ORIGIN}` });
}

console.log("\n=== 生产环境配置检查 ===\n");
for (const check of checks) {
  console.log(`${check.pass ? "✅" : "❌"} ${check.name}: ${check.message}`);
}
const allPass = checks.every(c => c.pass);
console.log(`\n${allPass ? "✅ 全部检查通过，可以启动" : "❌ 存在问题，请修正后重试"}`);
process.exit(allPass ? 0 : 1);
