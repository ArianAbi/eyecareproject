import fs from 'node:fs/promises'

const origin = 'http://localhost:3000'
const out = new URL('./', import.meta.url)
const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json())
const target = targets.find(item => item.type === 'page')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
let id = 0
const pending = new Map()
ws.onmessage = event => {
  const message = JSON.parse(event.data)
  if (!message.id) return
  const job = pending.get(message.id)
  pending.delete(message.id)
  message.error ? job.reject(Error(message.error.message)) : job.resolve(message.result)
}
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const callId = ++id
    pending.set(callId, { resolve, reject })
    ws.send(JSON.stringify({ id: callId, method, params }))
  })
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function evaluate(expression, awaitPromise = true) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true })
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
  return result.result.value
}
async function waitFor(check, timeout = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try { if (await evaluate(check)) return } catch {}
    await sleep(250)
  }
  throw Error(`Timed out waiting for: ${check}`)
}
async function navigate(path) {
  await send('Page.navigate', { url: `${origin}${path}` })
  await waitFor(`document.readyState === 'complete'`)
  await sleep(800)
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  await fs.writeFile(new URL(`${name}.png`, out), Buffer.from(data, 'base64'))
}
async function setViewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
}
async function input(selector, value) {
  await evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el) throw Error('Missing ${selector}'); const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; const setter=Object.getOwnPropertyDescriptor(proto,'value').set; setter.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); })()`)
}
async function clickText(text) {
  return evaluate(`(() => { const target=[...document.querySelectorAll('button,a')].find(el=>el.textContent.trim().includes(${JSON.stringify(text)})); if(!target) return false; target.click(); return true })()`)
}
async function realClick(selector) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`)
  await sleep(100)
  const point = await evaluate(`(() => { const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2} })()`)
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 })
}
async function snapshot(name) {
  const value = await evaluate(`({url:location.href,title:document.title,text:document.body.innerText.slice(0,8000),html:document.body.innerHTML.slice(0,20000),controls:[...document.querySelectorAll('input,textarea,button')].map((el,index)=>({index,tag:el.tagName,type:el.type,name:el.name,id:el.id,placeholder:el.placeholder,text:el.innerText,role:el.getAttribute('role'),disabled:el.disabled,ariaLabel:el.getAttribute('aria-label')}))})`)
  await fs.writeFile(new URL(`${name}.json`, out), JSON.stringify(value, null, 2), 'utf8')
  return value
}
async function selectOption(inputSelector, optionText) {
  await evaluate(`(() => { const el=document.querySelector(${JSON.stringify(inputSelector)}); el.scrollIntoView({block:'center'}); el.focus() })()`)
  await send('Input.insertText', { text: optionText })
  await sleep(300)
  if (await evaluate(`[...document.querySelectorAll('[role="option"]')].some(el=>el.textContent.includes(${JSON.stringify(optionText)}))`)) {
    await evaluate(`[...document.querySelectorAll('[role="option"]')].find(el=>el.textContent.includes(${JSON.stringify(optionText)})).click()`)
    await waitFor(`document.querySelector(${JSON.stringify(inputSelector)}).value.includes(${JSON.stringify(optionText)})`)
    return
  }
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 })
  await sleep(150)
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await waitFor(`document.querySelector(${JSON.stringify(inputSelector)}).value.includes(${JSON.stringify(optionText)})`)
}
async function createProduct(name, price, category = 'SEE MAX') {
  await navigate('/admin/products/create')
  await input('input[name="name"]', name)
  await input('input[name="price"]', String(price))
  await input('textarea[name="description"]', `محصول آزمایشی ${name}`)
  await selectOption('#form-categoryId', category)
  await waitFor(`!document.querySelector('button[type="submit"]').disabled`)
  await evaluate(`document.querySelector('button[type="submit"]').click()`)
  await waitFor(`location.pathname === '/admin/products'`, 20000)
  await waitFor(`document.body.innerText.includes(${JSON.stringify(name)})`)
}

await send('Page.enable')
await send('Runtime.enable')
await setViewport(1440, 1000)
await navigate('/login')
if (await evaluate(`location.pathname === '/login'`)) {
  await screenshot('01-login')
  await input('input[name="username"]', 'arian')
  await input('input[name="password"]', 'password')
  await waitFor(`!document.querySelector('button[type="submit"]').disabled`)
  await evaluate(`document.querySelector('button[type="submit"]').click()`)
  await waitFor(`location.pathname !== '/login'`, 20000)
}
await navigate('/admin/products')
await screenshot('02-products-before')
await snapshot('products-before')
await navigate('/admin/products/create')
await screenshot('03-create-product')
await snapshot('create-product')
await navigate('/admin/master-category')
await screenshot('04-master-categories')
await snapshot('master-categories')
await navigate('/admin/product-category')
await screenshot('05-product-categories')
await snapshot('product-categories')
const suffix = new Date().toISOString().replace(/\D/g, '').slice(8, 14)
const products = [`تست عدسی روزانه ${suffix}`, `تست عدسی بلوکات ${suffix}`]
const shouldCreate = !process.argv.includes('--no-create')
if (shouldCreate) {
  await createProduct(products[0], 450000)
  await createProduct(products[1], 625000)
}
await screenshot('06-products-after-create')
await snapshot('products-after-create')

const routes = [
  ['/admin', '07-admin-dashboard'],
  ['/admin/users', '08-admin-users'],
  ['/admin/analytics', '09-admin-analytics'],
  ['/admin/glasslens-order', '10-admin-order-for-user'],
  ['/glasslens-order', '11-user-order-desktop'],
]
const results = []
for (const [path, name] of routes) {
  await navigate(path)
  const state = await snapshot(name)
  await screenshot(name)
  results.push({ path, url: state.url, title: state.title, hasApplicationError: /Application error|Internal Server Error|Cannot read properties/i.test(state.text) })
}
await navigate('/admin/glasslens-order')
await evaluate(`document.querySelector('input[placeholder="نام کاربر یا شماره..."]').focus()`)
await send('Input.insertText', { text: 'arian' })
await waitFor(`[...document.querySelectorAll('[role="option"]')].some(el=>el.textContent.includes('arian'))`, 10000)
await evaluate(`[...document.querySelectorAll('[role="option"]')].find(el=>el.textContent.includes('arian')).click()`)
await waitFor(`location.search.includes('userId=')`, 10000)
await waitFor(`document.body.innerText.includes('سبد خرید فعلی این کاربر')`, 15000)
await screenshot('10b-admin-order-user-selected')
await snapshot('10b-admin-order-user-selected')
await setViewport(390, 844)
await navigate('/glasslens-order')
await screenshot('12-user-order-mobile')
const mobile = await evaluate(`({viewport:innerWidth,bodyWidth:document.body.scrollWidth,table:[...document.querySelectorAll('table')].map(el=>({width:el.scrollWidth,parentWidth:el.parentElement.clientWidth,parentOverflow:getComputedStyle(el.parentElement).overflowX})),sections:[...document.querySelectorAll('fieldset > section')].map(el=>getComputedStyle(el).gridTemplateColumns)})`)
await fs.writeFile(new URL('run-summary.json', out), JSON.stringify({ productsCreatedThisRun: shouldCreate ? products : [], results, mobile }, null, 2), 'utf8')
console.log(JSON.stringify({ ok: true, url: await evaluate('location.href') }))
ws.close()
process.exit(0)
