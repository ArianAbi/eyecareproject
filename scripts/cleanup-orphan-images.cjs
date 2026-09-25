// Dry run by default. Only UUID WebP files absent from ImageAsset and older than 24h qualify.
require("dotenv").config({ quiet: true });
const { Pool } = require("pg");
const fs = require("node:fs/promises");
const path = require("node:path");
async function main() {
  if (!process.env.IMAGE_UPLOAD_DIR) throw Error("Set IMAGE_UPLOAD_DIR to the reviewed persistent upload directory.");
  const root = await fs.realpath(process.env.IMAGE_UPLOAD_DIR);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let found = 0;
  try {
    const directory = await fs.opendir(root);
    for await (const entry of directory) {
      if (!entry.isFile() || !/^[0-9a-f-]{36}\.webp$/.test(entry.name)) continue;
      const target = path.resolve(root, entry.name);
      if (path.dirname(target) !== root) throw Error("Unexpected cleanup path");
      const stat = await fs.lstat(target);
      if (!stat.isFile() || Date.now() - stat.mtimeMs < 86400000) continue;
      const result = await pool.query('SELECT 1 FROM "ImageAsset" WHERE "filename" = $1', [entry.name]);
      if (result.rowCount) continue;
      console.log(process.argv.includes("--apply") ? "Remove" : "Would remove", entry.name);
      if (process.argv.includes("--apply")) await fs.unlink(target);
      if (++found >= 1000) break;
    }
  } finally { await pool.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
