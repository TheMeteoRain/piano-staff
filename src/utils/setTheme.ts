export type ThemeOption = 'Dark' | 'Light' | 'System' | undefined | null
export const THEME_ATTRIBUTE_KEY = 'data-theme'

function setTheme(newTheme?: string) {
  const theme = (
    newTheme
      ? (newTheme as ThemeOption)
      : (localStorage.getItem('theme') as ThemeOption)
  )?.toLowerCase()
  const prefersDarkScheme = window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches

  if (prefersDarkScheme && (!theme || theme === 'system')) {
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute(THEME_ATTRIBUTE_KEY, 'dark')
  } else if (theme === 'dark') {
    document.documentElement.classList.add(theme)
    document.documentElement.classList.remove('light')
    document.documentElement.setAttribute(THEME_ATTRIBUTE_KEY, theme)
  } else if (theme === 'light') {
    document.documentElement.classList.add(theme)
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute(THEME_ATTRIBUTE_KEY, theme)
  }
}

export default setTheme
