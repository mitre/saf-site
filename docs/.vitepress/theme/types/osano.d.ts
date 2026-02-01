// Osano consent manager types
interface OsanoConsentManager {
  showDrawer: (type: string) => void
}

interface Osano {
  cm: OsanoConsentManager
}

declare global {
  interface Window {
    Osano?: Osano
  }
}

export {}
