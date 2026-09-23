const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const sharp = require("sharp");

require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, filename);
};
const { compressImage } = require("../lib/image-storage.ts");
const { MAX_IMAGE_BYTES } = require("../lib/image-upload.ts");

test("rejects empty, oversized, malformed and SVG inputs", async () => {
  for (const input of [Buffer.alloc(0), Buffer.alloc(MAX_IMAGE_BYTES + 1),
    Buffer.from("not an image"), Buffer.from('<svg width="10" height="10"><rect width="10" height="10"/></svg>')]) {
    await assert.rejects(compressImage(input));
  }
});

test("resizes to WebP, strips metadata and generates a 10 by 10 placeholder", async () => {
  const input = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: "red" } })
    .withMetadata().jpeg().toBuffer();
  const result = await compressImage(input);
  const metadata = await sharp(result.data).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(result.width, 2048);
  assert.equal(result.height, 1024);
  assert.equal(metadata.exif, undefined);
  assert.ok(result.data.length < input.length);
  const placeholder = await sharp(Buffer.from(result.base64.split(",")[1], "base64")).metadata();
  assert.equal(placeholder.width, 10);
  assert.equal(placeholder.height, 10);
});

test("does not enlarge small images and preserves transparency", async () => {
  const input = await sharp({ create: { width: 20, height: 12, channels: 4, background: "transparent" } }).png().toBuffer();
  const result = await compressImage(input);
  assert.equal(result.width, 20);
  assert.equal(result.height, 12);
  assert.equal((await sharp(result.data).metadata()).hasAlpha, true);
});
