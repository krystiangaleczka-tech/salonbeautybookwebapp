Salon Booking Application
Przegląd systemu
Aplikacja do rezerwacji terminów w salonie piękności oparta na Firebase i TypeScript. System składa się z trzech głównych komponentów komunikujących się przez Firebase backend.
Architektura wysokiego poziomu

Client App (React) ←→ Firebase ←→ Admin Panel (Next.js)
                         ↕
                    Cloud Functions
                         ↕
                     Firestore DB


Komponenty systemu

Client Frontend

Technologia: React + TypeScript + Vite

Port: 3000 (development)

UI: Tailwind CSS + shadcn/ui

State: Redux Toolkit

Routing: React Router

Deployment: Firebase Hosting

Funkcje: Rezerwacja terminów, przeglądanie usług, profil klienta

Admin Panel

Technologia: Next.js + TypeScript

Port: 3001 (development)

UI: Tailwind CSS + shadcn/ui

Deployment: Firebase Hosting

Funkcje: Zarządzanie terminami, klienci, usługi, raporty

Backend API

Technologia: Firebase Cloud Functions + TypeScript

Funkcje: CRUD operacje, logika biznesowa, integracje zewnętrzne

Endpoint: Automatycznie zarządzany przez Firebase

Baza danych

Technologia: Firestore (NoSQL)

Kolekcje: bookings, clients, services, staff, settings

Funkcje: Real-time synchronizacja, offline support

Deployment i hosting

Firebase Hosting: Automatyczny SSL, CDN, custom domeny

Firebase Functions: Serverless backend, automatyczne skalowanie

Firestore: Managed database, backup, security rules

Bezpieczeństwo

Firebase Authentication dla staff

Firestore Security Rules

HTTPS enforced

Environment variables dla konfiguracji

Kluczowe zalety architektury

Prostota: Jeden dostawca dla całego stacku

Skalowanie: Automatyczne bez konfiguracji

Real-time: Natywny support dla live updates

Koszt: Bezpłatny tier dla rozwoju

Maintenance: Managed infrastructure

Struktura katalogów

salon-booking-app/
├── client-frontend/     # React app
├── admin-frontend/      # Next.js admin
├── functions/          # Cloud Functions
├── firebase.json       # Firebase config
└── firestore.rules     # Database security


Wymagania aplikacji

Klienci: Rezerwacja bez rejestracji, SMS powiadomienia

Staff: Zarządzanie kalendarzem, klientami, usługami

Właściciel: Raporty, ustawienia, finanse

System: Real-time dostępność, offline support