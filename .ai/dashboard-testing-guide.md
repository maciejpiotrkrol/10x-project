# Dashboard View - Testing Guide

Ten dokument zawiera kompletny przewodnik testowania widoku Dashboard.

## Przygotowanie do testowania

### 1. Uruchom aplikację

```bash
npm run dev
```

### 2. Zaloguj się do aplikacji

- Przejdź do `/auth/login`
- Zaloguj się na istniejące konto z aktywnym planem treningowym
- Jeśli nie masz konta z planem, najpierw wygeneruj plan przez `/survey`

## Test Cases

### TC-001: Happy Path - Przeglądanie aktywnego planu

**Kroki:**

1. Zaloguj się do aplikacji
2. Przejdź do `/dashboard`

**Oczekiwany rezultat:**

- ✅ Dashboard się ładuje bez błędów
- ✅ PlanHeader wyświetla poprawne daty i statystyki
- ✅ Widzisz 10 accordionów (Tydzień 1-10)
- ✅ Accordion z dzisiejszym dniem jest automatycznie rozwinięty
- ✅ Strona automatycznie scrolluje do dzisiejszego dnia
- ✅ Dzisiejsza karta ma niebieski ring (highlight)
- ✅ Progress bar pokazuje poprawny procent ukończenia

**Status:** [ ]

---

### TC-002: Oznaczanie treningu jako wykonanego (US-007)

**Kroki:**

1. Znajdź nieoukończony trening (nie rest day)
2. Kliknij checkbox "Oznacz jako wykonany"

**Oczekiwany rezultat:**

- ✅ Checkbox natychmiast zmienia stan (optimistic update)
- ✅ Karta dostaje zielony border (border-2 border-green-500)
- ✅ Pojawia się zielony checkmark (✓) w prawym górnym rogu
- ✅ Toast success: "Trening oznaczony jako wykonany"
- ✅ Statystyki w PlanHeader aktualizują się (X+1/Y)
- ✅ Progress bar się aktualizuje
- ✅ Week accordion header aktualizuje się (Y+1/Z)
- ✅ Po refresh strony, stan jest zachowany (zapisany w DB)

**Status:** [ ]

---

### TC-003: Cofanie oznaczenia treningu (US-008)

**Kroki:**

1. Znajdź wykonany trening (zielony border, checkmark)
2. Kliknij checkbox ponownie

**Oczekiwany rezultat:**

- ✅ Checkbox natychmiast się odznacza
- ✅ Zielony border znika
- ✅ Checkmark (✓) znika
- ✅ Toast success: "Oznaczenie cofnięte"
- ✅ Statystyki w PlanHeader aktualizują się (X-1/Y)
- ✅ Progress bar się aktualizuje (procent maleje)
- ✅ Week accordion header aktualizuje się (Y-1/Z)
- ✅ Po refresh strony, stan cofnięcia jest zachowany

**Status:** [ ]

---

### TC-004: Próba oznaczenia rest day jako wykonanego

**Kroki:**

1. Znajdź rest day (szare tło, 🛌 emoji, "Odpoczynek")
2. Spróbuj kliknąć na kartę (nie powinno być checkboxa)

**Oczekiwany rezultat:**

- ✅ Rest day NIE MA checkboxa "Oznacz jako wykonany"
- ✅ Rest day jest read-only
- ✅ Nie można go oznaczyć jako wykonanego

**Status:** [ ]

---

### TC-005: Scroll to Today - FAB Button

**Kroki:**

1. Scrolluj stronę w górę (FAR from dzisiejszego dnia)
2. Obserwuj czy pojawia się FAB button w prawym dolnym rogu

**Oczekiwany rezultat:**

- ✅ FAB pojawia się gdy dzisiejsza karta NIE jest w viewport
- ✅ FAB znika gdy dzisiejsza karta JEST w viewport
- ✅ Kliknięcie FAB scrolluje smooth do dzisiejszej karty
- ✅ FAB ma aria-label dla accessibility

**Responsive:**

- ✅ Na mobile: FAB ma większy touch target (min-h-[44px])
- ✅ Na mobile: FAB jest w bottom-20 (powyżej bottom nav)
- ✅ Na desktop: FAB jest w bottom-6

**Status:** [ ]

---

### TC-006: Expand/Collapse Week Accordion

**Kroki:**

1. Kliknij na nagłówek tygodnia (AccordionTrigger)
2. Obserwuj animację expand/collapse

**Oczekiwany rezultat:**

- ✅ Accordion smoothly expands/collapses
- ✅ 7 WorkoutDayCards staje się visible/hidden
- ✅ Tylko 1 accordion może być expanded naraz (single mode)
- ✅ Accordion można collapsed (collapsible mode)

**Keyboard Navigation:**

- ✅ Tab do accordion trigger
- ✅ Enter/Space togguje expand/collapse
- ✅ ARIA attributes poprawnie ustawione (aria-expanded)

**Status:** [ ]

---

### TC-007: No Active Plan - Empty State

**Kroki:**

1. Usuń aktywny plan z DB (lub użyj konta bez planu)
2. Przejdź do `/dashboard`

**Oczekiwany rezultat:**

- ✅ Wyświetla się EmptyState component
- ✅ Message: "Nie masz aktywnego planu treningowego"
- ✅ Button CTA: "Wygeneruj plan"
- ✅ Kliknięcie CTA przekierowuje do `/survey`

**Status:** [ ]

---

### TC-008: Plan Completed - Completion Modal

**Kroki:**

1. Mark wszystkie pozostałe treningi jako completed
2. Oznacz ostatni trening jako wykonany

**Oczekiwany rezultat:**

- ✅ CompletionModal automatycznie się otwiera
- ✅ Modal pokazuje: "🎉 Gratulacje!"
- ✅ Message: "Ukończyłeś swój 10-tygodniowy plan treningowy!"
- ✅ 2 buttons: "Zamknij" (outline) i "Wygeneruj nowy plan" (primary)
- ✅ Kliknięcie "Zamknij" zamyka modal
- ✅ Kliknięcie "Wygeneruj nowy plan" redirectuje do `/survey`
- ✅ Modal można zamknąć przez backdrop click lub ESC

**Status:** [ ]

---

### TC-009: Session Expired (401 Unauthorized)

**Kroki:**

1. Zaloguj się i przejdź do dashboard
2. W DevTools: usuń JWT cookie lub zmień na invalid
3. Spróbuj mark workout as completed

**Oczekiwany rezultat:**

- ✅ API zwraca 401 Unauthorized
- ✅ Hook useWorkoutToggle detekuje 401
- ✅ Redirect do `/auth/login` (window.location.href)
- ✅ Brak phantom updates (rollback local state)

**Status:** [ ]

---

### TC-010: Network Error - Rollback Optimistic Update

**Kroki:**

1. W DevTools: Network tab → Offline mode
2. Mark workout as completed

**Oczekiwany rezultat:**

- ✅ Optimistic update działa (checkbox checked immediately)
- ✅ API call fails (network error)
- ✅ Rollback: checkbox wraca do unchecked
- ✅ Toast error: "Nie udało się zaktualizować. Spróbuj ponownie."
- ✅ User może retry (click checkbox again)

**Status:** [ ]

---

### TC-011: Rapid Clicks - Multiple Toggle Attempts

**Kroki:**

1. Kliknij checkbox 5 razy szybko (rapid clicks)

**Oczekiwany rezultat:**

- ✅ Każdy click toggle'uje stan (no debouncing)
- ✅ Ostatni stan wins (eventual consistency)
- ✅ Brak race conditions
- ✅ Final state reflects last API response

**Uwaga:** Mogą wystąpić multiple API calls, ale to jest OK w MVP.

**Status:** [ ]

---

### TC-012: Responsiveness - Mobile (<768px)

**Viewport:** 375x667 (iPhone SE)

**Kroki:**

1. Zmień viewport na mobile
2. Przejdź przez wszystkie interactive elements

**Oczekiwany rezultat:**

- ✅ Layout jest single column
- ✅ Touch targets są ≥44x44px (checkbox + label)
- ✅ Font sizes są readable (sm:text-base na większości tekstów)
- ✅ FAB nie zakrywa treści (bottom-20, above bottom nav)
- ✅ Modal buttons są full width (w-full sm:w-auto)
- ✅ Spacing jest odpowiedni (px-4, py-6)
- ✅ Cards nie są zbyt szerokie (max-w-4xl container)

**Status:** [ ]

---

### TC-013: Responsiveness - Tablet (768-1024px)

**Viewport:** 768x1024 (iPad)

**Kroki:**

1. Zmień viewport na tablet
2. Sprawdź layout i spacing

**Oczekiwany rezultat:**

- ✅ Layout uses sm: breakpoints (text-sm → sm:text-base)
- ✅ FAB position adjusts (bottom-6 instead of bottom-20)
- ✅ Modal buttons są horizontal (sm:flex-row)
- ✅ Padding increases (py-6 → sm:py-8)

**Status:** [ ]

---

### TC-014: Responsiveness - Desktop (>1024px)

**Viewport:** 1920x1080

**Kroki:**

1. Zmień viewport na desktop
2. Sprawdź max-width constraints

**Oczekiwany rezultat:**

- ✅ Container ma max-w-4xl (content nie rozciąga się na cały ekran)
- ✅ Content jest centered (mx-auto)
- ✅ Touch targets mogą być mniejsze (normal click targets)
- ✅ Font sizes używają sm: variants

**Status:** [ ]

---

### TC-015: Keyboard Navigation

**Kroki:**

1. Użyj tylko klawiatury (Tab, Enter, Space, Arrow keys)
2. Nawiguj przez wszystkie interactive elements

**Oczekiwany rezultat:**

- ✅ Tab focus order jest logiczny (top → bottom)
- ✅ Focus indicators są visible (ring-2 ring-offset-2)
- ✅ Enter/Space togguje checkboxy
- ✅ Enter/Space expand/collapse accordions
- ✅ ESC zamyka modal
- ✅ FAB ma focus indicator

**Status:** [ ]

---

### TC-016: Screen Reader Accessibility

**Tools:** VoiceOver (macOS), NVDA (Windows), TalkBack (Android)

**Kroki:**

1. Włącz screen reader
2. Nawiguj przez dashboard

**Oczekiwany rezultat:**

- ✅ Accordions mają poprawne ARIA attributes (aria-expanded)
- ✅ Checkboxy mają labels (htmlFor matching id)
- ✅ FAB ma aria-label: "Przeskocz do dzisiejszego treningu"
- ✅ Modal ma role="dialog" i aria-labelledby
- ✅ Cards mają semantic structure (header, content)

**Status:** [ ]

---

### TC-017: Browser Compatibility

**Browsers:** Chrome, Firefox, Safari, Edge

**Kroki:**

1. Test w każdej przeglądarce (desktop + mobile)
2. Sprawdź wszystkie main features

**Oczekiwany rezultat:**

- ✅ Chrome: wszystko działa
- ✅ Firefox: wszystko działa
- ✅ Safari: wszystko działa (iOS Safari także)
- ✅ Edge: wszystko działa

**Known Issues:**

- Brak (wszystko powinno działać - używamy standardowych Web APIs)

**Status:** [ ]

---

### TC-018: Performance - Large Dataset (70 cards)

**Kroki:**

1. Otwórz wszystkie 10 accordions
2. Obserwuj performance (DevTools → Performance tab)
3. Scroll przez wszystkie 70 cards

**Oczekiwany rezultat:**

- ✅ Initial load < 2s (Lighthouse)
- ✅ Smooth scrolling (60fps)
- ✅ No janky animations
- ✅ Memory usage acceptable (~20-50MB dla 70 cards)

**Optimizations Applied:**

- React.memo na WorkoutDayCard (sprawdź czy jest)
- useMemo dla groupWorkoutsByWeeks
- Transition durations (duration-200)

**Status:** [ ]

---

## Edge Cases Checklist

### Data Edge Cases

- [ ] Plan z 0 completed workouts (all pending)
- [ ] Plan z wszystkimi completed workouts (100%)
- [ ] Plan z mixed completed/pending (50%)
- [ ] Today's date NIE jest w planie (plan w przeszłości/przyszłości)
- [ ] Plan z nietypową liczbą rest days
- [ ] Very long workout description (>500 chars)

### Network Edge Cases

- [ ] Slow 3G connection (DevTools → Network throttling)
- [ ] Offline mode (complete offline)
- [ ] API timeout (mock delay >10s)
- [ ] 500 Internal Server Error from API

### User Behavior Edge Cases

- [ ] Multiple rapid clicks (tested above)
- [ ] Refresh strony podczas pending API call
- [ ] Multiple tabs open (concurrent updates) - MVP: brak sync
- [ ] Back/Forward browser navigation

### Viewport Edge Cases

- [ ] Very small mobile (320x568 - iPhone SE 1st gen)
- [ ] Very large desktop (2560x1440 - 4K)
- [ ] Portrait vs Landscape orientation
- [ ] Zoom 200% (accessibility)

---

## Bug Report Template

Jeśli znajdziesz bug, zgłoś go w następującym formacie:

```markdown
### Bug: [Krótki opis]

**Severity:** Critical / High / Medium / Low

**Test Case:** TC-XXX

**Steps to Reproduce:**

1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
[Co powinno się wydarzyć]

**Actual Result:**
[Co się faktycznie wydarzyło]

**Screenshots/Video:**
[Jeśli applicable]

**Environment:**

- Browser: Chrome 120
- OS: macOS 14.1
- Viewport: 1920x1080

**Console Errors:**
[Jeśli są jakieś błędy w console]
```

---

## Test Summary

Po zakończeniu testów, wypełnij summary:

**Date:** \_\_\_\_\_\_\_\_\_\_\_\_

**Tester:** \_\_\_\_\_\_\_\_\_\_\_\_

**Total Test Cases:** 18

**Passed:** \_\_\_\_ / 18

**Failed:** \_\_\_\_ / 18

**Critical Bugs:** \_\_\_\_

**High Priority Bugs:** \_\_\_\_

**Medium Priority Bugs:** \_\_\_\_

**Low Priority Bugs:** \_\_\_\_

**Ready for Production:** [ ] Yes [ ] No

**Notes:**
[Dodatkowe uwagi]
