const { readSheet } = require('read-excel-file/node')

async function readSheetRows(filePath, sheetName = 'Sheet1') {
  const [headerRow = [], ...dataRows] = await readSheet(filePath, sheetName)
  const headers = headerRow.map(value => String(value ?? '').trim())

  return dataRows
    .filter(row => row.some(value => value !== null && value !== undefined && value !== ''))
    .map(row => {
      const record = {}
      headers.forEach((header, index) => {
        if (header) record[header] = row[index] ?? ''
      })
      return record
    })
}

module.exports = { readSheetRows }
