Salon Booking Application
Przegląd systemu
Aplikacja do rezerwacji terminów w salonie piękności oparta na Firebase i TypeScript. Aktywny system obejmuje panel administracyjny oraz warstwę backendową opartą na Firebase.
Architektura wysokiego poziomu

Admin Panel (Next.js) ←→ Firebase
                     ↕
               Cloud Functions
                     ↕
                 Firestore DB


Komponenty systemu

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
├── admin-frontend/      # Next.js admin
├── functions/          # Cloud Functions
├── firebase.json       # Firebase config
├── archives/           # Zarchiwizowane frontendowe snapshoty
└── firestore.rules     # Database security


Wymagania aplikacji

Staff: Zarządzanie kalendarzem, klientami, usługami

Właściciel: Raporty, ustawienia, finanse

System: Real-time dostępność, offline support

Notatka: Poprzedni moduł `client-frontend` został zarchiwizowany. Nowe wdrożenie aplikacji klienckiej powstanie od podstaw, aby uniknąć konfliktów konfiguracyjnych.