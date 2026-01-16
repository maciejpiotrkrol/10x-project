# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing Page jest pierwszym punktem kontaktu użytkownika z aplikacją Athletica. Jej głównym celem jest przyciągnięcie nowych użytkowników poprzez prezentację wartości aplikacji (value proposition) oraz skierowanie ich do procesu rejestracji. Strona wyświetla nazwę aplikacji, krótki opis, trzy kluczowe funkcjonalności oraz wyraźny przycisk Call-to-Action "Zacznij za darmo". Zalogowani użytkownicy są automatycznie przekierowywani do widoku dashboard.

## 2. Routing widoku

**Ścieżka:** `/` (root)

**Behavior:**

- Dla niezalogowanych użytkowników: wyświetla landing page
- Dla zalogowanych użytkowników: automatyczne przekierowanie do `/dashboard` (obsługiwane przez middleware)

## 3. Struktura komponentów

Widok Landing Page składa się z jednego głównego komponentu Astro (.astro) bez React, ponieważ jest w pełni statyczny:

```
src/pages/index.astro
└── Layout: BaseLayout.astro (lub dedykowany LandingLayout.astro)
    └── main
        ├── Hero Section
        │   ├── h1 (Nazwa aplikacji)
        │   ├── p (Value proposition)
        │   └── Button/Link (CTA)
        └── Features Section
            ├── Feature Item 1 (Spersonalizowane cele)
            ├── Feature Item 2 (AI-powered generation)
            └── Feature Item 3 (Śledzenie postępów)
```

**Opcjonalnie:** Można wydzielić sekcje do osobnych komponentów Astro:

- `HeroSection.astro` - hero z CTA
- `FeaturesSection.astro` - lista trzech funkcjonalności

## 4. Szczegóły komponentów

### index.astro (Główny komponent Landing Page)

**Opis komponentu:**
Główny plik strony landing page. Odpowiada za wyświetlenie hero section z nazwą aplikacji, value proposition, przyciskiem CTA oraz sekcji z trzema kluczowymi funkcjonalnościami aplikacji. Komponent jest w pełni statyczny (Astro), bez JavaScript po stronie klienta.

**Główne elementy HTML:**

- `<main>` - główny kontener semantyczny
  - `<section>` (hero) - hero section z contentem głównym
    - `<div>` (container) - centrujący kontener
      - `<h1>` - nazwa aplikacji "Athletica"
      - `<p>` - krótki opis value proposition
      - `<a>` (stylizowany jako button) - CTA button "Zacznij za darmo" → `/auth/signup`
  - `<section>` (features) - lista kluczowych funkcjonalności
    - `<div>` (grid/flex container) - kontener na 3 feature items
      - 3x `<div>` (feature-card) - każdy zawiera:
        - `<div>` (icon-container) - emoji jako ikona
        - `<h3>` - tytuł funkcjonalności
        - `<p>` - krótki opis

**Obsługiwane zdarzenia:**

- Brak zdarzeń JavaScript (strona statyczna)
- Nawigacja przez standardowy `<a href="/auth/signup">`

**Warunki walidacji:**

- Brak walidacji po stronie komponentu
- Middleware server-side sprawdza czy użytkownik jest zalogowany:
  - Jeśli `context.locals.supabase.auth.getUser()` zwraca użytkownika → redirect do `/dashboard`
  - Jeśli nie → renderuj landing page

**Typy:**

- Brak specjalnych typów (content hardcoded w komponencie)
- Opcjonalnie można stworzyć typ dla feature items:

```typescript
interface Feature {
  icon: string; // Emoji
  title: string; // Tytuł funkcjonalności
  description: string; // Opis funkcjonalności
}
```

**Propsy:**

- Brak (komponent nie przyjmuje propsów - wszystko statyczne)

### HeroSection.astro (Opcjonalny wydzielony komponent)

**Opis komponentu:**
Wydzielony komponent odpowiedzialny za hero section z głównym przekazem i CTA. Zawiera nazwę aplikacji, value proposition oraz przycisk "Zacznij za darmo".

**Główne elementy HTML:**

- `<section>` - semantyczny kontener hero
  - `<div>` (container) - kontener centrujący
    - `<h1>` - "Athletica"
    - `<p>` - value proposition (np. "Twój osobisty trener biegowy napędzany AI")
    - `<a>` lub `<Button>` - CTA link/button

**Obsługiwane zdarzenia:**

- Brak (standardowa nawigacja przez href)

**Warunki walidacji:**

- Brak

**Typy:**

- Brak

**Propsy:**

- Brak (lub opcjonalnie: `title: string`, `subtitle: string`, `ctaText: string`, `ctaHref: string`)

### FeaturesSection.astro (Opcjonalny wydzielony komponent)

**Opis komponentu:**
Sekcja wyświetlająca 3 kluczowe funkcjonalności aplikacji w formie grid/flex layout. Każda funkcjonalność przedstawiona jako karta z emoji ikoną, tytułem i opisem.

**Główne elementy HTML:**

- `<section>` - semantyczny kontener
  - `<div>` (grid-container) - grid/flex layout
    - 3x `<div>` (feature-card):
      - `<div>` (icon) - emoji
      - `<h3>` - tytuł
      - `<p>` - opis

**Obsługiwane zdarzenia:**

- Brak (czysto prezentacyjny)

**Warunki walidacji:**

- Brak

**Typy:**

```typescript
interface Feature {
  icon: string;
  title: string;
  description: string;
}
```

**Propsy:**

```typescript
interface Props {
  features: Feature[];
}
```

lub brak propsów (features hardcoded)

### Button (Shadcn/ui)

**Opis komponentu:**
Standardowy button komponent z biblioteki Shadcn/ui. Użyty jako link `<a>` stylizowany jako button dla CTA.

**Główne elementy:**

- Komponent Button z Shadcn z wariantem "default" lub "primary"
- Renderowany jako `<a>` element (asChild pattern w Radix)

**Obsługiwane zdarzenia:**

- Standardowa nawigacja przez href (brak JavaScript)

**Warunki walidacji:**

- Brak

**Typy:**

- Standardowe typy z `@/components/ui/button`

**Propsy:**

```typescript
{
  asChild?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}
```

## 5. Typy

Landing Page nie wymaga specjalnych typów, ponieważ jest w pełni statyczna. Wszystkie dane (teksty, ikony) są hardcoded w komponencie.

**Opcjonalnie** (dla lepszej organizacji kodu):

```typescript
// Może być zdefiniowane lokalnie w pliku .astro
interface Feature {
  /** Emoji używane jako ikona (🎯, 🤖, 📊) */
  icon: string;

  /** Tytuł funkcjonalności */
  title: string;

  /** Krótki opis funkcjonalności (1-2 zdania) */
  description: string;
}
```

**Przykładowe dane:**

```typescript
const features: Feature[] = [
  {
    icon: "🎯",
    title: "Spersonalizowane cele",
    description: "Plany treningowe dostosowane do Twoich celów i poziomu zaawansowania",
  },
  {
    icon: "🤖",
    title: "AI-powered generation",
    description: "Inteligentne algorytmy tworzą optymalny plan treningowy",
  },
  {
    icon: "📊",
    title: "Śledzenie postępów",
    description: "Monitoruj swoje treningi i realizuj cele krok po kroku",
  },
];
```

## 6. Zarządzanie stanem

**Brak zarządzania stanem** - Landing Page jest w pełni statyczna.

Jedyne "zarządzanie stanem" to sprawdzenie przez middleware server-side, czy użytkownik jest zalogowany:

```typescript
// W src/middleware/index.ts (już istniejący middleware)
const {
  data: { user },
} = await context.locals.supabase.auth.getUser();

if (user && context.url.pathname === "/") {
  return context.redirect("/dashboard");
}
```

## 7. Integracja API

**Brak integracji API** na Landing Page.

Landing Page nie wykonuje żadnych wywołań API. Jedyne sprawdzenie autentykacji odbywa się server-side w middleware przed renderowaniem strony:

**Middleware sprawdza:**

- `context.locals.supabase.auth.getUser()` → zwraca `{ data: { user }, error }`
- Jeśli `user` istnieje → redirect do `/dashboard`
- Jeśli `user === null` → renderuj landing page

**Typy żądania:** Brak
**Typy odpowiedzi:** Brak

## 8. Interakcje użytkownika

### 8.1. Użytkownik odwiedza stronę główną (/)

**Akcja:** Użytkownik wpisuje URL aplikacji lub klika link prowadzący do `/`

**Obsługa:**

1. Middleware sprawdza sesję Supabase
2. Jeśli użytkownik zalogowany → automatyczne przekierowanie do `/dashboard`
3. Jeśli użytkownik niezalogowany → wyświetlenie landing page

**Oczekiwany wynik:**

- Niezalogowani: widzą landing page z hero i features
- Zalogowani: przekierowanie do dashboard (nie widzą landing page)

### 8.2. Użytkownik klika "Zacznij za darmo"

**Akcja:** Kliknięcie przycisku CTA "Zacznij za darmo"

**Obsługa:**

- Standardowa nawigacja przez `<a href="/auth/signup">`
- Brak JavaScript (natywna nawigacja przeglądarki)

**Oczekiwany wynik:**

- Przekierowanie do strony rejestracji `/auth/signup`

### 8.3. Nawigacja klawiaturą

**Akcja:** Użytkownik nawiguje używając klawisza Tab

**Obsługa:**

- Focus-visible states na przycisku CTA (Tailwind: `focus-visible:ring-2`)
- Dostępność klawiatury dla linku/buttona

**Oczekiwany wynik:**

- Widoczne zaznaczenie focus na interaktywnych elementach
- Możliwość aktywacji CTA przez Enter/Space

### 8.4. Użycie screen readera

**Akcja:** Użytkownik z niepełnosprawnością używa screen readera

**Obsługa:**

- Semantyczny HTML (header, main, section, h1, h2, h3)
- Alt text dla ikon (jeśli używane img zamiast emoji)
- ARIA landmarks jeśli potrzebne

**Oczekiwany wynik:**

- Prawidłowa nawigacja przez landmarks
- Zrozumiała struktura treści
- Czytelne opisy elementów

## 9. Warunki i walidacja

### 9.1. Warunek: Sprawdzenie statusu autentykacji

**Komponent:** Middleware (nie komponent UI)

**Warunek:**

```typescript
const {
  data: { user },
} = await context.locals.supabase.auth.getUser();
if (user && context.url.pathname === "/") {
  // Użytkownik zalogowany i próbuje wejść na landing page
}
```

**Wpływ na UI:**

- Jeśli warunek spełniony: redirect do `/dashboard` (użytkownik nie widzi landing page)
- Jeśli warunek niespełniony: renderowanie landing page

**Cel:** Zapobieganie wyświetlaniu landing page zalogowanym użytkownikom

### 9.2. Walidacja: Meta tags i SEO

**Komponent:** Layout / Head section

**Warunek:**

- Obecność `<title>` tag
- Obecność `<meta name="description">`
- Poprawna struktura Open Graph tags (opcjonalnie)

**Wpływ na UI:**

- Brak bezpośredniego wpływu na UI
- Wpływ na SEO i wyświetlanie w wynikach wyszukiwania

### 9.3. Walidacja: Dostępność (Accessibility)

**Komponent:** Wszystkie elementy landing page

**Warunki:**

- Semantyczny HTML (header, main, section, h1-h6)
- Kontrast kolorów minimum 4.5:1 (WCAG AA)
- Focus-visible states na interaktywnych elementach
- Alt text dla obrazów (jeśli używane)

**Wpływ na UI:**

- Lepsze doświadczenie dla użytkowników z niepełnosprawnościami
- Zgodność z WCAG 2.1 guidelines

## 10. Obsługa błędów

### 10.1. Błąd middleware przy sprawdzaniu sesji

**Scenariusz:** Supabase auth zwraca błąd podczas sprawdzania sesji

**Obsługa:**

```typescript
const {
  data: { user },
  error,
} = await context.locals.supabase.auth.getUser();
if (error) {
  // Log error server-side
  console.error("Auth check error:", error);
  // Fail-safe: wyświetl landing page
  return next();
}
```

**Wyświetlany komunikat:** Brak (cicha obsługa, wyświetl landing page)

**Akcje użytkownika:** Użytkownik widzi landing page normalnie

### 10.2. Brak połączenia sieciowego

**Scenariusz:** Użytkownik nie ma połączenia z internetem

**Obsługa:**

- Przeglądarki wyświetlają standardowy komunikat "No internet connection"
- Landing page nie wymaga JavaScript, więc po załadowaniu działa offline

**Wyświetlany komunikat:** Komunikat przeglądarki

**Akcje użytkownika:** Sprawdzenie połączenia, odświeżenie strony

### 10.3. Błąd SEO meta tags

**Scenariusz:** Brakuje title lub description meta tags

**Obsługa:**

- Zawsze definiować domyślne wartości w Layout
- Fallback title: "Athletica"
- Fallback description: "Aplikacja do tworzenia planów treningowych"

**Wyświetlany komunikat:** Brak (wpływ tylko na SEO)

### 10.4. Problemy z kontrastem kolorów

**Scenariusz:** Niski kontrast utrudnia czytanie

**Obsługa:**

- Testowanie kontrastów podczas developmentu (narzędzie: WebAIM Contrast Checker)
- Użycie zmiennych Tailwind z wysokim kontrastem
- Minimum 4.5:1 dla normalnego tekstu, 3:1 dla dużego tekstu (WCAG AA)

**Wyświetlany komunikat:** Brak (problem prewencyjny)

## 11. Kroki implementacji

### Krok 1: Przygotowanie middleware

**Zadanie:** Zaimplementować sprawdzanie autentykacji i przekierowanie zalogowanych użytkowników

**Akcje:**

1. Otworzyć `src/middleware/index.ts`
2. Dodać logikę sprawdzającą `context.url.pathname === '/'`
3. Jeśli użytkownik zalogowany i ścieżka to `/`, wykonać `return context.redirect('/dashboard')`
4. Przetestować z zalogowanym i niezalogowanym użytkownikiem

**Przykładowy kod:**

```typescript
// src/middleware/index.ts
export const onRequest = defineMiddleware(async (context, next) => {
  // ... istniejący kod Supabase setup ...

  const {
    data: { user },
  } = await context.locals.supabase.auth.getUser();

  // Przekieruj zalogowanych użytkowników z landing page do dashboard
  if (user && context.url.pathname === "/") {
    return context.redirect("/dashboard");
  }

  return next();
});
```

### Krok 2: Utworzenie Layout (jeśli nie istnieje)

**Zadanie:** Stworzyć layout z odpowiednimi meta tags dla SEO

**Akcje:**

1. Stworzyć (lub zmodyfikować) `src/layouts/BaseLayout.astro`
2. Dodać `<title>` tag: "Athletica - Twój osobisty trener biegowy"
3. Dodać `<meta name="description">` z value proposition
4. Dodać `<meta name="viewport">` dla responsywności
5. Zaimportować globalne style Tailwind
6. Dodać lang="pl" do `<html>`

**Przykładowy kod:**

```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title?: string;
  description?: string;
}

const {
  title = "Athletica - Twój osobisty trener biegowy",
  description = "Stwórz spersonalizowany plan treningowy biegowy w 10 tygodni. AI tworzy plan idealnie dopasowany do Twoich celów.",
} = Astro.props;
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

### Krok 3: Utworzenie głównego pliku landing page

**Zadanie:** Stworzyć `src/pages/index.astro` z podstawową strukturą

**Akcje:**

1. Stworzyć plik `src/pages/index.astro`
2. Zaimportować Layout
3. Dodać `export const prerender = false` (dla SSR z middleware)
4. Stworzyć podstawową strukturę HTML: `<main>` z dwoma `<section>`

**Przykładowy kod:**

```astro
---
// src/pages/index.astro
import BaseLayout from "@/layouts/BaseLayout.astro";

export const prerender = false; // SSR dla middleware redirect
---

<BaseLayout>
  <main class="min-h-screen flex flex-col items-center justify-center">
    <!-- Hero Section -->
    <section>
      <!-- Zawartość hero -->
    </section>

    <!-- Features Section -->
    <section>
      <!-- Zawartość features -->
    </section>
  </main>
</BaseLayout>
```

### Krok 4: Implementacja Hero Section

**Zadanie:** Dodać hero section z nazwą aplikacji, value proposition i CTA

**Akcje:**

1. W pierwszym `<section>` dodać kontener centrujący
2. Dodać `<h1>` z nazwą "Athletica"
3. Dodać `<p>` z value proposition
4. Dodać `<a>` link stylizowany jako button z tekstem "Zacznij za darmo" i `href="/auth/signup"`
5. Zastosować Tailwind classes dla stylowania i układu

**Przykładowy kod:**

```astro
<section class="text-center px-4 mb-16">
  <h1 class="text-5xl md:text-6xl font-bold mb-6 text-gray-900">Athletica</h1>
  <p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
    Twój osobisty trener biegowy napędzany AI. Stwórz spersonalizowany plan treningowy w 10 tygodni.
  </p>
  <a
    href="/auth/signup"
    class="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
  >
    Zacznij za darmo
  </a>
</section>
```

### Krok 5: Implementacja Features Section

**Zadanie:** Dodać sekcję z 3 kluczowymi funkcjonalnościami

**Akcje:**

1. W drugim `<section>` stworzyć grid/flex container
2. Dodać 3 karty feature (div) z:
   - Emoji jako ikona
   - `<h3>` jako tytuł
   - `<p>` jako opis
3. Zastosować responsywny grid layout (1 kolumna mobile, 3 kolumny desktop)
4. Dodać Tailwind classes dla stylowania

**Przykładowy kod:**

```astro
<section class="px-4 max-w-6xl mx-auto">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <!-- Feature 1 -->
    <div class="text-center">
      <div class="text-5xl mb-4" role="img" aria-label="Ikona celów">🎯</div>
      <h3 class="text-xl font-semibold mb-2 text-gray-900">Spersonalizowane cele</h3>
      <p class="text-gray-600">Plany treningowe dostosowane do Twoich celów i poziomu zaawansowania</p>
    </div>

    <!-- Feature 2 -->
    <div class="text-center">
      <div class="text-5xl mb-4" role="img" aria-label="Ikona AI">🤖</div>
      <h3 class="text-xl font-semibold mb-2 text-gray-900">AI-powered generation</h3>
      <p class="text-gray-600">Inteligentne algorytmy tworzą optymalny plan treningowy</p>
    </div>

    <!-- Feature 3 -->
    <div class="text-center">
      <div class="text-5xl mb-4" role="img" aria-label="Ikona postępów">📊</div>
      <h3 class="text-xl font-semibold mb-2 text-gray-900">Śledzenie postępów</h3>
      <p class="text-gray-600">Monitoruj swoje treningi i realizuj cele krok po kroku</p>
    </div>
  </div>
</section>
```

### Krok 6: (Opcjonalne) Użycie Shadcn Button

**Zadanie:** Zastąpić `<a>` linki komponentem Button z Shadcn/ui

**Akcje:**

1. Sprawdzić czy istnieje `src/components/ui/button.tsx`
2. Jeśli nie, dodać przez Shadcn CLI: `npx shadcn-ui@latest add button`
3. Zaimportować Button w pliku .astro
4. Użyć Button z `asChild` prop i `<a>` jako child

**Przykładowy kod:**

```astro
---
import { Button } from "@/components/ui/button";
---

<Button asChild size="lg">
  <a href="/auth/signup"> Zacznij za darmo </a>
</Button>
```

### Krok 7: Stylowanie i responsywność

**Zadanie:** Dopracować stylowanie i zapewnić responsywność

**Akcje:**

1. Sprawdzić layout na różnych rozmiarach ekranów (mobile, tablet, desktop)
2. Użyć Tailwind responsive breakpoints (sm, md, lg, xl)
3. Upewnić się, że zawartość mieści się bez scrollowania na większości ekranów
4. Dostosować padding, marginesy i rozmiary fontów
5. Przetestować na urządzeniach mobilnych

**Przykładowe Tailwind classes:**

- Container: `px-4 md:px-6 lg:px-8`
- Heading: `text-4xl md:text-5xl lg:text-6xl`
- Grid: `grid-cols-1 md:grid-cols-3`
- Spacing: `mb-8 md:mb-12 lg:mb-16`

### Krok 8: Testowanie dostępności

**Zadanie:** Przetestować dostępność (a11y) landing page

**Akcje:**

1. Użyć Lighthouse w Chrome DevTools (kategoria Accessibility)
2. Przetestować nawigację klawiaturą (Tab, Enter)
3. Sprawdzić focus-visible states
4. Sprawdzić kontrasty kolorów (minimum 4.5:1)
5. Przetestować ze screen readerem (np. VoiceOver na macOS, NVDA na Windows)
6. Upewnić się, że semantyczny HTML jest poprawny

**Checklist:**

- [ ] Wynik Lighthouse Accessibility > 90
- [ ] Wszystkie interaktywne elementy dostępne klawiaturą
- [ ] Focus states widoczne
- [ ] Kontrasty spełniają WCAG AA
- [ ] Semantyczny HTML (header, main, section, h1-h6)
- [ ] ARIA labels gdzie potrzebne

### Krok 9: Testowanie przekierowania

**Zadanie:** Przetestować middleware i przekierowanie zalogowanych użytkowników

**Akcje:**

1. Uruchomić aplikację: `npm run dev`
2. Otworzyć `/` jako niezalogowany użytkownik → powinien zobaczyć landing page
3. Zalogować się (lub zarejestrować)
4. Ręcznie wejść na `/` → powinien być przekierowany do `/dashboard`
5. Wylogować się
6. Wejść na `/` ponownie → powinien zobaczyć landing page

**Oczekiwane rezultaty:**

- Niezalogowani: widzą landing page
- Zalogowani: automatyczne przekierowanie do /dashboard

### Krok 10: Optymalizacja SEO i meta tags

**Zadanie:** Zoptymalizować SEO i dodać dodatkowe meta tags

**Akcje:**

1. Sprawdzić obecność wszystkich podstawowych meta tags
2. Dodać Open Graph tags (opcjonalnie):
   - `og:title`
   - `og:description`
   - `og:image`
   - `og:url`
3. Dodać Twitter Card tags (opcjonalnie)
4. Sprawdzić title i description w Google Search preview
5. Dodać canonical URL jeśli potrzebne

**Przykładowy kod (w Layout):**

```astro
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:type" content="website" />
<meta property="og:url" content={Astro.url} />
<meta name="twitter:card" content="summary_large_image" />
```

### Krok 11: Testy finalne i deploy

**Zadanie:** Przeprowadzić finalne testy i wdrożyć na production

**Akcje:**

1. Build aplikacji: `npm run build`
2. Przetestować production build lokalnie: `npm run preview`
3. Sprawdzić czy wszystko działa poprawnie w trybie production
4. Sprawdzić czas ładowania strony (Lighthouse Performance)
5. Sprawdzić bundle size (powinien być minimalny - brak JS dla landing page)
6. Commit i push zmian do repozytorium
7. Deploy przez CI/CD (GitHub Actions → DigitalOcean)

**Checklist finalny:**

- [ ] Build przechodzi bez błędów
- [ ] Middleware przekierowanie działa
- [ ] Landing page wyświetla się poprawnie
- [ ] CTA button prowadzi do /auth/signup
- [ ] Responsywność działa na wszystkich urządzeniach
- [ ] Dostępność > 90 w Lighthouse
- [ ] SEO meta tags obecne
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Czas ładowania < 2s
