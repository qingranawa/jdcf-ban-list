import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { strToU8, zipSync } from 'fflate'
import { readSheetRows } from '../../scripts/excel-reader'

const temporaryDirectories: string[] = []

const workbookFiles = {
  '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
  '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
  'xl/workbook.xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>'),
  'xl/_rels/workbook.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
  'xl/sharedStrings.xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="0" uniqueCount="0"></sst>'),
  'xl/styles.xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellXfs></styleSheet>'),
  'xl/worksheets/sheet1.xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Nickname</t></is></c><c r="B1" t="inlineStr"><is><t>Steam UserID</t></is></c><c r="C1" t="inlineStr"><is><t>封禁时间</t></is></c><c r="D1" t="inlineStr"><is><t>备注</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Cassie</t></is></c><c r="B2" t="inlineStr"><is><t>76561198000000000@steam</t></is></c><c r="C2"><v>45508</v></c><c r="D2" t="inlineStr"><is><t></t></is></c></row></sheetData></worksheet>'),
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

describe('readSheetRows', () => {
  it('maps Sheet1 headers to values while preserving Excel date serials and blank cells', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'jdcf-excel-reader-'))
    temporaryDirectories.push(directory)
    const filePath = path.join(directory, 'bans.xlsx')
    await writeFile(filePath, Buffer.from(zipSync(workbookFiles)))

    await expect(readSheetRows(filePath)).resolves.toEqual([
      {
        Nickname: 'Cassie',
        'Steam UserID': '76561198000000000@steam',
        封禁时间: 45508,
        备注: '',
      },
    ])
  })
})
