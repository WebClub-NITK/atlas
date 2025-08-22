import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiClient from '../api/config'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [themeConfig, setThemeConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const applyVars = useCallback(cfg => {
    if (!cfg) return
    const r = document.documentElement
    r.style.setProperty('--color-primary', cfg.primary_color || '#ffffffff')
    r.style.setProperty('--color-secondary', cfg.secondary_color || '#1f2937')
    r.style.setProperty('--color-accent', cfg.accent_color || '#FB3E3C')
    r.style.setProperty('--font-family-custom', cfg.font_family || 'ui-sans-serif, system-ui')

    // Handle custom CSS injection
    let styleTag = document.getElementById('custom-theme-css');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'custom-theme-css';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = cfg.custom_css || '';
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newIsDarkMode = !prev
      document.body.classList.toggle('dark-layout', newIsDarkMode)
      return newIsDarkMode
    })
  }, [])

  useEffect(() => {
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(prefersDarkMode)
    document.body.classList.toggle('dark-layout', prefersDarkMode)
  }, [])

  const fetchTheme = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get(`/api/theme/?_=${new Date().getTime()}`)
      const data = res.data
      setThemeConfig(data)
      applyVars(data)
    } catch (e) {
      setError(e.message)
      const fallback = {
        site_name: 'Atlas',
        logo: null,
        primary_color: '#000000',
        secondary_color: '#1f2937',
        accent_color: '#FB3E3C',
        font_family: 'ui-sans-serif, system-ui',
        custom_css: ''
      }
      // Use functional update to avoid stale state
      setThemeConfig(prev => prev || fallback)
      applyVars(fallback)
    } finally {
      setLoading(false)
    }
  }, [applyVars])

  useEffect(() => {
    if (!themeConfig) {
      fetchTheme()
    }
  }, [fetchTheme, themeConfig])

  useEffect(() => {
    document.body.classList.toggle('dark-layout', isDarkMode)
  }, [isDarkMode])

  // Update page title from theme config
  useEffect(() => {
    const siteName = themeConfig?.site_name || 'Atlas'
    if (document.title !== siteName) {
      document.title = siteName
    }
  }, [themeConfig])

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleTheme,
      themeConfig,
      themeLoading: loading,
      themeError: error,
      refreshTheme: fetchTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext)
}
