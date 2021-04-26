const fs = require('fs')
const path = require('path')

const bundlePath = path.resolve(__dirname, '../dist/index.js')

function addCSSImport() {
  let bundle = fs.readFileSync(bundlePath, 'utf-8')
  if (bundle.includes(`import './index.css';`)) return
  bundle = `import './index.css';\n` + bundle
  fs.writeFileSync(bundlePath, bundle)
}

module.exports.addCSSImport = addCSSImport

if (require.main === module) {
  addCSSImport()
}
