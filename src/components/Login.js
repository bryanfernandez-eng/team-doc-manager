"use client"

import { useState } from "react"
import { Lock, User, UserCheck, Zap, Shield, Eye, EyeOff } from "lucide-react"

const Login = ({ onLogin }) => {
  const [accessCode, setAccessCode] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (accessCode === process.env.REACT_APP_ADMIN_CODE) {
      onLogin("admin")
    } else if (accessCode === process.env.REACT_APP_TEAM_CODE) {
      onLogin("team")
    } else {
      setError("Invalid access code. Please try again.")
      setAccessCode("")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-3/4 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute inset-0">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl animate-pulse"></div>

          <div className="relative bg-gray-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"></div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="text-center mb-6 sm:mb-8">
                <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-spin-slow"></div>
                  <div className="absolute inset-1 bg-gray-900 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    FIU CAPSTONE TEAM
                  </span>
                </h1>

                <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4">Capstone 2 Document Hub</p>
                <div className="w-20 sm:w-24 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto rounded-full"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="space-y-2">
                  <label htmlFor="accessCode" className="block text-sm font-medium text-cyan-300 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Access Code
                  </label>

                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="accessCode"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      className="w-full px-4 py-3 sm:py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white placeholder-gray-400 transition-all duration-300 pr-12 text-base"
                      placeholder="Enter your access code"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors duration-200 p-1"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-center animate-shake">
                    <Lock className="w-5 h-5 mx-auto mb-2" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !accessCode.trim()}
                  className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 p-px transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[48px]"
                >
                  <div className="relative bg-gray-900 rounded-xl px-6 py-3 group-hover:bg-transparent transition-colors duration-300">
                    <div className="flex items-center justify-center space-x-2">
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="text-white font-medium">Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 text-white" />
                          <span className="text-white font-medium">Access System</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              </form>

              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-700/50">
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center space-x-4 sm:space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <UserCheck className="w-4 h-4 text-cyan-400" />
                      <span className="text-gray-300">Admin</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-500"></div>
                      <User className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300">Team</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center justify-center space-x-2">
                    <Shield className="w-3 h-3" />
                    <span>Secure Authentication • Powered by Firebase</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-scan { animation: scan 3s linear infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  )
}

export default Login
