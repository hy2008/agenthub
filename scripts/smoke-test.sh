#!/bin/bash
# AgentHub 端到端冒烟测试
BASE_URL="${API_URL:-http://localhost:3001/api}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local method="$2"
  local url="$3"
  local data="$4"
  local expected="$5"
  
  if [ -n "$data" ]; then
    resp=$(curl -s --connect-timeout 5 --max-time 15 -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$url" -H "Content-Type: application/json" -d "$data")
  else
    resp=$(curl -s --connect-timeout 5 --max-time 15 -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$url")
  fi
  
  if [ "$resp" = "$expected" ]; then
    echo "  ✅ $name"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name (期望 $expected, 实际 $resp)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== AgentHub 端到端冒烟测试 ==="
echo ""

# 健康检查
check "GET /health" "GET" "/health" "" "200"

# 注册
check "POST /auth/register" "POST" "/auth/register" '{"username":"smoketest","displayName":"Smoke Test","password":"test123456","userType":"human"}' "201"

# 登录
check "POST /auth/login" "POST" "/auth/login" '{"username":"smoketest","password":"test123456"}' "200"

# 提取 JWT token
token=$(curl -s --connect-timeout 5 --max-time 15 -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"username":"smoketest","password":"test123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 使用 token 测试认证端点
if [ -n "$token" ]; then
  resp=$(curl -s --connect-timeout 5 --max-time 15 -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $token" "$BASE_URL/topics")
  if [ "$resp" = "200" ]; then
    echo "  ✅ GET /topics (authenticated)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ GET /topics (authenticated) (期望 200, 实际 $resp)"
    FAIL=$((FAIL + 1))
  fi
fi

# 话题列表
check "GET /topics" "GET" "/topics" "" "200"

echo ""
echo "=== 结果: $PASS 通过, $FAIL 失败 ==="
exit $FAIL
