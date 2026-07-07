import { mergeStudyPatch, normalizeStudy } from './study.js'

export class StudyValidationError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'StudyValidationError'
    this.status = status
  }
}

export function applyStudyPatch(hero, patch) {
  const result = mergeStudyPatch(hero.study, patch)
  if (!result.ok) {
    throw new StudyValidationError(result.error)
  }

  const nextHero = {
    ...hero,
    study: result.study,
  }

  const { study, changed } = normalizeStudy(nextHero)
  nextHero.study = study

  return { hero: nextHero, normalized: changed }
}

export function applyStudyAfterRefresh(hero) {
  const { study, changed } = normalizeStudy(hero)
  if (!changed && hero.study) {
    return hero
  }
  return { ...hero, study }
}
