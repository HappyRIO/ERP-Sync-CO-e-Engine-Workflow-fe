# ITAD Platform Frontend

React + TypeScript + Vite frontend for the IT Asset Disposition (ITAD) SaaS workflow platform.

## Overview

Modern, responsive web application for managing IT asset disposition workflows. Built with React, TypeScript, and Tailwind CSS, featuring a comprehensive dashboard, booking management, job tracking, and reporting capabilities.

## Tech Stack

- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI + shadcn/ui
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **Maps:** Leaflet + React Leaflet
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ui/             # Base UI components (shadcn)
│   │   ├── auth/           # Authentication components
│   │   ├── booking/        # Booking-related components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── driver/         # Driver-specific components
│   │   ├── jobs/           # Job-related components
│   │   └── layout/         # Layout components
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── TenantThemeContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAssets.ts
│   │   ├── useBooking.ts
│   │   ├── useCO2.ts
│   │   ├── useJobs.ts
│   │   └── ...
│   ├── lib/                # Utility libraries
│   │   ├── calculations.ts
│   │   ├── constants.ts
│   │   ├── permissions.ts
│   │   └── utils.ts
│   ├── pages/              # Page components
│   │   ├── app/            # Main application pages
│   │   │   ├── admin/      # Admin-only pages
│   │   │   ├── Booking.tsx
│   │   │   ├── Jobs.tsx
│   │   │   ├── Sites.tsx
│   │   │   └── ...
│   │   └── Login.tsx
│   ├── services/           # API service layer
│   │   ├── api-client.ts
│   │   ├── auth.service.ts
│   │   ├── booking.service.ts
│   │   └── ...
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
└── package.json
```

## Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend README)

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Environment
VITE_NODE_ENV=production
```

For production, set:
```env
VITE_API_URL=https://your-api-domain.com
VITE_NODE_ENV=production
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will start on `http://localhost:5173` with hot module replacement.

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

Built files will be in the `dist/` directory.

## Key Features

### Authentication & Authorization
- User login/signup
- Role-based access control (admin, client, reseller, driver)
- Protected routes
- Session management

### Booking Management
- Multi-step booking form
- Site management
- Asset selection with quantities
- CO2e impact calculation
- Buyback estimate
- Address autocomplete and map picker
- European address validation

### Job Tracking
- Job list with filters
- Job detail view with timeline
- Status updates
- Evidence upload (photos, signatures)
- Driver job view (mobile-optimized)

### Dashboard
- Statistics overview
- CO2e dashboard with charts
- Recent activity
- Quick actions

### Admin Features
- User management
- Client management
- Driver management
- Booking approval queue
- Assignment management
- Sanitisation workflow
- Grading workflow
- Organisation profile settings

### Reporting
- Booking certificates
- Grading reports
- CO2e reports
- Job history

### Notifications
- Real-time notifications
- Notification center
- Mark as read functionality

## Pages & Routes

### Public Routes
- `/login` - User login
- `/signup` - User registration
- `/accept-invite/:token` - Accept invitation

### Protected Routes (Client/Reseller/Admin)
- `/` - Dashboard
- `/bookings` - Create booking
- `/bookings/history` - Booking history
- `/bookings/:id` - Booking details
- `/bookings/:id/summary` - Booking summary
- `/bookings/:id/timeline` - Booking timeline
- `/bookings/:id/certificates` - Booking certificates
- `/bookings/:id/grading-report` - Grading report
- `/jobs` - Job list
- `/jobs/:id` - Job details
- `/jobs/history` - Job history
- `/sites` - Site management
- `/clients` - Client management (admin/reseller)
- `/co2e` - CO2e dashboard
- `/documents` - Document management
- `/notifications` - Notifications
- `/settings` - User settings

### Admin-Only Routes
- `/admin/users` - User management
- `/admin/drivers` - Driver management
- `/admin/approval` - Booking approval
- `/admin/assignment` - Job assignment
- `/admin/sanitisation` - Sanitisation workflow
- `/admin/grading` - Grading workflow

### Driver Routes
- `/driver/jobs` - Driver job view
- `/driver/schedule` - Driver schedule

## User Roles & Permissions

### Admin
- Full system access
- User management
- Booking approval
- Job assignment
- Workflow management
- Settings management

### Client
- Create bookings
- View own bookings and jobs
- Manage sites
- View reports and certificates
- Update profile

### Reseller
- Manage clients
- View referred clients' bookings/jobs
- Create bookings on behalf of clients
- View reports

### Driver
- View assigned jobs
- Update job status
- Upload evidence (photos, signatures)
- View schedule

## Component Library

The application uses shadcn/ui components built on Radix UI:
- Buttons, Cards, Dialogs
- Forms (Input, Select, DatePicker)
- Tables, Badges, Alerts
- Navigation components
- Data visualization components

## State Management

- **React Query** - Server state management and caching
- **React Context** - Global state (auth, notifications, theme)
- **React Hook Form** - Form state management
- **Local State** - Component-level state with useState

## API Integration

All API calls are made through service layer:
- `auth.service.ts` - Authentication
- `booking.service.ts` - Bookings
- `job.service.ts` - Jobs
- `site.service.ts` - Sites
- `client.service.ts` - Clients
- `co2.service.ts` - CO2 calculations
- `buyback.service.ts` - Buyback calculations
- And more...

Services use a centralized API client with:
- Automatic token handling (cookies)
- Error handling
- Request/response interceptors
- TypeScript types

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **CSS Variables** - For theming
- **Responsive Design** - Mobile-first approach
- **Dark Mode** - Supported via next-themes

## Form Validation

- **Zod** - Schema validation
- **React Hook Form** - Form handling
- Client-side and server-side validation
- Real-time validation feedback

## Maps & Location

- **Leaflet** - Interactive maps
- **OpenStreetMap** - Map tiles
- Address autocomplete
- Postcode geocoding
- Route calculation

## Charts & Visualization

- **Recharts** - Chart library
- CO2e impact charts
- Statistics dashboards
- Trend visualizations

## Available Scripts

```bash
# Development
npm run dev              # Start development server

# Build
npm run build            # Build for production
npm run build:dev        # Build in development mode

# Code Quality
npm run lint             # Run ESLint

# Preview
npm run preview          # Preview production build
```

## Production Deployment

1. Set `VITE_API_URL` to production API URL
2. Build the application: `npm run build`
3. Deploy `dist/` directory to your hosting service:
   - Vercel (recommended)
   - Netlify
   - AWS S3 + CloudFront
   - Nginx
   - Any static hosting service

### Vercel Deployment

The project includes `vercel.json` for Vercel deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Nginx Configuration

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000` |
| `VITE_NODE_ENV` | Environment mode | `development` |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Code splitting with React.lazy
- Image optimization
- Asset compression
- Lazy loading
- Memoization where appropriate

## Security

- XSS protection via React's built-in escaping
- CSRF protection via httpOnly cookies
- Secure API communication
- Input sanitization
- Content Security Policy headers (configured on backend)

## Support

For issues or questions, contact: support@yourdomain.com
