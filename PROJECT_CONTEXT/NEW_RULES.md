Zasady Rozwoju Projektu - Aktualny Stan
Podstawowe zasady
0. Zawsze odpowiadaj w języku polskim
Wszystka komunikacja w zespole projektowym oraz dokumentacja techniczna powinna być prowadzona w języku polskim.

1. Limit długości plików
Maksymalna długość pliku to 1000 linii kodu
Jeśli plik przekracza ten limit, należy go podzielić na mniejsze moduły
Każdy moduł powinien mieć jasno określoną odpowiedzialność
Preferowane jest tworzenie plików o długości 300-500 linii dla lepszej maintainability
2. Kolejność działań
Najpierw instaluj zależności, a dopiero później generuj kod, który je wykorzystuje
Upewnij się, że wszystkie wymagane pakiety są dodane do package.json przed rozpoczęciem implementacji
Przy dodawaniu nowych zależności, sprawdź czy nie ma już podobnych w projekcie
3. Transparentność
Jeśli czegoś nie umiesz, powiedz wprost że nie umiesz
Nie próbuj tworzyć rozwiązań "na siłę" - lepiej zapytać o pomoc
Dokumentuj wszystkie decyzje architektoniczne i ich uzasadnienie
Współpraca i komunikacja
4. Human-in-the-loop
Stosuj podejście współpracy z człowiekiem, aby wygenerować najlepsze możliwe rozwiązanie
Razem robimy pair programming - kod jest tworzony we współpracy
Przed wprowadzaniem dużych zmian, skonsultuj się z zespołem
5. Limit prób
Jeśli nie możesz rozwiązać problemu po 2 próbach, poproś człowieka o pomoc
Nie marnuj czasu na nieskuteczne próby - lepiej poprosić o wskazówkę
Każda nieudana próba powinna być udokumentowana w logach postępu
6. Problemy z dokumentacją
Jeśli masz problem z biblioteką lub frameworkiem, poproś o dołączenie odpowiedniej dokumentacji
Zawsze sprawdzaj oficjalną dokumentację przed implementacją
Twórz własne notatki do nietypowych rozwiązań
Jakość kodu
7. Wysoka jakość
Stosuj jedynie porządne i eleganckie rozwiązania
Unikaj "quick and dirty" rozwiązań, nawet pod presją czasu
Każdy commit powinien być kompletnym i działającym fragmentem kodu
8. Problemy z typami
Jeśli nie wiesz jak rozwiązać problem z typami danych w TypeScript, zastosuj komentarz // @ts-ignore
Jednakże, zawsze preferuj poprawne rozwiązania typów nad ignorowaniem ich
W przypadku problemów z typami, skonsultuj się z zespołem
9. Kompletność zadań
NIGDY nie zostawiaj komentarzy typu TODO podczas wykonywania zadania
Każde zadanie musi być wykonane od początku do końca w całości i poprawnie
Wszystkie funkcjonalności muszą być w pełni zaimplementowane
10. Zawsze twórz kod i komentarze w języku angielskim
Nazwy zmiennych, funkcji, komponentów powinny być w języku angielskim
Komentarze w kodzie powinny być w języku angielskim
Komunikacja z użytkownikiem (UI teksty) powinna być w języku polskim
Planowanie i analiza
11. Analiza istniejącego kodu
Gdy podajesz plan wdrożenia nowej funkcji, zawsze przeanalizuj aktualny kod
Dostosuj plan do istniejącej architektury i wzorców projektowych
Unikaj duplikacji kodu - wykorzystaj istniejące komponenty i usługi
12. Struktura projektu
Przestrzegaj ustalonej struktury katalogów i plików
Nowe funkcjonalności powinny być umieszczane w odpowiednich modułach
Utrzymuj spójność nazewnictwa w całym projekcie
Praca z Firebase
13. Bezpieczeństwo danych
Zawsze stosuj Firestore Security Rules do ochrony danych
Nigdy nie przechowuj wrażliwych danych w kodzie frontend
Używaj zmiennych środowiskowych dla konfiguracji
14. Optymalizacja zapytań
Unikaj nadmiernych zapytań do bazy danych
Używaj listenerów do aktualizacji w czasie rzeczywistym zamiast częstego odświeżania
Stosuj paginację dla dużych zbiorów danych
✅ **NOWE**: Używaj static fetch (getDocs) zamiast realtime listeners dla stabilności
15. Obsługa błędów
Zawsze implementuj obsługę błędów dla operacji Firebase
Używaj try-catch bloków dla operacji asynchronicznych
Zapewnij czytelne komunikaty błędów dla użytkownika
✅ **NOWE**: Implementuj retry logic dla operacji Google Calendar
Praca z React/Next.js
16. Komponenty
Twórz małe, reużywalne komponenty
Każdy komponent powinien mieć jedną odpowiedzialność
Używaj TypeScript do definiowania props komponentów
17. Stan aplikacji
Używaj React Context do globalnego stanu
Dla lokalnego stanu preferuj useState i useReducer
Unikaj nadmiernego ponownego renderowania
✅ **NOWE**: Unikaj infinite loops w useEffect - sprawdzaj dependencies
18. Routing
Używaj Next.js App Router
Przechowuj logikę autentykacji w middleware
Optymalizuj ładowanie stron z dynamicznym importem
Praca z Tailwind CSS
19. Spójność stylistyczna
Używaj ustalonej palety kolorów zdefiniowanej w pliku konfiguracyjnym
Stosuj spójne odstępy i rozmiary zgodne z design systemem
Unikaj inline styles - preferuj klasy Tailwind
20. Responsywność
Każdy komponent musi być responsywny
Używaj mobil-first approach
Testuj interfejs na różnych rozdzielczościach
Testowanie
21. Testy jednostkowe
Piszę testy jednostkowe dla wszystkich nowych funkcji
Używaj Jest i React Testing Library
Pokrycie kodu testami powinno wynosić minimum 80%
✅ **NOWE**: Testuj custom hooks (usePendingTimeChanges, useAuth)
22. Testy E2E
Twórz testy E2E dla krytycznych ścieżek użytkownika
Używaj Playwright do automatyzacji testów
Testy powinny być uruchamiane przed każdym wdrożeniem
✅ **NOWE**: Testuj integrację z Google Calendar
Dokumentacja
23. Komentarze w kodzie
Dokumentuj wszystkie nietypowe rozwiązania
Opisuj cel i parametry funkcji
Używaj JSDoc formatu dla lepszej dokumentacji
24. Dokumentacja techniczna
Aktualizuj PROJECT_CONTEXT.md przy wprowadzaniu dużych zmian
Twórz diagramy dla złożonych komponentów
Udokumentuj decyzje architektoniczne
25. Log postępu
Po każdym wykonanym zadaniu twórz nowy plik log w katalogu progress
Nazwa pliku powinna zawierać datę, godzinę i opis zadania
Opisuj w logach co zostało zrobione i dlaczego
Wdrożenie
26. CI/CD
Używaj GitHub Actions do automatyzacji wdrożenia
Każdy commit na main powinien być automatycznie wdrożony
Testy powinny być uruchamiane przed wdrożeniem
✅ **NOWE**: Oddzielne deployment dla frontend i functions
27. Environment
Rozróżniaj środowiska development, staging i production
Używaj zmiennych środowiskowych dla konfiguracji
Nigdy nie umieszczaj danych produkcyjnych w kodzie
✅ **NOWE**: Konfiguruj regiony (Firestore eur3, Functions europe-central2)
28. Monitoring
Implementuj monitoring błędów (np. Sentry)
Śledź metryki wydajności aplikacji
Ustaw alerty dla krytycznych problemów
Zasady specyficzne dla projektu
29. Zarządzanie stanem kalendarza
Używaj hooka usePendingTimeChanges do zarządzania zmianami czasu
Zawsze waliduj konflikty terminów przed zapisaniem
Używaj optimistycznych update dla lepszej UX
✅ **NOWE**: Po każdej operacji CRUD wywołuj loadAppointments() dla odświeżenia
30. System powiadomień
Wszystkie powiadomienia powinny być zapisywane w Firestore
Używaj real-time listeners do wyświetlania powiadomień
Implementuj mechanizm oznaczania jako przeczytane
31. Bufory czasowe
Respektuj bufory czasowe przy planowaniu wizyt
Używaj personalnych buforów dla pracowników
Waliduj dostępność z uwzględnieniem buforów
32. Role i uprawnienia
Używaj role-based access control
Sprawdzaj uprawnienia przed wykonaniem operacji
Implementuj bezpieczne sesje użytkowników
✅ **NOWE**: Google Calendar Integration Rules
33. OAuth2 Security
Zawsze używaj bezpiecznego przepływu OAuth2 dla Google Calendar
Przechowuj tokeny access i refresh w Firestore z ograniczonym dostępem
Automatycznie odświeżaj tokeny access przed wygaśnięciem
Używaj limited scopes dla Google Calendar API (tylko potrzebne uprawnienia)
34. Synchronizacja wydarzeń
Zawsze zapisuj ID wydarzenia Google Calendar w dokumencie wizyty
Ochron ID wydarzenia przed przypadkowym nadpisaniem przy edycji wizyty
Implementuj batch synchronization dla wielu wizyt
Obsługuj błędy synchronizacji z retry logic
35. Token Management
Nigdy nie przechowuj tokenów OAuth2 w kodzie frontend
Używaj Firebase Functions do operacji na tokenach
Implementuj automatyczne odświeżanie tokenów
Monitoruj wygaśnięcie tokenów i wymagaj ponownej autentykacji
✅ **NOWE**: Firestore Stability Rules
36. useEffect Patterns
Zawsze umieszczaj funkcje zmieniające state wewnątrz useEffect
Sprawdzaj dependencies w useEffect - unikaj infinite loops
Nie wywołuj funkcji asynchronicznych bezpośrednio w useEffect
Używaj useCallback dla funkcji przekazywanych do dependencies
37. Realtime vs Static Fetch
Używaj static fetch (getDocs) zamiast realtime listeners dla stabilności
Po operacjach CRUD wywołuj manualne odświeżenie danych
Unikaj WebSocket connections które powodują problemy CORS
Implementuj mechanizm odświeżania zamiast polegania na automatycznych update'ach
38. Error Handling
Zawsze implementuj try-catch dla operacji Firestore
Loguj błędy Firestore do konsoli dla debugowania
Implementuj fallback dla operacji Google Calendar
Pokazuj użytkownikowi czytelne komunikaty o błędach synchronizacji
Narzędzia i konwencje
39. Formatowanie kodu
Używaj Prettier do formatowania kodu
Konfiguruj ESLint do sprawdzania jakości kodu
Używaj pre-commit hooks do automatycznego formatowania
40. Nazewnictwo
Używaj camelCase dla zmiennych i funkcji
Używaj PascalCase dla komponentów i klas
Używaj UPPER_SNAKE_CASE dla stałych
✅ **NOWE**: Używaj prefixed nazw dla funkcji Google Calendar (sync*, google*)
41. Git workflow
Używaj feature branches dla nowych funkcjonalności
Commity powinny mieć czytelne komunikaty
Używaj pull requests do code review
✅ **NOWE**: Twórz oddzielne commity dla frontend i functions changes
42. Region Configuration
Używaj eur3 region dla Firestore dla stabilności
Używaj europe-central2 region dla Cloud Functions
Dokumentuj wybór regionów w konfiguracji projektu
Nie zmieniaj regionów bez gruntownych testów migracji
Podsumowanie
Te zasady mają na celu zapewnienie wysokiej jakości kodu, spójności projektu i efektywnej współpracy w zespole. Przestrzeganie tych zasad ułatwi utrzymanie i rozwój aplikacji w długim terminie.

✅ **NOWE**: Zasady zostały zaktualizowane o doświadczenia z implementacji Google Calendar i rozwiązywania problemów ze stabilnością Firestore.

Wszelkie wyjątki od tych zasad powinny być dokładnie uzasadnione i skonsultowane z zespołem.