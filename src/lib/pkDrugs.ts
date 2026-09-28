/**
 * Built-in PK reference table for common psychiatric medications (血药浓度模拟).
 *
 * Every number below was checked (2026-09-28) against the cited official label /
 * SmPC text. "typ" is the label's stated mean/typical value; where a label gives
 * only a range, typ is the midpoint of that range (marked `midpoint: true`).
 * Values are adult, healthy/typical-patient figures — individuals vary widely.
 */
import type { LanguageId } from './locale'
import type { MedPkParams } from '../types'

export interface PkRange {
  typ: number
  min?: number
  max?: number
  /** typ was derived as the midpoint of a label range (no single mean stated). */
  midpoint?: boolean
}

export interface PkSource {
  label: string
  url: string
}

export type PkNameLang = 'zh-Hans' | 'zh-Hant' | 'en' | 'ja' | 'ko'

export interface PkDrug {
  id: string
  /** Display names; zh-Hant covers both HK and TW. */
  names: Record<PkNameLang, string>
  halfLifeH: PkRange
  tmaxH: PkRange
  sources: PkSource[]
  /** Extra alias strings (generic + brand names, all languages). Display names are always aliases. */
  aliases: string[]
  /** Formulation variant marker: matched when the med name mentions an ER/XR/SR form. */
  form?: 'ir' | 'er' | 'sr' | 'xl'
  /** Base molecule id (for variants). */
  base?: string
  /** i18n key of an extra note (active metabolite, etc.). */
  noteKey?: string
}

const dm = (setid: string, label: string): PkSource => ({
  label,
  url: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setid}`,
})

export const PK_DRUGS: PkDrug[] = [
  // ——— SSRIs ———
  {
    id: 'sertraline',
    names: { 'zh-Hans': '舍曲林', 'zh-Hant': '舍曲林', en: 'Sertraline', ja: 'セルトラリン', ko: '세르트랄린' },
    halfLifeH: { typ: 26 },
    tmaxH: { typ: 6.5, min: 4.5, max: 8.4, midpoint: true },
    sources: [dm('fda754f6-d0f3-4dce-a17a-927d64f912f7', 'FDA label · ZOLOFT (DailyMed)')],
    aliases: ['sertraline', 'zoloft', '左洛复', '左洛復', '樂復得', '乐复得', 'ジェイゾロフト', 'ゾロフト', '서트랄린', '졸로푸트'],
  },
  {
    id: 'escitalopram',
    names: { 'zh-Hans': '艾司西酞普兰', 'zh-Hant': '艾司西酞普蘭', en: 'Escitalopram', ja: 'エスシタロプラム', ko: '에스시탈로프람' },
    halfLifeH: { typ: 30, min: 27, max: 32, midpoint: true },
    tmaxH: { typ: 5 },
    sources: [dm('13bb8267-1cab-43e5-acae-55a4d957630a', 'FDA label · LEXAPRO (DailyMed)')],
    aliases: ['escitalopram', 'lexapro', 'cipralex', '来士普', '來士普', '立普能', 'レクサプロ', '렉사프로'],
  },
  {
    id: 'fluoxetine',
    names: { 'zh-Hans': '氟西汀', 'zh-Hant': '氟西汀', en: 'Fluoxetine', ja: 'フルオキセチン', ko: '플루옥세틴' },
    // Chronic dosing: 4–6 days (acute 1–3 days).
    halfLifeH: { typ: 120, min: 96, max: 144, midpoint: true },
    tmaxH: { typ: 7, min: 6, max: 8, midpoint: true },
    sources: [dm('c88f33ed-6dfb-4c5e-bc01-d8e36dd97299', 'FDA label · PROZAC (DailyMed)')],
    aliases: ['fluoxetine', 'prozac', '百忧解', '百憂解', '프로작', '푸로작'],
    noteKey: 'pk.note.fluoxetine',
  },
  {
    id: 'paroxetine',
    names: { 'zh-Hans': '帕罗西汀', 'zh-Hant': '帕羅西汀', en: 'Paroxetine', ja: 'パロキセチン', ko: '파록세틴' },
    halfLifeH: { typ: 21 },
    tmaxH: { typ: 5.2 },
    sources: [dm('118320de-0632-4139-8b13-7428b41da0ac', 'FDA label · paroxetine tablets (DailyMed)')],
    aliases: ['paroxetine', 'paxil', 'seroxat', '赛乐特', '賽樂特', '克憂果', '乐友', 'パキシル', '팍실', '세로자트'],
  },
  {
    id: 'fluvoxamine',
    names: { 'zh-Hans': '氟伏沙明', 'zh-Hant': '氟伏沙明', en: 'Fluvoxamine', ja: 'フルボキサミン', ko: '플루복사민' },
    halfLifeH: { typ: 15.6 },
    tmaxH: { typ: 5.5, min: 3, max: 8, midpoint: true },
    sources: [dm('0b107225-ed5a-4461-9184-f3f2bad1892f', 'FDA label · fluvoxamine maleate tablets (DailyMed)')],
    aliases: ['fluvoxamine', 'luvox', 'faverin', '兰释', '蘭釋', '無鬱寧', '无郁宁', 'ルボックス', 'デプロメール'],
  },
  {
    id: 'citalopram',
    names: { 'zh-Hans': '西酞普兰', 'zh-Hant': '西酞普蘭', en: 'Citalopram', ja: 'シタロプラム', ko: '시탈로프람' },
    halfLifeH: { typ: 35 },
    tmaxH: { typ: 4 },
    sources: [dm('4259d9b1-de34-43a4-85a8-41dd214e9177', 'FDA label · CELEXA (DailyMed)')],
    aliases: ['citalopram', 'celexa', 'cipramil', '喜普妙'],
  },
  // ——— SNRIs ———
  {
    id: 'venlafaxine-xr',
    base: 'venlafaxine',
    form: 'er',
    names: { 'zh-Hans': '文拉法辛（缓释）', 'zh-Hant': '文拉法辛（緩釋）', en: 'Venlafaxine XR', ja: 'ベンラファキシン（徐放）', ko: '벤라팍신 서방형' },
    halfLifeH: { typ: 5, min: 3, max: 7 },
    tmaxH: { typ: 5.5 },
    sources: [dm('c848a5d8-ba94-4c84-80e3-0bf35fb8e32e', 'FDA label · EFFEXOR XR (DailyMed)')],
    aliases: ['venlafaxine', 'effexor', 'efexor', '文拉法辛', '怡诺思', '怡諾思', '速悅', '速悦', '博乐欣', 'イフェクサー', 'ベンラファキシン', '벤라팍신', '이펙사'],
    noteKey: 'pk.note.venlafaxine',
  },
  {
    id: 'venlafaxine-ir',
    base: 'venlafaxine',
    form: 'ir',
    names: { 'zh-Hans': '文拉法辛（普通片）', 'zh-Hant': '文拉法辛（一般錠）', en: 'Venlafaxine IR', ja: 'ベンラファキシン（速放）', ko: '벤라팍신 속방형' },
    halfLifeH: { typ: 5, min: 3, max: 7 },
    tmaxH: { typ: 2 },
    sources: [dm('c848a5d8-ba94-4c84-80e3-0bf35fb8e32e', 'FDA label · EFFEXOR XR, Table 17 (IR arm) (DailyMed)')],
    aliases: [],
    noteKey: 'pk.note.venlafaxine',
  },
  {
    id: 'desvenlafaxine',
    names: { 'zh-Hans': '去甲文拉法辛', 'zh-Hant': '去甲文拉法辛', en: 'Desvenlafaxine', ja: 'デスベンラファキシン', ko: '데스벤라팍신' },
    halfLifeH: { typ: 11 },
    tmaxH: { typ: 7.5 },
    sources: [{ label: 'Pfizer PRISTIQ prescribing information §5.2', url: 'https://labeling.pfizer.com/ShowLabeling.aspx?id=17826' }],
    aliases: ['desvenlafaxine', 'pristiq', 'プリスティーク', '프리스틱'],
  },
  {
    id: 'duloxetine',
    names: { 'zh-Hans': '度洛西汀', 'zh-Hant': '度洛西汀', en: 'Duloxetine', ja: 'デュロキセチン', ko: '둘록세틴' },
    halfLifeH: { typ: 12, min: 8, max: 17 },
    tmaxH: { typ: 6 },
    sources: [dm('2f7d4d67-10c1-4bf4-a7f2-c185fbad64ba', 'FDA label · CYMBALTA (DailyMed)')],
    aliases: ['duloxetine', 'cymbalta', '欣百达', '欣百達', '千憂解', '千忧解', 'サインバルタ', '심발타'],
    noteKey: 'pk.note.duloxetine',
  },
  // ——— Other antidepressants ———
  {
    id: 'bupropion-xl',
    base: 'bupropion',
    form: 'xl',
    names: { 'zh-Hans': '安非他酮（XL 缓释）', 'zh-Hant': '安非他酮（XL 緩釋）', en: 'Bupropion XL', ja: 'ブプロピオン（XL）', ko: '부프로피온 XL' },
    halfLifeH: { typ: 21, min: 12, max: 30 },
    tmaxH: { typ: 5 },
    sources: [dm('a435da9d-f6e8-4ddc-897d-8cd2bf777b21', 'FDA label · WELLBUTRIN XL (DailyMed)')],
    aliases: ['bupropion', 'wellbutrin', '安非他酮', '丁胺苯丙酮', '威博雋', '威博隽', 'ブプロピオン', '부프로피온', '웰부트린'],
    noteKey: 'pk.note.bupropion',
  },
  {
    id: 'bupropion-sr',
    base: 'bupropion',
    form: 'sr',
    names: { 'zh-Hans': '安非他酮（SR 缓释）', 'zh-Hant': '安非他酮（SR 緩釋）', en: 'Bupropion SR', ja: 'ブプロピオン（SR）', ko: '부프로피온 SR' },
    halfLifeH: { typ: 21, min: 12, max: 30 },
    tmaxH: { typ: 3 },
    sources: [dm('0574b84d-075f-410f-a8eb-86901e307ea2', 'FDA label · bupropion HCl SR tablets (DailyMed)')],
    aliases: [],
    noteKey: 'pk.note.bupropion',
  },
  {
    id: 'mirtazapine',
    names: { 'zh-Hans': '米氮平', 'zh-Hant': '米氮平', en: 'Mirtazapine', ja: 'ミルタザピン', ko: '미르타자핀' },
    halfLifeH: { typ: 30, min: 20, max: 40, midpoint: true },
    tmaxH: { typ: 2 },
    sources: [dm('98ad1917-a094-44f5-a28f-a64a8cfcd887', 'FDA label · REMERON (DailyMed)')],
    aliases: ['mirtazapine', 'remeron', '瑞美隆', '樂活優', '乐活优', 'リフレックス', 'レメロン', '레메론'],
  },
  {
    id: 'agomelatine',
    names: { 'zh-Hans': '阿戈美拉汀', 'zh-Hant': '阿戈美拉汀', en: 'Agomelatine', ja: 'アゴメラチン', ko: '아고멜라틴' },
    halfLifeH: { typ: 1.5, min: 1, max: 2, midpoint: true },
    tmaxH: { typ: 1.5, min: 1, max: 2, midpoint: true },
    sources: [{ label: 'EMA · Valdoxan SmPC §5.2', url: 'https://www.ema.europa.eu/en/documents/product-information/valdoxan-epar-product-information_en.pdf' }],
    aliases: ['agomelatine', 'valdoxan', 'thymanax', '维度新', '維度新'],
  },
  {
    id: 'vortioxetine',
    names: { 'zh-Hans': '伏硫西汀', 'zh-Hant': '伏硫西汀', en: 'Vortioxetine', ja: 'ボルチオキセチン', ko: '보티옥세틴' },
    halfLifeH: { typ: 66 },
    tmaxH: { typ: 9, min: 7, max: 11, midpoint: true },
    sources: [dm('1a5b68e2-14d0-419d-9ec6-1ca97145e838', 'FDA label · TRINTELLIX (DailyMed)')],
    aliases: ['vortioxetine', 'trintellix', 'brintellix', '心达悦', '心達悅', 'トリンテリックス', '브린텔릭스', '트린텔릭스'],
  },
  {
    id: 'trazodone',
    names: { 'zh-Hans': '曲唑酮', 'zh-Hant': '曲唑酮', en: 'Trazodone', ja: 'トラゾドン', ko: '트라조돈' },
    halfLifeH: { typ: 9, min: 5, max: 13, midpoint: true },
    tmaxH: { typ: 1 },
    sources: [
      { label: 'UK SmPC · Molipaxin §5.2 (half-life)', url: 'https://www.medicines.org.uk/emc/product/4196/smpc' },
      dm('007f38e0-653b-43e4-a1c1-b59997b2762a', 'FDA label · trazodone HCl tablets (Tmax, fasting; ~2 h with food)'),
    ],
    aliases: ['trazodone', 'desyrel', 'trittico', 'molipaxin', '美时玉', '美時玉', '美舒鬱', '美舒郁', 'デジレル', 'レスリン', '트리티코'],
  },
  // ——— Antipsychotics ———
  {
    id: 'quetiapine-ir',
    base: 'quetiapine',
    form: 'ir',
    names: { 'zh-Hans': '喹硫平（普通片）', 'zh-Hant': '喹硫平（一般錠）', en: 'Quetiapine IR', ja: 'クエチアピン（速放）', ko: '쿠에티아핀 속방형' },
    halfLifeH: { typ: 6 },
    tmaxH: { typ: 1.5 },
    sources: [dm('0584dda8-bc3c-48fe-1a90-79608f78e8a0', 'FDA label · SEROQUEL (DailyMed)')],
    aliases: ['quetiapine', 'seroquel', '喹硫平', '思瑞康', '思樂康', '思乐康', 'セロクエル', 'クエチアピン', '쿠에티아핀', '쎄로켈', '세로켈'],
  },
  {
    id: 'quetiapine-xr',
    base: 'quetiapine',
    form: 'er',
    names: { 'zh-Hans': '喹硫平（缓释）', 'zh-Hant': '喹硫平（緩釋）', en: 'Quetiapine XR', ja: 'クエチアピン（徐放）', ko: '쿠에티아핀 서방형' },
    halfLifeH: { typ: 7 },
    tmaxH: { typ: 6 },
    sources: [dm('473a3ac4-67f4-4782-baa9-7f9bdd8761f4', 'FDA label · SEROQUEL XR (DailyMed)')],
    aliases: ['ビプレッソ'],
    noteKey: 'pk.note.quetiapineXr',
  },
  {
    id: 'olanzapine',
    names: { 'zh-Hans': '奥氮平', 'zh-Hant': '奧氮平', en: 'Olanzapine', ja: 'オランザピン', ko: '올란자핀' },
    halfLifeH: { typ: 30, min: 21, max: 54 },
    tmaxH: { typ: 6 },
    sources: [dm('b418946a-1ab4-4d89-a012-d94fc361a3c4', 'FDA label · ZYPREXA (DailyMed)')],
    aliases: ['olanzapine', 'zyprexa', '再普乐', '再普樂', '金普薩', '金普萨', '欧兰宁', 'ジプレキサ', '자이프렉사'],
  },
  {
    id: 'aripiprazole',
    names: { 'zh-Hans': '阿立哌唑', 'zh-Hant': '阿立哌唑', en: 'Aripiprazole', ja: 'アリピプラゾール', ko: '아리피프라졸' },
    halfLifeH: { typ: 75 },
    tmaxH: { typ: 4, min: 3, max: 5, midpoint: true },
    sources: [dm('c040bd1d-45b7-49f2-93ea-aed7220b30ac', 'FDA label · ABILIFY (DailyMed)')],
    aliases: ['aripiprazole', 'abilify', '安律凡', '博思清', '安立復', '安立复', 'エビリファイ', '아빌리파이'],
    noteKey: 'pk.note.aripiprazole',
  },
  {
    id: 'risperidone',
    names: { 'zh-Hans': '利培酮', 'zh-Hant': '利培酮', en: 'Risperidone', ja: 'リスペリドン', ko: '리스페리돈' },
    // Active moiety (risperidone + 9-hydroxyrisperidone) overall half-life ~20 h.
    halfLifeH: { typ: 20 },
    // 9-hydroxyrisperidone peaks ~3 h (parent ~1 h) in extensive metabolizers.
    tmaxH: { typ: 3 },
    sources: [dm('7e117c7e-02fc-4343-92a1-230061dfc5e0', 'FDA label · RISPERDAL (DailyMed)')],
    aliases: ['risperidone', 'risperdal', '维思通', '維思通', '理斯必妥', 'リスパダール', '리스페달'],
    noteKey: 'pk.note.risperidone',
  },
  {
    id: 'lurasidone',
    names: { 'zh-Hans': '鲁拉西酮', 'zh-Hant': '魯拉西酮', en: 'Lurasidone', ja: 'ルラシドン', ko: '루라시돈' },
    halfLifeH: { typ: 18 },
    tmaxH: { typ: 2, min: 1, max: 3, midpoint: true },
    sources: [dm('afad3051-9df2-4c54-9684-e8262a133af8', 'FDA label · LATUDA (DailyMed)')],
    aliases: ['lurasidone', 'latuda', '罗舒达', '羅舒達', 'ラツーダ', '라투다'],
  },
  // ——— Mood stabilizers ———
  {
    id: 'lithium-ir',
    base: 'lithium',
    form: 'ir',
    names: { 'zh-Hans': '碳酸锂（普通片）', 'zh-Hant': '碳酸鋰（一般錠）', en: 'Lithium carbonate IR', ja: '炭酸リチウム（速放）', ko: '탄산리튬 속방형' },
    halfLifeH: { typ: 24, min: 18, max: 36 },
    tmaxH: { typ: 1.5, min: 0.25, max: 3, midpoint: true },
    sources: [
      dm('04518b80-7563-4544-bf05-04f286223faa', 'FDA label · lithium carbonate capsules (DailyMed)'),
      dm('1b65d27e-5086-4a87-8387-c49f3d060978', 'FDA label · lithium carbonate ER tablets (≈24 h)'),
    ],
    aliases: ['lithium', 'priadel', 'camcolit', '碳酸锂', '碳酸鋰', '锂盐', '鋰鹽', '炭酸リチウム', 'リーマス', '탄산리튬', '리튬'],
    noteKey: 'pk.note.lithium',
  },
  {
    id: 'lithium-er',
    base: 'lithium',
    form: 'er',
    names: { 'zh-Hans': '碳酸锂（缓释）', 'zh-Hant': '碳酸鋰（緩釋）', en: 'Lithium carbonate ER', ja: '炭酸リチウム（徐放）', ko: '탄산리튬 서방형' },
    halfLifeH: { typ: 24, min: 18, max: 36 },
    tmaxH: { typ: 4, min: 2, max: 6, midpoint: true },
    sources: [
      dm('04518b80-7563-4544-bf05-04f286223faa', 'FDA label · lithium carbonate (Tmax of SR forms) (DailyMed)'),
      dm('1b65d27e-5086-4a87-8387-c49f3d060978', 'FDA label · lithium carbonate ER tablets (DailyMed)'),
    ],
    aliases: ['lithobid', 'eskalith'],
    noteKey: 'pk.note.lithium',
  },
  {
    id: 'lamotrigine',
    names: { 'zh-Hans': '拉莫三嗪', 'zh-Hant': '拉莫三嗪', en: 'Lamotrigine', ja: 'ラモトリギン', ko: '라모트리진' },
    // Multiple-dose, healthy volunteers, no interacting drugs.
    halfLifeH: { typ: 25.4, min: 11.6, max: 61.6 },
    tmaxH: { typ: 1.7, min: 0.5, max: 4 },
    sources: [dm('d7e3572d-56fe-4727-2bb4-013ccca22678', 'FDA label · LAMICTAL, Table 14 (DailyMed)')],
    aliases: ['lamotrigine', 'lamictal', '利必通', 'ラミクタール', '라믹탈'],
    noteKey: 'pk.note.lamotrigine',
  },
  {
    id: 'valproate',
    names: { 'zh-Hans': '丙戊酸盐', 'zh-Hant': '丙戊酸鹽', en: 'Valproate', ja: 'バルプロ酸', ko: '발프로산' },
    halfLifeH: { typ: 12.5, min: 9, max: 16, midpoint: true },
    // Delayed-release tablet, fasting (≈8 h with food).
    tmaxH: { typ: 4 },
    sources: [dm('08a65cf4-7749-4ceb-6895-8f4805e2b01f', 'FDA label · DEPAKOTE (DailyMed)')],
    aliases: ['valproate', 'valproic', 'divalproex', 'depakote', 'depakine', 'epilim', '丙戊酸', '德巴金', '帝拔癲', '帝拔癫', 'デパケン', 'セレニカ', '데파코트', '데파킨'],
    noteKey: 'pk.note.valproate',
  },
  // ——— Benzodiazepines / Z-drugs / anxiolytics ———
  {
    id: 'alprazolam-ir',
    base: 'alprazolam',
    form: 'ir',
    names: { 'zh-Hans': '阿普唑仑', 'zh-Hant': '阿普唑侖', en: 'Alprazolam', ja: 'アルプラゾラム', ko: '알프라졸람' },
    halfLifeH: { typ: 11.2, min: 6.3, max: 26.9 },
    tmaxH: { typ: 1.5, min: 1, max: 2, midpoint: true },
    sources: [dm('bb5cf72e-3a41-41a8-9a38-80f974eca33f', 'FDA label · XANAX (DailyMed)')],
    aliases: ['alprazolam', 'xanax', '佳静安定', '贊安諾', '赞安诺', 'ソラナックス', 'コンスタン', '자낙스'],
  },
  {
    id: 'alprazolam-xr',
    base: 'alprazolam',
    form: 'er',
    names: { 'zh-Hans': '阿普唑仑（缓释）', 'zh-Hant': '阿普唑侖（緩釋）', en: 'Alprazolam XR', ja: 'アルプラゾラム（徐放）', ko: '알프라졸람 서방형' },
    halfLifeH: { typ: 13.3, min: 10.7, max: 15.8, midpoint: true },
    tmaxH: { typ: 10 },
    sources: [dm('c8990714-c2f5-4b0c-9f1c-91d77156d962', 'FDA label · XANAX XR (DailyMed)')],
    aliases: [],
  },
  {
    id: 'lorazepam',
    names: { 'zh-Hans': '劳拉西泮', 'zh-Hant': '勞拉西泮', en: 'Lorazepam', ja: 'ロラゼパム', ko: '로라제팜' },
    halfLifeH: { typ: 12 },
    tmaxH: { typ: 2 },
    sources: [dm('89057c93-8155-4040-acec-64e877bd2b4c', 'FDA label · ATIVAN (DailyMed)')],
    aliases: ['lorazepam', 'ativan', '罗拉', '蘿拉西泮', '安定文', 'ワイパックス', '아티반'],
  },
  {
    id: 'clonazepam',
    names: { 'zh-Hans': '氯硝西泮', 'zh-Hant': '氯硝西泮', en: 'Clonazepam', ja: 'クロナゼパム', ko: '클로나제팜' },
    halfLifeH: { typ: 35, min: 30, max: 40, midpoint: true },
    tmaxH: { typ: 2.5, min: 1, max: 4, midpoint: true },
    sources: [dm('cfa0d79a-843c-4b88-95a1-e9511d649ca1', 'FDA label · KLONOPIN (DailyMed)')],
    aliases: ['clonazepam', 'klonopin', 'rivotril', '氯硝安定', '利福全', 'リボトリール', 'ランドセン', '리보트릴'],
  },
  {
    id: 'diazepam',
    names: { 'zh-Hans': '地西泮', 'zh-Hant': '地西泮', en: 'Diazepam', ja: 'ジアゼパム', ko: '디아제팜' },
    // UK SmPC: terminal phase 1–2 days; FDA: up to 48 h.
    halfLifeH: { typ: 36, min: 24, max: 48, midpoint: true },
    tmaxH: { typ: 1.25, min: 1, max: 1.5, midpoint: true },
    sources: [
      dm('554baee5-b171-4452-a50a-41a0946f956c', 'FDA label · VALIUM (DailyMed)'),
      { label: 'UK SmPC · Diazepam 10 mg tablets §5.2', url: 'https://www.medicines.org.uk/emc/product/101913/smpc' },
    ],
    aliases: ['diazepam', 'valium', '安定', '煩寧', '烦宁', 'セルシン', 'ホリゾン', '바리움'],
    noteKey: 'pk.note.diazepam',
  },
  {
    id: 'zolpidem',
    names: { 'zh-Hans': '唑吡坦', 'zh-Hant': '唑吡坦', en: 'Zolpidem', ja: 'ゾルピデム', ko: '졸피뎀' },
    halfLifeH: { typ: 2.5, min: 1.4, max: 4.5 },
    tmaxH: { typ: 1.6 },
    sources: [dm('c36cadf4-65a4-4466-b409-c82020b42452', 'FDA label · AMBIEN (DailyMed)')],
    aliases: ['zolpidem', 'ambien', 'stilnox', '思诺思', '思諾思', '使蒂諾斯', '使蒂诺斯', 'マイスリー', '스틸녹스'],
  },
  {
    id: 'zopiclone',
    names: { 'zh-Hans': '佐匹克隆', 'zh-Hant': '佐匹克隆', en: 'Zopiclone', ja: 'ゾピクロン', ko: '조피클론' },
    halfLifeH: { typ: 5 },
    tmaxH: { typ: 1.75, min: 1.5, max: 2, midpoint: true },
    sources: [{ label: 'UK SmPC · Zimovane §5.2', url: 'https://www.medicines.org.uk/emc/product/2855/smpc' }],
    aliases: ['zopiclone', 'imovane', 'zimovane', '忆梦返', '憶夢返', 'アモバン', '조피클론'],
  },
  {
    id: 'eszopiclone',
    names: { 'zh-Hans': '右佐匹克隆', 'zh-Hant': '右佐匹克隆', en: 'Eszopiclone', ja: 'エスゾピクロン', ko: '에스조피클론' },
    halfLifeH: { typ: 6 },
    tmaxH: { typ: 1 },
    sources: [dm('3821f4b7-a3c8-4920-ba80-18aa96532c09', 'FDA label · LUNESTA (DailyMed)')],
    aliases: ['eszopiclone', 'lunesta', 'ルネスタ', '루네스타'],
  },
  {
    id: 'buspirone',
    names: { 'zh-Hans': '丁螺环酮', 'zh-Hant': '丁螺環酮', en: 'Buspirone', ja: 'ブスピロン', ko: '부스피론' },
    halfLifeH: { typ: 2.5, min: 2, max: 3, midpoint: true },
    tmaxH: { typ: 1, min: 0.67, max: 1.5 },
    sources: [dm('02628a0c-bfdb-4a58-8e48-bcd8ca12d53b', 'FDA label · buspirone HCl tablets (DailyMed)')],
    aliases: ['buspirone', 'buspar'],
  },
]

export const PK_DRUG_BY_ID: Record<string, PkDrug> = Object.fromEntries(PK_DRUGS.map((d) => [d.id, d]))

export function pkNameLang(language: LanguageId): PkNameLang {
  if (language === 'zh-Hant-HK' || language === 'zh-Hant-TW') return 'zh-Hant'
  return language
}

export function pkDrugName(drug: PkDrug, language: LanguageId): string {
  return drug.names[pkNameLang(language)]
}

/** Normalize a medication name for matching (case, width, spaces, punctuation, strengths). */
export function normalizeMedName(raw: string): string {
  return raw
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\d+(\.\d+)?\s*(mg|毫克|μg|mcg|g|ml|片|粒|颗|顆|錠|정|캡슐)/g, ' ')
    .replace(/[\s·・,，、.。()（）[\]【】\-_/+®™]+/g, '')
}

const FORM_PATTERNS: Array<{ form: NonNullable<PkDrug['form']>; re: RegExp }> = [
  { form: 'xl', re: /\bxl\b|ＸＬ/i },
  { form: 'sr', re: /\bsr\b/i },
  { form: 'er', re: /\b(xr|er|cr|pr|la|xro|xl)\b|缓释|緩釋|控释|控釋|持續|持续|長效|长效|徐放|서방|extended|prolonged|chrono/i },
]

function detectForm(raw: string): PkDrug['form'] | undefined {
  const s = raw.normalize('NFKC')
  for (const { form, re } of FORM_PATTERNS) if (re.test(s)) return form
  return undefined
}

/** Default variant when a molecule has several and the name doesn't say. */
const DEFAULT_VARIANT: Record<string, string> = {
  venlafaxine: 'venlafaxine-xr',
  bupropion: 'bupropion-xl',
  quetiapine: 'quetiapine-ir',
  lithium: 'lithium-ir',
  alprazolam: 'alprazolam-ir',
}

function pickVariant(base: string, form: PkDrug['form'] | undefined): PkDrug | undefined {
  const variants = PK_DRUGS.filter((d) => d.base === base)
  if (!variants.length) return undefined
  if (form) {
    const exact = variants.find((v) => v.form === form)
    if (exact) return exact
    // XL/SR asked for a molecule that only has IR/ER: treat as ER.
    if (form !== 'ir') {
      const er = variants.find((v) => v.form === 'er' || v.form === 'xl' || v.form === 'sr')
      if (er) return er
    }
  }
  return PK_DRUG_BY_ID[DEFAULT_VARIANT[base]] ?? variants[0]
}

/**
 * Match a free-text medication name (any of the six UI languages, generic or brand)
 * to a built-in drug. Longest alias wins; ER/XR/SR/XL markers pick the formulation.
 */
export function matchPkDrug(name: string): PkDrug | null {
  const norm = normalizeMedName(name)
  if (!norm) return null
  let best: { drug: PkDrug; len: number } | null = null
  for (const drug of PK_DRUGS) {
    const cands = [...drug.aliases, ...Object.values(drug.names)]
    for (const a of cands) {
      const an = normalizeMedName(a)
      if (an.length < 2) continue
      if (norm.includes(an) && (!best || an.length > best.len)) best = { drug, len: an.length }
    }
  }
  if (!best) return null
  const { drug } = best
  if (drug.base) {
    // Generic/brand aliases live on the molecule's default variant; an explicit
    // ER/XR/SR/XL marker in the name selects the formulation.
    const form = detectForm(name)
    if (form) return pickVariant(drug.base, form) ?? drug
  }
  return drug
}

/** Validate the jsonb read from Supabase. Unknown shapes → null (auto). */
export function parseMedPkParams(raw: unknown): MedPkParams | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.mode === 'builtin' && typeof o.drugId === 'string' && PK_DRUG_BY_ID[o.drugId]) {
    return { mode: 'builtin', drugId: o.drugId }
  }
  if (o.mode === 'custom') {
    const h = Number(o.halfLifeH)
    if (!(h > 0 && h <= 24 * 60)) return null
    const tRaw = o.tmaxH
    const t = tRaw == null || tRaw === '' ? null : Number(tRaw)
    return { mode: 'custom', halfLifeH: h, tmaxH: t != null && t > 0 && t <= 72 ? t : null }
  }
  return null
}

/** Default Tmax (h) when the user enters only a half-life. */
export const DEFAULT_CUSTOM_TMAX_H = 2

export type ResolvedPk =
  | { kind: 'builtin'; drug: PkDrug; auto: boolean; halfLifeH: number; tmaxH: number }
  | { kind: 'custom'; halfLifeH: number; tmaxH: number; tmaxDefaulted: boolean }
  | { kind: 'none' }

export function resolvePk(name: string, params: MedPkParams | null | undefined): ResolvedPk {
  if (params?.mode === 'custom') {
    const tmax = params.tmaxH && params.tmaxH > 0 ? params.tmaxH : null
    return {
      kind: 'custom',
      halfLifeH: params.halfLifeH,
      tmaxH: tmax ?? DEFAULT_CUSTOM_TMAX_H,
      tmaxDefaulted: tmax == null,
    }
  }
  if (params?.mode === 'builtin') {
    const d = PK_DRUG_BY_ID[params.drugId]
    if (d) return { kind: 'builtin', drug: d, auto: false, halfLifeH: d.halfLifeH.typ, tmaxH: d.tmaxH.typ }
  }
  const m = matchPkDrug(name)
  if (m) return { kind: 'builtin', drug: m, auto: true, halfLifeH: m.halfLifeH.typ, tmaxH: m.tmaxH.typ }
  return { kind: 'none' }
}
