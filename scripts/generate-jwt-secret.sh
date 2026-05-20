#!/bin/bash
# 生成 64 字符随机 hex 串作为 JWT_SECRET
openssl rand -hex 32
echo ""
echo "Copy the output above to your .env JWT_SECRET"
