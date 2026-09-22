import { format, parseISO } from 'date-fns'
import { jsPDF } from 'jspdf'
import type { LanguageId } from './locale'
import type { MessageKey } from '../locales/messages'
import { CONTRAST_SCALES, scoreContrastScale, type ContrastBandKey } from './contrastScales'
import type { ContrastResult, ContrastScaleId } from '../types'

type TFn = (key: MessageKey | string, vars?: Record<string, string>) => string

function bandLabel(t: TFn, band: ContrastBandKey): string {
  return t(`contrast.band.${band}` as MessageKey)
}

function scoreLines(
  scaleId: ContrastScaleId,
  scores: Record<string, number>,
  bands: Record<string, ContrastBandKey> | null,
  t: TFn,
): string[] {
  const lines: string[] = []
  if (scaleId === 'dass21') {
    for (const key of ['depression', 'anxiety', 'stress'] as const) {
      const label = t(`contrast.dass.${key}`)
      const band = bands?.[key]
      lines.push(
        `${label}: ${scores[key] ?? 0}${band ? ` (${bandLabel(t, band)})` : ''}`,
      )
    }
    return lines
  }
  if (scaleId === 'who5') {
    lines.push(`${t('contrast.total')}: ${scores.total ?? 0}`)
    lines.push(t('contrast.who5.percent', { pct: String(scores.percent ?? 0) }))
    if (bands?.total) lines.push(bandLabel(t, bands.total))
    return lines
  }
  lines.push(`${t('contrast.total')}: ${scores.total ?? Object.values(scores)[0] ?? '—'}`)
  if (bands?.total) lines.push(bandLabel(t, bands.total))
  return lines
}

function formatDelta(n: number): string {
  if (n > 0) return `+${n}`
  return String(n)
}

export function downloadContrastPdf(opts: {
  result: ContrastResult
  previous: ContrastResult | null
  language: LanguageId
  t: TFn
}): void {
  const { result, previous, language, t } = opts
  const scale = CONTRAST_SCALES[result.scaleId]
  const scored = scoreContrastScale(result.scaleId, result.answers)
  const prevScored = previous
    ? scoreContrastScale(previous.scaleId, previous.answers)
    : null

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  const pageW = doc.internal.pageSize.getWidth()
  const maxW = pageW - margin * 2
  let y = margin

  const write = (text: string, size = 12, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(text, maxW) as string[]
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += size + 6
    }
  }

  write(t('contrast.pdf.title'), 18, 'bold')
  y += 4
  write(scale.name[language], 14, 'bold')
  write(scale.short[language], 11)
  y += 6

  const dateStr = format(parseISO(result.completedAt), 'yyyy-MM-dd HH:mm')
  write(`${t('contrast.pdf.date')}: ${dateStr}`, 12)

  y += 8
  write(t('contrast.pdf.scores'), 13, 'bold')
  for (const line of scoreLines(result.scaleId, scored.scores, scored.bands, t)) {
    write(line, 12)
  }

  if (previous && prevScored) {
    y += 10
    write(t('contrast.compare.title'), 13, 'bold')
    const prevDate = format(parseISO(previous.completedAt), 'yyyy-MM-dd HH:mm')
    write(`${t('contrast.compare.prevDate')}: ${prevDate}`, 12)
    for (const line of scoreLines(previous.scaleId, prevScored.scores, prevScored.bands, t)) {
      write(`${t('contrast.compare.prevLabel')}: ${line}`, 12)
    }

    if (result.scaleId === 'dass21') {
      for (const key of ['depression', 'anxiety', 'stress'] as const) {
        const cur = scored.scores[key] ?? 0
        const prev = prevScored.scores[key] ?? 0
        write(
          `${t(`contrast.dass.${key}`)} Δ: ${formatDelta(cur - prev)}`,
          12,
        )
      }
    } else {
      const cur = scored.scores.total ?? 0
      const prev = prevScored.scores.total ?? 0
      write(`${t('contrast.compare.delta')}: ${formatDelta(cur - prev)}`, 12)
      if (result.scaleId === 'who5') {
        const curP = scored.scores.percent ?? 0
        const prevP = prevScored.scores.percent ?? 0
        write(`${t('contrast.who5.percent', { pct: String(curP) })} (Δ ${formatDelta(curP - prevP)})`, 11)
      }
    }
  }

  y += 14
  write(t('contrast.pdf.disclaimer'), 10)

  const day = format(parseISO(result.completedAt), 'yyyy-MM-dd')
  const scaleTag = result.scaleId.toUpperCase().replace('21', '21')
  const filename = `Thryve-Contrast-${scaleTag}-${day}.pdf`
  doc.save(filename)
}

export function formatScoresBrief(r: ContrastResult): string {
  if (r.scaleId === 'dass21') {
    return `D ${r.scores.depression ?? 0} · A ${r.scores.anxiety ?? 0} · S ${r.scores.stress ?? 0}`
  }
  if (r.scaleId === 'who5') {
    return `${r.scores.total ?? 0} (${r.scores.percent ?? 0}%)`
  }
  return String(r.scores.total ?? Object.values(r.scores)[0] ?? '—')
}
