import type { RegionId } from './locale'

export type CrisisLine = {
  /** tel: / sms: / https: href */
  href: string
  /** Stable key for i18n label lookup */
  labelKey: string
  /** Fallback label (简体) if i18n missing */
  labelFallback: string
  /** Optional hint key */
  hintKey?: string
  hintFallback?: string
  urgent?: boolean
}

export type CrisisRegionBundle = {
  region: RegionId
  emergency: CrisisLine[]
  psych: CrisisLine[]
  /** Extra notes keys (region-specific) */
  noteKeys: string[]
  /** Optional official reference URL */
  refUrl?: string
  refLabelKey?: string
}

/**
 * Verified hotlines only — do not invent numbers.
 * Labels use i18n keys; fallbacks are 简体中文.
 */
export const CRISIS_BY_REGION: Record<RegionId, CrisisRegionBundle> = {
  hk: {
    region: 'hk',
    emergency: [
      {
        href: 'tel:999',
        labelKey: 'crisis.call999',
        labelFallback: '拨打 999',
        hintKey: 'crisis.hintEmergency',
        hintFallback: '紧急服务',
        urgent: true,
      },
    ],
    psych: [
      {
        href: 'tel:28960000',
        labelKey: 'crisis.hk.samaritans',
        labelFallback: '撒玛利亚会 2896 0000',
        hintKey: 'crisis.hint247',
        hintFallback: '24 小时',
      },
      {
        href: 'tel:23892222',
        labelKey: 'crisis.hk.befrienders',
        labelFallback: '生命热线 2389 2222',
        hintKey: 'crisis.hintChinese',
        hintFallback: '中文',
      },
      {
        href: 'tel:23892223',
        labelKey: 'crisis.hk.befriendersEn',
        labelFallback: '生命热线（英文）2389 2223',
        hintKey: 'crisis.hintEnglish',
        hintFallback: 'English',
      },
    ],
    noteKeys: [],
  },
  mo: {
    region: 'mo',
    emergency: [
      {
        href: 'tel:999',
        labelKey: 'crisis.call999',
        labelFallback: '拨打 999',
        hintKey: 'crisis.hintEmergency',
        hintFallback: '紧急服务',
        urgent: true,
      },
    ],
    psych: [
      {
        href: 'tel:28525222',
        labelKey: 'crisis.mo.lifeHopeZh',
        labelFallback: '生命希望热线 2852 5222',
        hintKey: 'crisis.hint247Chinese',
        hintFallback: '中文 · 24 小时',
      },
      {
        href: 'tel:28525777',
        labelKey: 'crisis.mo.lifeHopeEn',
        labelFallback: '生命希望热线（外籍）2852 5777',
        hintKey: 'crisis.hintLimitedHours',
        hintFallback: '时段有限',
      },
    ],
    noteKeys: [],
  },
  cn: {
    region: 'cn',
    emergency: [
      {
        href: 'tel:120',
        labelKey: 'crisis.cn.call120',
        labelFallback: '拨打 120',
        hintKey: 'crisis.cn.hint120',
        hintFallback: '医疗救护（优先）',
        urgent: true,
      },
      {
        href: 'tel:110',
        labelKey: 'crisis.cn.call110',
        labelFallback: '拨打 110',
        hintKey: 'crisis.cn.hint110',
        hintFallback: '需要警方现场救助时',
        urgent: true,
      },
    ],
    psych: [
      {
        href: 'tel:12356',
        labelKey: 'crisis.cn.call12356',
        labelFallback: '拨打 12356',
        hintKey: 'crisis.cn.hint12356',
        hintFallback: '全国统一心理援助热线',
      },
    ],
    noteKeys: ['crisis.cn.note1', 'crisis.cn.note2', 'crisis.cn.note3'],
    refUrl: 'https://www.gov.cn/zhengce/zhengceku/202412/content_6994470.htm',
    refLabelKey: 'crisis.cn.ref',
  },
  tw: {
    region: 'tw',
    emergency: [
      {
        href: 'tel:119',
        labelKey: 'crisis.call119',
        labelFallback: '拨打 119',
        hintKey: 'crisis.hintAmbulanceFire',
        hintFallback: '消防救护',
        urgent: true,
      },
      {
        href: 'tel:110',
        labelKey: 'crisis.call110',
        labelFallback: '拨打 110',
        hintKey: 'crisis.hintPolice',
        hintFallback: '报警',
        urgent: true,
      },
    ],
    psych: [
      {
        href: 'tel:1925',
        labelKey: 'crisis.tw.1925',
        labelFallback: '安心專線 1925',
        hintKey: 'crisis.hint247',
        hintFallback: '24 小时',
      },
    ],
    noteKeys: ['crisis.tw.noteOptional'],
  },
  jp: {
    region: 'jp',
    emergency: [
      {
        href: 'tel:119',
        labelKey: 'crisis.call119',
        labelFallback: '拨打 119',
        hintKey: 'crisis.hintAmbulanceFire',
        hintFallback: '消防救护',
        urgent: true,
      },
      {
        href: 'tel:110',
        labelKey: 'crisis.call110',
        labelFallback: '拨打 110',
        hintKey: 'crisis.hintPolice',
        hintFallback: '报警',
        urgent: true,
      },
    ],
    psych: [
      {
        href: 'tel:0570-064-556',
        labelKey: 'crisis.jp.kokoro',
        labelFallback: 'こころの健康相談統一ダイヤル 0570-064-556',
        hintKey: 'crisis.jp.hintHours',
        hintFallback: '时段因都道府县而异',
      },
    ],
    noteKeys: ['crisis.jp.noteHours'],
  },
  kr: {
    region: 'kr',
    emergency: [
      {
        href: 'tel:119',
        labelKey: 'crisis.call119',
        labelFallback: '拨打 119',
        hintKey: 'crisis.hintAmbulanceFire',
        hintFallback: '消防救护',
        urgent: true,
      },
      {
        href: 'tel:112',
        labelKey: 'crisis.call112',
        labelFallback: '拨打 112',
        hintKey: 'crisis.hintPolice',
        hintFallback: '报警',
        urgent: true,
      },
    ],
    psych: [
      {
        href: 'tel:109',
        labelKey: 'crisis.kr.109',
        labelFallback: '자살예방상담전화 109',
        hintKey: 'crisis.hint247',
        hintFallback: '24 小时',
      },
      {
        href: 'tel:1577-0199',
        labelKey: 'crisis.kr.1577',
        labelFallback: '정신건강 1577-0199',
        hintKey: 'crisis.kr.hintMental',
        hintFallback: '精神健康咨询',
      },
    ],
    noteKeys: [],
  },
  sg: {
    region: 'sg',
    emergency: [
      {
        href: 'tel:995',
        labelKey: 'crisis.sg.call995',
        labelFallback: '拨打 995',
        hintKey: 'crisis.hintAmbulanceFire',
        hintFallback: '救护 / 消防',
        urgent: true,
      },
      {
        href: 'tel:999',
        labelKey: 'crisis.call999',
        labelFallback: '拨打 999',
        hintKey: 'crisis.hintPolice',
        hintFallback: '报警',
        urgent: true,
      },
    ],
    psych: [
      {
        href: 'tel:1767',
        labelKey: 'crisis.sg.sos',
        labelFallback: 'SOS 1767',
        hintKey: 'crisis.hint247',
        hintFallback: '24 小时',
      },
      {
        href: 'https://wa.me/6591511767',
        labelKey: 'crisis.sg.caretext',
        labelFallback: 'WhatsApp CareText 9151 1767',
        hintKey: 'crisis.hintWhatsApp',
        hintFallback: 'WhatsApp 文字支援',
      },
    ],
    noteKeys: [],
  },
  my: {
    region: 'my',
    emergency: [
      {
        href: 'tel:999',
        labelKey: 'crisis.call999',
        labelFallback: '拨打 999',
        hintKey: 'crisis.hintEmergency',
        hintFallback: '紧急服务',
        urgent: true,
      },
    ],
    psych: [
      {
        href: 'tel:+60376272929',
        labelKey: 'crisis.my.befrienders',
        labelFallback: 'Befrienders KL +60 3-7627 2929',
        hintKey: 'crisis.my.hint',
        hintFallback: '吉隆坡倾听热线',
      },
    ],
    noteKeys: [],
  },
  gb: {
    region: 'gb',
    emergency: [
      {
        href: 'tel:999',
        labelKey: 'crisis.call999',
        labelFallback: '拨打 999',
        hintKey: 'crisis.hintEmergency',
        hintFallback: '紧急服务',
        urgent: true,
      },
      {
        href: 'tel:112',
        labelKey: 'crisis.call112',
        labelFallback: '拨打 112',
        hintKey: 'crisis.hintEmergencyEu',
        hintFallback: '紧急服务（欧盟号码）',
        urgent: true,
      },
    ],
    psych: [
      {
        href: 'tel:116123',
        labelKey: 'crisis.gb.samaritans',
        labelFallback: 'Samaritans 116 123',
        hintKey: 'crisis.hintFree247',
        hintFallback: '免费 · 24 小时',
      },
    ],
    noteKeys: [],
  },
  us: {
    region: 'us',
    emergency: [
      {
        href: 'tel:911',
        labelKey: 'crisis.us.call911',
        labelFallback: '拨打 911',
        hintKey: 'crisis.hintEmergency',
        hintFallback: '紧急服务',
        urgent: true,
      },
    ],
    psych: [
      {
        href: 'tel:988',
        labelKey: 'crisis.us.988',
        labelFallback: '988 Suicide & Crisis Lifeline',
        hintKey: 'crisis.us.hint988',
        hintFallback: '可致电或发短信',
      },
    ],
    noteKeys: [],
  },
}
