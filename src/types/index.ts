export interface ThemeConfig {
  primary: string
  accent: string
  surface: string
}

export interface MedicalHistory {
  diagnoses: string
  medications: string
  allergies: string
  notes: string
  skipped: boolean
}

/** Cloud profile (maps to public.profiles; id = auth.uid()). */
export interface Profile {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt?: string
  theme: ThemeConfig
  /** Kept for export compatibility; not stored in cloud MVP schema. */
  medicalHistory?: MedicalHistory
  onboardingDone?: boolean
}

export type EmotionMode = 'current' | 'daily'

/** mood: 1–100 (legacy rows may still be 1–10 without `sources`). */
export interface EmotionEntry {
  id: string
  profileId: string
  mode: EmotionMode
  mood: number
  tags: string[]
  /** Where the feeling comes from (absent on legacy 1–10 rows). */
  sources?: string[]
  notes: string
  recordedAt: string
  createdAt: string
}

/** quality: 1–7 (永夜→日光); legacy rows may still be 1–10. interruptions kept for old data (new saves use 0). */
export interface SleepEntry {
  id: string
  profileId: string
  date: string
  bedtime: string
  wakeTime: string
  quality: number
  interruptions: number
  notes: string
  createdAt: string
}

/** appetite: 1–5 (闭塞→饱满); legacy rows may still be 1–10. meals derived from appetite on new saves. */
export interface EatingEntry {
  id: string
  profileId: string
  date: string
  meals: number
  appetite: number
  notes: string
  createdAt: string
}

export interface DepressiveChecklist {
  lowEnergy: boolean
  anhedonia: boolean
  sleepChange: boolean
  appetiteChange: boolean
  guilt: boolean
  concentration: boolean
  psychomotor: boolean
  suicidalThoughts: boolean
}

export interface DepressiveEntry {
  id: string
  profileId: string
  startedAt: string
  endedAt: string | null
  feelings: string
  severity: number
  checklist: DepressiveChecklist
  notes: string
  createdAt: string
}

export interface AttachmentMeta {
  id: string
  profileId: string
  name: string
  mimeType: string
  size: number
  createdAt: string
  note: string
}

export interface ProfileExport {
  version: 1
  exportedAt: string
  profile: Omit<Profile, 'email'> & { email?: string }
  emotions: EmotionEntry[]
  sleeps: SleepEntry[]
  eatings: EatingEntry[]
  depressives: DepressiveEntry[]
  attachments: Array<AttachmentMeta & { dataBase64: string }>
}

/** @deprecated Prefer POSITIVE/NEGATIVE sets in lib/mood — kept for any leftover refs */
export const EMOTION_TAGS = [
  '焦虑',
  '平静',
  '悲伤',
  '喜悦',
  '愤怒',
  '疲惫',
  '孤独',
  '希望',
  '恐惧',
  '感激',
  '麻木',
  '烦躁',
] as const

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  暖阳橙: { primary: '#FF8A65', accent: '#FFD54F', surface: '#FFF8F3' },
  草木绿: { primary: '#43A047', accent: '#26A69A', surface: '#F3FAF4' },
  暮紫: { primary: '#7E57C2', accent: '#EC407A', surface: '#F8F5FC' },
  雾灰: { primary: '#607D8B', accent: '#90A4AE', surface: '#F5F7F8' },
}

export const DEFAULT_THEME: ThemeConfig = THEME_PRESETS['暖阳橙']

export const DEFAULT_CHECKLIST: DepressiveChecklist = {
  lowEnergy: false,
  anhedonia: false,
  sleepChange: false,
  appetiteChange: false,
  guilt: false,
  concentration: false,
  psychomotor: false,
  suicidalThoughts: false,
}

export const CHECKLIST_LABELS: Record<keyof DepressiveChecklist, string> = {
  lowEnergy: '精力下降 / 易疲劳',
  anhedonia: '兴趣减退 / 快感缺失',
  sleepChange: '睡眠明显改变',
  appetiteChange: '食欲或体重改变',
  guilt: '过度自责或无价值感',
  concentration: '注意力 / 决策困难',
  psychomotor: '动作迟缓或烦躁不安',
  suicidalThoughts: '消极念头或自伤想法',
}
