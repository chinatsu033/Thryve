/** Mood scale helpers: new entries use 1–100; legacy was 1–10. */

export function isLegacyMoodEntry(entry: { mood: number; sources?: string[] }): boolean {
  return entry.sources === undefined && entry.mood >= 1 && entry.mood <= 10
}

/** Normalize stored mood to 1–100 for charts/display. */
export function normalizeMood(mood: number, entry?: { sources?: string[] }): number {
  if (entry && isLegacyMoodEntry({ mood, sources: entry.sources })) {
    return Math.min(100, Math.max(1, Math.round(mood * 10)))
  }
  // Heuristic without entry metadata: values ≤10 are almost always legacy 1–10
  if (entry === undefined && mood >= 1 && mood <= 10) {
    return Math.min(100, Math.max(1, Math.round(mood * 10)))
  }
  return Math.min(100, Math.max(1, Math.round(mood)))
}

/** 11 emotion states from 低谷 → 盛放 (maps continuous 1–100). */
export const MOOD_LABELS = [
  '低谷',
  '长夜',
  '阴霾',
  '破晓',
  '微风',
  '平稳',
  '暖阳',
  '清朗',
  '跃动',
  '璀璨',
  '盛放',
] as const

export type MoodLabel = (typeof MOOD_LABELS)[number]

/** Index 0–10 for mood 1–100. */
export function moodLabelIndex(mood100: number): number {
  const m = Math.min(100, Math.max(1, Math.round(mood100)))
  return Math.min(10, Math.floor(((m - 1) * 11) / 100))
}

export function moodSoftLabel(mood100: number): MoodLabel {
  return MOOD_LABELS[moodLabelIndex(mood100)]
}

/** @deprecated alias — use moodSoftLabel */
export type MoodBand = MoodLabel
export function moodBand(mood100: number): MoodLabel {
  return moodSoftLabel(mood100)
}

/** ~4 rows of chips at typical mobile width. */
export const POSITIVE_EMOTION_WORDS = [
  '平静',
  '喜悦',
  '希望',
  '感激',
  '轻松',
  '满足',
  '安心',
  '兴奋',
  '温暖',
  '自信',
  '好奇',
  '温柔',
  '快乐',
  '舒畅',
  '开朗',
  '充实',
  '踏实',
  '释然',
  '雀跃',
  '振奋',
] as const

export const NEGATIVE_EMOTION_WORDS = [
  '悲伤',
  '焦虑',
  '愤怒',
  '疲惫',
  '孤独',
  '恐惧',
  '麻木',
  '烦躁',
  '无助',
  '自责',
  '紧张',
  '失落',
  '沮丧',
  '委屈',
  '愧疚',
  '压抑',
  '慌乱',
  '空虚',
  '无力',
  '伤心',
] as const

export const NEUTRAL_EMOTION_WORDS = [
  '平静',
  '疲惫',
  '沉稳',
  '淡然',
  '纠结',
  '放松',
  '迷茫',
  '期待',
  '迟钝',
  '还好',
  '普通',
  '一般',
  '说不清',
  '波动',
  '犹豫',
  '观望',
] as const

/** ~3 rows of chips at typical mobile width. */
export const EMOTION_SOURCE_WORDS = [
  '工作',
  '家人',
  '朋友',
  '薪水',
  '健康',
  '学习',
  '恋爱',
  '自己',
  '睡眠',
  '天气',
  '社交',
  '学业',
  '通勤',
  '媒体',
  '回忆',
  '其他',
] as const

export function emotionWordsForMood(mood: number): readonly string[] {
  const i = moodLabelIndex(mood)
  // 平稳(5) neutral; below → negative; above → positive
  if (i > 5) return POSITIVE_EMOTION_WORDS
  if (i < 5) return NEGATIVE_EMOTION_WORDS
  return NEUTRAL_EMOTION_WORDS
}

/** i18n key for soft mood label (mood.0 … mood.10). */
export function moodSoftLabelKey(mood100: number): `mood.${number}` {
  return `mood.${moodLabelIndex(mood100)}`
}
