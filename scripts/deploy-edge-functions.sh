#!/bin/bash
# ============================================================
# deploy-edge-functions.sh
# نشر جميع Edge Functions المُحسّنة أمنياً على Supabase
#
# الاستخدام:
#   1. npx supabase login
#   2. npx supabase link --project-ref tgdkxzzkvfyazmnawkpw
#   3. bash scripts/deploy-edge-functions.sh
# ============================================================

set -e

echo "=== نشر Edge Functions ==="
echo ""

FUNCTIONS=(
  "activate-department-member"
  "ai-chat"
  "bulk-create-institution-accounts"
  "complete-password-change"
  "create-course"
  "create-faculty-avatar-upload"
  "livekit-token"
  "signup-logo-upload"
)

for fn in "${FUNCTIONS[@]}"; do
  echo "نشر: $fn ..."
  npx supabase functions deploy "$fn" --no-verify-jwt 2>&1 || {
    echo "خطأ في نشر: $fn"
    exit 1
  }
  echo "✓ $fn تم النشر"
  echo ""
done

echo "=== اكتمل النشر ==="
echo "ال Functions المُنشرة:"
for fn in "${FUNCTIONS[@]}"; do
  echo "  - $fn"
done
