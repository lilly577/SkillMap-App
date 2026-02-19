# Tech Skill Matchmaker - Frontend

A real-time, web-based skill-matching platform for tech professionals and hiring companies.

## Features

- **Tech Specialist Profiles** - Complete registration with CV upload
- **Company Profiles** - Company registration and job posting
- **Real-Time Matching** - Algorithm-based candidate-job matching
- **Dashboards** - Personalized views for specialists and companies
- **Real-Time Chat** - Built-in messaging system (WebSocket ready)
- **Video Interviews** - Integrated video conferencing (WebRTC ready)
- **Email Notifications** - Automated match alerts
- **Professional UI** - Modern design with blue/purple gradient theme

## Tech Stack

**Frontend (This Repository):**
- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- React Router
- React Query

**Backend (Your Implementation):**
- Node.js
- MongoDB
- WebSockets (for chat)
- WebRTC (for video)
- Email Service (SendGrid/AWS SES)

## Project Structure

```
src/
├── pages/
│   ├── Index.tsx                  # Landing page
│   ├── SpecialistRegister.tsx     # Tech specialist signup
│   ├── CompanyRegister.tsx        # Company signup
│   ├── SpecialistDashboard.tsx    # Specialist dashboard with matches
│   ├── CompanyDashboard.tsx       # Company dashboard with candidates
│   ├── Chat.tsx                   # Real-time messaging
│   └── Video.tsx                  # Video interview interface
├── components/ui/                 # Reusable UI components
├── hooks/                         # Custom React hooks
└── lib/                          # Utilities

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### Backend Deployment
Deploy your Node.js/MongoDB backend to:
- Render

URL: https://skillmap-app.netlify.app/




