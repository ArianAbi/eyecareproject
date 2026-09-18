const { readFileSync } = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

exports.load = function load(file, mocks = {}) {
    const filename = path.resolve(file)
    const source = readFileSync(filename, 'utf8')
    const compiled = ts.transpileModule(source, { compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    } }).outputText
    const output = {}
    new Function('require', 'exports', compiled)(name => {
        if (name in mocks) return mocks[name]
        if (name.startsWith('.') || name.startsWith('@/')) {
            const target = name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(filename), name)
            return load(`${target}.ts`, mocks)
        }
        return require(name)
    }, output)
    return output
}
