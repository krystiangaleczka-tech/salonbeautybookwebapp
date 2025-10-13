# Implementacja przełączania między dzisiejszymi a wszystkimi rezerwacjami

## Data i czas
2025-10-13 11:41 (CET)

## Opis zmiany
Zaimplementowano funkcjonalność przełączania między pokazywaniem dzisiejszych wizyt a wszystkimi rezerwacjami na dashboardzie.

## Szczegóły techniczne

### Zmiany w pliku dashboard-service.ts
- Dodano nową funkcję `getAllAppointments()` do pobierania wszystkich potwierdzonych rezerwacji
- Funkcja pobiera do 100 najnowszych rezerwacji posortowanych malejąco po dacie
- Dołącza szczegóły o klientach i usługach

### Zmiany w pliku page.tsx (dashboard)
- Dodano stan `showAllAppointments` do śledzenia trybu wyświetlania
- Dodano funkcję `toggleAppointmentsView()` do przełączania między widokami
- Zaktualizowano useEffect do ponownego pobierania danych przy zmianie trybu
- Zmieniono dynamicznie nagłówek sekcji ("Dzisiejsze wizyty" / "Wszystkie rezerwacje")
- Zaktualizowano tekst przycisku ("Zobacz wszystkie rezerwacje" / "Pokaż dzisiejsze wizyty")
- Dodano wyświetlanie pełnej daty dla wszystkich rezerwacji
- Dodano komunikaty odpowiednie dla trybu ("Brak wizyt na dziś" / "Brak rezerwacji")

## Powód zmiany
Użytkownik zgłosił potrzebę przełączania między widokiem dzisiejszych wizyt a wszystkimi rezerwacjami po kliknięciu przycisku na dashboardzie.

## Wpływ na funkcjonalność
- Umożliwia łatwe przełączanie między widokiem dzisiejszych i wszystkich rezerwacji
- Dodaje datę do wyświetlania wszystkich rezerwacji dla lepszego kontekstu
- Zachowuje wydajność poprzez ograniczenie liczby pobieranych rezerwacji do 100
- Zapewnia płynne przełączanie z odpowiednim wskaźnikiem ładowania