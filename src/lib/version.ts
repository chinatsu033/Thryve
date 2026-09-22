/** App marketing version (Settings / Release). */
export const APP_VERSION = '0.12.0'
export const APP_VERSION_LABEL = 'Ver 0.12'

/** Latest notes use i18n keys; older entries keep zh-Hans historical text. */
export const APP_CHANGELOG: { version: string; notes: string[] }[] = [
  {
    version: '0.12.0',
    notes: [
      'changelog.0.12.0.1',
      'changelog.0.12.0.2',
      'changelog.0.12.0.3',
    ],
  },
  {
    version: '0.1.4',
    notes: ['changelog.0.1.4.1'],
  },
  {
    version: '0.1.3',
    notes: ['changelog.0.1.3.1', 'changelog.0.1.3.2', 'changelog.0.1.3.3'],
  },
  {
    version: '0.1.2',
    notes: [
      '全应用多语言界面（简中 / 英 / 繁中港台 / 日 / 韩）与锁定模块名',
      '切换语言时同步更新 html lang 与 date-fns 日期格式',
    ],
  },
  {
    version: '0.1.0',
    notes: ['新增用药日历', '修改主页上滑返回开始页过于灵敏问题'],
  },
]
