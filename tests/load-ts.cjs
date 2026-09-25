const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
function load(filename, mocks = {}, globals = {}) {
  const cache = new Map();
  function read(file) {
    file = path.resolve(file);
    const key = path.relative(process.cwd(), file).replaceAll("\\", "/").replace(/\.tsx?$/, "");
    if (key in mocks) return mocks[key];
    if (cache.has(file)) return cache.get(file).exports;
    const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const loaded = { exports: {} }; cache.set(file, loaded);
    const dependency = name => {
      if (name in mocks) return mocks[name];
      if (name === "server-only") return {};
      if (name.startsWith(".") || name.startsWith("@/")) {
        let target = name.startsWith("@/") ? path.resolve(name.slice(2)) : path.resolve(path.dirname(file), name);
        if (!/\.[cm]?[jt]sx?$/.test(target)) target += ".ts";
        return read(target);
      }
      return require(name);
    };
    new Function("require", "module", "exports", ...Object.keys(globals), output)(dependency, loaded, loaded.exports, ...Object.values(globals));
    return loaded.exports;
  }
  return read(filename);
}
module.exports = { load };
