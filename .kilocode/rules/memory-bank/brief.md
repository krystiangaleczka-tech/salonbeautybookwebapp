---
updated: 2025-10-22
author: KiloCode AI
version: 1.0
project: Beauty Salon Booking System - Beauty Mario
---

# Brief - System Rezerwacji dla Salonu Piękności

## Przegląd Projektu
Budujemy kompletny system rezerwacji dla małego salonu piękności "Beauty Mario" oparty na Next.js i Firebase. System jest obecnie w fazie produkcyjnej z pełną integracją Google Calendar.

## Główne Cele
- Eliminacja prowizji od platform marketplace (100% oszczędności)
- Maksymalizacja efektywności - rezerwacja w maksymalnie 3 kliknięcia
- Pełna kontrola nad danymi klientów
- Integracja z istniejącymi kalendarzami Google pracowników
- Dwukierunkowa synchronizacja wizyt z urządzeniami mobilnymi
- System wielopracowniczy dla skalowalności biznesu

## Kluczowe Wymagania
1. **Panel administracyjny** - zarządzanie kalendarzem, klientami, usługami, pracownikami
2. **System wielopracowniczy** - role: owner, employee, tester
3. **Integracja Google Calendar** - OAuth2, dwukierunkowa synchronizacja
4. **Real-time powiadomienia** - automatyczne aktualizacje i przypomnienia
5. **Zaawansowane filtry** - wyszukiwanie i filtrowanie wizyt z zapisywaniem presetów
6. **Responsywność** - optymalizacja dla tabletów i desktopów
7. **Tryb ciemny** - przełącznik motywu jasny/ciemny

## Architektura High-Level
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Firestore eur3, Cloud Functions europe-central2, Authentication)
- **Integracje**: Google Calendar API z OAuth2
- **Deployment**: Firebase Hosting (https://salonbeautymario-x1.web.app)

## Status Projektu
System jest w produkcji z wszystkimi kluczowymi funkcjonalnościami zrealizowanymi. Projekt osiągnął wszystkie cele biznesowe i techniczne.
