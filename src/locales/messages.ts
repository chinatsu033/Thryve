import type { LanguageId } from '../lib/locale'

export type MessageKey = keyof typeof zhHans

const zhHans = {
  // Onboarding — region
  'onboarding.region.title': '选择地区',
  'onboarding.region.sub': '用于显示当地紧急求助信息',
  'onboarding.region.continue': '下一步',
  'onboarding.region.mapHint': '滑动选择你所在的地区',

  // Onboarding — language
  'onboarding.language.title': '选择语言',
  'onboarding.language.sub': '界面与求助页将尽量使用此语言',
  'onboarding.language.finish': '完成',
  'onboarding.language.continue': '继续',

  // Settings locale
  'settings.locale.title': '地区与语言',
  'settings.locale.region': '地区',
  'settings.locale.language': '语言',
  'settings.locale.changeRegion': '更改地区',
  'settings.locale.changeLanguage': '更改语言',
  'settings.crisis.blurb': '急救与心理援助热线（无需登录亦可打开）。若处于立即危险，请优先拨打当地紧急号码。',
  'settings.crisis.open': '打开紧急求助页',

  // Crisis common
  'crisis.title': '紧急求助',
  'crisis.sub': '{region} · 心理援助与急救指引',
  'crisis.urgentTitle': '立即危险时请先急救',
  'crisis.urgentLead':
    '若已自伤受伤、意识异常、持有危险物品，或生命安全受到威胁：请优先拨打当地紧急号码。心理热线不能替代急救调度。',
  'crisis.psychTitle': '心理援助热线',
  'crisis.psychLead': '需要倾听、疏导或危机干预时，可联系下列热线。',
  'crisis.tipsTitle': '此刻可做的事',
  'crisis.tip1': '尽量离开危险环境，把手边危险物品放到安全处。',
  'crisis.tip2': '找一位可信任的人陪同，或请对方帮你拨打电话。',
  'crisis.tip3': '做几次缓慢深呼吸：吸气 4 秒，呼气 6 秒。',
  'crisis.tip4': '若暂时无法开口，也可先拨通热线，听对方引导。',
  'crisis.disclaimer':
    'Thryve / 本页不是急救或医疗诊断服务，不能替代专业医疗与现场救助。所列号码可能变更，请以当地官方为准。',
  'crisis.changeRegion': '更换地区',
  'crisis.currentRegion': '当前地区：{region}',

  // Shared dial labels
  'crisis.call999': '拨打 999',
  'crisis.call119': '拨打 119',
  'crisis.call110': '拨打 110',
  'crisis.call112': '拨打 112',
  'crisis.hintEmergency': '紧急服务',
  'crisis.hintEmergencyEu': '紧急服务（欧盟号码）',
  'crisis.hintAmbulanceFire': '消防救护',
  'crisis.hintPolice': '报警',
  'crisis.hint247': '24 小时',
  'crisis.hintFree247': '免费 · 24 小时',
  'crisis.hintChinese': '中文',
  'crisis.hintEnglish': 'English',
  'crisis.hint247Chinese': '中文 · 24 小时',
  'crisis.hintLimitedHours': '时段有限',
  'crisis.hintWhatsApp': 'WhatsApp 文字支援',

  // HK
  'crisis.hk.samaritans': '撒玛利亚会 2896 0000',
  'crisis.hk.befrienders': '生命热线 2389 2222',
  'crisis.hk.befriendersEn': '生命热线（英文）2389 2223',

  // MO
  'crisis.mo.lifeHopeZh': '生命希望热线 2852 5222',
  'crisis.mo.lifeHopeEn': '生命希望热线（外籍）2852 5777',

  // CN
  'crisis.cn.call120': '拨打 120',
  'crisis.cn.call110': '拨打 110',
  'crisis.cn.hint120': '医疗救护（优先）',
  'crisis.cn.hint110': '需要警方现场救助时',
  'crisis.cn.call12356': '拨打 12356',
  'crisis.cn.hint12356': '全国统一心理援助热线',
  'crisis.cn.psychLead':
    '需要倾听、疏导或危机干预时，可拨打全国统一心理援助热线（国家卫健委协调工信部设置；2025 年 5 月 1 日起全国 31 省区市开通；俗称「没事儿」热线）。',
  'crisis.cn.note1': '各地服务时段可能不同（部分 24 小时），以当地接通为准。',
  'crisis.cn.note2': '省内一般可直拨；部分地区可加拨区号接入指定城市坐席。',
  'crisis.cn.note3': '热线可与 110 / 120 联动，但若你本人正处立即危险，仍应直接拨打 120 / 110。',
  'crisis.cn.ref': '中国政府网相关通知',

  // TW (台湾地区)
  'crisis.tw.1925': '安心專線 1925',
  'crisis.tw.noteOptional': '亦可参考：生命線 1995、張老師 1980。',

  // JP
  'crisis.jp.kokoro': 'こころの健康相談統一ダイヤル 0570-064-556',
  'crisis.jp.hintHours': '时段因都道府县而异',
  'crisis.jp.noteHours': '服务时段因都道府县而异，请以当地接通为准。',

  // KR
  'crisis.kr.109': '자살예방상담전화 109',
  'crisis.kr.1577': '정신건강 1577-0199',
  'crisis.kr.hintMental': '精神健康咨询',

  // SG
  'crisis.sg.call995': '拨打 995',
  'crisis.sg.sos': 'SOS 1767',
  'crisis.sg.caretext': 'WhatsApp CareText 9151 1767',

  // MY
  'crisis.my.befrienders': 'Befrienders KL +60 3-7627 2929',
  'crisis.my.hint': '吉隆坡倾听热线',

  // GB
  'crisis.gb.samaritans': 'Samaritans 116 123',

  // US
  'crisis.us.call911': '拨打 911',
  'crisis.us.988': '988 Suicide & Crisis Lifeline',
  'crisis.us.hint988': '可致电或发短信',
} as const

const en: Record<MessageKey, string> = {
  'onboarding.region.title': 'Choose your region',
  'onboarding.region.sub': 'Used for local crisis resources',
  'onboarding.region.continue': 'Continue',
  'onboarding.region.mapHint': 'Scroll to select your region',

  'onboarding.language.title': 'Choose language',
  'onboarding.language.sub': 'Crisis help and key screens will use this language',
  'onboarding.language.finish': 'Done',
  'onboarding.language.continue': 'Continue',

  'settings.locale.title': 'Region & language',
  'settings.locale.region': 'Region',
  'settings.locale.language': 'Language',
  'settings.locale.changeRegion': 'Change region',
  'settings.locale.changeLanguage': 'Change language',
  'settings.crisis.blurb':
    'Emergency and mental-health hotlines (open without signing in). If you are in immediate danger, call local emergency services first.',
  'settings.crisis.open': 'Open crisis help',

  'crisis.title': 'Crisis help',
  'crisis.sub': '{region} · Emergency & mental health resources',
  'crisis.urgentTitle': 'If you are in immediate danger',
  'crisis.urgentLead':
    'If you are injured, unsafe, or at risk of harm: call local emergency services first. Helplines cannot dispatch ambulances.',
  'crisis.psychTitle': 'Mental health helplines',
  'crisis.psychLead': 'For listening, support, or crisis intervention, try the lines below.',
  'crisis.tipsTitle': 'Things you can try right now',
  'crisis.tip1': 'Move away from danger and put harmful items somewhere safe.',
  'crisis.tip2': 'Reach out to someone you trust, or ask them to call with you.',
  'crisis.tip3': 'Try slow breaths: inhale 4 seconds, exhale 6 seconds.',
  'crisis.tip4': 'If speaking is hard, you can still dial and listen.',
  'crisis.disclaimer':
    'Thryve is not emergency or medical diagnosis services. Numbers may change; check official sources.',
  'crisis.changeRegion': 'Change region',
  'crisis.currentRegion': 'Current region: {region}',

  'crisis.call999': 'Call 999',
  'crisis.call119': 'Call 119',
  'crisis.call110': 'Call 110',
  'crisis.call112': 'Call 112',
  'crisis.hintEmergency': 'Emergency services',
  'crisis.hintEmergencyEu': 'Emergency (EU number)',
  'crisis.hintAmbulanceFire': 'Ambulance / fire',
  'crisis.hintPolice': 'Police',
  'crisis.hint247': '24/7',
  'crisis.hintFree247': 'Free · 24/7',
  'crisis.hintChinese': 'Chinese',
  'crisis.hintEnglish': 'English',
  'crisis.hint247Chinese': 'Chinese · 24/7',
  'crisis.hintLimitedHours': 'Limited hours',
  'crisis.hintWhatsApp': 'WhatsApp text support',

  'crisis.hk.samaritans': 'Samaritans Hong Kong 2896 0000',
  'crisis.hk.befrienders': 'Samaritan Befrienders HK 2389 2222',
  'crisis.hk.befriendersEn': 'Samaritan Befrienders (English) 2389 2223',

  'crisis.mo.lifeHopeZh': 'Life Hope (Chinese) 2852 5222',
  'crisis.mo.lifeHopeEn': 'Life Hope (Expat) 2852 5777',

  'crisis.cn.call120': 'Call 120',
  'crisis.cn.call110': 'Call 110',
  'crisis.cn.hint120': 'Medical emergency (priority)',
  'crisis.cn.hint110': 'When police response is needed',
  'crisis.cn.call12356': 'Call 12356',
  'crisis.cn.hint12356': 'National mental health helpline',
  'crisis.cn.psychLead':
    'For listening or crisis support, call China’s national mental health helpline 12356 (available nationwide since 1 May 2025).',
  'crisis.cn.note1': 'Hours vary by locality (some 24/7); go by what connects locally.',
  'crisis.cn.note2': 'Often dialable directly; some areas may need an area code.',
  'crisis.cn.note3': 'Helplines can coordinate with 110/120, but call 120/110 yourself if in immediate danger.',
  'crisis.cn.ref': 'Related notice on gov.cn',

  'crisis.tw.1925': '1925 Peace of Mind Line',
  'crisis.tw.noteOptional': 'Also: Lifeline 1995, Teacher Chang 1980.',

  'crisis.jp.kokoro': 'Mental Health Consultation Dial 0570-064-556',
  'crisis.jp.hintHours': 'Hours vary by prefecture',
  'crisis.jp.noteHours': 'Service hours vary by prefecture; go by what connects locally.',

  'crisis.kr.109': 'Suicide Prevention Hotline 109',
  'crisis.kr.1577': 'Mental Health 1577-0199',
  'crisis.kr.hintMental': 'Mental health counseling',

  'crisis.sg.call995': 'Call 995',
  'crisis.sg.sos': 'SOS 1767',
  'crisis.sg.caretext': 'WhatsApp CareText 9151 1767',

  'crisis.my.befrienders': 'Befrienders KL +60 3-7627 2929',
  'crisis.my.hint': 'Kuala Lumpur listening line',

  'crisis.gb.samaritans': 'Samaritans 116 123',

  'crisis.us.call911': 'Call 911',
  'crisis.us.988': '988 Suicide & Crisis Lifeline',
  'crisis.us.hint988': 'Call or text',
}

const zhHantHK: Record<MessageKey, string> = {
  ...zhHans,
  'onboarding.region.title': '選擇地區',
  'onboarding.region.sub': '用於顯示當地緊急求助資訊',
  'onboarding.region.continue': '下一步',
  'onboarding.region.mapHint': '滑動選擇你所在的地區',
  'onboarding.language.title': '選擇語言',
  'onboarding.language.sub': '介面與求助頁會盡量使用此語言',
  'onboarding.language.finish': '完成',
  'onboarding.language.continue': '繼續',
  'settings.locale.title': '地區與語言',
  'settings.locale.region': '地區',
  'settings.locale.language': '語言',
  'settings.locale.changeRegion': '更改地區',
  'settings.locale.changeLanguage': '更改語言',
  'settings.crisis.blurb':
    '急救與心理援助熱線（無需登入亦可打開）。若處於即時危險，請優先撥打當地緊急號碼。',
  'settings.crisis.open': '打開緊急求助頁',
  'crisis.title': '緊急求助',
  'crisis.sub': '{region} · 心理援助與急救指引',
  'crisis.urgentTitle': '即時危險時請先急救',
  'crisis.urgentLead':
    '若已自傷受傷、意識異常、持有危險物品，或生命安全受到威脅：請優先撥打當地緊急號碼。心理熱線不能替代急救調度。',
  'crisis.psychTitle': '心理援助熱線',
  'crisis.psychLead': '需要傾聽、疏導或危機介入時，可聯絡下列熱線。',
  'crisis.tipsTitle': '此刻可做的事',
  'crisis.tip1': '盡量離開危險環境，把手邊危險物品放到安全處。',
  'crisis.tip2': '找一位可信任的人陪同，或請對方幫你撥打電話。',
  'crisis.tip3': '做幾次緩慢深呼吸：吸氣 4 秒，呼氣 6 秒。',
  'crisis.tip4': '若暫時無法開口，亦可先撥通熱線，聽對方引導。',
  'crisis.disclaimer':
    'Thryve / 本頁不是急救或醫療診斷服務，不能替代專業醫療與現場救助。所列號碼可能變更，請以當地官方為準。',
  'crisis.changeRegion': '更換地區',
  'crisis.currentRegion': '目前地區：{region}',
  'crisis.call999': '撥打 999',
  'crisis.call119': '撥打 119',
  'crisis.call110': '撥打 110',
  'crisis.call112': '撥打 112',
  'crisis.hintEmergency': '緊急服務',
  'crisis.hintAmbulanceFire': '消防救護',
  'crisis.hintPolice': '報警',
  'crisis.hint247': '24 小時',
  'crisis.hintFree247': '免費 · 24 小時',
  'crisis.hint247Chinese': '中文 · 24 小時',
  'crisis.hintLimitedHours': '時段有限',
  'crisis.hk.samaritans': '撒瑪利亞會 2896 0000',
  'crisis.hk.befrienders': '生命熱線 2389 2222',
  'crisis.hk.befriendersEn': '生命熱線（英文）2389 2223',
  'crisis.mo.lifeHopeZh': '生命希望熱線 2852 5222',
  'crisis.mo.lifeHopeEn': '生命希望熱線（外籍）2852 5777',
  'crisis.cn.call120': '撥打 120',
  'crisis.cn.call110': '撥打 110',
  'crisis.cn.hint120': '醫療救護（優先）',
  'crisis.cn.hint110': '需要警方現場救助時',
  'crisis.cn.call12356': '撥打 12356',
  'crisis.cn.hint12356': '全國統一心理援助熱線',
  'crisis.cn.psychLead':
    '需要傾聽、疏導或危機介入時，可撥打全國統一心理援助熱線（2025 年 5 月 1 日起全國開通）。',
  'crisis.cn.note1': '各地服務時段可能不同（部分 24 小時），以當地接通為準。',
  'crisis.cn.note2': '省內一般可直撥；部分地區可加撥區號接入指定城市坐席。',
  'crisis.cn.note3': '熱線可與 110 / 120 聯動，但若你正處即時危險，仍應直接撥打 120 / 110。',
  'crisis.cn.ref': '中國政府網相關通知',
  'crisis.tw.1925': '安心專線 1925',
  'crisis.tw.noteOptional': '亦可參考：生命線 1995、張老師 1980。',
  'crisis.jp.hintHours': '時段因都道府縣而異',
  'crisis.jp.noteHours': '服務時段因都道府縣而異，請以當地接通為準。',
  'crisis.kr.hintMental': '精神健康諮詢',
  'crisis.sg.call995': '撥打 995',
  'crisis.my.hint': '吉隆坡傾聽熱線',
  'crisis.us.call911': '撥打 911',
  'crisis.us.hint988': '可致電或發短信',
}

const zhHantTW: Record<MessageKey, string> = {
  ...zhHantHK,
  'onboarding.region.title': '選擇地區',
  'settings.locale.title': '地區與語言',
  'crisis.title': '緊急求助',
  'crisis.tw.1925': '安心專線 1925',
  'crisis.tw.noteOptional': '亦可參考：生命線 1995、張老師 1980。',
}

const ja: Record<MessageKey, string> = {
  ...en,
  'onboarding.region.title': '地域を選ぶ',
  'onboarding.region.sub': '現地の緊急相談情報を表示します',
  'onboarding.region.continue': '次へ',
  'onboarding.region.mapHint': 'スクロールして地域を選択',
  'onboarding.language.title': '言語を選ぶ',
  'onboarding.language.sub': '危機サポート画面などでこの言語を使います',
  'onboarding.language.finish': '完了',
  'onboarding.language.continue': '続ける',
  'settings.locale.title': '地域と言語',
  'settings.locale.region': '地域',
  'settings.locale.language': '言語',
  'settings.locale.changeRegion': '地域を変更',
  'settings.locale.changeLanguage': '言語を変更',
  'settings.crisis.blurb':
    '救急・こころの相談窓口（ログイン不要）。直ちに危険なときは、まず現地の緊急番号へ。',
  'settings.crisis.open': '緊急サポートを開く',
  'crisis.title': '緊急サポート',
  'crisis.sub': '{region} · 救急とこころの相談',
  'crisis.urgentTitle': '直ちに危険なとき',
  'crisis.urgentLead':
    'けが・意識の異常・危険物がある、または生命の危険がある場合は、まず現地の緊急番号へ。相談ダイヤルは救急指令の代わりにはなりません。',
  'crisis.psychTitle': 'こころの相談窓口',
  'crisis.psychLead': '傾聴や危機介入が必要なときは、以下の窓口へ。',
  'crisis.tipsTitle': 'いまできること',
  'crisis.tip1': '危険な場所から離れ、危険物を安全な場所へ。',
  'crisis.tip2': '信頼できる人に付き添ってもらうか、電話を手伝ってもらう。',
  'crisis.tip3': 'ゆっくり呼吸：吸う 4 秒、吐く 6 秒。',
  'crisis.tip4': '話せなくても、まずダイヤルして相手の声を聞いてよい。',
  'crisis.disclaimer':
    'Thryve は救急・医療診断サービスではありません。番号は変更されることがあります。公式情報を確認してください。',
  'crisis.changeRegion': '地域を変更',
  'crisis.currentRegion': '現在の地域：{region}',
  'crisis.call999': '999 に電話',
  'crisis.call119': '119 に電話',
  'crisis.call110': '110 に電話',
  'crisis.call112': '112 に電話',
  'crisis.hintEmergency': '緊急サービス',
  'crisis.hintAmbulanceFire': '救急・消防',
  'crisis.hintPolice': '警察',
  'crisis.hint247': '24 時間',
  'crisis.hintFree247': '無料 · 24 時間',
  'crisis.hintLimitedHours': '時間帯に制限あり',
  'crisis.jp.kokoro': 'こころの健康相談統一ダイヤル 0570-064-556',
  'crisis.jp.hintHours': '時間は都道府県により異なります',
  'crisis.jp.noteHours': 'サービス時間は都道府県により異なります。つながった案内に従ってください。',
  'crisis.us.call911': '911 に電話',
  'crisis.cn.call120': '120 に電話',
  'crisis.cn.call110': '110 に電話',
  'crisis.sg.call995': '995 に電話',
}

const ko: Record<MessageKey, string> = {
  ...en,
  'onboarding.region.title': '지역 선택',
  'onboarding.region.sub': '현지 긴급 도움 정보를 표시합니다',
  'onboarding.region.continue': '다음',
  'onboarding.region.mapHint': '스크롤하여 지역을 선택하세요',
  'onboarding.language.title': '언어 선택',
  'onboarding.language.sub': '위기 도움 화면 등에 이 언어를 사용합니다',
  'onboarding.language.finish': '완료',
  'onboarding.language.continue': '계속',
  'settings.locale.title': '지역 및 언어',
  'settings.locale.region': '지역',
  'settings.locale.language': '언어',
  'settings.locale.changeRegion': '지역 변경',
  'settings.locale.changeLanguage': '언어 변경',
  'settings.crisis.blurb':
    '응급·심리 지원 핫라인(로그인 없이 열 수 있음). 즉시 위험한 경우 현지 긴급 번호로 먼저 연락하세요.',
  'settings.crisis.open': '긴급 도움 열기',
  'crisis.title': '긴급 도움',
  'crisis.sub': '{region} · 응급 및 심리 지원',
  'crisis.urgentTitle': '즉시 위험한 경우',
  'crisis.urgentLead':
    '부상·의식 이상·위험물이 있거나 생명이 위협받는 경우: 먼저 현지 긴급 번호로 연락하세요. 심리 상담 전화는 응급 출동을 대체할 수 없습니다.',
  'crisis.psychTitle': '심리 지원 핫라인',
  'crisis.psychLead': '경청·위기 개입이 필요할 때 아래 번호로 연락하세요.',
  'crisis.tipsTitle': '지금 할 수 있는 일',
  'crisis.tip1': '위험한 곳에서 벗어나고 위험물을 안전한 곳에 두세요.',
  'crisis.tip2': '믿을 수 있는 사람과 함께하거나 전화를 부탁하세요.',
  'crisis.tip3': '천천히 호흡: 들이쉬기 4초, 내쉬기 6초.',
  'crisis.tip4': '말하기 어렵다면 먼저 전화를 걸어 안내를 들으세요.',
  'crisis.disclaimer':
    'Thryve는 응급·의료 진단 서비스가 아닙니다. 번호는 변경될 수 있으니 공식 정보를 확인하세요.',
  'crisis.changeRegion': '지역 변경',
  'crisis.currentRegion': '현재 지역: {region}',
  'crisis.call999': '999 전화',
  'crisis.call119': '119 전화',
  'crisis.call110': '110 전화',
  'crisis.call112': '112 전화',
  'crisis.hintEmergency': '긴급 서비스',
  'crisis.hintAmbulanceFire': '소방·구급',
  'crisis.hintPolice': '경찰',
  'crisis.hint247': '24시간',
  'crisis.hintFree247': '무료 · 24시간',
  'crisis.kr.109': '자살예방상담전화 109',
  'crisis.kr.1577': '정신건강 1577-0199',
  'crisis.kr.hintMental': '정신건강 상담',
  'crisis.us.call911': '911 전화',
  'crisis.cn.call120': '120 전화',
  'crisis.cn.call110': '110 전화',
  'crisis.sg.call995': '995 전화',
}

const CATALOGS: Record<LanguageId, Record<MessageKey, string>> = {
  'zh-Hans': zhHans,
  en,
  'zh-Hant-HK': zhHantHK,
  'zh-Hant-TW': zhHantTW,
  ja,
  ko,
}

export function translate(
  language: LanguageId,
  key: MessageKey | string,
  vars?: Record<string, string>,
): string {
  const catalog = CATALOGS[language] ?? zhHans
  const fallback = zhHans[key as MessageKey]
  let text = catalog[key as MessageKey] ?? fallback ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, v)
    }
  }
  return text
}
