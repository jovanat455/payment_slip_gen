import express from 'express'
import fs from 'fs'
import path from 'path'

const app = express()
const dataPath = path.join(process.cwd(), 'src', 'dugovanja.txt')

app.use(express.json({ limit: '50mb' }))
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

app.get('/api/dugovanja', (req, res) => {
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Ne mogu da otvorim src/dugovanja.txt' })
    }
    res.type('text/plain').send(data)
  })
})

app.post('/api/save-dugovanja', (req, res) => {
  const { text, filename } = req.body
  if (!text) {
    return res.status(400).json({ error: 'Nema teksta za snimanje' })
  }

  if (filename !== 'dugovanja.txt') {
    return res.status(400).json({ error: 'Snimanje je moguće samo kao dugovanja.txt' })
  }

  fs.writeFile(dataPath, text, 'utf8', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Ne mogu da snimim src/dugovanja.txt' })
    }
    res.json({ saved: true })
  })
})

app.post('/api/save-pdfs', (req, res) => {
  const { folderPath, files } = req.body
  if (!folderPath || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Potrebni su folderPath i lista fajlova.' })
  }

  try {
    const targetDir = path.isAbsolute(folderPath)
      ? path.resolve(folderPath)
      : path.resolve(process.cwd(), folderPath)

    fs.mkdirSync(targetDir, { recursive: true })

    const savedFiles = files.map((file) => {
      const fileName = path.basename(file.name)
      const buffer = Buffer.from(file.data, 'base64')
      const filePath = path.join(targetDir, fileName)
      fs.writeFileSync(filePath, buffer)
      return filePath
    })

    res.json({ saved: true, savedFiles })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ne mogu da sačuvam PDF fajlove na serveru.' })
  }
})

app.get('/api/dodatni-troskovi', (req, res) => {
  const filePath = path.join(process.cwd(), 'src', 'dodatni_troskovi.txt')
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('')
  }
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Ne mogu da otvorim src/dodatni_troskovi.txt' })
    }
    res.type('text/plain').send(data)
  })
})

const port = 3000
app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`)
})
