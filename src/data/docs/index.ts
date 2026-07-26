import type { DocsGroup } from '@/types/docs'
import { engineeringDocs } from './engineering'
import { fundamentalsDocs } from './fundamentals'
import { typeManipulationDocs } from './type-manipulation'
import { typeSystemDocs } from './type-system'

export const docsGroups: DocsGroup[] = [
  fundamentalsDocs,
  typeSystemDocs,
  typeManipulationDocs,
  engineeringDocs,
]

export const docsSections = docsGroups.flatMap((group) => group.sections)

export function findDocsSection(id: string) {
  return docsSections.find((section) => section.id === id)
}
