#!/usr/bin/env node
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const publicDir = path.resolve(process.argv[2] || "public");

const SLOT_MARKERS = [
  {
    name: "sidebarHtml",
    source: "sidebar",
    slot: "<!-- locked-sidebar-slot -->",
  },
  {
    name: "contentHtml",
    source: "content",
    slot: '<div data-protected-slot="content"></div>',
  },
  {
    name: "footerHtml",
    source: "footer",
    slot: '<div data-protected-slot="footer"></div>',
  },
];

function walkFiles(dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, result);
    } else if (entry.isFile() && entry.name === "index.html") {
      result.push(fullPath);
    }
  }
  return result;
}

function extractTemplate(html, sourceName) {
  const pattern = new RegExp(`<template\\s+data-lock-source=(?:"${sourceName}"|${sourceName})>([\\s\\S]*?)<\\/template>`, "i");
  const match = html.match(pattern);
  if (!match) {
    return null;
  }

  return {
    value: match[1],
    nextHtml: html.replace(pattern, "__LOCK_SLOT__"),
  };
}

function encryptJson(payload, passwordHash) {
  const key = Buffer.from(passwordHash, "hex");
  if (key.length !== 32) {
    throw new Error("passwordHash must be a SHA-256 hex string");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    alg: "AES-256-GCM",
    kdf: "SHA-256(password)",
    iv: iv.toString("base64"),
    ciphertext: Buffer.concat([encrypted, tag]).toString("base64"),
  };
}

function replaceLockedDescriptions(html) {
  const description = "这篇文章已锁定，输入访问密码后可查看正文。";
  return html
    .replace(/<meta\s+name=description\s+content="[\s\S]*?">/i, `<meta name=description content="${description}">`)
    .replace(/<meta\s+property="og:description"\s+content="[\s\S]*?">/i, `<meta property="og:description" content="${description}">`)
    .replace(/<meta\s+name=twitter:description\s+content="[\s\S]*?">/i, `<meta name=twitter:description content="${description}">`);
}

function removeLockedMetadata(html) {
  return html
    .replace(/<meta\s+name=keywords\s+content="[\s\S]*?">/i, "")
    .replace(/<meta\s+property="article:tag"\s+content="[\s\S]*?">/gi, "");
}

function removeBlogPostingSchema(html) {
  return html.replace(/<script\s+type=(?:"application\/ld\+json"|application\/ld\+json)>([\s\S]*?)<\/script>/g, (match, body) => {
    return body.includes('"@type":"BlogPosting"') || body.includes('"@type": "BlogPosting"') ? "" : match;
  });
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  const lockMatch = html.match(/<section\s+class=(?:"post-lock"|post-lock)[^>]*\sdata-password-hash=(?:"([a-f0-9]{64})"|([a-f0-9]{64}))[^>]*>/i);
  if (!lockMatch) {
    return false;
  }

  const passwordHash = lockMatch[1] || lockMatch[2];
  const payload = {};

  for (const marker of SLOT_MARKERS) {
    const extracted = extractTemplate(html, marker.source);
    if (!extracted) {
      continue;
    }

    payload[marker.name] = extracted.value.trim();
    html = extracted.nextHtml.replace("__LOCK_SLOT__", marker.slot);
  }

  if (!payload.contentHtml) {
    throw new Error(`Locked post has no protected content: ${filePath}`);
  }

  const encrypted = encryptJson(payload, passwordHash);
  const encryptedScript = `<script type="application/json" data-encrypted-post>${JSON.stringify(encrypted)}</script>`;

  html = removeLockedMetadata(replaceLockedDescriptions(removeBlogPostingSchema(html)));
  html = html.replace(/\sdata-password-hash=(?:"[^"]+"|[^\s>]+)/i, "");
  html = html.replace("</article>", `${encryptedScript}\n  </article>`);

  fs.writeFileSync(filePath, html, "utf8");
  return true;
}

if (!fs.existsSync(publicDir)) {
  throw new Error(`Public directory not found: ${publicDir}`);
}

let count = 0;
for (const filePath of walkFiles(publicDir)) {
  if (processFile(filePath)) {
    count += 1;
    console.log(`Encrypted locked post: ${path.relative(publicDir, filePath)}`);
  }
}

console.log(`Encrypted locked posts: ${count}`);

