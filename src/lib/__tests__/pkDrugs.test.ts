import { describe, expect, it } from 'vitest'
import { COMMON_MED_IDS, commonMedNameKey } from '../meds'
import { LANGUAGE_IDS } from '../locale'
import { translate } from '../../locales/messages'
import { PK_DRUGS, PK_DRUG_BY_ID, matchPkDrug, parseMedPkParams, resolvePk } from '../pkDrugs'
import { kaFromTmax, keFromHalfLife } from '../pk'

describe('built-in table integrity', () => {
  it('has unique ids and sane, sourced numbers', () => {
    expect(new Set(PK_DRUGS.map((d) => d.id)).size).toBe(PK_DRUGS.length)
    for (const d of PK_DRUGS) {
      for (const r of [d.halfLifeH, d.tmaxH]) {
        expect(r.typ).toBeGreaterThan(0)
        if (r.min != null) expect(r.min).toBeLessThanOrEqual(r.typ)
        if (r.max != null) expect(r.max).toBeGreaterThanOrEqual(r.typ)
      }
      expect(d.sources.length).toBeGreaterThan(0)
      for (const s of d.sources) {
        expect(s.url).toMatch(/^https:\/\//)
        expect(s.label.length).toBeGreaterThan(3)
      }
      for (const n of Object.values(d.names)) expect(n.trim().length).toBeGreaterThan(0)
      // ka must be solvable for every entry
      expect(kaFromTmax(d.tmaxH.typ, keFromHalfLife(d.halfLifeH.typ))).toBeGreaterThan(0)
    }
  })

  it('spot-checks label values', () => {
    expect(PK_DRUG_BY_ID.sertraline.halfLifeH.typ).toBe(26)
    expect(PK_DRUG_BY_ID.fluoxetine.halfLifeH.typ).toBe(120)
    expect(PK_DRUG_BY_ID.aripiprazole.halfLifeH.typ).toBe(75)
    expect(PK_DRUG_BY_ID.zolpidem.tmaxH.typ).toBe(1.6)
    expect(PK_DRUG_BY_ID['quetiapine-xr'].tmaxH.typ).toBe(6)
  })
})

describe('name matching', () => {
  it.each([
    ['舍曲林', 'sertraline'],
    ['左洛复 50mg', 'sertraline'],
    ['Zoloft', 'sertraline'],
    ['ジェイゾロフト錠25mg', 'sertraline'],
    ['졸로푸트', 'sertraline'],
    ['艾司西酞普蘭', 'escitalopram'],
    ['來士普', 'escitalopram'],
    ['レクサプロ', 'escitalopram'],
    ['百憂解', 'fluoxetine'],
    ['思瑞康', 'quetiapine-ir'],
    ['思瑞康缓释片', 'quetiapine-xr'],
    ['Seroquel XR 50 mg', 'quetiapine-xr'],
    ['ビプレッソ', 'quetiapine-xr'],
    ['怡诺思', 'venlafaxine-xr'],
    ['Venlafaxine IR', 'venlafaxine-ir'],
    ['Wellbutrin SR', 'bupropion-sr'],
    ['安非他酮缓释片', 'bupropion-xl'],
    ['碳酸锂缓释片', 'lithium-er'],
    ['碳酸锂', 'lithium-ir'],
    ['Lithobid', 'lithium-er'],
    ['安定', 'diazepam'],
    ['安定文', 'lorazepam'],
    ['德巴金', 'valproate'],
    ['丙戊酸镁缓释片', 'valproate'],
    ['Xanax XR', 'alprazolam-xr'],
    ['자낙스', 'alprazolam-ir'],
    ['右佐匹克隆', 'eszopiclone'],
    ['佐匹克隆', 'zopiclone'],
    ['Valdoxan', 'agomelatine'],
    ['心达悦', 'vortioxetine'],
  ])('%s → %s', (name, id) => {
    expect(matchPkDrug(name)?.id).toBe(id)
  })

  it('returns null for unknown / supplements', () => {
    expect(matchPkDrug('维生素D')).toBeNull()
    expect(matchPkDrug('Some new med')).toBeNull()
    expect(matchPkDrug('')).toBeNull()
  })

  it('matches every psychiatric quick-pick chip in all six languages', () => {
    const skip = new Set(['melatonin', 'vitaminD', 'vitaminB', 'probiotic'])
    for (const lang of LANGUAGE_IDS) {
      for (const id of COMMON_MED_IDS) {
        if (skip.has(id)) continue
        const name = translate(lang, commonMedNameKey(id))
        const m = matchPkDrug(name)
        expect(m, `${lang}:${name}`).not.toBeNull()
        expect(m!.base ?? m!.id, `${lang}:${name}`).toBe(id)
      }
    }
  })
})

describe('stored params', () => {
  it('parses valid shapes and rejects junk', () => {
    expect(parseMedPkParams(null)).toBeNull()
    expect(parseMedPkParams({ mode: 'builtin', drugId: 'sertraline' })).toEqual({ mode: 'builtin', drugId: 'sertraline' })
    expect(parseMedPkParams({ mode: 'builtin', drugId: 'nope' })).toBeNull()
    expect(parseMedPkParams({ mode: 'custom', halfLifeH: 10 })).toEqual({ mode: 'custom', halfLifeH: 10, tmaxH: null })
    expect(parseMedPkParams({ mode: 'custom', halfLifeH: 10, tmaxH: 3 })).toEqual({ mode: 'custom', halfLifeH: 10, tmaxH: 3 })
    expect(parseMedPkParams({ mode: 'custom', halfLifeH: -1 })).toBeNull()
    expect(parseMedPkParams('x')).toBeNull()
  })

  it('resolves custom > builtin override > auto match > none', () => {
    expect(resolvePk('舍曲林', { mode: 'custom', halfLifeH: 10 })).toMatchObject({ kind: 'custom', halfLifeH: 10, tmaxH: 2, tmaxDefaulted: true })
    expect(resolvePk('舍曲林', { mode: 'builtin', drugId: 'escitalopram' })).toMatchObject({ kind: 'builtin', auto: false })
    const auto = resolvePk('舍曲林', null)
    expect(auto.kind === 'builtin' && auto.drug.id).toBe('sertraline')
    expect(resolvePk('某新药', null).kind).toBe('none')
  })
})
