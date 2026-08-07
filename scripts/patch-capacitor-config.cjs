#!/usr/bin/env node
// Usage: node scripts/patch-capacitor-config.js <appId> <appName>
const fs = require('fs');
const [, , appId, appName] = process.argv;

let src = fs.readFileSync('capacitor.config.ts', 'utf8');
src = src.replace(/appId:\s*(['"]).*?\1/, `appId: ${JSON.stringify(appId)}`);
src = src.replace(/appName:\s*(['"]).*?\1/, `appName: ${JSON.stringify(appName)}`);
fs.writeFileSync('capacitor.config.ts', src);
