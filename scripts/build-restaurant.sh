#!/bin/bash
# Usage: ./scripts/build-restaurant.sh <restaurantId>
# Example: ./scripts/build-restaurant.sh 24395

set -e

RESTAURANT_ID=$1
CONFIG="restaurant-configs/$RESTAURANT_ID/config.json"

if [ -z "$RESTAURANT_ID" ]; then
  echo "Error: pass a restaurant ID. Example: ./scripts/build-restaurant.sh 24395"
  exit 1
fi

if [ ! -f "$CONFIG" ]; then
  echo "Error: config not found at $CONFIG"
  exit 1
fi

APP_ID=$(node -e "console.log(require('./$CONFIG').appId)")
APP_NAME=$(node -e "console.log(require('./$CONFIG').appName)")
TEMPLATE_ID=$(node -e "console.log(require('./$CONFIG').templateId)")

echo "Building: $APP_NAME ($APP_ID) — template $TEMPLATE_ID"

# 1. Write .env.local for this restaurant
cat > .env.local << EOF
VITE_RESTAURANT_ID=$RESTAURANT_ID
VITE_RESTAURANT_TEMPLATE_ID=$TEMPLATE_ID
VITE_RESTAURANT_APP_NAME=$APP_NAME
EOF

# 2. Patch capacitor.config.ts
node -e "
const fs = require('fs');
let src = fs.readFileSync('capacitor.config.ts', 'utf8');
src = src.replace(/appId: '.*?'/, \"appId: '$APP_ID'\");
src = src.replace(/appName: '.*?'/, \"appName: '$APP_NAME'\");
fs.writeFileSync('capacitor.config.ts', src);
"

# 3. Copy icons
cp "restaurant-configs/$RESTAURANT_ID/icon.png"   resources/icon.png
cp "restaurant-configs/$RESTAURANT_ID/splash.png" resources/splash.png

# 4. Build web bundle with restaurant env vars baked in
npm run build

# 5. Generate icons and splash for Android/iOS
npx @capacitor/assets generate

# 6. Patch Android strings.xml (launcher name — not updated by cap sync)
node -e "
const fs = require('fs');
const path = 'android/app/src/main/res/values/strings.xml';
const xml = \`<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name=\"app_name\">$APP_NAME</string>
    <string name=\"title_activity_main\">$APP_NAME</string>
    <string name=\"package_name\">$APP_ID</string>
    <string name=\"custom_url_scheme\">$APP_ID</string>
</resources>\`;
fs.writeFileSync(path, xml);
"

# 7. Sync native projects
npx cap sync android

echo ""
echo "Done. Open Android Studio to build the signed APK:"
echo "  npx cap open android"
