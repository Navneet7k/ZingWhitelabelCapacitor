#!/usr/bin/env node
// Usage: node scripts/patch-strings-xml.js <appName> <appId>
const fs = require('fs');
const [, , appName, appId] = process.argv;

// Android string resources need '&','<','>','"' XML-escaped, and a literal
// apostrophe backslash-escaped (unescaped ' crashes AAPT2 resource compilation).
const esc = s => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, "\\'");

const path = 'android/app/src/main/res/values/strings.xml';
const xml = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">${esc(appName)}</string>
    <string name="title_activity_main">${esc(appName)}</string>
    <string name="package_name">${esc(appId)}</string>
    <string name="custom_url_scheme">${esc(appId)}</string>
</resources>`;
fs.writeFileSync(path, xml);
