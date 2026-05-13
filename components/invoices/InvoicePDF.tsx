import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#222222', paddingTop: 40, paddingBottom: 40, paddingLeft: 40, paddingRight: 40, backgroundColor: '#ffffff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { width: 110, height: 44 },
  invoiceTitle: { fontSize: 36, fontFamily: 'Helvetica-Bold', color: '#E53935' },
  addressBlock: { fontSize: 9, color: '#444444', marginBottom: 2 },
  invoiceMeta: { textAlign: 'right' },
  metaBold: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 2 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginTop: 14, marginBottom: 14 },
  boxRow: { flexDirection: 'row', marginTop: 6 },
  spacer: { flex: 1, marginRight: 12 },
  billBox: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'solid', borderRadius: 4, paddingTop: 10, paddingBottom: 10, paddingLeft: 10, paddingRight: 10, marginRight: 12 },
  payBox: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'solid', borderRadius: 4, paddingTop: 10, paddingBottom: 10, paddingLeft: 10, paddingRight: 10 },
  boxHeaderBill: { fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'center', color: '#E53935', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#d1d5db', borderBottomStyle: 'solid' },
  boxHeaderPay: { fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'center', color: '#16512a', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#d1d5db', borderBottomStyle: 'solid' },
  boxLine: { fontSize: 9, color: '#374151', lineHeight: 1.7, textAlign: 'center' },
  contact: { marginTop: 12, fontSize: 9, color: '#374151' },
  contactLine: { marginBottom: 2 },
  contactEmail: { color: '#16512a' },
  table: { marginTop: 14, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'solid', borderRadius: 4 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#374151', paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10 },
  tableHeaderDesc: { flex: 1, color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableHeaderQty: { width: 60, color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'center' },
  tableHeaderAmt: { width: 70, color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'right' },
  tableDataRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e5e7eb', borderTopStyle: 'solid', paddingTop: 10, paddingBottom: 10, paddingLeft: 10, paddingRight: 10 },
  tableEmptyRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e5e7eb', borderTopStyle: 'solid', paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10 },
  tableDesc: { flex: 1, fontSize: 9, color: '#222222' },
  tableQty: { width: 60, fontSize: 9, textAlign: 'center', color: '#374151' },
  tableAmt: { width: 70, fontSize: 9, textAlign: 'right', color: '#222222' },
  totalRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#d1d5db', borderTopStyle: 'solid', backgroundColor: '#f9fafb', paddingTop: 10, paddingBottom: 10, paddingLeft: 10, paddingRight: 10 },
  totalLabel: { flex: 1, fontSize: 9, color: '#6b7280' },
  totalWord: { width: 60, fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'center', color: '#222222' },
  totalAmt: { width: 70, fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'right', color: '#222222' },
  footer: { marginTop: 24, textAlign: 'center', color: '#6b7280', fontSize: 8 },
  footerEmail: { color: '#16512a' },
})

export interface InvoicePDFProps {
  invoiceRef: string
  invoiceDate: string
  clientName: string | null
  clientContact: string | null
  description: string
  amount: number
  logoBase64: string
}

export function InvoicePDF({ invoiceRef, invoiceDate, clientName, clientContact, description, amount, logoBase64 }: InvoicePDFProps) {
  const formattedAmount = `£${amount.toFixed(2)}`

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Logo + INVOICE */}
        <View style={s.headerRow}>
          <Image src={logoBase64} style={s.logo} />
          <Text style={s.invoiceTitle}>INVOICE</Text>
        </View>

        {/* Address + Invoice meta */}
        <View style={[s.headerRow, { marginTop: 14 }]}>
          <View>
            <Text style={s.addressBlock}>Better EPC Rating</Text>
            <Text style={s.addressBlock}>25 Rosefield Road</Text>
            <Text style={s.addressBlock}>B67 6DU</Text>
          </View>
          <View style={s.invoiceMeta}>
            <Text style={s.metaBold}>Invoice #{invoiceRef}</Text>
            <Text style={s.metaBold}>Invoice date {invoiceDate}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* BILL TO + PAY TO */}
        <View style={s.boxRow}>
          {clientName ? (
            <View style={s.billBox}>
              <Text style={s.boxHeaderBill}>BILL TO</Text>
              {clientContact ? <Text style={s.boxLine}>{clientContact}</Text> : null}
              <Text style={s.boxLine}>{clientName}</Text>
            </View>
          ) : (
            <View style={s.spacer} />
          )}
          <View style={s.payBox}>
            <Text style={s.boxHeaderPay}>PAY TO</Text>
            <Text style={s.boxLine}>Yazen Yafai trading as Better EPC Rating</Text>
            <Text style={[s.boxLine, { marginTop: 4 }]}>Bank: Monzo Business</Text>
            <Text style={s.boxLine}>Sort Code: 04-00-06</Text>
            <Text style={s.boxLine}>Account Number: 09572715</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={s.contact}>
          <Text style={s.contactLine}>Phone: 07413 993550</Text>
          <Text style={s.contactLine}>Email: <Text style={s.contactEmail}>yazen@yourhomespecialist.co.uk</Text></Text>
        </View>

        {/* Line items */}
        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={s.tableHeaderDesc}>DESCRIPTION</Text>
            <Text style={s.tableHeaderQty}>Quantity</Text>
            <Text style={s.tableHeaderAmt}>AMOUNT</Text>
          </View>
          <View style={s.tableDataRow}>
            <Text style={s.tableDesc}>{description}</Text>
            <Text style={s.tableQty}>1</Text>
            <Text style={s.tableAmt}>{formattedAmount}</Text>
          </View>
          <View style={s.tableEmptyRow}><Text style={s.tableDesc}> </Text></View>
          <View style={s.tableEmptyRow}><Text style={s.tableDesc}> </Text></View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Thank you for your business!</Text>
            <Text style={s.totalWord}>TOTAL</Text>
            <Text style={s.totalAmt}>{formattedAmount}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text>If you have any questions about this invoice, please contact</Text>
          <Text style={s.footerEmail}>yazen@yourhomespecialist.co.uk</Text>
        </View>

      </Page>
    </Document>
  )
}
