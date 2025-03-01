import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../hooks/useAuth"
import { useTheme } from "../context/ThemeContext"
import { IconLogin2, IconUserPlus, IconSun, IconMoon, IconMenu2, IconX } from "@tabler/icons-react"

function NavLink({ to, children }) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={`relative flex items-center px-3 py-2 text-gray-300 hover:text-white transition-colors ${
        isActive ? "text-white" : ""
      }`}
    >
      {children}
      {isActive && (
        <motion.span
          layoutId="navbar-active"
          className="absolute inset-0 border border-white/50 rounded-full -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </Link>
  )
}

function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isAdminRoute = location.pathname.startsWith("/admin")

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setIsMobileMenuOpen(false)
    navigate(isAdminRoute ? "/admin/login" : "/")
  }

  const navList = (
    <ul className="flex flex-col gap-4 w-full lg:flex-row lg:items-center lg:gap-6">
      <li>
        <button
          onClick={toggleTheme}
          className="flex items-center px-3 py-2 text-gray-300 hover:text-white transition-colors w-full lg:w-auto"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
          <span className="ml-2 lg:hidden">Toggle Theme</span>
        </button>
      </li>
      {isAuthenticated && (
        <>
          {isAdmin ? (
            <li>
              <NavLink to="/admin/dashboard">Admin</NavLink>
            </li>
          ) : (
            <>
              <li>
                <NavLink to="/challenges">Challenges</NavLink>
              </li>
              <li>
                <NavLink to="/scoreboard">Scoreboard</NavLink>
              </li>
              <li>
                <NavLink to="/team/profile">Team</NavLink>
              </li>
            </>
          )}
        </>
      )}
    </ul>
  )

  const authButtons = (
    <div className="flex flex-col w-full gap-3 mt-4 lg:mt-0 lg:flex-row lg:w-auto">
      {!isAuthenticated ? (
        <>
          <Link
            to={isAdminRoute ? "/admin/login" : "/login"}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <IconLogin2 size={20} />
            Login
          </Link>
          {!isAdminRoute && (
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <IconUserPlus size={20} />
              Register
            </Link>
          )}
        </>
      ) : (
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors w-full lg:w-auto"
        >
          Logout
        </button>
      )}
    </div>
  )

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-neutral-800 px-4 py-2 lg:px-8 transition-all duration-300 ${
        scrolled ? "bg-neutral-900/90" : "bg-neutral-900/80"
      }`}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link to={user?.isAdmin ? "/admin/dashboard" : "/"} className="font-mario text-xl text-white">
          Atlas
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-between flex-1 ml-6">
          <div className="flex-1 ml-80">{navList}</div>
          <div className="flex gap-2">{authButtons}</div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-white p-2 ml-auto"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
        </button>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-x-0 top-[57px] bg-neutral-900/95 lg:hidden border-b border-neutral-800 overflow-hidden"
            >
              <div className="flex flex-col p-6 space-y-4 max-h-[calc(100vh-57px)] overflow-y-auto">
                {navList}
                {authButtons}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

export default Navbar

