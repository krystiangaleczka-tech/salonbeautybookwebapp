# Calendar Timezone Fix - 2025-10-12 19:18

## Problem
Wizyty na 12.10.2025 (niedziela) nie były widoczne w kalendarzu, ale wizyty na 19.10.2025 (niedziela za tydzień) już tak. Dodatkowo, wizyty "przeskakiwały" między dniami przy zmianie widoków kalendarza.

## Przyczyny
1. **Problem strefy czasowej**: Funkcja `toISOString()` zawsze zwraca czas w UTC, co powodowało przesunięcie daty o 1 dzień wstecz przy konwersji na lokalny czas
2. **Błędne filtrowanie**: Filtry w kalendarzu używały nieprawidłowych funkcji porównywania dat
3. **Godziny pracy**: Niedziela była ustawiona jako dzień zamknięty w konfiguracji godzin pracy
4. **Brakująca zależność**: `useMemo` dla `filteredCalendarEvents` nie zawierał `calendarServices` w dependency array

## Rozwiązanie
1. Nowa funkcja `timestampToDate()` - uniwersalna konwersja Timestamp z Firebase na obiekt Date
2. Funkcja `isSameLocalDay()` - poprawne porównywanie dat tylko według roku/miesiąca/dnia
3. Poprawiona funkcja `toDateKey()` - używa lokalnych wartości daty zamiast UTC
4. Zaktualizowane wszystkie filtry we wszystkich widokach kalendarza
5. Dodano brakującą zależność `calendarServices` w `useMemo` dla `filteredCalendarEvents`
6. Godziny pracy w niedzielę zostały zmienione z zamknięte na skrócone (10:00-16:00)

## Zmodyfikowane pliki
- `admin-frontend/src/app/(protected)/kalendarz/page.tsx`

## Wdrożenie
- URL aplikacji: https://salonbeautymario-x1.web.app
- Git commit: 2fb9f8e - "Fix: Calendar timezone issues and appointment visibility"

## Wynik
Wizyty na 12.10.2025 i inne daty są teraz widoczne prawidłowo we wszystkich widokach kalendarza, bez "przeskakiwania" między dniami i bez znikania przy zmianie widoku.
