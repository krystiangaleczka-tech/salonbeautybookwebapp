---
updated: 2025-10-22
author: KiloCode AI
version: 1.0
project: Beauty Salon Booking System - Beauty Mario
---

# Deployment Procedures - Procedury Wdrożeniowe

## Przegląd Wdrożenia

### Środowiska
- **Development**: Lokalne środowisko (localhost:3001)
- **Staging**: Firebase Hosting preview channels
- **Production**: https://salonbeautymario-x1.web.app

### Architektura Wdrożenia
GitHub Repository

↓ GitHub Actions (CI
C
) ↓ Firebase Hosting (F
ontend) Firebase Functions (
text

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code coverage ≥ 80%
- [ ] No console.logs in production code
- [ ] Environment variables configured

### Security
- [ ] Firebase security rules updated
- [ ] API keys properly configured
- [ ] OAuth2 credentials valid
- [ ] No sensitive data in code

### Performance
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Lighthouse score > 90
- [ ] No memory leaks detected

## Development Deployment

### Local Development
Terminal 1: Run frontend
cd admin-frontend
Terminal 2: Run Firebase emulators (optional)
firebase emulators:start
Access: http://localhost:3001
text

### Environment Setup
admin-frontend/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=salonbeautymario-x1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
text

## Staging Deployment

### Firebase Preview Channels
Build frontend
cd admin-frontend
npm run
Deploy to preview channel
firebase hosting:channel:deploy preview-feature-xyz
Output:
✔ hosting:channel: Channel URL (preview-feature-xyz):
https://salonbeautymario-x1--preview-feature-xyz-abc123.web.app
text

### Testing Staging
Run E2E tests against staging
PLAYWRIGHT_BASE_URL=https://salonbeautymario-x1--preview-xyz.web.app npm run test:e2e
text

## Production Deployment

### Manual Deployment

#### Step 1: Build Frontend
cd admin-frontend
npm run
Verify build
npm run start # Test production build locally
text

#### Step 2: Deploy Functions
cd booking-functions
npm run
Or deploy specific function
firebase deploy --only functions:syncToGoogleCalendar
text

#### Step 3: Deploy Hosting
firebase deploy --only hosting
Or deploy everything
firebase deploy
text

#### Step 4: Verify Deployment
Check deployment URL
open https://salonbeautymario-x1.web.app
Check Functions logs
firebase functions:log
text

### Automated Deployment (CI/CD)

#### GitHub Actions Workflow
.github/workflows/deploy.yml
name: Deploy to Production
on:
pus
: bra
jobs:
deplo
: ru
text
steps:
  - uses: actions/checkout@v3
  
  - name: Setup Node.js
    uses: actions/setup-node@v3
    with:
      node-version: '18'
  
  - name: Install dependencies
    run: |
      cd admin-frontend
      npm ci
  
  - name: Run tests
    run: |
      cd admin-frontend
      npm test
  
  - name: Build
    run: |
      cd admin-frontend
      npm run build
  
  - name: Deploy to Firebase
    uses: FirebaseExtended/action-hosting-deploy@v0
    with:
      repoToken: '${{ secrets.GITHUB_TOKEN }}'
      firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
      channelId: live
      projectId: salonbeautymario-x1
text

## Database Migration

### Firestore Schema Updates

#### Adding New Field
// booking-functions/src/migrations/add-field.ts
async function addFieldToAppointments() {
const batch = db.batch();
snapshot.docs.forEach(doc =>
{ batch.update(doc.
ef, { newField: d
faultValue, updatedA
: T
await batch.commit();
console.log(`Updated ${snapshot.size} docuUpdated ${snapshot.size} documents);
text

#### Running Migration
Deploy migration function
firebase deploy --only functions:migrateAppointments
Trigger migration (one-time)
firebase functions:call migrateAppointments
Monitor logs
firebase functions:log --only migrateAppointments
text

### Security Rules Update
Edit firestore.rules
vim firestore.rules
Deploy rules
firebase deploy --only firestore:rules
Verify rules
firebase firestore:rules:list
text

## Rollback Procedures

### Frontend Rollback
List recent releases
firebase hosting:releases:list
Rollback to previous version
firebase hosting:rollback
Or rollback to specific version
firebase hosting:clone <source-version> <target-channel>
text

### Functions Rollback
List function versions
gcloud functions list --project salonbeautymario-x1
Rollback to previous version
firebase functions:delete functionName
fireba
text

### Database Rollback
Export current state (backup)
gcloud firestore export gs://salonbeautymario-x1-backups/backup-$(date +%Y%m%d)
Restore from backup
gcloud firestore import gs://salonbeautymario-x1-backups/backup-20251022
text

## Monitoring Post-Deployment

### Health Checks
Check hosting status
curl -I https://salonbeautymario-x1.web.app
Check Functions health
firebase functions:log --only syncToGoogleCalendar
Check Firestore metrics
gcloud firestore operations list --project salonbeautymario-x1
text

### Error Monitoring
// Sentry configuration (admin-frontend/src/lib/sentry.ts)
import * as Sentry from
Sentry.init({
dsn: process.env.NEXT_PUBLIC_SENTRY_DS
, environment: process.env.NODE_
NV, tracesSampleRat
text

### Performance Monitoring
Firebase Performance Monitoring
Automatically tracks:
- Page load times
- Network requests
- Custom traces
View metrics
open https://console.firebase.google.com/project/salonbeautymario-x1/performance
text

## Backup Procedures

### Automated Backups
Schedule daily backups (Cloud Scheduler + Cloud Functions)
gcloud scheduler jobs create http firestore-backup
--schedule="0 2 * * *"
--uri="https://europe-central2-salonbeautymario-x1.cloudfunctions.net/backupFirestore"
--time-zone="Europe/Warsaw"
text

### Manual Backup
Export Firestore
gcloud firestore export gs://salonbeautymario-x1-backups/manual-backup-$(date +%Y%m%d-%H%M%S)
--project salonbeautymario-x1
Verify backup
gsutil ls gs://salonbeautymario-x1-backups/
text

## Deployment Schedule

### Regular Deployments
- **Minor updates**: As needed (hotfixes)
- **Feature releases**: Weekly (Fridays, 10:00 AM CEST)
- **Major updates**: Monthly (first Friday of month)

### Maintenance Windows
- **Scheduled maintenance**: Sundays 02:00-04:00 AM CEST
- **Emergency maintenance**: As needed with 1-hour notice

## Post-Deployment Tasks

### Verification Checklist
- [ ] Homepage loads correctly
- [ ] Authentication works
- [ ] Calendar displays appointments
- [ ] CRUD operations functional
- [ ] Google Calendar sync working
- [ ] No console errors
- [ ] Performance metrics acceptable
- [ ] Error rate < 1%

### Communication
Deployment Notification Template
Deployment Completed
Date: 2025-10-22
Time: 14:30 CEST
Version: v1.2.3
Changes:
Feature: Added SMS notifications
Fix: Resolved calendar sync issue
Performance: Reduced bundle size by 15%
Rollback Plan: Available if issues detected within 1 hour
Monitoring: Active for next 24 hours
text
undefined