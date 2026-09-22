/** Stable security-question ids; labels via i18n `security.q.<id>`. */
export const SECURITY_QUESTION_IDS = [
  'pet',
  'city',
  'school',
  'motherMaiden',
  'teacher',
  'street',
  'book',
  'friend',
  'food',
  'birthplace',
] as const

export type SecurityQuestionId = (typeof SECURITY_QUESTION_IDS)[number]

export function questionLabelKey(id: string): string {
  return `security.q.${id}`
}
