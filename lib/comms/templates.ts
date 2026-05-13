const SIG = `
<br><br>
<strong>Yazen Yafai</strong><br>
Better EPC Rating<br>
07413 993550 | <a href="https://www.yourhomespecialist.co.uk">yourhomespecialist.co.uk</a>
`

export function bookingConfirmationEmail({
  clientName,
  propertyAddress,
  service,
  date,
}: {
  clientName: string
  propertyAddress: string
  service: string
  date: string
}) {
  return {
    subject: `Booking Confirmed – ${propertyAddress}`,
    body: `
      <p>Hi ${clientName},</p>
      <p>I'm writing to confirm that I've booked in the <strong>${service}</strong> at
      <strong>${propertyAddress}</strong> for <strong>${date}</strong>.</p>
      <p>Please don't hesitate to get in touch if you need anything changed or have any questions.</p>
      ${SIG}
    `,
  }
}

export function dayBeforeReminderSMS({
  propertyAddress,
  date,
  service,
}: {
  propertyAddress: string
  date: string
  service: string
}) {
  return {
    body: `Hi, this is a reminder that Yazen from Better EPC Rating will be visiting ${propertyAddress} tomorrow (${date}) for your ${service}. Please ensure access is available. Call/text 07413 993550 with any questions.`,
  }
}

export function reviewRequestSMS({
  propertyAddress,
  service,
}: {
  propertyAddress: string
  service: string
}) {
  const reviewUrl = process.env.GOOGLE_REVIEW_URL || 'https://www.yourhomespecialist.co.uk'
  return {
    body: `Hi, thank you for choosing Better EPC Rating for your ${service} at ${propertyAddress}. We'd really appreciate a quick review — it only takes a minute: ${reviewUrl} Thanks, Yazen`,
  }
}

export function paymentChaserEmail({
  clientName,
  ref,
  fee,
}: {
  clientName: string
  ref: string
  fee: number
}) {
  return {
    subject: `Invoice Reminder – ${ref}`,
    body: `
      <p>Hi ${clientName},</p>
      <p>Just a friendly reminder that invoice <strong>${ref}</strong> for <strong>£${fee.toFixed(2)}</strong> is still outstanding.</p>
      <p>
        <strong>Bank:</strong> Monzo Business<br>
        <strong>Sort Code:</strong> 04-00-06<br>
        <strong>Account Number:</strong> 09572715
      </p>
      <p>Please get in touch if you have any questions — happy to help.</p>
      ${SIG}
    `,
  }
}
