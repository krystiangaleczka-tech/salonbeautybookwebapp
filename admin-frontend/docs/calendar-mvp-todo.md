# Calendar MVP TODO

## 0. Zakres i reguły
- [ ] Walidator `noParallel` dla usług oznaczonych jako niewspółbieżne (np. pedicure)
- [ ] Godziny pracy bazowe (ustawienia) + wyjątki z poziomu kalendarza
- [ ] Potwierdzenie, że modyfikacja dnia nie zmienia grafiku tygodniowego

## 1. Layout i nawigacja
- [x] Widok "Dzień / Tydzień / Miesiąc" (domyślnie Tydzień)
- [x] Toolbar akcji (Dodaj, Edytuj, Usuń, Zmień godziny pracy) z hitbox ≥ 44×44 px
- [x] Prawy panel: lista wizyt wybranego dnia zsynchronizowana z kalendarzem

## 2. Kolory i stany
- [x] Tło strony beżowe, obszar godzin pracy różowy, poza zakresem szare
- [x] Kolory statusów wizyt (zielony/pomarańczowy/czerwony) spójne z listą boczną
- [x] Oznaczenie konfliktów cienkim czerwonym paskiem + tooltip

## 3. Interakcje (touch-first)
- [ ] Modal nowej wizyty po tapnięciu w wolny slot
- [ ] Drag & drop wizyt w dozwolonych godzinach z "ghost slotem"
- [ ] Modal zmiany godzin dnia z natychmiastową aktualizacją i ostrzeżeniem

## 4. Walidacje i logika
- [ ] Blokada równoległości pedicure z komunikatem
- [ ] Blokada slotów poza godzinami (tooltip + override właściciela)
- [ ] Bufory czasowe per usługa przy obliczaniu dostępności

## 5. Panel boczny "Lista wizyt dnia"
- [x] Kafelki z godziną, usługą, klientem, statusem, ceną
- [ ] Filtrowanie po statusie / usłudze / pracowniku

## 6. Formularze i szczegóły wizyty
- [ ] Formularz nowej/edytowanej wizyty (klient, usługa, pracownik, start, czas trwania)
- [ ] Automatyczne podpowiedzi czasu trwania i bufora

## 7. Zależne ustawienia
- [ ] Model godzin pracy Pon–Nd (salon/pracownik)
- [ ] Konfiguracja usług z polami: `id`, `name`, `durationMin`, `noParallel`, `bufferAfterMin`

## 8. Stany graniczne i komunikaty
- [ ] Alert przy kolizji pedicure ↔ pedicure
- [ ] Dialog przy skracaniu godzin z istniejącymi wizytami
- [ ] Ostrzeżenia przy dodawaniu wizyty poza godzinami pracy
- [ ] Toast trybu offline (zapis offline → synchronizacja)

## 9. Wydajność i UX
- [ ] Hitboxy ≥ 44×44 px, płynne drag, brak inercji
- [ ] Wirtualizacja listy przy >50 wizytach dziennie
- [ ] (Opcj.) Pinch-to-zoom osi czasu

## 10. Testy akceptacyjne
- [ ] Scenariusze E2E opisane w specyfikacji

## 11. Plusy (po MVP)
- [ ] Quick action "Pierwszy wolny slot"
- [ ] Pasek konfliktów dnia
- [ ] Eksport listy dnia do CSV
