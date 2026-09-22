/** App marketing version (Settings / Release). */
export const APP_VERSION = '0.1.1'
export const APP_VERSION_LABEL = 'Ver 0.1.1'

export const APP_CHANGELOG: { version: string; notes: string[] }[] = [
  {
    version: '0.1.1',
    notes: [
      '多地区紧急求助热线（香港 / 澳门 / 中国大陆 / 台湾地区 / 日本 / 南韩 / 新马 / 英美等）',
      '首次启动地区 + 语言引导；设置可重新选择',
      '危机页可切换地区并即时更新热线',
    ],
  },
  {
    version: '0.1.0',
    notes: ['新增用药日历', '修改主页上滑返回开始页过于灵敏问题', '新增中国大陆心理紧急求助页'],
  },
]
