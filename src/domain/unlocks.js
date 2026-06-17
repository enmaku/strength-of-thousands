const CLASSROOM_ADVANTAGE_THRESHOLD = 3
const UNCOMMON_RULES_THRESHOLD = 5

export function deriveUnlocks(hearts) {
  const count = Math.max(0, Math.min(5, hearts))
  return {
    classroomAdvantage: count >= CLASSROOM_ADVANTAGE_THRESHOLD,
    uncommonRules: count >= UNCOMMON_RULES_THRESHOLD,
  }
}
