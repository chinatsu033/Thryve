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

export type MoodBand = '低谷' | '偏低' | '平稳' | '偏暖' | '盛放'

export function moodBand(mood100: number): MoodBand {
  if (mood100 <= 20) return '低谷'
  if (mood100 <= 40) return '偏低'
  if (mood100 <= 60) return '平稳'
  if (mood100 <= 80) return '偏暖'
  return '盛放'
}

/** Soft 3-band label for list cards. */
export function moodSoftLabel(mood100: number): '低谷' | '平稳' | '盛放' {
  if (mood100 < 40) return '低谷'
  if (mood100 <= 60) return '平稳'
  return '盛放'
}

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
] as const

export const EMOTION_SOURCE_WORDS = [
  '工作',
  '家人',
  '朋友',
  '薪水',
  '健康',
  '学习',
  '恋爱',
  '自己',
  '其他',
] as const

export function emotionWordsForMood(mood: number): readonly string[] {
  if (mood > 50) return POSITIVE_EMOTION_WORDS
  if (mood < 50) return NEGATIVE_EMOTION_WORDS
  return NEUTRAL_EMOTION_WORDS
}
