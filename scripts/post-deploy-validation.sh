#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-http://localhost}

check() {
  local path=$1; local expect=${2:-200}; local label=$3
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path" || echo 000)
  if [ "$code" = "$expect" ]; then echo "✅ $label ($code)"; else echo "❌ $label ($code)"; return 1; fi
}

main() {
  echo "Validating $BASE_URL"
  fails=0
  check "/" 200 "Home" || ((fails++))
  check "/aptos" 200 "Apartments page" || ((fails++))
  check "/builders" 200 "Builders page" || ((fails++))
  check "/api/v1/aptos/" 200 "Apartments API" || ((fails++))
  check "/api/v1/builders/" 200 "Builders API" || ((fails++))
  check "/api/v1/health/" 200 "API Health" || ((fails++))
  if [ $fails -eq 0 ]; then echo "🎉 All validations passed"; else echo "💥 $fails failed"; exit 1; fi
}

main "$@"

