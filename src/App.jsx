import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { toDataURL } from 'qrcode'
import './App.css'

const initialState = {
  primalac: 'Stambena zajednica Oblakovska 15',
  svrha: 'Račun za 12-25',
  stanjeNaRacunu: '177.385,38',
  vanredniTroskovi: '/',
  racun: '200-3265930101033-58',
  iznos: '1955',
  pozivNaBroj: '',
  uplatioc: '',
  nazivFajla: 'uplatnica',
}

function App() {
  const [form, setForm] = useState(initialState)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const buildQrText = (iban, iznos, poziv) => {
    return `K:PR|V:01|C:1|R:${iban}|N:${form.primalac}|I:RSD${iznos}|SF:289|S:${form.svrha}|RO:00${poziv}`
  }

  const formatIban = (iban) => {
    const cleaned = iban.replace(/\s|-/g, '').toUpperCase()
    if (cleaned.length >= 20) {
      return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 17) + '-' + cleaned.slice(17)
    }
    return cleaned
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('')
    setError('')
    setLoading(true)

    try {
      const amount = Number(form.iznos.replace(',', '.'))
      if (Number.isNaN(amount) || amount <= 0) {
        throw new Error('Iznos mora biti pozitivan broj.')
      }

      const iznosRsd = amount.toFixed(2).replace('.', ',')
      const iban = form.racun.replace(/\s|-/g, '').toUpperCase()
      const poziv = form.pozivNaBroj.trim()
      const qrText = buildQrText(iban, iznosRsd, poziv)
      const qrDataUrl = await toDataURL(qrText, {
        errorCorrectionLevel: 'Q',
        width: 260,
      })

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const margin = 36
      const topOffsetX = 25
      const pageWidth = doc.internal.pageSize.getWidth()
      const contentWidth = pageWidth - margin * 2

      doc.setFont('times', 'bold')
      doc.setFontSize(20)
      doc.text('Stambena zajednica OBLAKOVSKA 15', margin + topOffsetX, 50)

      doc.setFont('times', 'normal')
      doc.setFontSize(10)
      let y = 70
      doc.text('Racun za januar 2026. godine', margin + topOffsetX, y)
      y += 16
      doc.text(`Stanje na racunu stambene zajednice: ${form.stanjeNaRacunu} RSD`, margin + topOffsetX, y)
      y += 16
      doc.text(`Vanredni troskovi u prethodnom mesecu: ${form.vanredniTroskovi}`, margin + topOffsetX, y)

      y += 26
      doc.setFont('times', 'bold')
      doc.text('Stavke:', margin + topOffsetX, y)

      const tableX = margin + topOffsetX
      const tableY = y + 10
      const tableWidth = contentWidth * 0.5
      const rowHeight = 22
      const col1Width = tableWidth * 0.75
      const rows = 3

      doc.setDrawColor(0)
      doc.setLineWidth(0.5)
      doc.rect(tableX, tableY, tableWidth, rowHeight * rows)
      doc.line(tableX + col1Width, tableY, tableX + col1Width, tableY + rowHeight * rows)
      doc.line(tableX, tableY + rowHeight, tableX + tableWidth, tableY + rowHeight)
      doc.line(tableX, tableY + rowHeight * 2, tableX + tableWidth, tableY + rowHeight * 2)
      doc.line(tableX, tableY + rowHeight * 3, tableX + tableWidth, tableY + rowHeight * 3)

      doc.setFont('times', 'normal')
      doc.text('Fond za tekuce odrzavanje zgrade', tableX + 6, tableY + 15)
      doc.text('1100', tableX + col1Width + 8, tableY + 15)
      doc.text('Ciscenje zgrade', tableX + 6, tableY + rowHeight + 15)
      doc.text('400', tableX + col1Width + 8, tableY + rowHeight + 15)
      doc.text('Odrzavanje lifta', tableX + 6, tableY + rowHeight * 2 + 15)
      doc.text('455', tableX + col1Width + 8, tableY + rowHeight * 2 + 15)

      const formX = margin + (contentWidth * 0.05)
      const formY = tableY + rowHeight * 4 + 90 // was 30
      const formWidth = contentWidth * 0.9
      const formHeight = 260 // was 280
      doc.setLineWidth(1) //added
      doc.rect(formX, formY, formWidth, formHeight)

      const leftX = formX + 10
      const leftWidth = 210
      let leftY = formY + 28
      const rightX = formX + leftWidth + 50
      let rightY = formY + 28
      const boxHeight = 22
      const smallBoxWidth = 40
      const amountBoxWidth = 60 // was 80
      const rowSpacing = 50 // this
      const labelY = leftY
      const boxY = leftY + 6

      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.text('Uplatilac:', leftX, labelY)
      doc.rect(leftX, boxY, leftWidth, boxHeight)

      doc.text('Sifra', rightX, labelY - 10)
      doc.text('placanja', rightX, labelY)
      doc.rect(rightX, boxY, smallBoxWidth, boxHeight)
      doc.setFontSize(10)
      doc.setFont('times', 'bold')
      doc.text('289', rightX + 10, boxY + 14)

      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.text('Valuta', rightX + 50, labelY + 2) // here was 55
      doc.rect(rightX + 50, boxY, smallBoxWidth, boxHeight)
      doc.setFontSize(10)
      doc.setFont('times', 'bold')
      doc.text('RSD', rightX + 58, boxY + 14) // her ws 63

      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.text('Iznos', rightX + 100, labelY + 2)
      doc.rect(rightX + 100, boxY, amountBoxWidth, boxHeight)
      doc.setFontSize(10)
      doc.setFont('times', 'bold')
      doc.text(`=${iznosRsd}`, rightX + 110, boxY + 14) // was 118

      leftY += rowSpacing
      rightY += rowSpacing
      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.text('Svrha uplate:', leftX, leftY)
      doc.rect(leftX, leftY + 4, leftWidth, boxHeight)
      doc.setFontSize(10)
      doc.setFont('times', 'bold')
      doc.text(form.svrha || '-', leftX + 4, leftY + 16, { maxWidth: leftWidth - 8 })

      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.text('Racun primaoca', rightX, rightY)
      doc.rect(rightX, rightY + 4, 160, boxHeight) // was 190
      doc.setFontSize(10)
      doc.setFont('times', 'bold')
      doc.text(form.racun, rightX + 30, rightY + 16, { maxWidth: 184 })

      leftY += rowSpacing
      rightY += rowSpacing
      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.text('Primalac:', leftX, leftY)
      doc.rect(leftX, leftY + 4, leftWidth, boxHeight)
      doc.setFontSize(10)
      doc.setFont('times', 'bold')
      doc.text(form.primalac || '-', leftX + 4, leftY + 16, { maxWidth: leftWidth - 8 })

      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.text('Model', rightX, rightY)
      doc.rect(rightX, rightY + 4, 40, boxHeight)
      doc.setFontSize(10)
      doc.setFont('times', 'bold')
      doc.text('00', rightX + 10, rightY + 16)

      const pozivX = rightX + 50
      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.text('poziv na broj', pozivX, rightY)
      doc.rect(pozivX, rightY + 4, 110, boxHeight)
      doc.setFontSize(10)
      doc.setFont('times', 'bold')
      doc.text(poziv || '-', pozivX + 5, rightY + 16, { maxWidth: 112 })

      const qrSize = 90
      const qrX = formX + formWidth - qrSize - 45 //was 35
      const qrY = formY + formHeight - qrSize - 10
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
      doc.setFontSize(8)
      doc.setFont('times', 'normal')
      doc.text('NBS IPS QR', qrX + 10, qrY + qrSize + 2) // here

      const footerY = formY + formHeight - 50 // was 80
      doc.setFont('times', 'normal')
      doc.setFontSize(7)
      doc.line(leftX, footerY, leftX + 100, footerY)
      doc.text('pecat i potpis uplatioca', leftX, footerY + 8)
      doc.line(leftX + 110, footerY, leftX + 200, footerY) // was 110
      doc.text('mesto i datum prijema', leftX + 110, footerY + 8)
      doc.line(leftX + 210, footerY, leftX + 300, footerY)
      doc.text('datum valute', leftX + 210, footerY + 8)

      const filename = `${form.nazivFajla.trim() || 'uplatnica'}.pdf`
      doc.save(filename)
      setStatus(`PDF je generisan i preuzet kao ${filename}.`)
    } catch (submitError) {
      setError(submitError.message || 'Došlo je do greške prilikom generisanja PDF-a.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="card">
        <h1>Stambena zajednica OBLAKOVSKA 15</h1>
        <p>Popunite podatke i kliknite generiši da preuzmete uplatnicu.</p>

        <form onSubmit={handleSubmit}>
          <div className="row row-4">
            <label>
              Uplatilac
              <input name="uplatioc" value={form.uplatioc} onChange={handleChange} />
            </label>
            <label>
              Sifra placanja
              <input value="289" disabled />
            </label>
            <label>
              Valuta
              <input value="RSD" disabled />
            </label>
            <label>
              Iznos
              <input name="iznos" value={form.iznos} onChange={handleChange} />
            </label>
          </div>

          <div className="row">
            <label>
              Svrha uplate
              <input name="svrha" value={form.svrha} onChange={handleChange} placeholder="Unesite svrhu uplate" />
            </label>
            <label>
              Racun primaoca
              <input name="racun" value={form.racun} onChange={handleChange} />
            </label>
          </div>

          <div className="row">
            <label>
              Primalac
              <input name="primalac" value={form.primalac} onChange={handleChange} />
            </label>
            <label>
              Model
              <input value="00" disabled />
            </label>
            <label>
              Poziv na broj
              <input name="pozivNaBroj" value={form.pozivNaBroj} onChange={handleChange} />
            </label>
          </div>

          <div className="row row-3">
            <label>
              Stanje na racunu
              <input name="stanjeNaRacunu" value={form.stanjeNaRacunu} onChange={handleChange} />
            </label>
            <label>
              Vanredni troskovi
              <input name="vanredniTroskovi" value={form.vanredniTroskovi} onChange={handleChange} />
            </label>
            <label>
              Naziv fajla
              <input name="nazivFajla" value={form.nazivFajla} onChange={handleChange} />
            </label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Generišem...' : 'Generiši PDF'}
          </button>
        </form>

        {status && <div className="status">{status}</div>}
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  )
}

export default App
