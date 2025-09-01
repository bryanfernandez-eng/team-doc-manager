# FIU Capstone Team Document Manager

A centralized hub for managing capstone project documents, assignments, and team resources with role-based access control.

## 🎯 Why This Exists

Built to solve **team organization chaos**. As our FIU Capstone team grew, we were drowning in:
- Scattered documents across Google Drive, Slack, and email
- Lost assignment deadlines and submission links  
- Confusion about what's done vs. in-progress
- No central place for project resources

This app gives us **one organized hub** where everyone knows exactly what needs to be done, when it's due, and where to find everything.

## 🛠️ Tech Stack

- **Frontend**: React 19.1.1 + Tailwind CSS
- **Backend**: Firebase Firestore
- **Icons**: Lucide React  
- **Deployment**: Netlify

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd team-doc-manager
   npm install
   ```

2. **Environment Setup** - Create `.env`:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   
   REACT_APP_ADMIN_CODE=your_admin_code
   REACT_APP_TEAM_CODE=your_team_code
   ```

3. **Run Locally**
   ```bash
   npm start
   ```

## 🌐 Live Demo

**[View Live Application](https://fiucapstone2.netlify.app/)** 

- **Admin Access**: Full document management
- **Team Access**: Read-only document viewing

## 🏗️ Features

- **Document Management**: Add, edit, categorize assignments
- **Progress Tracking**: Status updates and due dates  
- **Role-Based Access**: Admin controls + team view
- **Search & Filter**: Find documents quickly
- **Useful Links**: Centralized project resources
- **Real-time Sync**: Firebase-powered live updates

Perfect for capstone teams, student projects, or any group needing organized document collaboration.

---

**Built by FIU Capstone Team | Deployed on Netlify**
