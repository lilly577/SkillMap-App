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

The app will be available at `http://localhost:8080`

### 3. Connect to Your Backend

See `API_INTEGRATION.md` for detailed instructions on connecting this frontend to your Node.js/MongoDB backend.

All API integration points are marked with `TODO` comments in the code.

## Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero section |
| `/specialist/register` | Tech specialist registration form |
| `/specialist/dashboard` | Specialist dashboard with job matches |
| `/company/register` | Company registration form |
| `/company/dashboard` | Company dashboard with candidates & job posting |
| `/chat` | Real-time messaging interface |
| `/video` | Video interview room |

## Backend Integration

This frontend is ready to connect to your backend. You need to implement:

1. **REST APIs** - User registration, job posting, match retrieval
2. **WebSocket Server** - Real-time chat functionality
3. **WebRTC Signaling** - Video call setup and management
4. **Email Service** - Match notifications
5. **Matching Algorithm** - Skill-based candidate-job matching

See `API_INTEGRATION.md` for complete API specifications.

## Design System

The app uses a professional blue/purple gradient theme defined in `src/index.css`:
- Primary: Blue (`hsl(221 83% 53%)`)
- Secondary: Purple (`hsl(262 83% 58%)`)
- All colors use HSL format and semantic tokens


### Backend Deployment
Deploy your Node.js/MongoDB backend to:
- Heroku
- AWS (EC2/ECS)
- DigitalOcean
- Render
- Railway

## Environment Variables

Create a `.env` file (not tracked in git):
```
VITE_API_BASE_URL=https://your-backend-url.com
VITE_WS_URL=wss://your-backend-url.com
```

## Development Notes

- Mock data is used in dashboards - replace with actual API calls
- WebSocket and WebRTC logic need backend implementation
- File uploads ready for FormData submission
- All forms include validation

## Next Steps

1. ✅ Frontend complete
2. ⏳ Build Node.js/MongoDB backend
3. ⏳ Implement WebSocket server for chat
4. ⏳ Implement WebRTC signaling for video
5. ⏳ Set up email notifications
6. ⏳ Deploy both frontend and backend
7. ⏳ Connect frontend to backend APIs

**Project URL**: https://TechMatch/projects/6a80222c-4229-4b4a-984b-afe24b6fa153


The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```





