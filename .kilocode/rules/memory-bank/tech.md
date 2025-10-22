---
updated: 2025-10-22
author: KiloCode AI
version: 1.0
project: Beauty Salon Booking System - Beauty Mario
---

# Tech - Technologie i Narzędzia

## Technologie Frontend

### Core
- **Next.js 14** - React framework z App Router
- **TypeScript 5.x** - Type safety dla całej aplikacji
- **React 18** - UI library z concurrent features

### Styling
- **Tailwind CSS 3.x** - Utility-first CSS framework
- **shadcn/ui** - Komponenty UI z Radix UI
- **Framer Motion** - Animacje i przejścia

### State Management
- **React Context API** - Global state management
- **Custom Hooks** - Reusable logic (useAuth, useEmployee, usePendingTimeChanges)
- **React Hook Form** - Form management z walidacją

### Build Tools
- **Vite/Next.js** - Build tool i bundler
- **PostCSS** - CSS processing
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Technologie Backend

### Firebase Stack
- **Firebase Authentication** - email/password, OAuth2 (Google)
- **Firestore** - NoSQL database (region: eur3)
- **Cloud Functions** - Serverless functions (region: europe-central2)
- **Firebase Hosting** - Static hosting
- **Firebase Storage** - File storage
- **Firebase Analytics** - Analytics

### External APIs
- **Google Calendar API** - Calendar integration
- **Google OAuth2** - Authentication dla Google Calendar

## Development Setup

### Wymagania Systemowe
- **Node.js**: 18.x lub wyższy
- **npm**: 9.x lub wyższy
- **Git**: 2.x lub wyższy

### Instalacja Projektu
Clone repository
git clone <repository-url>
Install admin frontend dependencies
cd admin-frontend
npm install
Install functions dependencies
cd ../booking-functions
npm install
Setup Firebase
firebase login
firebase use salonbeautymario-x1
text

### Environment Variables
admin-frontend/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=salonbeautymario-x1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=
text

### Development Commands
Run admin frontend
cd admin-frontend
npm run dev # http://localhost:3001
Build for production
npm run build
Run tests
npm test
Run E2E tests
npm run test:e2e
Deploy functions
cd booking-functions
npm run deploy
Deploy hosting
firebase deploy --only hosting
text

## Testing Stack

### Unit Testing
- **Jest** - Test runner
- **React Testing Library** - Component testing
- **@testing-library/jest-dom** - Custom matchers

### E2E Testing
- **Playwright** - Browser automation
- **@playwright/test** - Test runner dla E2E

### Test Coverage
- Target: 80% code coverage
- Focus: Critical business logic i custom hooks

### Testing Commands
Run unit tests
npm test
Run tests in watch mode
npm test:watch
Generate coverage report
npm test:coverage
Run E2E tests
npm run test:e2e
E2E headed mode
npm run test:e2e:headed
text

## Firebase Configuration

### Firebase Projects
- **Production**: salonbeautymario-x1
- **Staging**: (if applicable)
- **Development**: (local emulator)

### Firestore Indexes
Defined in `firestore.indexes.json`:
- Compound indexes dla queries (appointments by staff + date range)
- TTL indexes dla expired tokens

### Security Rules
Defined in `firestore.rules`:
- Role-based access control
- User authentication required
- Admin-only collections
- User-scoped data access

### Cloud Functions Regions
- **Primary**: europe-central2
- **Firestore**: eur3 (europe-west3)

## Deployment

### Hosting
Deploy everything
firebase deploy
Deploy only hosting
firebase deploy --only hosting
Deploy only functions
firebase deploy --only functions
Deploy specific function
firebase deploy --only functions:functionName
text

### Production URL
https://salonbeautymario-x1.web.app

## Monitoring & Analytics

### Error Tracking
- **Sentry** - Real-time error tracking
- **Firebase Crashlytics** - Crash reporting

### Analytics
- **Firebase Analytics** - User behavior tracking
- **Google Analytics** - Web analytics

### Performance Monitoring
- **Firebase Performance** - Performance metrics
- **Lighthouse** - Performance audits

## Tool Usage Patterns

### Git Workflow
Feature branch
git checkout -b feature/feature-name
Commit
git commit -m "feat: description"
Push
git push origin feature/feature-name
PR i merge do main
text

### Code Review Checklist
- [ ] TypeScript types complete
- [ ] Unit tests passing
- [ ] ESLint no errors
- [ ] No console.logs
- [ ] Performance optimized
- [ ] Security rules updated
- [ ] Documentation updated

## Technical Constraints

### Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Device Support
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px (limited support)

### Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

## Useful Commands

### Firebase
Login
firebase login
Initialize project
firebase init
Use project
firebase use <project-id>
Serve locally
firebase serve
Open console
firebase open
View logs
firebase functions:log
text

### npm
Install dependencies
npm install
Update dependencies
npm update
Check outdated
npm outdated
Audit security
npm audit
Fix vulnerabilities
npm audit fix
text
undefined