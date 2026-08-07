#!/bin/bash
# Usage: ./scripts/build-restaurant.sh <restaurantId> [android|ios|both]
# Examples:
#   ./scripts/build-restaurant.sh 24395           → builds both (default)
#   ./scripts/build-restaurant.sh 24395 android   → Android only
#   ./scripts/build-restaurant.sh 24395 ios       → iOS only (requires Mac + Xcode)

set -e

RESTAURANT_ID=$1
PLATFORM=${2:-both}
CONFIG="restaurant-configs/$RESTAURANT_ID/config.json"

if [ -z "$RESTAURANT_ID" ]; then
  echo "Error: pass a restaurant ID. Example: ./scripts/build-restaurant.sh 24395"
  exit 1
fi

if [ ! -f "$CONFIG" ]; then
  echo "Error: config not found at $CONFIG"
  exit 1
fi

if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" && "$PLATFORM" != "both" ]]; then
  echo "Error: platform must be android, ios, or both"
  exit 1
fi

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
  if [[ "$(uname)" != "Darwin" ]]; then
    echo "Error: iOS builds require macOS with Xcode installed."
    exit 1
  fi
fi

APP_ID=$(node -e "console.log(require('./$CONFIG').appId)")
APP_NAME=$(node -e "console.log(require('./$CONFIG').appName)")
TEMPLATE_ID=$(node -e "console.log(require('./$CONFIG').templateId)")

echo ""
echo "========================================"
echo "  Restaurant : $APP_NAME"
echo "  App ID     : $APP_ID"
echo "  Template   : $TEMPLATE_ID"
echo "  Platform   : $PLATFORM"
echo "========================================"
echo ""

# ── 1. Write .env.local ────────────────────────────────────────────────────────
echo "→ Writing .env.local..."
cat > .env.local << EOF
VITE_RESTAURANT_ID=$RESTAURANT_ID
VITE_RESTAURANT_TEMPLATE_ID=$TEMPLATE_ID
VITE_RESTAURANT_APP_NAME=$APP_NAME
EOF

# ── 2. Patch capacitor.config.ts ──────────────────────────────────────────────
echo "→ Patching capacitor.config.ts..."
node scripts/patch-capacitor-config.cjs "$APP_ID" "$APP_NAME"

# ── 3. Copy icons ──────────────────────────────────────────────────────────────
echo "→ Copying icon and splash..."
cp "restaurant-configs/$RESTAURANT_ID/icon.png"   resources/icon.png
cp "restaurant-configs/$RESTAURANT_ID/splash.png" resources/splash.png

# ── 4. Build web bundle ────────────────────────────────────────────────────────
echo "→ Building web bundle..."
npm run build

# ── 5. Generate icons/splash for native platforms ─────────────────────────────
echo "→ Generating native icons and splash screens..."
npx @capacitor/assets generate

# ══════════════════════════════════════════════════════════════════════════════
# ANDROID
# ══════════════════════════════════════════════════════════════════════════════
if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
  echo ""
  echo "── Android ──────────────────────────────────────────────────────────────────"

  # 6a. Patch strings.xml (launcher name)
  echo "→ Patching android/app/src/main/res/values/strings.xml..."
  node scripts/patch-strings-xml.cjs "$APP_NAME" "$APP_ID"

  # 6b. Patch applicationId in build.gradle
  echo "→ Patching android/app/build.gradle applicationId..."
  node -e "
  const fs = require('fs');
  const path = 'android/app/build.gradle';
  let src = fs.readFileSync(path, 'utf8');
  src = src.replace(/applicationId\s+\".*?\"/, 'applicationId \"$APP_ID\"');
  fs.writeFileSync(path, src);
  "

  # 6c. Copy google-services.json for FCM
  GOOGLE_SERVICES="restaurant-configs/$RESTAURANT_ID/google-services.json"
  if [ -f "$GOOGLE_SERVICES" ]; then
    cp "$GOOGLE_SERVICES" android/app/google-services.json
    echo "✅ google-services.json copied"
  else
    echo "⚠️  Warning: no google-services.json at $GOOGLE_SERVICES — FCM will not work on Android"
  fi

  # 6d. Sync Android
  echo "→ Running cap sync android..."
  npx cap sync android

  echo "✅ Android ready."
fi

# ══════════════════════════════════════════════════════════════════════════════
# iOS
# ══════════════════════════════════════════════════════════════════════════════
if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
  echo ""
  echo "── iOS ──────────────────────────────────────────────────────────────────────"

  # 7a. Patch Bundle ID in project.pbxproj (replaces all debug + release entries)
  echo "→ Patching ios/App/App.xcodeproj/project.pbxproj Bundle ID..."
  sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER = .*;/PRODUCT_BUNDLE_IDENTIFIER = $APP_ID;/g" \
    ios/App/App.xcodeproj/project.pbxproj

  # 7b. Patch CFBundleDisplayName in Info.plist
  echo "→ Patching ios/App/App/Info.plist CFBundleDisplayName..."
  /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $APP_NAME" ios/App/App/Info.plist 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string $APP_NAME" ios/App/App/Info.plist

  # 7c. Copy GoogleService-Info.plist for FCM
  GOOGLE_PLIST="restaurant-configs/$RESTAURANT_ID/GoogleService-Info.plist"
  if [ -f "$GOOGLE_PLIST" ]; then
    cp "$GOOGLE_PLIST" ios/App/App/GoogleService-Info.plist
    echo "✅ GoogleService-Info.plist copied"
  else
    echo "⚠️  Warning: no GoogleService-Info.plist at $GOOGLE_PLIST — FCM will not work on iOS"
  fi

  # 7d. Sync iOS
  echo "→ Running cap sync ios..."
  npx cap sync ios

  echo "✅ iOS ready."
fi

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo "  Build prep complete!"
echo "========================================"
if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
  echo "  Android → npx cap open android"
fi
if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
  echo "  iOS     → npx cap open ios"
fi
echo "========================================"
echo ""
