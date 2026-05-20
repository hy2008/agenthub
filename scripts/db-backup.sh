#!/bin/bash
# AgentHub 数据库自动备份脚本
# 使用: ./scripts/db-backup.sh [输出目录]

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="agenthub_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/agenthub}"

echo "📦 备份数据库到 $BACKUP_DIR/$FILENAME ..."
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/$FILENAME"

if [ $? -eq 0 ]; then
  echo "✅ 备份完成: $BACKUP_DIR/$FILENAME ($(wc -c < "$BACKUP_DIR/$FILENAME") bytes)"
  # 保留最近 7 天备份，删除更早的
  find "$BACKUP_DIR" -name "agenthub_backup_*.sql" -mtime +7 -delete
  echo "🧹 已清理 7 天前的备份"
else
  echo "❌ 备份失败"
  exit 1
fi
