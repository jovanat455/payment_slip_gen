import { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import { toDataURL } from 'qrcode'
import './App.css'

const initialState = {
  primalac: 'Stambena zajednica Oblakovska 15',
  svrha: 'Račun za 12-26',
  stanjeNaRacunu: '177.385,38',
  vanredniTroskovi: '/',
  racun: '200-3265930101033-58',
  iznos: '1955',
  pozivNaBroj: '',
  uplatioc: '',
  nazivFajla: 'uplatnica',
  racunZa: 'januar 2026. godine',
  pathSacuvavanja: '',
}

const initialBulkState = {
  racunZa: 'mart 2026. godine',
  stanjeNaRacunu: '177.385,38',
  vanredniTroskovi: '/',
  svrha: 'Račun za 12-26',
  folderPath: 'racuni',
  bulkPozivPattern: '0326',
}

const apartmentCount = 11

function App() {
  const [form, setForm] = useState(initialState)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [bulkForm, setBulkForm] = useState(initialBulkState)
  const [mode, setMode] = useState('single')
  const [trackingData, setTrackingData] = useState(() => {
    const saved = window.localStorage.getItem('dugovanja')
    return saved ? JSON.parse(saved) : {}
  })
  const [selectedTracking, setSelectedTracking] = useState({ stan: '1', year: '2025' })
  const [checkedMonths, setCheckedMonths] = useState(Array(12).fill(false))
  const [loadedTrackingFileName, setLoadedTrackingFileName] = useState('dugovanja.txt')
  const [dodatniTroskovi, setDodatniTroskovi] = useState([])
  const backendUrl = 'http://localhost:3000'

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleBulkChange = (event) => {
    const { name, value } = event.target
    setBulkForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleTrackingSelectChange = (event) => {
    const { name, value } = event.target
    setSelectedTracking((prev) => ({ ...prev, [name]: value }))
  }

  const toggleMonth = (index) => {
    setCheckedMonths((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }

  const parseTrackingText = (text) => {
    const nextData = {}
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed) return
      const parts = trimmed.split('|')
      if (parts.length < 3) return
      const [stan, year, values] = parts
      if (!stan || !year || values === undefined) return
      const stanPadded = stan.padStart(2, '0')
      const key = `${stanPadded}|${year}`
      nextData[key] = values.split(',').map((v) => v.trim() === '1')
    })
    return nextData
  }

  const handleTrackingFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const nextData = parseTrackingText(text)
    setTrackingData(nextData)
    window.localStorage.setItem('dugovanja', JSON.stringify(nextData))
    setLoadedTrackingFileName(file.name)
    setStatus(`Učitano ${file.name}.`)
  }

  const parseDodatniTroskovi = (text) => {
    const blocks = text.split('====').map(b => b.trim()).filter(b => b)
    return blocks.map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l)
      const stavka = lines.find(l => l.startsWith('stavka:'))?.split(':')[1]?.trim()
      const stanoviStr = lines.find(l => l.startsWith('stanovi:'))?.split(':')[1]?.trim()
      const stanovi = stanoviStr ? stanoviStr.split(',').map(s => s.trim()) : []
      const trosakStr = lines.find(l => l.startsWith('dodatan trosak:'))?.split(':')[1]?.trim()
      const trosak = Number(trosakStr) || 0
      return { stavka, stanovi, trosak }
    }).filter(item => item.stavka && item.trosak > 0)
  }

  const loadTrackingFromRepo = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/dugovanja`)
      if (!res.ok) {
        throw new Error('Server nije dostupan')
      }
      const text = await res.text()
      const nextData = parseTrackingText(text)
      setTrackingData(nextData)
      window.localStorage.setItem('dugovanja', JSON.stringify(nextData))
      setLoadedTrackingFileName('dugovanja.txt')
      setStatus('Učitano dugovanja iz repo fajla.')
    } catch (err) {
      setError('Ne mogu da učitam src/dugovanja.txt. Pokreni backend.')
    }
  }

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const loadDodatniTroskovi = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/dodatni-troskovi`)
      if (!res.ok) {
        setDodatniTroskovi([])
        return
      }
      const text = await res.text()
      const parsed = parseDodatniTroskovi(text)
      setDodatniTroskovi(parsed)
    } catch {
      setDodatniTroskovi([])
    }
  }

  useEffect(() => {
    loadTrackingFromRepo()
    loadDodatniTroskovi()
  }, [])

  useEffect(() => {
    const stanPadded = selectedTracking.stan.padStart(2, '0')
    const key = `${stanPadded}|${selectedTracking.year}`
    const entry = trackingData[key]
    setCheckedMonths(entry ? entry : Array(12).fill(false))
  }, [selectedTracking, trackingData])

  useEffect(() => {
    const pattern = bulkForm.bulkPozivPattern.trim()
    if (pattern.length === 4) {
      const monthNum = pattern.slice(0, 2)
      const yearShort = pattern.slice(2, 4)
      const monthNames = {
        '01': 'januar',
        '02': 'februar',
        '03': 'mart',
        '04': 'april',
        '05': 'maj',
        '06': 'jun',
        '07': 'jul',
        '08': 'avgust',
        '09': 'septembar',
        '10': 'oktobar',
        '11': 'novembar',
        '12': 'decembar'
      }
      const monthName = monthNames[monthNum]
      if (monthName) {
        const yearFull = `20${yearShort}`
        setBulkForm(prev => ({
          ...prev,
          racunZa: `${monthName} ${yearFull}. godine`,
          svrha: `Račun za ${monthNum}-${yearShort}`
        }))
      }
    }
  }, [bulkForm.bulkPozivPattern])

  const saveTracking = async () => {
    const confirmed = window.confirm('Da li ste sigurni da želite da sačuvate dugovanja?')
    if (!confirmed) return

    const stanPadded = selectedTracking.stan.padStart(2, '0')
    const key = `${stanPadded}|${selectedTracking.year}`
    const nextData = { ...trackingData, [key]: checkedMonths }
    setTrackingData(nextData)
    window.localStorage.setItem('dugovanja', JSON.stringify(nextData))
    const text = Object.entries(nextData)
      .map(([k, v]) => `${k}|${v.map((b) => (b ? '1' : '0')).join(',')}`)
      .join('\n')
    const filename = loadedTrackingFileName || 'dugovanja.txt'

    try {
      const res = await fetch(`${backendUrl}/api/save-dugovanja`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, filename }),
      })

      if (!res.ok) {
        throw new Error('Backend nije dostupan')
      }

      setStatus(`Dugovanja sačuvana u repo fajlu ${filename}.`)
    } catch (err) {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      downloadBlob(blob, filename)
      setStatus(`Dugovanja sačuvana lokalno kao ${filename}.`) 
    }
  }

  const buildQrText = ({ iban, iznos, poziv, primalac, svrha }) => {
    return `K:PR|V:01|C:1|R:${iban}|N:${primalac}|I:RSD${iznos}|SF:289|S:${svrha}|RO:00${poziv}`
  }

  const formatIban = (iban) => {
    const cleaned = iban.replace(/\s|-/g, '').toUpperCase()
    if (cleaned.length >= 20) {
      return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 17) + '-' + cleaned.slice(17)
    }
    return cleaned
  }

  const createInvoiceDoc = async ({ primalac, svrha, stanjeNaRacunu, vanredniTroskovi, racun, iznos, pozivNaBroj, racunZa, trackingData, dodatniTrosak = 0, dodatneStavke = [] }) => {
    const baseAmount = Number(iznos.replace(',', '.'))
    if (Number.isNaN(baseAmount) || baseAmount <= 0) {
      throw new Error('Iznos mora biti pozitivan broj.')
    }

    const amount = baseAmount + dodatniTrosak
    const iznosRsd = amount.toFixed(2).replace('.', ',')
    const iban = racun.replace(/\s|-/g, '').toUpperCase()
    const poziv = pozivNaBroj.trim()
    const qrText = buildQrText({ iban, iznos: iznosRsd, poziv, primalac, svrha })
    const qrDataUrl = await toDataURL(qrText, {
      errorCorrectionLevel: 'Q',
      width: 260,
    })

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    doc.addFont('/fonts/verdana.ttf', 'Verdana', 'normal')
    doc.addFont('/fonts/verdanab.ttf', 'Verdana', 'bold')
    const margin = 36
    const topOffsetX = 25
    const pageWidth = doc.internal.pageSize.getWidth()
    const contentWidth = pageWidth - margin * 2

    doc.setFont('Verdana', 'bold')
    doc.setFontSize(16)
    doc.text('Stambena zajednica OBLAKOVSKA 15', margin + topOffsetX, 50)

    doc.setFont('Verdana', 'normal')
    doc.setFontSize(10)
    let y = 70
    doc.text(`Račun za ${racunZa}`, margin + topOffsetX, y)
    y += 16
    doc.text(`Stanje na računu stambene zajednice: ${stanjeNaRacunu} RSD`, margin + topOffsetX, y)
    y += 16
    doc.text(`Vanredni troškovi u prethodnom mesecu: ${vanredniTroskovi}`, margin + topOffsetX, y)

    y += 26
    doc.setFont('Verdana', 'bold')
    doc.text('Stavke:', margin + topOffsetX, y)

    const tableX = margin + topOffsetX
    const tableY = y + 10
    const tableWidth = contentWidth * 0.5
    const rowHeight = 22
    const col1Width = tableWidth * 0.75
    const stavke = [
      ['Fond za tekuće održavanje zgrade', '1100'],
      ['Čišćenje zgrade', '400'],
      ['Održavanje lifta', '455'],
      ...dodatneStavke.map(s => [s.stavka, s.trosak.toString()])
    ]
    const rows = stavke.length

    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.rect(tableX, tableY, tableWidth, rowHeight * rows)
    doc.line(tableX + col1Width, tableY, tableX + col1Width, tableY + rowHeight * rows)
    for (let i = 1; i <= rows; i += 1) {
      doc.line(tableX, tableY + rowHeight * i, tableX + tableWidth, tableY + rowHeight * i)
    }

    doc.setFont('Verdana', 'normal')
    stavke.forEach((stavka, idx) => {
      doc.text(stavka[0], tableX + 6, tableY + rowHeight * idx + 15)
      doc.text(stavka[1], tableX + col1Width + 8, tableY + rowHeight * idx + 15)
    })

    const formX = margin + (contentWidth * 0.05)
    const formY = tableY + rowHeight * rows + 90
    const formWidth = contentWidth * 0.9
    const formHeight = 260
    doc.setLineWidth(1)
    doc.rect(formX, formY, formWidth, formHeight)

    const leftX = formX + 10
    const leftWidth = 210
    let leftY = formY + 28
    const rightX = formX + leftWidth + 50
    let rightY = formY + 28
    const boxHeight = 22
    const smallBoxWidth = 40
    const amountBoxWidth = 60
    const rowSpacing = 50
    const labelY = leftY
    const boxY = leftY + 6

    doc.setFont('Verdana', 'normal')
    doc.setFontSize(9)
    doc.text('Uplatilac:', leftX, labelY)
    doc.rect(leftX, boxY, leftWidth, boxHeight)

    doc.text('Šifra', rightX, labelY - 10)
    doc.text('placanja', rightX, labelY)
    doc.rect(rightX, boxY, smallBoxWidth, boxHeight)
    doc.setFontSize(10)
    doc.setFont('Verdana', 'bold')
    doc.text('289', rightX + 10, boxY + 14)

    doc.setFont('Verdana', 'normal')
    doc.setFontSize(9)
    doc.text('Valuta', rightX + 50, labelY + 2)
    doc.rect(rightX + 50, boxY, smallBoxWidth, boxHeight)
    doc.setFontSize(10)
    doc.setFont('Verdana', 'bold')
    doc.text('RSD', rightX + 58, boxY + 14)

    doc.setFont('Verdana', 'normal')
    doc.setFontSize(9)
    doc.text('Iznos', rightX + 100, labelY + 2)
    doc.rect(rightX + 100, boxY, amountBoxWidth, boxHeight)
    doc.setFontSize(10)
    doc.setFont('Verdana', 'bold')
    doc.text(`=${iznosRsd}`, rightX + 103, boxY + 14)

    leftY += rowSpacing
    rightY += rowSpacing
    doc.setFont('Verdana', 'normal')
    doc.setFontSize(9)
    doc.text('Svrha uplate:', leftX, leftY)
    doc.rect(leftX, leftY + 4, leftWidth, boxHeight)
    doc.setFontSize(10)
    doc.setFont('Verdana', 'bold')
    doc.text(svrha || '-', leftX + 4, leftY + 16, { maxWidth: leftWidth - 8 })

    doc.setFont('Verdana', 'normal')
    doc.setFontSize(9)
    doc.text('Račun primaoca', rightX, rightY)
    doc.rect(rightX, rightY + 4, 160, boxHeight)
    doc.setFontSize(10)
    doc.setFont('Verdana', 'bold')
    doc.text(racun, rightX + 10, rightY + 16, { maxWidth: 184 })

    leftY += rowSpacing
    rightY += rowSpacing
    doc.setFont('Verdana', 'normal')
    doc.setFontSize(9)
    doc.text('Primalac:', leftX, leftY)
    doc.rect(leftX, leftY + 4, leftWidth, boxHeight)
    doc.setFontSize(10)
    doc.setFont('Verdana', 'bold')
    doc.text(primalac || '-', leftX + 4, leftY + 16, { maxWidth: leftWidth - 8 })

    doc.setFont('Verdana', 'normal')
    doc.setFontSize(9)
    doc.text('Model', rightX, rightY)
    doc.rect(rightX, rightY + 4, 40, boxHeight)
    doc.setFontSize(10)
    doc.setFont('Verdana', 'bold')
    doc.text('00', rightX + 10, rightY + 16)

    const pozivX = rightX + 50
    doc.setFont('Verdana', 'normal')
    doc.setFontSize(9)
    doc.text('poziv na broj', pozivX, rightY)
    doc.rect(pozivX, rightY + 4, 110, boxHeight)
    doc.setFontSize(10)
    doc.setFont('Verdana', 'bold')
    doc.text(poziv || '-', pozivX + 5, rightY + 16, { maxWidth: 112 })

    const qrSize = 90
    const qrX = formX + formWidth - qrSize - 45
    const qrY = formY + formHeight - qrSize - 10
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    doc.setFontSize(8)
    doc.setFont('times', 'normal')
    doc.text('NBS IPS QR', qrX + 10, qrY + qrSize + 2)

    const footerY = formY + formHeight - 50
    doc.setFont('times', 'normal')
    doc.setFontSize(7)
    doc.line(leftX, footerY, leftX + 100, footerY)
    doc.text('pecat i potpis uplatioca', leftX, footerY + 8)
    doc.line(leftX + 110, footerY, leftX + 200, footerY)
    doc.text('mesto i datum prijema', leftX + 110, footerY + 8)
    doc.line(leftX + 210, footerY, leftX + 300, footerY)
    doc.text('datum valute', leftX + 210, footerY + 8)

    // Add debt information if pozivNaBroj is valid
    if (pozivNaBroj && pozivNaBroj.length >= 6) {
      const mm = pozivNaBroj.slice(0, 2)
      const yy = pozivNaBroj.slice(2, 4)
      const ss = pozivNaBroj.slice(4, 6)
      const month = parseInt(mm, 10)
      const year = 2000 + parseInt(yy, 10)
      const stan = parseInt(ss, 10)
      if (month >= 1 && month <= 12 && year >= 2025 && stan >= 1 && stan <= 11) {
        const stanStr = String(stan).padStart(2, '0')
        const unpaid = []
        for (let y = 2025; y <= year; y++) {
          const key = `${stanStr}|${y}`
          const months = trackingData[key]
          if (months) {
            months.forEach((paid, idx) => {
              if (!paid) {
                const m = idx + 1
                const beforeCurrent = y < year || (y === year && m < month)
                if (beforeCurrent) {
                  unpaid.push(`${String(m).padStart(2, '0')}-${y}`)
                }
              }
            })
          }
        }
        let debtY = footerY + 80
        doc.setFont('Verdana', 'bold')
        doc.setFontSize(10)
        if (unpaid.length > 0) {
          const total = unpaid.length * 1955
          doc.text('Neplaćeni racuni:', margin + topOffsetX, debtY)
          debtY += 15
          doc.setFont('Verdana', 'normal')
          doc.setFontSize(9)
          unpaid.forEach(line => {
            doc.text(line, margin + topOffsetX + 10, debtY)
            debtY += 12
          })
          debtY += 10
          doc.setFont('Verdana', 'bold')
          doc.text(`Ukupan dug za neplaćene račune: ${total} dinara`, margin + topOffsetX, debtY)
        } else {
          doc.text('Sva dugovanja za prethodne mesece su izmirena', margin + topOffsetX, debtY)
        }
      }
    }

    return doc
  }

  const handleSingleSubmit = async (event) => {
    event.preventDefault()
    setStatus('')
    setError('')
    setLoading(true)

    try {
      const doc = await createInvoiceDoc({
        primalac: form.primalac,
        svrha: form.svrha,
        stanjeNaRacunu: form.stanjeNaRacunu,
        vanredniTroskovi: form.vanredniTroskovi,
        racun: form.racun,
        iznos: form.iznos,
        pozivNaBroj: form.pozivNaBroj,
        racunZa: form.racunZa,
        trackingData,
      })
      const filename = `${form.nazivFajla.trim() || 'uplatnica'}.pdf`

      if (form.pathSacuvavanja && form.pathSacuvavanja.trim()) {
        const dataUri = doc.output('datauristring')
        const base64 = dataUri.split(',')[1]
        const response = await fetch(`${backendUrl}/api/save-pdfs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderPath: form.pathSacuvavanja.trim(),
            files: [{ name: filename, data: base64 }],
          }),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Ne mogu da sačuvam fajl na serveru.')
        }
        setStatus(`PDF je sačuvan kao ${filename} u ${form.pathSacuvavanja.trim()}.`)
      } else {
        doc.save(filename)
        setStatus(`PDF je generisan i preuzet kao ${filename}.`)
      }
    } catch (submitError) {
      setError(submitError.message || 'Došlo je do greške prilikom generisanja PDF-a.')
    } finally {
      setLoading(false)
    }
  }

const arrayBufferToBase64 = (buffer) => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

const handleBulkSubmit = async (event) => {
  event.preventDefault()
  setStatus('')
  setError('')
  setLoading(true)

  try {
    if (!bulkForm.bulkPozivPattern.trim()) {
      throw new Error('Unesite pattern za poziv na broj.')
    }

    await loadDodatniTroskovi()
    await loadTrackingFromRepo()

    const files = []
    for (let i = 1; i <= apartmentCount; i += 1) {
      const stan = String(i).padStart(2, '0')
      const poziv = `${bulkForm.bulkPozivPattern}${stan}`

      const dodatneZaStan = dodatniTroskovi.filter(dt => dt.stanovi.includes(stan))
      const dodatniTrosak = dodatneZaStan.reduce((sum, dt) => sum + dt.trosak, 0)
      const dodatneStavke = dodatneZaStan.map(dt => ({ stavka: dt.stavka, trosak: dt.trosak }))

      const doc = await createInvoiceDoc({
        primalac: form.primalac,
        svrha: bulkForm.svrha,
        stanjeNaRacunu: bulkForm.stanjeNaRacunu,
        vanredniTroskovi: bulkForm.vanredniTroskovi,
        racun: form.racun,
        iznos: form.iznos,
        pozivNaBroj: poziv,
        racunZa: bulkForm.racunZa,
        trackingData,
        dodatniTrosak,
        dodatneStavke,
      })

      if (bulkForm.folderPath.trim()) {
        const dataUri = doc.output('datauristring')
        const base64 = dataUri.split(',')[1]
        files.push({ name: `racun_stan_${stan}.pdf`, data: base64 })
      } else {
        doc.save(`racun_stan_${stan}.pdf`)
      }
    }

    // Reload tracking data before generating summary
    await loadTrackingFromRepo()

    // Generate summary
    const currentMonth = bulkForm.bulkPozivPattern.slice(0, 2)
    const currentYear = bulkForm.bulkPozivPattern.slice(2, 4)
    const currM = Number(currentMonth)
    const currY = Number(currentYear)
    const summaryLines = []
    summaryLines.push('Dugovanja')
    summaryLines.push('=====================')
    let totalAll = 0
    for (let i = 1; i <= apartmentCount; i += 1) {
      const stan = String(i).padStart(2, '0')
      const unpaidMonths = []
      let totalStan = 0
      Object.keys(trackingData).forEach(key => {
        if (key.startsWith(`${stan}|`)) {
          const [, year] = key.split('|')
          const months = trackingData[key]
          months.forEach((paid, idx) => {
            if (!paid) {
              const month = String(idx + 1).padStart(2, '0')
              const monthKey = `${month}-${year.slice(-2)}`
              const [m, y] = monthKey.split('-').map(Number)
              if (y < currY || (y === currY && m < currM)) {
                unpaidMonths.push(monthKey)
                totalStan += 1955
              }
            }
          })
        }
      })
      unpaidMonths.sort()
      if (unpaidMonths.length === 0) {
        summaryLines.push(`stan ${i}: sve placeno`)
      } else {
        summaryLines.push(`stan ${i}: ${unpaidMonths.join(', ')}; ukupno = ${totalStan} dinara`)
      }
      totalAll += totalStan
    }
    summaryLines.push('')
    summaryLines.push('======================')
    summaryLines.push(`Ukupno dugovanje svih stanara: ${totalAll} dinara`)
    const summaryText = summaryLines.join('\n')

    if (bulkForm.folderPath.trim()) {
      files.push({ name: 'summary.txt', data: btoa(summaryText) })
    } else {
      downloadBlob(new Blob([summaryText], { type: 'text/plain;charset=utf-8' }), 'summary.txt')
    }

    if (bulkForm.folderPath.trim()) {
      const response = await fetch(`${backendUrl}/api/save-pdfs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: bulkForm.folderPath.trim(), files }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ne mogu da sačuvam fajlove na serveru.')
      }
      const result = await response.json()
      setStatus(`Generisano je ${apartmentCount} PDF fajlova i summary.txt fajl sačuvano u ${bulkForm.folderPath.trim()}.`)
    } else {
      setStatus(`Generisano je ${apartmentCount} PDF računa i summary.txt fajl.`)
    }
  } catch (submitError) {
    setError(submitError.message || 'Došlo je do greške prilikom generisanja PDF fajlova.')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="app">
      <div className="card">
        <h1>Generator računa</h1>
        <p>Popunite podatke i kliknite generiši da preuzmete uplatnicu.</p>

        <div className="mode-switch">
          <button type="button" className={mode === 'single' ? 'active' : ''} onClick={() => setMode('single')}>
            Generiši jedan račun
          </button>
          <button type="button" className={mode === 'bulk' ? 'active' : ''} onClick={() => setMode('bulk')}>
            Generiši sve račune
          </button>
          <button type="button" className={mode === 'tracking' ? 'active' : ''} onClick={() => setMode('tracking')}>
            Dugovanja
          </button>
        </div>

        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit}>
            <div className="row row-3">
              <label>
                Račun za
                <input name="racunZa" value={form.racunZa} onChange={handleChange} />
              </label>
              <label>
                Stanje na računu
                <input name="stanjeNaRacunu" value={form.stanjeNaRacunu} onChange={handleChange} />
              </label>
              <label>
                Svrha uplate
                <input name="svrha" value={form.svrha} onChange={handleChange} placeholder="Unesite svrhu uplate" />
              </label>
            </div>

            <div className="row row-split-3">
              <label>
                Poziv na broj
                <input name="pozivNaBroj" value={form.pozivNaBroj} onChange={handleChange} />
              </label>
              <label>
                Vanredni troškovi
                <input name="vanredniTroskovi" value={form.vanredniTroskovi} onChange={handleChange} />
              </label>
            </div>

            <div className="row">
              <label>
                Naziv fajla
                <input name="nazivFajla" value={form.nazivFajla} onChange={handleChange} />
              </label>
              <label>
                Lokacija za čuvanje
                <input name="pathSacuvavanja" value={form.pathSacuvavanja || ''} onChange={handleChange} placeholder="racuni/" />
              </label>
            </div>

            <button type="submit" className="primary-gradient-button" disabled={loading}>
              {loading ? 'Generišem...' : 'Generiši PDF'}
            </button>
          </form>
        ) : mode === 'bulk' ? (
          <form onSubmit={handleBulkSubmit}>
            <div className="row row-3">
              <label>
                Račun za
                <input name="racunZa" value={bulkForm.racunZa} onChange={handleBulkChange} />
              </label>
              <label>
                Stanje na računu
                <input name="stanjeNaRacunu" value={bulkForm.stanjeNaRacunu} onChange={handleBulkChange} />
              </label>
              <label>
                Svrha uplate
                <input name="svrha" value={bulkForm.svrha} onChange={handleBulkChange} placeholder="Unesite svrhu uplate" />
              </label>
            </div>

            <div className="row row-split-3">
              <label>
                Pattern poziva
                <input name="bulkPozivPattern" value={bulkForm.bulkPozivPattern} onChange={handleBulkChange} placeholder="0326" />
              </label>
              <label>
                Vanredni troškovi
                <input name="vanredniTroskovi" value={bulkForm.vanredniTroskovi} onChange={handleBulkChange} />
              </label>
            </div>

            <div className="row row-2">
              <label>
                Lokacija za čuvanje
                <input name="folderPath" value={bulkForm.folderPath} onChange={handleBulkChange} placeholder="racuni/mart2026" />
              </label>
            </div>

            <div className="row">
                <p className="hint">
                  Biće generisano {apartmentCount} računa za stanove 1–{apartmentCount}.
                  Fajlovi će se preuzeti kao <strong>racun_stan_01.pdf</strong>, <strong>racun_stan_02.pdf</strong>...
                </p>
            </div>

            <button type="submit" className="primary-gradient-button" disabled={loading}>
              {loading ? 'Generišem...' : 'Generiši sve račune'}
            </button>
          </form>
        ) : (
          <div>
            <div className="row tracking-row">
              <label>
                Stan
                <select name="stan" value={selectedTracking.stan} onChange={handleTrackingSelectChange}>
                  {Array.from({ length: apartmentCount }, (_, i) => (
                    <option key={i} value={String(i + 1).padStart(2, '0')}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Godina
                <select name="year" value={selectedTracking.year} onChange={handleTrackingSelectChange}>
                  {Array.from({ length: 6 }, (_, i) => 2025 + i).map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <input value={`${selectedTracking.stan} / ${selectedTracking.year}`} disabled />
              </label>
            </div>

            <div className="row tracking-row">
              <label>
                Učitaj iz txt
                <input type="file" accept=".txt" onChange={handleTrackingFileChange} />
              </label>
              <label>
                Učitaj postojeća dugovanja
                <button
                  type="button"
                  className="primary-gradient-button"
                  onClick={loadTrackingFromRepo}
                >
                  Učitaj src/dugovanja.txt
                </button>
              </label>
              <label>
                Fajl
                <input value={loadedTrackingFileName} disabled />
              </label>
            </div>

            <div className="tracking-months">
              {['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'].map((month, index) => (
                <div key={month} className="tracking-month-label">
                  <input
                    type="checkbox"
                    checked={checkedMonths[index]}
                    onChange={() => toggleMonth(index)}
                  />
                  <span>{month}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="primary-gradient-button"
              disabled={loading}
              onClick={saveTracking}
            >
              {loading ? 'Čuvam...' : 'Sačuvaj dugovanja'}
            </button>
          </div>
        )}

        {status && (
          <div className="status">
            <span>{status}</span>
            <button type="button" className="close-btn" onClick={() => setStatus('')}>×</button>
          </div>
        )}
        {error && (
          <div className="error">
            <span>{error}</span>
            <button type="button" className="close-btn" onClick={() => setError('')}>×</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
