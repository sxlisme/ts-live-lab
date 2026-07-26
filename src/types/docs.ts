export interface DocsExample {
  title: string
  code: string
  language?: 'typescript' | 'javascript' | 'json'
}

export interface DocsCallout {
  kind: 'note' | 'warning' | 'tip'
  title: string
  content: string
}

export interface DocsTopic {
  id: string
  title: string
  paragraphs: string[]
  points?: string[]
  examples?: DocsExample[]
  callout?: DocsCallout
}

export interface DocsSection {
  id: string
  groupId: string
  title: string
  shortTitle: string
  description: string
  paragraphs: string[]
  topics: DocsTopic[]
  notes?: string[]
  relatedIds?: string[]
  sourceUrl: string
}

export interface DocsGroup {
  id: string
  title: string
  description: string
  sections: DocsSection[]
}
