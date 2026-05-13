import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

// Colours matching the Better EPC Rating brand
const GREEN  = rgb(0.086, 0.318, 0.165)  // #16512a
const RED    = rgb(0.902, 0.318, 0.000)  // #e65100 orange CTA
const GRAY   = rgb(0.216, 0.255, 0.318)  // #374151
const LGRAY  = rgb(0.420, 0.447, 0.502)  // #6b7280
const MGRAY  = rgb(0.820, 0.831, 0.847)  // #d1d5db
const HGRAY  = rgb(0.976, 0.980, 0.984)  // #f9fafb

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return rgb(r, g, b)
}
const HEADER_BG = hexToRgb('#374151')

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: inv, error: dbError } = await supabase
      .from('invoices')
      .select('*, clients(name, contact_name, type, address), jobs(property_address, postcode, service)')
      .eq('id', id)
      .single()

    if (dbError || !inv) {
      return new Response(JSON.stringify({ error: 'Invoice not found', detail: dbError?.message }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      })
    }

    const client = inv.clients as { name: string; contact_name: string | null; type: string | null; address: string | null } | null
    const job = inv.jobs as { property_address: string | null; postcode: string | null; service: string | null } | null
    const isEstateAgent = client?.type === 'Estate Agent'

    // ── Determine line items (single or multi-job) ───────────────────────────
    type LineItem = { desc: string; amount: number }
    let lineItems: LineItem[] = []

    const jobIds: string[] | null = Array.isArray(inv.job_ids) && inv.job_ids.length > 0
      ? inv.job_ids as string[]
      : null

    if (jobIds && jobIds.length > 1) {
      const { data: multiJobs } = await supabase
        .from('jobs')
        .select('ref, property_address, postcode, service, fee')
        .in('id', jobIds)

      lineItems = (multiJobs ?? []).map(j => ({
        desc: [j.property_address, j.postcode, j.service].filter(Boolean).join(' ') || j.ref || 'Services rendered',
        amount: j.fee ?? 0,
      }))
    } else {
      const desc = [job?.property_address, job?.postcode, job?.service].filter(Boolean).join(' ')
        || inv.notes || 'Services rendered'
      lineItems = [{ desc, amount: inv.amount ?? 0 }]
    }

    const totalAmount = lineItems.reduce((s, item) => s + item.amount, 0)
    const formattedTotal = `£${totalAmount.toFixed(2)}`

    const dateStr = inv.invoice_date
      ? new Date(inv.invoice_date).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB')

    // ── Build PDF ────────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const { width, height } = page.getSize()

    const bold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const normal = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const M  = 40   // margin
    const CW = width - M * 2

    // Helper: draw text from top-left origin (pdf-lib uses bottom-left)
    function text(
      str: string,
      x: number,
      yFromTop: number,
      opts: {
        font?: typeof bold
        size?: number
        color?: ReturnType<typeof rgb>
        align?: 'left' | 'center' | 'right'
        maxWidth?: number
      } = {}
    ) {
      const font  = opts.font  ?? normal
      const size  = opts.size  ?? 9
      const color = opts.color ?? GRAY
      const maxW  = opts.maxWidth ?? CW
      const tw    = font.widthOfTextAtSize(str, size)
      let dx = 0
      if (opts.align === 'center') dx = (maxW - tw) / 2
      if (opts.align === 'right')  dx = maxW - tw
      page.drawText(str, {
        x: x + dx,
        y: height - yFromTop,
        font,
        size,
        color,
      })
    }

    function rect(
      x: number, yFromTop: number, w: number, h: number,
      opts: { fill?: ReturnType<typeof rgb>; border?: ReturnType<typeof rgb>; borderWidth?: number } = {}
    ) {
      if (opts.fill) {
        page.drawRectangle({ x, y: height - yFromTop - h, width: w, height: h, color: opts.fill })
      }
      if (opts.border) {
        page.drawRectangle({
          x, y: height - yFromTop - h, width: w, height: h,
          borderColor: opts.border, borderWidth: opts.borderWidth ?? 0.5, opacity: 0, borderOpacity: 1,
        })
      }
    }

    function line(x1: number, y1: number, x2: number, y2: number, color: ReturnType<typeof rgb>, thickness = 0.5) {
      page.drawLine({
        start: { x: x1, y: height - y1 },
        end:   { x: x2, y: height - y2 },
        color,
        thickness,
      })
    }

    // ── Logo (optional) ──────────────────────────────────────────────────────
    let logoY = M
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png')
      const logoBytes = fs.readFileSync(logoPath)
      const logoImg   = await pdfDoc.embedPng(logoBytes)
      const logoW = 110
      const logoH = logoW * (logoImg.height / logoImg.width)
      page.drawImage(logoImg, { x: M, y: height - M - logoH, width: logoW, height: logoH })
      logoY = M + logoH + 4
    } catch { /* no logo */ }

    // ── INVOICE stamp ────────────────────────────────────────────────────────
    text('INVOICE', M, M + 32, { font: bold, size: 32, color: RED, align: 'right', maxWidth: CW })

    // ── Business address + invoice meta ──────────────────────────────────────
    const addrY = Math.max(logoY, M + 48)
    text('Better EPC Rating', M, addrY,      { size: 9, color: GRAY })
    text('Birmingham',             M, addrY + 13, { size: 9, color: GRAY })
    text('',                       M, addrY + 26, { size: 9, color: GRAY })

    text(`Invoice #${inv.ref || 'DRAFT'}`, M, addrY,      { font: bold, size: 10, color: GRAY, align: 'right', maxWidth: CW })
    text(`Invoice date ${dateStr}`,        M, addrY + 14, { font: bold, size: 9,  color: GRAY, align: 'right', maxWidth: CW })

    // ── Divider ──────────────────────────────────────────────────────────────
    const divY = addrY + 44
    line(M, divY, width - M, divY, MGRAY, 1)

    // ── Boxes ────────────────────────────────────────────────────────────────
    const boxY = divY + 14
    const boxH = 76
    const halfW = (CW - 12) / 2
    let usedBoxH = boxH

    if (client?.name && isEstateAgent) {
      // BILL TO — collect lines to render
      const billLines: string[] = []
      billLines.push(client.name)
      if (client.address) {
        client.address.split(',').map(s => s.trim()).filter(Boolean).forEach(l => billLines.push(l))
      }
      const billBoxH = Math.max(boxH, 26 + 12 + billLines.length * 13 + 8)
      usedBoxH = billBoxH

      rect(M, boxY, halfW, billBoxH, { border: MGRAY })
      text('BILL TO', M, boxY + 18, { font: bold, size: 9, color: RED, align: 'center', maxWidth: halfW })
      line(M, boxY + 26, M + halfW, boxY + 26, MGRAY, 0.5)
      let billY = boxY + 38
      for (const l of billLines) {
        text(l, M, billY, { size: 9, align: 'center', maxWidth: halfW })
        billY += 13
      }

      // PAY TO
      const payX = M + halfW + 12
      rect(payX, boxY, halfW, billBoxH, { border: MGRAY })
      text('PAY TO', payX, boxY + 18, { font: bold, size: 9, color: GREEN, align: 'center', maxWidth: halfW })
      line(payX, boxY + 26, payX + halfW, boxY + 26, MGRAY, 0.5)
      text('Yazen Yafai trading as Better EPC Rating', payX, boxY + 38, { size: 8, align: 'center', maxWidth: halfW })
      text('Bank: Monzo Business',       payX, boxY + 51, { size: 8, align: 'center', maxWidth: halfW })
      text('Sort Code: 04-00-06',        payX, boxY + 63, { size: 8, align: 'center', maxWidth: halfW })
      text('Account Number: 09572715',   payX, boxY + 75, { size: 8, align: 'center', maxWidth: halfW })
    } else {
      // PAY TO only — full width
      rect(M, boxY, CW, boxH, { border: MGRAY })
      text('PAY TO', M, boxY + 18, { font: bold, size: 9, color: GREEN, align: 'center', maxWidth: CW })
      line(M, boxY + 26, width - M, boxY + 26, MGRAY, 0.5)
      text('Yazen Yafai trading as Better EPC Rating', M, boxY + 38, { size: 9, align: 'center', maxWidth: CW })
      text('Bank: Monzo Business',       M, boxY + 51, { size: 9, align: 'center', maxWidth: CW })
      text('Sort Code: 04-00-06',        M, boxY + 63, { size: 9, align: 'center', maxWidth: CW })
      text('Account Number: 09572715',   M, boxY + 75, { size: 9, align: 'center', maxWidth: CW })
    }

    // ── Contact ──────────────────────────────────────────────────────────────
    const contactY = boxY + usedBoxH + 14
    text('Phone: 07413 993550',             M, contactY)
    text('Email: yazen@yourhomespecialist.co.uk', M, contactY + 13, { color: GREEN })

    // ── Table ────────────────────────────────────────────────────────────────
    const tableY = contactY + 36
    const descW  = CW - 60 - 70
    const qtyW   = 60
    const amtW   = 70
    const qtyX   = M + descW
    const amtX   = qtyX + qtyW
    const ROW_H  = 32

    // Header row
    rect(M, tableY, CW, 26, { fill: HEADER_BG })
    text('DESCRIPTION', M + 10, tableY + 9, { font: bold, size: 9, color: rgb(1,1,1) })
    text('Quantity',    qtyX,   tableY + 9, { font: bold, size: 9, color: rgb(1,1,1), align: 'center', maxWidth: qtyW })
    text('AMOUNT',      amtX,   tableY + 9, { font: bold, size: 9, color: rgb(1,1,1), align: 'right',  maxWidth: amtW })

    // Data rows — one per line item
    const maxDescChars = Math.floor((descW - 20) / (normal.widthOfTextAtSize('A', 9)))
    let rowY = tableY + 26

    for (const item of lineItems) {
      rect(M, rowY, CW, ROW_H, { border: MGRAY })
      const descLine = item.desc.length > maxDescChars
        ? item.desc.slice(0, maxDescChars - 1) + '…'
        : item.desc
      text(descLine,                    M + 10, rowY + 11, { size: 9 })
      text('1',                         qtyX,   rowY + 11, { size: 9, align: 'center', maxWidth: qtyW })
      text(`£${item.amount.toFixed(2)}`, amtX,  rowY + 11, { size: 9, align: 'right',  maxWidth: amtW })
      rowY += ROW_H
    }

    // Total row
    rect(M, rowY, CW, ROW_H, { fill: HGRAY, border: MGRAY })
    text('Thank you for your business!', M + 10, rowY + 11, { size: 9, color: LGRAY })
    text('TOTAL',        qtyX, rowY + 11, { font: bold, size: 9, color: GRAY, align: 'center', maxWidth: qtyW })
    text(formattedTotal, amtX, rowY + 11, { font: bold, size: 9, color: GRAY, align: 'right',  maxWidth: amtW })

    // Outer border around entire table
    const tableH = 26 + (lineItems.length * ROW_H) + ROW_H
    rect(M, tableY, CW, tableH, { border: MGRAY, borderWidth: 1 })

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = rowY + ROW_H + 24
    text('If you have any questions about this invoice, please contact', M, footerY, { size: 8, color: LGRAY, align: 'center', maxWidth: CW })
    text('yazen@yourhomespecialist.co.uk', M, footerY + 13, { size: 8, color: GREEN, align: 'center', maxWidth: CW })

    const pdfBytes = await pdfDoc.save()
    const pdfBuffer = Buffer.from(pdfBytes)

    // Filename: for multi-job use ref only; for single job include road name
    const roadName = !jobIds || jobIds.length <= 1
      ? (job?.property_address?.split(',')[0]?.trim() ?? '')
      : ''
    const filename = `${inv.ref || 'invoice'}${roadName ? ` ${roadName}` : ''}.pdf`
    const download = req.nextUrl.searchParams.get('download') === '1'

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return new Response(
      JSON.stringify({ error: 'PDF generation failed', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
