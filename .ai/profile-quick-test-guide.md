# Profile View - Quick Testing Guide

## 🚀 Szybki Start

```bash
# Uruchom dev server
npm run dev

# Aplikacja dostępna pod:
# http://localhost:4321
```

## 📋 Szybkie Testy (5 minut)

### Test 1: Pełny Profil ✅
1. Otwórz `http://localhost:4321/profile`
2. Zaloguj się (jeśli nie jesteś zalogowany)
3. **Oczekiwany wynik:**
   - Widoczne 4 karty: Cele treningowe, Dane osobowe, Rekordy życiowe, Akcje
   - Wszystkie dane wyświetlone poprawnie
   - Przycisk "Wygeneruj nowy plan" działa

### Test 2: EmptyState (Brak Profilu)
1. Użyj użytkownika bez profilu lub wyczyść dane
2. Otwórz `/profile`
3. **Oczekiwany wynik:**
   - Komunikat: "Brak profilu użytkownika"
   - Przycisk: "Wypełnij ankietę" → przekierowanie do `/survey`

### Test 3: Pre-fill Survey Data
1. Na stronie profilu, otwórz DevTools (F12)
2. Przejdź do: Application → Storage → Session Storage
3. Kliknij "Wygeneruj nowy plan"
4. **Oczekiwany wynik:**
   - W sessionStorage pojawia się klucz `surveyData`
   - Zawiera wszystkie dane profilu
   - Przekierowanie do `/survey`
   - Formularz ankiety wypełniony danymi

### Test 4: Nawigacja
**Desktop (> 768px):**
- Navbar na górze: Dashboard | **Profil** | Nowy Plan
- Profil podświetlony jako aktywna strona

**Mobile (< 768px):**
- Bottom nav na dole z ikonami
- User icon (Profil) podświetlony

### Test 5: Responsive
Zmień szerokość okna przeglądarki:
- **< 768px:** Karty jedna pod drugą, bottom nav widoczny
- **>= 768px:** Karty 2x2 grid, top nav widoczny

## 🎯 Test Scenariusze

### Scenariusz A: Nowy Użytkownik
```
Logowanie → /profile → EmptyState → "Wypełnij ankietę" → /survey
→ Wypełnienie ankiety → Generowanie planu → /dashboard
→ Klik "Profil" w nav → /profile → Pełny profil widoczny
```

### Scenariusz B: Istniejący Użytkownik
```
Logowanie → /dashboard → Klik "Profil" w nav → /profile
→ Przegląd danych → "Wygeneruj nowy plan" → /survey (pre-filled)
→ Modyfikacja danych → Generowanie nowego planu → /dashboard
```

### Scenariusz C: Mobile User
```
Logowanie → /dashboard → Tap User icon (bottom nav) → /profile
→ Scroll przez karty → Tap "Wygeneruj nowy plan"
→ /survey → Tap PlusCircle icon → Wypełnienie → Generowanie
```

## 🔍 Co Sprawdzić?

### Wizualnie
- ✅ Wszystkie karty wyświetlają się poprawnie
- ✅ Fonty i rozmiary tekstu są czytelne
- ✅ Ikony w bottom nav są widoczne
- ✅ Active states działają (podświetlenie aktywnej strony)
- ✅ Hover effects na linkach

### Funkcjonalnie
- ✅ Dane profilu ładują się poprawnie
- ✅ Rekordy życiowe formatowane jako MM:SS lub HH:MM:SS
- ✅ Płeć wyświetlana jako "Mężczyzna"/"Kobieta"
- ✅ Przycisk "Wygeneruj nowy plan" przekierowuje do survey
- ✅ sessionStorage zawiera wszystkie dane

### Accessibility
- ✅ Tab navigation działa (próbuj poruszać się Tabem)
- ✅ Focus states widoczne na elementach
- ✅ Wszystkie buttony i linki klikalne
- ✅ Brak błędów w konsoli

## 🐛 Troubleshooting

### Problem: "Unauthorized" / Redirect do login
**Rozwiązanie:** Upewnij się, że jesteś zalogowany. Sprawdź cookies w DevTools.

### Problem: Puste karty / Brak danych
**Rozwiązanie:**
1. Sprawdź Network tab w DevTools
2. Zweryfikuj czy `/api/profile` zwraca 200 OK
3. Sprawdź czy dane w bazie danych istnieją

### Problem: Bottom nav nie znika na desktop
**Rozwiązanie:**
1. Sprawdź szerokość okna (powinna być >= 768px)
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Problem: SessionStorage pusty po kliknięciu "Wygeneruj nowy plan"
**Rozwiązanie:**
1. Sprawdź console errors
2. Upewnij się że JavaScript działa (client:load)
3. Sprawdź czy przekierowanie następuje zbyt szybko

## 📱 Test na Urządzeniach

### Desktop Browsers
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Mobile Devices (Chrome DevTools Device Emulation)
- ✅ iPhone SE (375px)
- ✅ iPhone 14 Pro (390px)
- ✅ Pixel 5 (393px)
- ✅ Samsung Galaxy S20+ (412px)
- ✅ iPad (768px)

### Breakpoints do Testowania
- 375px - Mobile small
- 390px - Mobile medium
- 768px - Tablet (breakpoint!)
- 1024px - Desktop small
- 1440px - Desktop large

## ✅ Checklist przed Deploym

- [ ] Build przechodzi bez błędów (`npm run build`)
- [ ] Wszystkie 7 test cases przechodzą
- [ ] Nawigacja działa na mobile i desktop
- [ ] Responsive layout działa poprawnie
- [ ] sessionStorage pre-fill działa
- [ ] EmptyState wyświetla się dla użytkowników bez profilu
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Tab navigation działa
- [ ] Wszystkie linki i przyciski są klikalne

## 🎉 Gotowe!

Po przejściu wszystkich testów, widok profilu jest gotowy do produkcji.

**Szacowany czas testów:** 10-15 minut
