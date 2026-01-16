# Dashboard - Szybki Przewodnik Testowania

## 🚀 Uruchomienie

```bash
npm run dev
```

Otwórz: http://localhost:3000/dashboard

## ✅ Podstawowe Testy (5 min)

### 1. Oznaczanie treningu ⏱️ 30s
- Kliknij checkbox przy dowolnym treningu
- ✓ Border zmienia się na zielony natychmiast
- ✓ Badge "Wykonano" się pojawia
- ✓ Toast: "Trening oznaczony jako wykonany"
- ✓ Licznik w headerze: X+1/Y

### 2. Cofanie oznaczenia ⏱️ 20s
- Kliknij ponownie ten sam checkbox
- ✓ Border wraca do szarego
- ✓ Badge znika
- ✓ Toast: "Oznaczenie cofnięte"
- ✓ Licznik: X-1/Y

### 3. Rest Day ⏱️ 10s
- Znajdź dzień z emoji 🛌
- ✓ Brak checkboxa
- ✓ Szare tło (muted)
- ✓ Tekst: "Dzień wolny od treningów"

### 4. Auto-scroll ⏱️ 15s
- Odśwież stronę (F5)
- ✓ Po ~500ms smooth scroll do dzisiejszego dnia
- ✓ Obecny tydzień auto-expanded

### 5. FAB Button ⏱️ 20s
- Scroll w górę (poza dzisiejszy dzień)
- ✓ FAB "Dzisiaj" pojawia się (prawy dolny róg)
- Kliknij FAB
- ✓ Smooth scroll do dzisiejszego dnia
- ✓ FAB znika

### 6. Expand/Collapse ⏱️ 15s
- Kliknij na kartę treningu (nie na checkbox!)
- ✓ Opis rozwija się
- Kliknij ponownie
- ✓ Opis zwija się (line-clamp-2)

## 🔍 Testy Error Handling (3 min)

### 7. Network Error ⏱️ 30s
1. DevTools (F12) → Network tab → Offline
2. Spróbuj oznaczyć workout
3. ✓ Optimistic update → rollback
4. ✓ Toast: "Brak połączenia z internetem..."
5. Wyłącz Offline mode

### 8. Wielokrotne kliknięcia ⏱️ 20s
- Kliknij checkbox bardzo szybko 5x
- ✓ Tylko 1 request do API
- ✓ Checkbox disabled podczas update
- ✓ Brak race conditions

### 9. Session Expiry ⏱️ 30s
1. DevTools → Application → Cookies
2. Usuń wszystkie cookies
3. Spróbuj oznaczyć workout
4. ✓ Toast: "Sesja wygasła..."
5. ✓ Redirect do /auth/login

## ♿ Testy Accessibility (2 min)

### 10. Keyboard Navigation ⏱️ 45s
- Tab przez elementy
- ✓ Focus visible indicators (ring)
- Enter/Space na karcie → expand
- Tab do checkbox → Space to toggle
- ✓ Wszystko dostępne z klawiatury

### 11. Screen Reader ⏱️ 45s
- Mac: Cmd+F5 (VoiceOver)
- Windows: Ctrl+Alt+Enter (NVDA)
- Nawiguj strzałkami
- ✓ "Trening dzień X: [status]"
- ✓ Statystyki czytane z kontekstem
- ✓ "Wykonane treningi: X z Y"

## 📱 Mobile Test (1 min)

### 12. Responsive ⏱️ 60s
- DevTools → Toggle device toolbar (Cmd+Shift+M)
- iPhone SE (375px) → iPad (768px) → Desktop (1920px)
- ✓ Wszystko czytelne
- ✓ Touch targets min 44px
- ✓ FAB nie przesłania elementów
- ✓ Brak horizontal scroll

## 🎨 Visual States

### Expected Visual States:

**Rest Day:**
- 🛌 Emoji w badge
- Gray muted background
- Brak checkboxa
- Tekst: "Dzień wolny od treningów"

**Pending Workout:**
- Gray border (border-gray-300)
- Checkbox unchecked
- White background
- Pełny opis z możliwością expand

**Completed Workout:**
- Green border (border-green-500, 2px)
- ✓ Icon + Badge "Wykonano" (green)
- Checkbox checked
- Hover: darker green (border-green-600)

## 🐛 Known Issues / Limitations

**Brak** - wszystkie funkcjonalności zaimplementowane zgodnie z planem.

## 📊 Performance Metrics (Target)

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle Size: ~7 KB (gzipped)
- Lighthouse Score: > 90

## 🔧 Dev Tools Commands

```bash
# Linting
npm run lint

# Build (production)
npm run build

# Preview production build
npm run preview
```

## 📝 Test Checklist

- [ ] Oznaczanie treningu
- [ ] Cofanie oznaczenia
- [ ] Rest day (brak checkboxa)
- [ ] Auto-scroll do dzisiejszego dnia
- [ ] FAB scroll functionality
- [ ] Expand/collapse opisu
- [ ] Network error handling
- [ ] Race condition prevention
- [ ] Session expiry redirect
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Responsive design (320px-1920px)

## ✅ All Tests Passed?

Jeśli wszystkie testy przeszły ✓ → **READY FOR PRODUCTION** 🚀

## 🆘 Problem?

1. Sprawdź console (F12) - błędy?
2. Network tab - requesty 200 OK?
3. Sprawdź czy endpoint `/api/workout-days/:id` działa (Postman/curl)
4. Zrestartuj dev server (`Ctrl+C`, `npm run dev`)

---

**Estimated Total Testing Time: ~11 minutes**
