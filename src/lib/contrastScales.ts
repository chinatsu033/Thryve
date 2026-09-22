import type { LanguageId } from './locale'
import type { ContrastScaleId } from '../types'

export type LocalizedText = Record<LanguageId, string>

export interface ContrastOption {
  value: number
  label: LocalizedText
}

export interface ContrastItem {
  /** Shared options when not per-item. */
  text: LocalizedText
  options?: ContrastOption[]
}

export interface ContrastScaleDef {
  id: ContrastScaleId
  name: LocalizedText
  short: LocalizedText
  intro: LocalizedText
  /** Default options for all items (unless item.options overrides). */
  options: ContrastOption[]
  items: ContrastItem[]
}

export const CONTRAST_SCALE_IDS: ContrastScaleId[] = [
  'phq9', 'gad7', 'phq2', 'gad2', 'phq15', 'who5', 'dass21', 'ais',
]

export const CONTRAST_SCALES: Record<ContrastScaleId, ContrastScaleDef> = {
  phq9: {
    id: 'phq9',
    name: {
      'zh-Hans': 'PHQ-9',
      'en': 'PHQ-9',
      'zh-Hant-HK': 'PHQ-9',
      'zh-Hant-TW': 'PHQ-9',
      'ja': 'PHQ-9',
      'ko': 'PHQ-9',
    },
    short: {
      'zh-Hans': '抑郁筛查（9题）',
      'en': 'Depression screen (9 items)',
      'zh-Hant-HK': '抑鬱篩查（9題）',
      'zh-Hant-TW': '憂鬱篩檢（9題）',
      'ja': 'うつスクリーニング（9項目）',
      'ko': '우울 선별(9문항)',
    },
    intro: {
      'zh-Hans': '在过去两周里，你有多经常被以下问题所困扰？',
      'en': 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
      'zh-Hant-HK': '在過去兩星期，你有多經常被以下問題所困擾？',
      'zh-Hant-TW': '在過去兩週裡，你有多常被以下問題所困擾？',
      'ja': 'この2週間で、次の問題にどのくらい頻繁に悩まされましたか？',
      'ko': '지난 2주 동안 다음 문제로 얼마나 자주 불편하셨나요?',
    },
    options: [
  { value: 0, label: {
    'zh-Hans': '完全没有',
    'en': 'Not at all',
    'zh-Hant-HK': '完全沒有',
    'zh-Hant-TW': '完全沒有',
    'ja': '全くない',
    'ko': '전혀 없음',
  } },
  { value: 1, label: {
    'zh-Hans': '好几天',
    'en': 'Several days',
    'zh-Hant-HK': '好幾天',
    'zh-Hant-TW': '好幾天',
    'ja': '数日',
    'ko': '며칠',
  } },
  { value: 2, label: {
    'zh-Hans': '一半以上天数',
    'en': 'More than half the days',
    'zh-Hant-HK': '一半以上日子',
    'zh-Hant-TW': '一半以上天數',
    'ja': '半分以上',
    'ko': '절반 이상',
  } },
  { value: 3, label: {
    'zh-Hans': '几乎每天',
    'en': 'Nearly every day',
    'zh-Hant-HK': '幾乎每天',
    'zh-Hant-TW': '幾乎每天',
    'ja': 'ほぼ毎日',
    'ko': '거의 매일',
  } },
],
    items: [
  { text: {
    'zh-Hans': '做事时提不起劲或没有乐趣',
    'en': 'Little interest or pleasure in doing things',
    'zh-Hant-HK': '做事時提不起勁或沒有樂趣',
    'zh-Hant-TW': '做事時提不起勁或沒有樂趣',
    'ja': '物事に対してほとんど興味がない、または楽しめない',
    'ko': '일을 하는 데 흥미나 즐거움을 느끼지 못함',
  } },
  { text: {
    'zh-Hans': '感到心情低落、沮丧或绝望',
    'en': 'Feeling down, depressed, or hopeless',
    'zh-Hant-HK': '感到心情低落、沮喪或絕望',
    'zh-Hant-TW': '感到心情低落、沮喪或絕望',
    'ja': '気分が落ち込んでいる、憂うつ、または絶望的だと感じる',
    'ko': '기분이 가라앉거나, 우울하거나, 희망이 없다고 느낌',
  } },
  { text: {
    'zh-Hans': '入睡困难、睡不安稳或睡眠过多',
    'en': 'Trouble falling or staying asleep, or sleeping too much',
    'zh-Hant-HK': '入睡困難、睡不安穩或睡眠過多',
    'zh-Hant-TW': '入睡困難、睡不安穩或睡眠過多',
    'ja': '寝つきが悪い、途中で目が覚める、または寝すぎる',
    'ko': '잠들기 어렵거나, 자주 깨거나, 너무 많이 잠',
  } },
  { text: {
    'zh-Hans': '感觉疲倦或没有活力',
    'en': 'Feeling tired or having little energy',
    'zh-Hant-HK': '感覺疲倦或沒有活力',
    'zh-Hant-TW': '感覺疲倦或沒有活力',
    'ja': '疲れを感じる、または気力がない',
    'ko': '피곤하거나 기운이 거의 없음',
  } },
  { text: {
    'zh-Hans': '食欲不振或吃太多',
    'en': 'Poor appetite or overeating',
    'zh-Hant-HK': '食慾不振或吃太多',
    'zh-Hant-TW': '食慾不振或吃太多',
    'ja': '食欲がない、または食べ過ぎる',
    'ko': '식욕이 없거나 과식함',
  } },
  { text: {
    'zh-Hans': '觉得自己很糟——或觉得自己很失败，或让自己或家人失望',
    'en': 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    'zh-Hant-HK': '覺得自己很糟——或覺得自己很失敗，或讓自己或家人失望',
    'zh-Hant-TW': '覺得自己很糟——或覺得自己很失敗，或讓自己或家人失望',
    'ja': '自分のことを否定的に思う — または失敗者だと感じたり、自分や家族をがっかりさせたと感じる',
    'ko': '자신을 부정적으로 느낌 — 실패했다고 여기거나 자신이나 가족을 실망시켰다고 느낌',
  } },
  { text: {
    'zh-Hans': '对事物专注有困难，例如读报或看电视',
    'en': 'Trouble concentrating on things, such as reading the newspaper or watching television',
    'zh-Hant-HK': '對事物專注有困難，例如讀報或看電視',
    'zh-Hant-TW': '對事物專注有困難，例如讀報或看電視',
    'ja': '新聞を読む、テレビを見るなど、物事に集中するのが難しい',
    'ko': '신문 읽기나 TV 시청 등 일에 집중하기 어려움',
  } },
  { text: {
    'zh-Hans': '动作或说话速度缓慢到别人已经察觉？或正好相反——烦躁或坐立不安、动来动去比平常多很多',
    'en': 'Moving or speaking so slowly that other people could have noticed? Or so fidgety or restless that you have been moving around a lot more than usual',
    'zh-Hant-HK': '動作或說話速度緩慢到別人已經察覺？或正好相反——煩躁或坐立不安、動來動去比平常多很多',
    'zh-Hant-TW': '動作或說話速度緩慢到別人已經察覺？或正好相反——煩躁或坐立不安、動來動去比平常多很多',
    'ja': '動きや話し方が遅く、周囲の人に気づかれるほどだったか。またはそわそわして落ち着かず、普段よりかなり動き回っていたか',
    'ko': '움직임이나 말이 느려져 남들이 알아챌 정도였나요? 혹은 안절부절못하며 평소보다 훨씬 많이 움직였나요?',
  } },
  { text: {
    'zh-Hans': '有不如死了为好，或用某种方式伤害自己的念头',
    'en': 'Thoughts that you would be better off dead, or of hurting yourself in some way',
    'zh-Hant-HK': '有不如死了為好，或以某種方式傷害自己的念頭',
    'zh-Hant-TW': '有不如死了為好，或以某種方式傷害自己的念頭',
    'ja': '死んだ方がましだ、または何らかの方法で自分を傷つける考え',
    'ko': '죽는 편이 낫겠다거나, 어떤 식으로든 자신을 해치고 싶다는 생각',
  } },
],
  },
  gad7: {
    id: 'gad7',
    name: {
      'zh-Hans': 'GAD-7',
      'en': 'GAD-7',
      'zh-Hant-HK': 'GAD-7',
      'zh-Hant-TW': 'GAD-7',
      'ja': 'GAD-7',
      'ko': 'GAD-7',
    },
    short: {
      'zh-Hans': '焦虑筛查（7题）',
      'en': 'Anxiety screen (7 items)',
      'zh-Hant-HK': '焦慮篩查（7題）',
      'zh-Hant-TW': '焦慮篩檢（7題）',
      'ja': '不安スクリーニング（7項目）',
      'ko': '불안 선별(7문항)',
    },
    intro: {
      'zh-Hans': '在过去两周里，你有多经常被以下问题所困扰？',
      'en': 'Over the last 2 weeks, how often have you been bothered by the following problems?',
      'zh-Hant-HK': '在過去兩星期，你有多經常被以下問題所困擾？',
      'zh-Hant-TW': '在過去兩週裡，你有多常被以下問題所困擾？',
      'ja': 'この2週間で、次の問題にどのくらい頻繁に悩まされましたか？',
      'ko': '지난 2주 동안 다음 문제로 얼마나 자주 불편하셨나요?',
    },
    options: [
  { value: 0, label: {
    'zh-Hans': '完全没有',
    'en': 'Not at all',
    'zh-Hant-HK': '完全沒有',
    'zh-Hant-TW': '完全沒有',
    'ja': '全くない',
    'ko': '전혀 없음',
  } },
  { value: 1, label: {
    'zh-Hans': '好几天',
    'en': 'Several days',
    'zh-Hant-HK': '好幾天',
    'zh-Hant-TW': '好幾天',
    'ja': '数日',
    'ko': '며칠',
  } },
  { value: 2, label: {
    'zh-Hans': '一半以上天数',
    'en': 'More than half the days',
    'zh-Hant-HK': '一半以上日子',
    'zh-Hant-TW': '一半以上天數',
    'ja': '半分以上',
    'ko': '절반 이상',
  } },
  { value: 3, label: {
    'zh-Hans': '几乎每天',
    'en': 'Nearly every day',
    'zh-Hant-HK': '幾乎每天',
    'zh-Hant-TW': '幾乎每天',
    'ja': 'ほぼ毎日',
    'ko': '거의 매일',
  } },
],
    items: [
  { text: {
    'zh-Hans': '感觉紧张、焦虑或急切',
    'en': 'Feeling nervous, anxious, or on edge',
    'zh-Hant-HK': '感覺緊張、焦慮或急切',
    'zh-Hant-TW': '感覺緊張、焦慮或急切',
    'ja': '神経質になったり、不安になったり、イライラしたりする',
    'ko': '긴장되거나, 불안하거나, 초조함',
  } },
  { text: {
    'zh-Hans': '不能够停止或控制担忧',
    'en': 'Not being able to stop or control worrying',
    'zh-Hant-HK': '不能夠停止或控制擔憂',
    'zh-Hant-TW': '不能夠停止或控制擔憂',
    'ja': '心配することを止められない、またはコントロールできない',
    'ko': '걱정을 멈추거나 조절할 수 없음',
  } },
  { text: {
    'zh-Hans': '对各种各样的事情担忧过多',
    'en': 'Worrying too much about different things',
    'zh-Hant-HK': '對各種各樣的事情擔憂過多',
    'zh-Hant-TW': '對各種各樣的事情擔憂過多',
    'ja': 'いろいろなことについて心配しすぎる',
    'ko': '여러 가지 일에 대해 너무 많이 걱정함',
  } },
  { text: {
    'zh-Hans': '很难放松下来',
    'en': 'Trouble relaxing',
    'zh-Hant-HK': '很難放鬆下來',
    'zh-Hant-TW': '很難放鬆下來',
    'ja': 'くつろぐのが難しい',
    'ko': '편안하게 쉬기 어려움',
  } },
  { text: {
    'zh-Hans': '由于不安而无法静坐',
    'en': 'Being so restless that it is hard to sit still',
    'zh-Hant-HK': '由於不安而無法靜坐',
    'zh-Hant-TW': '由於不安而無法靜坐',
    'ja': '落ち着かないためじっとしているのが難しい',
    'ko': '안절부절못해서 가만히 앉아 있기 어려움',
  } },
  { text: {
    'zh-Hans': '变得容易烦恼或急躁',
    'en': 'Becoming easily annoyed or irritable',
    'zh-Hant-HK': '變得容易煩惱或急躁',
    'zh-Hant-TW': '變得容易煩惱或急躁',
    'ja': 'すぐにいらだったり、怒りっぽくなる',
    'ko': '쉽게 짜증이 나거나 화가 남',
  } },
  { text: {
    'zh-Hans': '感到好像有可怕的事情会发生',
    'en': 'Feeling afraid as if something awful might happen',
    'zh-Hant-HK': '感到好像有可怕的事情會發生',
    'zh-Hant-TW': '感到好像有可怕的事情會發生',
    'ja': '何か恐ろしいことが起こりそうで怖いと感じる',
    'ko': '끔찍한 일이 일어날 것 같아 두려움',
  } },
],
  },
  phq2: {
    id: 'phq2',
    name: {
      'zh-Hans': 'PHQ-2',
      'en': 'PHQ-2',
      'zh-Hant-HK': 'PHQ-2',
      'zh-Hant-TW': 'PHQ-2',
      'ja': 'PHQ-2',
      'ko': 'PHQ-2',
    },
    short: {
      'zh-Hans': '抑郁超短版（2题）',
      'en': 'Ultra-brief depression (2 items)',
      'zh-Hant-HK': '抑鬱超短版（2題）',
      'zh-Hant-TW': '憂鬱超短版（2題）',
      'ja': 'うつ超短縮版（2項目）',
      'ko': '우울 초단축(2문항)',
    },
    intro: {
      'zh-Hans': '在过去两周里，你有多经常被以下问题所困扰？',
      'en': 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
      'zh-Hant-HK': '在過去兩星期，你有多經常被以下問題所困擾？',
      'zh-Hant-TW': '在過去兩週裡，你有多常被以下問題所困擾？',
      'ja': 'この2週間で、次の問題にどのくらい頻繁に悩まされましたか？',
      'ko': '지난 2주 동안 다음 문제로 얼마나 자주 불편하셨나요?',
    },
    options: [
  { value: 0, label: {
    'zh-Hans': '完全没有',
    'en': 'Not at all',
    'zh-Hant-HK': '完全沒有',
    'zh-Hant-TW': '完全沒有',
    'ja': '全くない',
    'ko': '전혀 없음',
  } },
  { value: 1, label: {
    'zh-Hans': '好几天',
    'en': 'Several days',
    'zh-Hant-HK': '好幾天',
    'zh-Hant-TW': '好幾天',
    'ja': '数日',
    'ko': '며칠',
  } },
  { value: 2, label: {
    'zh-Hans': '一半以上天数',
    'en': 'More than half the days',
    'zh-Hant-HK': '一半以上日子',
    'zh-Hant-TW': '一半以上天數',
    'ja': '半分以上',
    'ko': '절반 이상',
  } },
  { value: 3, label: {
    'zh-Hans': '几乎每天',
    'en': 'Nearly every day',
    'zh-Hant-HK': '幾乎每天',
    'zh-Hant-TW': '幾乎每天',
    'ja': 'ほぼ毎日',
    'ko': '거의 매일',
  } },
],
    items: [
  { text: {
    'zh-Hans': '做事时提不起劲或没有乐趣',
    'en': 'Little interest or pleasure in doing things',
    'zh-Hant-HK': '做事時提不起勁或沒有樂趣',
    'zh-Hant-TW': '做事時提不起勁或沒有樂趣',
    'ja': '物事に対してほとんど興味がない、または楽しめない',
    'ko': '일을 하는 데 흥미나 즐거움을 느끼지 못함',
  } },
  { text: {
    'zh-Hans': '感到心情低落、沮丧或绝望',
    'en': 'Feeling down, depressed, or hopeless',
    'zh-Hant-HK': '感到心情低落、沮喪或絕望',
    'zh-Hant-TW': '感到心情低落、沮喪或絕望',
    'ja': '気分が落ち込んでいる、憂うつ、または絶望的だと感じる',
    'ko': '기분이 가라앉거나, 우울하거나, 희망이 없다고 느낌',
  } },
],
  },
  gad2: {
    id: 'gad2',
    name: {
      'zh-Hans': 'GAD-2',
      'en': 'GAD-2',
      'zh-Hant-HK': 'GAD-2',
      'zh-Hant-TW': 'GAD-2',
      'ja': 'GAD-2',
      'ko': 'GAD-2',
    },
    short: {
      'zh-Hans': '焦虑超短版（2题）',
      'en': 'Ultra-brief anxiety (2 items)',
      'zh-Hant-HK': '焦慮超短版（2題）',
      'zh-Hant-TW': '焦慮超短版（2題）',
      'ja': '不安超短縮版（2項目）',
      'ko': '불안 초단축(2문항)',
    },
    intro: {
      'zh-Hans': '在过去两周里，你有多经常被以下问题所困扰？',
      'en': 'Over the last 2 weeks, how often have you been bothered by the following problems?',
      'zh-Hant-HK': '在過去兩星期，你有多經常被以下問題所困擾？',
      'zh-Hant-TW': '在過去兩週裡，你有多常被以下問題所困擾？',
      'ja': 'この2週間で、次の問題にどのくらい頻繁に悩まされましたか？',
      'ko': '지난 2주 동안 다음 문제로 얼마나 자주 불편하셨나요?',
    },
    options: [
  { value: 0, label: {
    'zh-Hans': '完全没有',
    'en': 'Not at all',
    'zh-Hant-HK': '完全沒有',
    'zh-Hant-TW': '完全沒有',
    'ja': '全くない',
    'ko': '전혀 없음',
  } },
  { value: 1, label: {
    'zh-Hans': '好几天',
    'en': 'Several days',
    'zh-Hant-HK': '好幾天',
    'zh-Hant-TW': '好幾天',
    'ja': '数日',
    'ko': '며칠',
  } },
  { value: 2, label: {
    'zh-Hans': '一半以上天数',
    'en': 'More than half the days',
    'zh-Hant-HK': '一半以上日子',
    'zh-Hant-TW': '一半以上天數',
    'ja': '半分以上',
    'ko': '절반 이상',
  } },
  { value: 3, label: {
    'zh-Hans': '几乎每天',
    'en': 'Nearly every day',
    'zh-Hant-HK': '幾乎每天',
    'zh-Hant-TW': '幾乎每天',
    'ja': 'ほぼ毎日',
    'ko': '거의 매일',
  } },
],
    items: [
  { text: {
    'zh-Hans': '感觉紧张、焦虑或急切',
    'en': 'Feeling nervous, anxious, or on edge',
    'zh-Hant-HK': '感覺緊張、焦慮或急切',
    'zh-Hant-TW': '感覺緊張、焦慮或急切',
    'ja': '神経質になったり、不安になったり、イライラしたりする',
    'ko': '긴장되거나, 불안하거나, 초조함',
  } },
  { text: {
    'zh-Hans': '不能够停止或控制担忧',
    'en': 'Not being able to stop or control worrying',
    'zh-Hant-HK': '不能夠停止或控制擔憂',
    'zh-Hant-TW': '不能夠停止或控制擔憂',
    'ja': '心配することを止められない、またはコントロールできない',
    'ko': '걱정을 멈추거나 조절할 수 없음',
  } },
],
  },
  phq15: {
    id: 'phq15',
    name: {
      'zh-Hans': 'PHQ-15',
      'en': 'PHQ-15',
      'zh-Hant-HK': 'PHQ-15',
      'zh-Hant-TW': 'PHQ-15',
      'ja': 'PHQ-15',
      'ko': 'PHQ-15',
    },
    short: {
      'zh-Hans': '躯体症状（15题）',
      'en': 'Somatic symptoms (15 items)',
      'zh-Hant-HK': '軀體症狀（15題）',
      'zh-Hant-TW': '身體症狀（15題）',
      'ja': '身体症状（15項目）',
      'ko': '신체 증상(15문항)',
    },
    intro: {
      'zh-Hans': '在过去四周里，以下问题给你带来了多少困扰？',
      'en': 'During the past 4 weeks, how much have you been bothered by any of the following problems?',
      'zh-Hant-HK': '在過去四星期，以下問題給你帶來了多少困擾？',
      'zh-Hant-TW': '在過去四週裡，以下問題給你帶來了多少困擾？',
      'ja': 'この4週間で、次の問題にどのくらい悩まされましたか？',
      'ko': '지난 4주 동안 다음 문제로 얼마나 불편하셨나요?',
    },
    options: [
  { value: 0, label: {
    'zh-Hans': '完全没有困扰',
    'en': 'Not bothered at all',
    'zh-Hant-HK': '完全沒有困擾',
    'zh-Hant-TW': '完全沒有困擾',
    'ja': '全く気にならない',
    'ko': '전혀 괴롭지 않음',
  } },
  { value: 1, label: {
    'zh-Hans': '稍微有点困扰',
    'en': 'Bothered a little',
    'zh-Hant-HK': '稍微有點困擾',
    'zh-Hant-TW': '稍微有點困擾',
    'ja': '少し気になる',
    'ko': '조금 괴로움',
  } },
  { value: 2, label: {
    'zh-Hans': '很困扰',
    'en': 'Bothered a lot',
    'zh-Hant-HK': '很困擾',
    'zh-Hant-TW': '很困擾',
    'ja': 'とても気になる',
    'ko': '많이 괴로움',
  } },
],
    items: [
  { text: {
    'zh-Hans': '胃痛',
    'en': 'Stomach pain',
    'zh-Hant-HK': '胃痛',
    'zh-Hant-TW': '胃痛',
    'ja': '胃痛',
    'ko': '복통',
  } },
  { text: {
    'zh-Hans': '背痛',
    'en': 'Back pain',
    'zh-Hant-HK': '背痛',
    'zh-Hant-TW': '背痛',
    'ja': '腰痛・背中の痛み',
    'ko': '요통',
  } },
  { text: {
    'zh-Hans': '手臂、腿或关节疼痛（膝、髋等）',
    'en': 'Pain in your arms, legs, or joints (knees, hips, etc.)',
    'zh-Hant-HK': '手臂、腿或關節疼痛（膝、髖等）',
    'zh-Hant-TW': '手臂、腿或關節疼痛（膝、髖等）',
    'ja': '腕・脚・関節（膝・股関節など）の痛み',
    'ko': '팔·다리·관절(무릎, 엉덩이 등)의 통증',
  } },
  { text: {
    'zh-Hans': '痛经或其他月经问题（仅女性；其他人可跳过或选0）',
    'en': 'Menstrual cramps or other problems with your periods (women only; others may skip or mark 0)',
    'zh-Hant-HK': '痛經或其他月經問題（僅女性；其他人可跳過或選0）',
    'zh-Hant-TW': '痛經或其他月經問題（僅女性；其他人可跳過或選0）',
    'ja': '生理痛や生理に関するその他の問題（女性のみ；該当しない方は0）',
    'ko': '생리통 또는 생리 관련 문제(여성만; 해당 없으면 0)',
  } },
  { text: {
    'zh-Hans': '头痛',
    'en': 'Headaches',
    'zh-Hant-HK': '頭痛',
    'zh-Hant-TW': '頭痛',
    'ja': '頭痛',
    'ko': '두통',
  } },
  { text: {
    'zh-Hans': '胸痛',
    'en': 'Chest pain',
    'zh-Hant-HK': '胸痛',
    'zh-Hant-TW': '胸痛',
    'ja': '胸の痛み',
    'ko': '흉통',
  } },
  { text: {
    'zh-Hans': '头晕',
    'en': 'Dizziness',
    'zh-Hant-HK': '頭暈',
    'zh-Hant-TW': '頭暈',
    'ja': 'めまい',
    'ko': '어지러움',
  } },
  { text: {
    'zh-Hans': '昏厥',
    'en': 'Fainting spells',
    'zh-Hant-HK': '昏厥',
    'zh-Hant-TW': '昏厥',
    'ja': '失神',
    'ko': '실신',
  } },
  { text: {
    'zh-Hans': '感到心跳剧烈或过快',
    'en': 'Feeling your heart pound or race',
    'zh-Hant-HK': '感到心跳劇烈或過快',
    'zh-Hant-TW': '感到心跳劇烈或過快',
    'ja': '動悸や心臓が激しく打つ感じ',
    'ko': '심장이 두근거리거나 빨리 뛰는 느낌',
  } },
  { text: {
    'zh-Hans': '气短',
    'en': 'Shortness of breath',
    'zh-Hant-HK': '氣短',
    'zh-Hant-TW': '氣短',
    'ja': '息切れ',
    'ko': '숨이 참',
  } },
  { text: {
    'zh-Hans': '性交时疼痛或不适',
    'en': 'Pain or problems during sexual intercourse',
    'zh-Hant-HK': '性交時疼痛或不適',
    'zh-Hant-TW': '性交時疼痛或不適',
    'ja': '性交時の痛みや問題',
    'ko': '성관계 중 통증이나 문제',
  } },
  { text: {
    'zh-Hans': '便秘、稀便或腹泻',
    'en': 'Constipation, loose bowels, or diarrhea',
    'zh-Hant-HK': '便秘、稀便或腹瀉',
    'zh-Hant-TW': '便秘、稀便或腹瀉',
    'ja': '便秘・軟便・下痢',
    'ko': '변비, 무른 변 또는 설사',
  } },
  { text: {
    'zh-Hans': '恶心、胀气或消化不良',
    'en': 'Nausea, gas, or indigestion',
    'zh-Hant-HK': '噁心、脹氣或消化不良',
    'zh-Hant-TW': '噁心、脹氣或消化不良',
    'ja': '吐き気・ガス・消化不良',
    'ko': '메스꺼움, 가스 또는 소화불량',
  } },
  { text: {
    'zh-Hans': '感到疲倦或精力不足',
    'en': 'Feeling tired or having low energy',
    'zh-Hant-HK': '感到疲倦或精力不足',
    'zh-Hant-TW': '感到疲倦或精力不足',
    'ja': '疲労感や気力の低下',
    'ko': '피곤하거나 기운이 없음',
  } },
  { text: {
    'zh-Hans': '睡眠困难',
    'en': 'Trouble sleeping',
    'zh-Hant-HK': '睡眠困難',
    'zh-Hant-TW': '睡眠困難',
    'ja': '睡眠の問題',
    'ko': '수면 문제',
  } },
],
  },
  who5: {
    id: 'who5',
    name: {
      'zh-Hans': 'WHO-5',
      'en': 'WHO-5',
      'zh-Hant-HK': 'WHO-5',
      'zh-Hant-TW': 'WHO-5',
      'ja': 'WHO-5',
      'ko': 'WHO-5',
    },
    short: {
      'zh-Hans': '幸福感指数（5题）',
      'en': 'Well-being index (5 items)',
      'zh-Hant-HK': '幸福感指數（5題）',
      'zh-Hant-TW': '幸福感指數（5題）',
      'ja': 'ウェルビーイング指数（5項目）',
      'ko': '웰빙 지수(5문항)',
    },
    intro: {
      'zh-Hans': '请根据过去两周的感受，选择最符合你的选项。',
      'en': 'Please indicate for each statement which is closest to how you have been feeling over the last two weeks.',
      'zh-Hant-HK': '請根據過去兩星期的感受，選擇最符合你的選項。',
      'zh-Hant-TW': '請根據過去兩週的感受，選擇最符合你的選項。',
      'ja': 'この2週間の気持ちに最も近いものを選んでください。',
      'ko': '지난 2주 동안의 기분에 가장 가까운 답을 골라 주세요.',
    },
    options: [
  { value: 0, label: {
    'zh-Hans': '从来没有',
    'en': 'At no time',
    'zh-Hant-HK': '從來沒有',
    'zh-Hant-TW': '從來沒有',
    'ja': 'まったくなかった',
    'ko': '전혀 없음',
  } },
  { value: 1, label: {
    'zh-Hans': '有时',
    'en': 'Some of the time',
    'zh-Hant-HK': '有時',
    'zh-Hant-TW': '有時',
    'ja': 'ときどき',
    'ko': '가끔',
  } },
  { value: 2, label: {
    'zh-Hans': '不到一半时间',
    'en': 'Less than half of the time',
    'zh-Hant-HK': '少於一半時間',
    'zh-Hant-TW': '少於一半時間',
    'ja': '半分未満',
    'ko': '절반 미만',
  } },
  { value: 3, label: {
    'zh-Hans': '超过一半时间',
    'en': 'More than half of the time',
    'zh-Hant-HK': '超過一半時間',
    'zh-Hant-TW': '超過一半時間',
    'ja': '半分を超える',
    'ko': '절반 이상',
  } },
  { value: 4, label: {
    'zh-Hans': '大部分时间',
    'en': 'Most of the time',
    'zh-Hant-HK': '大部分時間',
    'zh-Hant-TW': '大部分時間',
    'ja': 'ほとんど',
    'ko': '대부분',
  } },
  { value: 5, label: {
    'zh-Hans': '所有时间',
    'en': 'All of the time',
    'zh-Hant-HK': '所有時間',
    'zh-Hant-TW': '所有時間',
    'ja': 'いつも',
    'ko': '항상',
  } },
],
    items: [
  { text: {
    'zh-Hans': '我感到愉快和心情舒畅',
    'en': 'I have felt cheerful and in good spirits',
    'zh-Hant-HK': '我感到愉快和心情舒暢',
    'zh-Hant-TW': '我感到愉快和心情舒暢',
    'ja': '明るく楽しい気分だった',
    'ko': '명랑하고 기분이 좋았다',
  } },
  { text: {
    'zh-Hans': '我感到平静和放松',
    'en': 'I have felt calm and relaxed',
    'zh-Hant-HK': '我感到平靜和放鬆',
    'zh-Hant-TW': '我感到平靜和放鬆',
    'ja': '落ち着いてリラックスしていた',
    'ko': '차분하고 편안했다',
  } },
  { text: {
    'zh-Hans': '我感到积极主动、充满活力',
    'en': 'I have felt active and vigorous',
    'zh-Hant-HK': '我感到積極主動、充滿活力',
    'zh-Hant-TW': '我感到積極主動、充滿活力',
    'ja': '活動的で元気だった',
    'ko': '활발하고 기운이 있었다',
  } },
  { text: {
    'zh-Hans': '我醒来时感觉清爽、得到充分休息',
    'en': 'I woke up feeling fresh and rested',
    'zh-Hant-HK': '我醒來時感覺清爽、得到充分休息',
    'zh-Hant-TW': '我醒來時感覺清爽、得到充分休息',
    'ja': '朝起きたとき爽やかで十分休めていると感じた',
    'ko': '아침에 상쾌하고 충분히 쉰 느낌으로 깼다',
  } },
  { text: {
    'zh-Hans': '我的日常生活充满了令我感兴趣的事物',
    'en': 'My daily life has been filled with things that interest me',
    'zh-Hant-HK': '我的日常生活充滿了令我感興趣的事物',
    'zh-Hant-TW': '我的日常生活充滿了令我感興趣的事物',
    'ja': '日常生活が興味のあることで満ちていた',
    'ko': '일상생활이 관심 가는 일들로 가득했다',
  } },
],
  },
  dass21: {
    id: 'dass21',
    name: {
      'zh-Hans': 'DASS-21',
      'en': 'DASS-21',
      'zh-Hant-HK': 'DASS-21',
      'zh-Hant-TW': 'DASS-21',
      'ja': 'DASS-21',
      'ko': 'DASS-21',
    },
    short: {
      'zh-Hans': '抑郁·焦虑·压力（21题）',
      'en': 'Depression · Anxiety · Stress (21)',
      'zh-Hant-HK': '抑鬱·焦慮·壓力（21題）',
      'zh-Hant-TW': '憂鬱·焦慮·壓力（21題）',
      'ja': '抑うつ・不安・ストレス（21）',
      'ko': '우울·불안·스트레스(21)',
    },
    intro: {
      'zh-Hans': '请阅读每条陈述，并选择过去一周内最符合你情况的选项。',
      'en': 'Please read each statement and choose how much the statement applied to you over the past week.',
      'zh-Hant-HK': '請閱讀每條陳述，並選擇過去一星期內最符合你情況的選項。',
      'zh-Hant-TW': '請閱讀每條陳述，並選擇過去一週內最符合你情況的選項。',
      'ja': '各文を読み、この1週間でどのくらい当てはまったかを選んでください。',
      'ko': '각 문장을 읽고 지난 한 주 동안 얼마나 해당했는지 골라 주세요.',
    },
    options: [
  { value: 0, label: {
    'zh-Hans': '完全不符合',
    'en': 'Did not apply to me at all',
    'zh-Hant-HK': '完全不符合',
    'zh-Hant-TW': '完全不符合',
    'ja': 'まったく当てはまらない',
    'ko': '전혀 해당 없음',
  } },
  { value: 1, label: {
    'zh-Hans': '有时符合 / 符合一部分',
    'en': 'Applied to me to some degree, or some of the time',
    'zh-Hant-HK': '有時符合／符合一部分',
    'zh-Hant-TW': '有時符合／符合一部分',
    'ja': 'ある程度、またはときどき当てはまっていた',
    'ko': '어느 정도 또는 가끔 해당',
  } },
  { value: 2, label: {
    'zh-Hans': '相当符合 / 很多时候符合',
    'en': 'Applied to me to a considerable degree, or a good part of time',
    'zh-Hant-HK': '相當符合／很多時候符合',
    'zh-Hant-TW': '相當符合／很多時候符合',
    'ja': 'かなりの程度、またはかなりの時間当てはまっていた',
    'ko': '상당 부분 또는 꽤 자주 해당',
  } },
  { value: 3, label: {
    'zh-Hans': '非常符合 / 大部分时间符合',
    'en': 'Applied to me very much, or most of the time',
    'zh-Hant-HK': '非常符合／大部分時間符合',
    'zh-Hant-TW': '非常符合／大部分時間符合',
    'ja': '非常によく、またはほとんどの時間当てはまっていた',
    'ko': '매우 많이 또는 대부분 해당',
  } },
],
    items: [
  { text: {
    'zh-Hans': '我发现很难放松下来',
    'en': 'I found it hard to wind down',
    'zh-Hant-HK': '我發現很難放鬆下來',
    'zh-Hant-TW': '我發現很難放鬆下來',
    'ja': 'リラックスするのが難しかった',
    'ko': '마음을 가라앉히기 어려웠다',
  } },
  { text: {
    'zh-Hans': '我感到口干',
    'en': 'I was aware of dryness of my mouth',
    'zh-Hant-HK': '我感到口乾',
    'zh-Hant-TW': '我感到口乾',
    'ja': '口の渇きを感じた',
    'ko': '입이 마른 것을 느꼈다',
  } },
  { text: {
    'zh-Hans': '我好像完全无法体验到任何积极的情绪',
    'en': 'I couldn’t seem to experience any positive feeling at all',
    'zh-Hant-HK': '我好像完全無法體驗到任何積極的情緒',
    'zh-Hant-TW': '我好像完全無法體驗到任何積極的情緒',
    'ja': '前向きな気持ちをまったく感じられないようだった',
    'ko': '긍정적인 감정을 전혀 느끼지 못하는 것 같았다',
  } },
  { text: {
    'zh-Hans': '我感到呼吸困难（例如呼吸过快，或在没有体力活动时气喘）',
    'en': 'I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)',
    'zh-Hant-HK': '我感到呼吸困難（例如呼吸過快，或在沒有體力活動時氣喘）',
    'zh-Hant-TW': '我感到呼吸困難（例如呼吸過快，或在沒有體力活動時氣喘）',
    'ja': '呼吸困難を感じた（例：過呼吸、運動していないのに息切れ）',
    'ko': '호흡 곤란을 경험했다(예: 과도하게 빠른 호흡, 운동 없이 숨참)',
  } },
  { text: {
    'zh-Hans': '我发现很难提起劲去做事情',
    'en': 'I found it difficult to work up the initiative to do things',
    'zh-Hant-HK': '我發現很難提起勁去做事情',
    'zh-Hant-TW': '我發現很難提起勁去做事情',
    'ja': '物事を始める意欲を起こすのが難しかった',
    'ko': '일을 시작할 의욕을 내기 어려웠다',
  } },
  { text: {
    'zh-Hans': '我对情况往往反应过度',
    'en': 'I tended to over-react to situations',
    'zh-Hant-HK': '我對情況往往反應過度',
    'zh-Hant-TW': '我對情況往往反應過度',
    'ja': '状況に過剰に反応しがちだった',
    'ko': '상황에 과도하게 반응하는 경향이 있었다',
  } },
  { text: {
    'zh-Hans': '我感到颤抖（例如手抖）',
    'en': 'I experienced trembling (e.g. in the hands)',
    'zh-Hant-HK': '我感到顫抖（例如手抖）',
    'zh-Hant-TW': '我感到顫抖（例如手抖）',
    'ja': '震えを感じた（例：手の震え）',
    'ko': '떨림을 경험했다(예: 손 떨림)',
  } },
  { text: {
    'zh-Hans': '我觉得自己消耗了很多神经能量',
    'en': 'I felt that I was using a lot of nervous energy',
    'zh-Hant-HK': '我覺得自己消耗了很多神經能量',
    'zh-Hant-TW': '我覺得自己消耗了很多神經能量',
    'ja': '神経をすり減らすエネルギーを大量に使っていると感じた',
    'ko': '신경 에너지를 많이 쓰고 있다고 느꼈다',
  } },
  { text: {
    'zh-Hans': '我担心自己会在某些场合惊慌并出丑',
    'en': 'I was worried about situations in which I might panic and make a fool of myself',
    'zh-Hant-HK': '我擔心自己會在某些場合驚慌並出醜',
    'zh-Hant-TW': '我擔心自己會在某些場合驚慌並出醜',
    'ja': 'パニックになって恥をかくかもしれない状況を心配した',
    'ko': '공황에 빠져 창피를 당할 상황을 걱정했다',
  } },
  { text: {
    'zh-Hans': '我觉得没什么可期待的',
    'en': 'I felt that I had nothing to look forward to',
    'zh-Hant-HK': '我覺得沒什麼可期待的',
    'zh-Hant-TW': '我覺得沒什麼可期待的',
    'ja': '楽しみにしていることが何もないと感じた',
    'ko': '기대할 것이 아무것도 없다고 느꼈다',
  } },
  { text: {
    'zh-Hans': '我发现自己变得烦躁不安',
    'en': 'I found myself getting agitated',
    'zh-Hant-HK': '我發現自己變得煩躁不安',
    'zh-Hant-TW': '我發現自己變得煩躁不安',
    'ja': 'いらだちを感じた',
    'ko': '초조해지는 자신을 발견했다',
  } },
  { text: {
    'zh-Hans': '我发现很难放松',
    'en': 'I found it difficult to relax',
    'zh-Hant-HK': '我發現很難放鬆',
    'zh-Hant-TW': '我發現很難放鬆',
    'ja': 'くつろぐのが難しかった',
    'ko': '긴장을 풀기 어려웠다',
  } },
  { text: {
    'zh-Hans': '我感到沮丧和忧郁',
    'en': 'I felt down-hearted and blue',
    'zh-Hant-HK': '我感到沮喪和憂鬱',
    'zh-Hant-TW': '我感到沮喪和憂鬱',
    'ja': '落ち込んで憂うつだった',
    'ko': '우울하고 침울했다',
  } },
  { text: {
    'zh-Hans': '我无法容忍任何妨碍我继续做事的事物',
    'en': 'I was intolerant of anything that kept me from getting on with what I was doing',
    'zh-Hant-HK': '我無法容忍任何妨礙我繼續做事的事物',
    'zh-Hant-TW': '我無法容忍任何妨礙我繼續做事的事物',
    'ja': '自分がしていることを妨げるものに耐えられなかった',
    'ko': '하던 일을 방해하는 것을 참을 수 없었다',
  } },
  { text: {
    'zh-Hans': '我觉得自己接近恐慌',
    'en': 'I felt I was close to panic',
    'zh-Hant-HK': '我覺得自己接近恐慌',
    'zh-Hant-TW': '我覺得自己接近恐慌',
    'ja': 'パニックに近いと感じた',
    'ko': '공황에 가까운 상태라고 느꼈다',
  } },
  { text: {
    'zh-Hans': '我对任何事都提不起热情',
    'en': 'I was unable to become enthusiastic about anything',
    'zh-Hant-HK': '我對任何事都提不起熱情',
    'zh-Hant-TW': '我對任何事都提不起熱情',
    'ja': '何にも熱中できなかった',
    'ko': '어떤 일에도 열정을 가질 수 없었다',
  } },
  { text: {
    'zh-Hans': '我觉得自己作为一个人没什么价值',
    'en': 'I felt I wasn’t worth much as a person',
    'zh-Hant-HK': '我覺得自己作為一個人沒什麼價值',
    'zh-Hant-TW': '我覺得自己作為一個人沒什麼價值',
    'ja': '人間としてあまり価値がないと感じた',
    'ko': '사람으로서 별로 가치가 없다고 느꼈다',
  } },
  { text: {
    'zh-Hans': '我觉得自己相当敏感易怒',
    'en': 'I felt that I was rather touchy',
    'zh-Hant-HK': '我覺得自己相當敏感易怒',
    'zh-Hant-TW': '我覺得自己相當敏感易怒',
    'ja': 'かなり過敏だと感じた',
    'ko': '상당히 예민하다고 느꼈다',
  } },
  { text: {
    'zh-Hans': '在没有体力活动时，我也意识到心跳的情况（例如心率加快、漏跳）',
    'en': 'I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat)',
    'zh-Hant-HK': '在沒有體力活動時，我也意識到心跳的情況（例如心率加快、漏跳）',
    'zh-Hant-TW': '在沒有體力活動時，我也意識到心跳的情況（例如心率加快、漏跳）',
    'ja': '運動していないのに心臓の動きを意識した（心拍増加や欠脈など）',
    'ko': '운동하지 않을 때도 심장 박동을 의식했다(심박 증가, 부정맥 등)',
  } },
  { text: {
    'zh-Hans': '我无缘无故地感到害怕',
    'en': 'I felt scared without any good reason',
    'zh-Hant-HK': '我無緣無故地感到害怕',
    'zh-Hant-TW': '我無緣無故地感到害怕',
    'ja': 'はっきりした理由もなく怖く感じた',
    'ko': '특별한 이유 없이 무서웠다',
  } },
  { text: {
    'zh-Hans': '我觉得生命没有意义',
    'en': 'I felt that life was meaningless',
    'zh-Hant-HK': '我覺得生命沒有意義',
    'zh-Hant-TW': '我覺得生命沒有意義',
    'ja': '人生には意味がないと感じた',
    'ko': '삶이 무의미하다고 느꼈다',
  } },
],
  },
  ais: {
    id: 'ais',
    name: {
      'zh-Hans': 'AIS（阿森斯失眠量表）',
      'en': 'AIS (Athens Insomnia Scale)',
      'zh-Hant-HK': 'AIS（阿森斯失眠量表）',
      'zh-Hant-TW': 'AIS（阿森斯失眠量表）',
      'ja': 'AIS（アテネ不眠尺度）',
      'ko': 'AIS（아테네 불면증 척도）',
    },
    short: {
      'zh-Hans': '失眠评估（8题）',
      'en': 'Insomnia assessment (8 items)',
      'zh-Hant-HK': '失眠評估（8題）',
      'zh-Hant-TW': '失眠評估（8題）',
      'ja': '不眠評価（8項目）',
      'ko': '불면 평가(8문항)',
    },
    intro: {
      'zh-Hans': '请根据过去一个月内每周至少发生三次的睡眠情况作答。',
      'en': 'Please rate your sleep based on problems that occurred at least three times per week during the last month.',
      'zh-Hant-HK': '請根據過去一個月內每週至少發生三次的睡眠情況作答。',
      'zh-Hant-TW': '請根據過去一個月內每週至少發生三次的睡眠情況作答。',
      'ja': 'この1か月間、週に3回以上あった睡眠の問題について答えてください。',
      'ko': '지난 한 달 동안 주 3회 이상 발생한 수면 문제를 기준으로 답해 주세요.',
    },
    options: [],
    items: [
      {
        text: {
          'zh-Hans': '入睡时间（关灯后）',
          'en': 'Sleep induction (time to fall asleep after turning-off the lights)',
          'zh-Hant-HK': '入睡時間（關燈後）',
          'zh-Hant-TW': '入睡時間（關燈後）',
          'ja': '入眠（消灯後に眠りにつくまでの時間）',
          'ko': '입면(불을 끈 후 잠들기까지)',
        },
        options: [
          { value: 0, label: {
            'zh-Hans': '没有问题',
            'en': 'No problem',
            'zh-Hant-HK': '沒有問題',
            'zh-Hant-TW': '沒有問題',
            'ja': '問題なし',
            'ko': '문제 없음',
          } },
          { value: 1, label: {
            'zh-Hans': '稍微延迟',
            'en': 'Slightly delayed',
            'zh-Hant-HK': '稍微延遲',
            'zh-Hant-TW': '稍微延遲',
            'ja': 'やや遅い',
            'ko': '약간 지연',
          } },
          { value: 2, label: {
            'zh-Hans': '明显延迟',
            'en': 'Markedly delayed',
            'zh-Hant-HK': '明顯延遲',
            'zh-Hant-TW': '明顯延遲',
            'ja': 'かなり遅い',
            'ko': '상당히 지연',
          } },
          { value: 3, label: {
            'zh-Hans': '非常延迟或完全没睡',
            'en': 'Very delayed or did not sleep at all',
            'zh-Hant-HK': '非常延遲或完全沒睡',
            'zh-Hant-TW': '非常延遲或完全沒睡',
            'ja': '非常に遅い、または全く眠れなかった',
            'ko': '매우 지연 또는 전혀 못 잠',
          } },
        ],
      },
      {
        text: {
          'zh-Hans': '夜间醒来',
          'en': 'Awakenings during the night',
          'zh-Hant-HK': '夜間醒來',
          'zh-Hant-TW': '夜間醒來',
          'ja': '夜間の中途覚醒',
          'ko': '야간 각성',
        },
        options: [
          { value: 0, label: {
            'zh-Hans': '没有问题',
            'en': 'No problem',
            'zh-Hant-HK': '沒有問題',
            'zh-Hant-TW': '沒有問題',
            'ja': '問題なし',
            'ko': '문제 없음',
          } },
          { value: 1, label: {
            'zh-Hans': '轻微问题',
            'en': 'Minor problem',
            'zh-Hant-HK': '輕微問題',
            'zh-Hant-TW': '輕微問題',
            'ja': '軽い問題',
            'ko': '경미한 문제',
          } },
          { value: 2, label: {
            'zh-Hans': '相当大的问题',
            'en': 'Considerable problem',
            'zh-Hant-HK': '相當大的問題',
            'zh-Hant-TW': '相當大的問題',
            'ja': 'かなりの問題',
            'ko': '상당한 문제',
          } },
          { value: 3, label: {
            'zh-Hans': '严重问题或完全没睡',
            'en': 'Serious problem or did not sleep at all',
            'zh-Hant-HK': '嚴重問題或完全沒睡',
            'zh-Hant-TW': '嚴重問題或完全沒睡',
            'ja': '深刻な問題、または全く眠れなかった',
            'ko': '심각한 문제 또는 전혀 못 잠',
          } },
        ],
      },
      {
        text: {
          'zh-Hans': '比期望更早最终醒来',
          'en': 'Final awakening earlier than desired',
          'zh-Hant-HK': '比期望更早最終醒來',
          'zh-Hant-TW': '比期望更早最終醒來',
          'ja': '希望より早い最終覚醒',
          'ko': '원하는 시각보다 이른 최종 각성',
        },
        options: [
          { value: 0, label: {
            'zh-Hans': '没有更早',
            'en': 'Not earlier',
            'zh-Hant-HK': '沒有更早',
            'zh-Hant-TW': '沒有更早',
            'ja': '早くない',
            'ko': '이르지 않음',
          } },
          { value: 1, label: {
            'zh-Hans': '稍微更早',
            'en': 'A little earlier',
            'zh-Hant-HK': '稍微更早',
            'zh-Hant-TW': '稍微更早',
            'ja': '少し早い',
            'ko': '조금 이름',
          } },
          { value: 2, label: {
            'zh-Hans': '明显更早',
            'en': 'Markedly earlier',
            'zh-Hant-HK': '明顯更早',
            'zh-Hant-TW': '明顯更早',
            'ja': 'かなり早い',
            'ko': '상당히 이름',
          } },
          { value: 3, label: {
            'zh-Hans': '非常早或完全没睡',
            'en': 'Much earlier or did not sleep at all',
            'zh-Hant-HK': '非常早或完全沒睡',
            'zh-Hant-TW': '非常早或完全沒睡',
            'ja': '非常に早い、または全く眠れなかった',
            'ko': '매우 이름 또는 전혀 못 잠',
          } },
        ],
      },
      {
        text: {
          'zh-Hans': '总睡眠时长',
          'en': 'Total sleep duration',
          'zh-Hant-HK': '總睡眠時長',
          'zh-Hant-TW': '總睡眠時長',
          'ja': '総睡眠時間',
          'ko': '총 수면 시간',
        },
        options: [
          { value: 0, label: {
            'zh-Hans': '充足',
            'en': 'Sufficient',
            'zh-Hant-HK': '充足',
            'zh-Hant-TW': '充足',
            'ja': '十分',
            'ko': '충분',
          } },
          { value: 1, label: {
            'zh-Hans': '稍微不足',
            'en': 'Slightly insufficient',
            'zh-Hant-HK': '稍微不足',
            'zh-Hant-TW': '稍微不足',
            'ja': 'やや不足',
            'ko': '약간 부족',
          } },
          { value: 2, label: {
            'zh-Hans': '明显不足',
            'en': 'Markedly insufficient',
            'zh-Hant-HK': '明顯不足',
            'zh-Hant-TW': '明顯不足',
            'ja': 'かなり不足',
            'ko': '상당히 부족',
          } },
          { value: 3, label: {
            'zh-Hans': '非常不足或完全没睡',
            'en': 'Very insufficient or did not sleep at all',
            'zh-Hant-HK': '非常不足或完全沒睡',
            'zh-Hant-TW': '非常不足或完全沒睡',
            'ja': '非常に不足、または全く眠れなかった',
            'ko': '매우 부족 또는 전혀 못 잠',
          } },
        ],
      },
      {
        text: {
          'zh-Hans': '整体睡眠质量（不论睡眠时长）',
          'en': 'Sleep quality (regardless of sleep duration)',
          'zh-Hant-HK': '整體睡眠質素（不論睡眠時長）',
          'zh-Hant-TW': '整體睡眠品質（不論睡眠時長）',
          'ja': '睡眠の質（時間にかかわらず）',
          'ko': '수면의 질(시간과 무관)',
        },
        options: [
          { value: 0, label: {
            'zh-Hans': '满意',
            'en': 'Satisfactory',
            'zh-Hant-HK': '滿意',
            'zh-Hant-TW': '滿意',
            'ja': '満足',
            'ko': '만족',
          } },
          { value: 1, label: {
            'zh-Hans': '稍微不满意',
            'en': 'Slightly unsatisfactory',
            'zh-Hant-HK': '稍微不滿意',
            'zh-Hant-TW': '稍微不滿意',
            'ja': 'やや不満足',
            'ko': '약간 불만족',
          } },
          { value: 2, label: {
            'zh-Hans': '明显不满意',
            'en': 'Markedly unsatisfactory',
            'zh-Hant-HK': '明顯不滿意',
            'zh-Hant-TW': '明顯不滿意',
            'ja': 'かなり不満足',
            'ko': '상당히 불만족',
          } },
          { value: 3, label: {
            'zh-Hans': '非常不满意或完全没睡',
            'en': 'Very unsatisfactory or did not sleep at all',
            'zh-Hant-HK': '非常不滿意或完全沒睡',
            'zh-Hant-TW': '非常不滿意或完全沒睡',
            'ja': '非常に不満足、または全く眠れなかった',
            'ko': '매우 불만족 또는 전혀 못 잠',
          } },
        ],
      },
      {
        text: {
          'zh-Hans': '白天的幸福感',
          'en': 'Well-being during the day',
          'zh-Hant-HK': '白天的幸福感',
          'zh-Hant-TW': '白天的幸福感',
          'ja': '日中の気分の良さ',
          'ko': '낮 동안의 안녕감',
        },
        options: [
          { value: 0, label: {
            'zh-Hans': '正常',
            'en': 'Normal',
            'zh-Hant-HK': '正常',
            'zh-Hant-TW': '正常',
            'ja': '普通',
            'ko': '정상',
          } },
          { value: 1, label: {
            'zh-Hans': '稍微下降',
            'en': 'Slightly decreased',
            'zh-Hant-HK': '稍微下降',
            'zh-Hant-TW': '稍微下降',
            'ja': 'やや低下',
            'ko': '약간 감소',
          } },
          { value: 2, label: {
            'zh-Hans': '明显下降',
            'en': 'Markedly decreased',
            'zh-Hant-HK': '明顯下降',
            'zh-Hant-TW': '明顯下降',
            'ja': 'かなり低下',
            'ko': '상당히 감소',
          } },
          { value: 3, label: {
            'zh-Hans': '非常下降',
            'en': 'Very decreased',
            'zh-Hant-HK': '非常下降',
            'zh-Hant-TW': '非常下降',
            'ja': '非常に低下',
            'ko': '매우 감소',
          } },
        ],
      },
      {
        text: {
          'zh-Hans': '白天的身体与心理功能',
          'en': 'Functioning (physical and mental) during the day',
          'zh-Hant-HK': '白天的身體與心理功能',
          'zh-Hant-TW': '白天的身體與心理功能',
          'ja': '日中の身体・精神機能',
          'ko': '낮 동안의 신체·정신 기능',
        },
        options: [
          { value: 0, label: {
            'zh-Hans': '正常',
            'en': 'Normal',
            'zh-Hant-HK': '正常',
            'zh-Hant-TW': '正常',
            'ja': '普通',
            'ko': '정상',
          } },
          { value: 1, label: {
            'zh-Hans': '稍微下降',
            'en': 'Slightly decreased',
            'zh-Hant-HK': '稍微下降',
            'zh-Hant-TW': '稍微下降',
            'ja': 'やや低下',
            'ko': '약간 감소',
          } },
          { value: 2, label: {
            'zh-Hans': '明显下降',
            'en': 'Markedly decreased',
            'zh-Hant-HK': '明顯下降',
            'zh-Hant-TW': '明顯下降',
            'ja': 'かなり低下',
            'ko': '상당히 감소',
          } },
          { value: 3, label: {
            'zh-Hans': '非常下降',
            'en': 'Very decreased',
            'zh-Hant-HK': '非常下降',
            'zh-Hant-TW': '非常下降',
            'ja': '非常に低下',
            'ko': '매우 감소',
          } },
        ],
      },
      {
        text: {
          'zh-Hans': '白天的困倦',
          'en': 'Sleepiness during the day',
          'zh-Hant-HK': '白天的困倦',
          'zh-Hant-TW': '白天的困倦',
          'ja': '日中の眠気',
          'ko': '낮 동안의 졸음',
        },
        options: [
          { value: 0, label: {
            'zh-Hans': '没有',
            'en': 'None',
            'zh-Hant-HK': '沒有',
            'zh-Hant-TW': '沒有',
            'ja': 'なし',
            'ko': '없음',
          } },
          { value: 1, label: {
            'zh-Hans': '轻度',
            'en': 'Mild',
            'zh-Hant-HK': '輕度',
            'zh-Hant-TW': '輕度',
            'ja': '軽度',
            'ko': '경도',
          } },
          { value: 2, label: {
            'zh-Hans': '相当明显',
            'en': 'Considerable',
            'zh-Hant-HK': '相當明顯',
            'zh-Hant-TW': '相當明顯',
            'ja': 'かなり',
            'ko': '상당함',
          } },
          { value: 3, label: {
            'zh-Hans': '强烈',
            'en': 'Intense',
            'zh-Hant-HK': '強烈',
            'zh-Hant-TW': '強烈',
            'ja': '強い',
            'ko': '심함',
          } },
        ],
      },
    ],
  },
}


/** DASS-21 0-based item indices for subscales. */
const DASS_DEP = [2, 4, 9, 12, 15, 16, 20] as const
const DASS_ANX = [1, 3, 6, 8, 14, 18, 19] as const
const DASS_STR = [0, 5, 7, 10, 11, 13, 17] as const

export type ContrastBandKey =
  | 'none'
  | 'minimal'
  | 'mild'
  | 'moderate'
  | 'modSevere'
  | 'severe'
  | 'extreme'
  | 'low'
  | 'medium'
  | 'high'
  | 'normal'
  | 'screenPos'
  | 'screenNeg'
  | 'insomnia'
  | 'noInsomnia'
  | 'whoLow'
  | 'whoOk'

export interface ContrastScoreResult {
  scores: Record<string, number>
  /** MessageKey suffix after contrast.band. — resolved in UI */
  bands: Record<string, ContrastBandKey>
  /** Soft flag for PHQ-9 item 9 > 0 */
  crisisFlag?: boolean
}

function sum(answers: number[]): number {
  return answers.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)
}

function phq9Band(t: number): ContrastBandKey {
  if (t <= 4) return 'none'
  if (t <= 9) return 'mild'
  if (t <= 14) return 'moderate'
  if (t <= 19) return 'modSevere'
  return 'severe'
}

function gad7Band(t: number): ContrastBandKey {
  if (t <= 4) return 'minimal'
  if (t <= 9) return 'mild'
  if (t <= 14) return 'moderate'
  return 'severe'
}

function phq15Band(t: number): ContrastBandKey {
  if (t <= 4) return 'minimal'
  if (t <= 9) return 'low'
  if (t <= 14) return 'medium'
  return 'high'
}

function dassDepBand(t: number): ContrastBandKey {
  if (t <= 9) return 'normal'
  if (t <= 13) return 'mild'
  if (t <= 20) return 'moderate'
  if (t <= 27) return 'severe'
  return 'extreme'
}

function dassAnxBand(t: number): ContrastBandKey {
  if (t <= 7) return 'normal'
  if (t <= 9) return 'mild'
  if (t <= 14) return 'moderate'
  if (t <= 19) return 'severe'
  return 'extreme'
}

function dassStrBand(t: number): ContrastBandKey {
  if (t <= 14) return 'normal'
  if (t <= 18) return 'mild'
  if (t <= 25) return 'moderate'
  if (t <= 33) return 'severe'
  return 'extreme'
}

export function scoreContrastScale(
  scaleId: ContrastScaleId,
  answers: number[],
): ContrastScoreResult {
  const def = CONTRAST_SCALES[scaleId]
  if (answers.length !== def.items.length) {
    throw new Error(`Expected ${def.items.length} answers for ${scaleId}`)
  }

  switch (scaleId) {
    case 'phq9': {
      const total = sum(answers)
      return {
        scores: { total },
        bands: { total: phq9Band(total) },
        crisisFlag: (answers[8] ?? 0) > 0,
      }
    }
    case 'gad7': {
      const total = sum(answers)
      return { scores: { total }, bands: { total: gad7Band(total) } }
    }
    case 'phq2': {
      const total = sum(answers)
      return {
        scores: { total },
        bands: { total: total >= 3 ? 'screenPos' : 'screenNeg' },
      }
    }
    case 'gad2': {
      const total = sum(answers)
      return {
        scores: { total },
        bands: { total: total >= 3 ? 'screenPos' : 'screenNeg' },
      }
    }
    case 'phq15': {
      const total = sum(answers)
      return { scores: { total }, bands: { total: phq15Band(total) } }
    }
    case 'who5': {
      const raw = sum(answers)
      const percent = raw * 4
      return {
        scores: { total: raw, percent },
        bands: { total: raw < 13 ? 'whoLow' : 'whoOk' },
      }
    }
    case 'dass21': {
      const dep = sum(DASS_DEP.map((i) => answers[i]!)) * 2
      const anx = sum(DASS_ANX.map((i) => answers[i]!)) * 2
      const str = sum(DASS_STR.map((i) => answers[i]!)) * 2
      return {
        scores: { depression: dep, anxiety: anx, stress: str },
        bands: {
          depression: dassDepBand(dep),
          anxiety: dassAnxBand(anx),
          stress: dassStrBand(str),
        },
      }
    }
    case 'ais': {
      const total = sum(answers)
      return {
        scores: { total },
        bands: { total: total >= 6 ? 'insomnia' : 'noInsomnia' },
      }
    }
  }
}

export function getScaleOptions(
  scale: ContrastScaleDef,
  itemIndex: number,
): ContrastOption[] {
  const item = scale.items[itemIndex]
  if (item?.options?.length) return item.options
  return scale.options
}
