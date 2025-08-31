import React, { useState } from "react";
import { Lock, Users, UserCheck } from "lucide-react";

const Login = ({ onLogin }) => {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (accessCode === process.env.REACT_APP_ADMIN_CODE) {
      onLogin("admin");
    } else if (accessCode === process.env.REACT_APP_TEAM_CODE) {
      onLogin("team");
    } else {
      setError("Invalid access code. Please try again.");
      setAccessCode("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">FIU Capstone Team</h1>
          <p className="text-gray-600">Document Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
              Access Code
            </label>
            <input
              type="password"
              id="accessCode"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your access code"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
          >
            Enter
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center">
                <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                <span>Admin Access</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-blue-600" />
                <span>Team Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login
