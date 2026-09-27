import "server-only"
import PDFDocument from "pdfkit"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { Readable } from "node:stream"
import type { CreditTransaction } from "@/generated/prisma/client"
import prisma from "./db"

const font = readFileSync(join(process.cwd(), "assets/fonts/NotoSansArabic.ttf"))
const number = new Intl.NumberFormat("en-US")
const dateParts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  hourCycle: "h23", timeZone: "Asia/Tehran",
})
const date = (value: Date) => {
  const parts = Object.fromEntries(dateParts.formatToParts(value).map(part => [part.type, part.value]))
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`
}
const columns = [
  { label: "تاریخ", width: 114 },
  { label: "شرح", width: 163 },
  { label: "بدهکار", width: 76 },
  { label: "بستانکار", width: 76 },
  { label: "مانده", width: 86 },
] as const
const left = 40
const right = left + columns.reduce((total, col) => total + col.width, 0)
const bottom = 798

type StatementRow = Pick<CreditTransaction, "id" | "createdAt" | "description" | "amount" | "balanceAfter">
type Account = { username: string, storeName: string, credit: number }

async function* transactionRows(userId: string): AsyncGenerator<StatementRow> {
  let cursor: string | undefined
  for (;;) {
    const page = await prisma.creditTransaction.findMany({
      where: { userId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 250,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, createdAt: true, description: true, amount: true, balanceAfter: true },
    })
    if (!page.length) return
    yield* page
    if (page.length < 250) return
    cursor = page.at(-1)!.id
  }
}

export async function renderCreditStatement(doc: PDFKit.PDFDocument, account: Account, rows: AsyncIterable<StatementRow>) {
  doc.registerFont("Persian", font).font("Persian")
  let page = 0
  let y = 0
  const startPage = () => {
    doc.addPage({ size: "A4", margin: 0 })
    page++
    doc.fillColor("#14382d").fontSize(17).text("معین حساب", left, 31, { width: right - left, align: "right" })
    doc.fillColor("#3f4c48").fontSize(10)
    doc.text("حساب", right - 95, 63, { width: 95, align: "right" })
    doc.text(account.storeName || account.username, left, 63, { width: right - left - 105, align: "right" })
    doc.text("اعتبار فعلی", right - 145, 83, { width: 145, align: "right" })
    doc.text(number.format(account.credit), left, 83, { width: right - left - 155, align: "right" })
    doc.text("تاریخ تهیه", right - 95, 103, { width: 95, align: "right" })
    doc.text(date(new Date()), left, 103, { width: right - left - 105, align: "right" })
    doc.fillColor("#5b6863").fontSize(8).text("مبالغ به تومان", left, 119, { width: right - left, align: "right" })
    doc.roundedRect(left, 133, right - left, 30, 4).fill("#e5f1e9")
    let x = right
    doc.fillColor("#14382d").fontSize(9)
    for (const col of columns) {
      x -= col.width
      doc.text(col.label, x + 4, 141, { width: col.width - 8, align: "right", lineBreak: false })
    }
    y = 163
  }
  const finishPage = () => {
    doc.fillColor("#5b6863").fontSize(9).text(`صفحه ${number.format(page)}`, left, 812, { width: right - left, align: "center" })
  }
  startPage()
  let count = 0
  for await (const row of rows) {
    const description = row.description || "—"
    doc.fontSize(9)
    const height = Math.max(33, doc.heightOfString(description, { width: columns[1].width - 12, align: "right" }) + 14)
    if (y + height > bottom) { finishPage(); startPage() }
    if (count % 2 === 0) doc.rect(left, y, right - left, height).fill("#f7faf8")
    doc.moveTo(left, y + height).lineTo(right, y + height).lineWidth(0.4).strokeColor("#dbe5df").stroke()
    const values = [
      date(row.createdAt), description,
      row.amount < 0 ? number.format(-row.amount) : "—",
      row.amount > 0 ? number.format(row.amount) : "—",
      row.balanceAfter === null ? "نامشخص" : number.format(row.balanceAfter),
    ]
    let x = right
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]
      x -= col.width
      doc.fillColor(i === 2 && row.amount < 0 ? "#a52d2d" : i === 3 && row.amount > 0 ? "#147043" : "#26332f")
        .fontSize(9).text(values[i], x + 5, y + 8, { width: col.width - 10, align: "right" })
    }
    y += height
    count++
  }
  if (!count) doc.fillColor("#5b6863").fontSize(10).text("تراکنشی ثبت نشده است.", left, y + 16, { width: right - left, align: "center" })
  finishPage()
  doc.end()
}

export async function createCreditStatementResponse(userId: string) {
  const account = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, storeName: true, credit: true } })
  if (!account) return new Response("Not found", { status: 404 })
  const doc = new PDFDocument({ autoFirstPage: false, compress: true, info: { Title: "معین حساب" } })
  const stream = Readable.toWeb(doc) as ReadableStream<Uint8Array>
  void renderCreditStatement(doc, account, transactionRows(userId)).catch(error => {
    console.error("Credit statement export failed", error)
    doc.destroy(error)
  })
  return new Response(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="account-statement.pdf"',
      "Cache-Control": "private, no-store",
    },
  })
}
