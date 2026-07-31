export interface TechnologyDependency {
  name: string
  packageName: string
  category: string
  role: string
  version: string
}

export interface BuildInfo {
  version: string
  builtAt: string
  dependencies: TechnologyDependency[]
}
