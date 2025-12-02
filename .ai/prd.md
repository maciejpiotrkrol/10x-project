# Dokument wymagań produktu (PRD) - Athletica

## 1. Przegląd produktu

Athletica to aplikacja internetowa w wersji MVP (Minimum Viable Product), której celem jest uproszczenie procesu planowania treningów biegowych. Za pomocą sztucznej inteligencji (AI), aplikacja generuje spersonalizowane, 10-tygodniowe plany treningowe na podstawie danych wprowadzonych przez użytkownika. Główne funkcjonalności obejmują system kont użytkowników, ankietę określającą cele i poziom zaawansowania, moduł generujący plany oraz prosty interfejs do przeglądania i śledzenia postępów w treningach. Aplikacja jest skierowana do biegaczy-amatorów, którzy szukają łatwego i skutecznego sposobu na stworzenie dopasowanego do nich planu treningowego.

## 2. Problem użytkownika

Planowanie spersonalizowanego i efektywnego treningu biegowego jest procesem złożonym i czasochłonnym, który często stanowi wyzwanie dla amatorów. Biegacze mają trudności z dostosowaniem gotowych planów do swojej aktualnej formy, celów i możliwości, co może prowadzić do braku postępów, przetrenowania lub kontuzji. Athletica rozwiązuje ten problem, oferując narzędzie, które w oparciu o AI tworzy plan treningowy idealnie dopasowany do indywidualnych potrzeb użytkownika, czyniąc proces planowania łatwym i przyjemnym.

## 3. Wymagania funkcjonalne

- 3.1. System kont użytkowników:
  - 3.1.1. Użytkownik może założyć konto przy użyciu adresu e-mail i hasła.
  - 3.1.2. Użytkownik może zalogować się do swojego konta.
  - 3.1.3. Dostępna jest funkcja resetowania zapomnianego hasła.
- 3.2. Ankieta i generowanie planu:
  - 3.2.1. Użytkownik wypełnia ankietę, podając: cel-dystans, średni tygodniowy kilometraż, liczbę dni treningowych, wiek, wagę, wzrost, płeć oraz co najmniej jeden rekord życiowy.
  - 3.2.2. Na podstawie danych z ankiety, system AI generuje 10-tygodniowy plan treningowy.
  - 3.2.3. Plan treningowy rozpoczyna się w dniu jego wygenerowania.
  - 3.2.4. Wygenerowanie nowego planu treningowego nadpisuje poprzedni aktywny plan. Użytkownik jest o tym informowany za pomocą okna dialogowego z prośbą o potwierdzenie.
- 3.3. Interfejs planu treningowego:
  - 3.3.1. Plan jest wyświetlany jako chronologiczna lista kafelków, po jednym na każdy dzień.
  - 3.3.2. Każdy kafelek treningowy zawiera pełny opis treningu w formie sformatowanego bloku tekstu.
  - 3.3.3. Dni bez treningu są wyraźnie oznaczone jako "Odpoczynek".
- 3.4. Interakcja z treningiem:
  - 3.4.1. Użytkownik ma możliwość oznaczenia treningu jako "wykonany".
  - 3.4.2. Użytkownik może cofnąć oznaczenie treningu jako "wykonany".
- 3.5. Profil użytkownika:
  - 3.5.1. Użytkownik ma dostęp do strony profilu w trybie "tylko do odczytu".
  - 3.5.2. Profil wyświetla dane wprowadzone przez użytkownika w ostatniej wypełnionej ankiecie.
- 3.6. Aspekty prawne:
  - 3.6.1. Pod ankietą wyświetlany jest prosty disclaimer prawny, który użytkownik musi wziąć pod uwagę przed wygenerowaniem planu.

## 4. Granice produktu

Poniższe funkcjonalności i cechy znajdują się poza zakresem MVP (Minimum Viable Product):

- Importowanie gotowych treningów i planów treningowych.
- Generowanie treningów w formacie umożliwiającym eksport do zegarków sportowych lub innych urządzeń.
- Współdzielenie planów treningowych z innymi użytkownikami.
- Integracje z zewnętrznymi platformami treningowymi (np. Strava, Garmin Connect).
- Aplikacje mobilne (produkt dostępny jest wyłącznie jako aplikacja webowa).
- Edycja lub usuwanie pojedynczych jednostek treningowych w ramach wygenerowanego planu.
- Wbudowany w aplikację system zbierania opinii od użytkowników.
- Zaawansowana walidacja realności danych wprowadzanych przez użytkownika w ankiecie.
- Dodawanie notatek do treningów.
- Kontekstowe wskazówki od AI dotyczące techniki biegu, diety czy regeneracji.

## 5. Historyjki użytkowników

---

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do jej funkcjonalności.
- Kryteria akceptacji:
  - 1. Formularz rejestracji zawiera pola na adres e-mail, hasło i potwierdzenie hasła.
  - 2. System waliduje poprawność formatu adresu e-mail.
  - 3. System sprawdza, czy hasła w obu polach są identyczne.
  - 4. Po pomyślnej rejestracji, użytkownik jest automatycznie zalogowany i przekierowany do strony z ankietą.
  - 5. W przypadku, gdy użytkownik o podanym adresie e-mail już istnieje, wyświetlany jest odpowiedni komunikat błędu.

---

- ID: US-002
- Tytuł: Logowanie do systemu
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego e-maila i hasła, aby uzyskać dostęp do mojego planu treningowego.
- Kryteria akceptacji:
  - 1. Formularz logowania zawiera pola na adres e-mail i hasło.
  - 2. Po pomyślnym zalogowaniu, użytkownik jest przekierowany do widoku swojego planu treningowego.
  - 3. W przypadku podania błędnego e-maila lub hasła, wyświetlany jest odpowiedni komunikat błędu.

---

- ID: US-003
- Tytuł: Wylogowanie z systemu
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować z aplikacji, aby zabezpieczyć dostęp do mojego konta.
- Kryteria akceptacji:
  - 1. W interfejsie aplikacji znajduje się przycisk "Wyloguj".
  - 2. Po kliknięciu przycisku, sesja użytkownika jest kończona i zostaje on przekierowany na stronę logowania.

---

- ID: US-004
- Tytuł: Resetowanie hasła
- Opis: Jako zarejestrowany użytkownik, który zapomniał hasła, chcę mieć możliwość jego zresetowania, aby odzyskać dostęp do konta.
- Kryteria akceptacji:
  - 1. Na stronie logowania znajduje się link "Zapomniałem hasła".
  - 2. Po kliknięciu linku, użytkownik jest proszony o podanie swojego adresu e-mail.
  - 3. Na podany adres e-mail wysyłana jest wiadomość z linkiem do zmiany hasła.
  - 4. Po przejściu pod link, użytkownik może ustawić nowe hasło.

---

- ID: US-005
- Tytuł: Wypełnienie ankiety i generacja pierwszego planu
- Opis: Jako nowy użytkownik, po pierwszym zalogowaniu, chcę wypełnić ankietę dotyczącą moich celów i obecnej formy, aby otrzymać mój pierwszy spersonalizowany plan treningowy.
- Kryteria akceptacji:
  - 1. Ankieta zawiera wszystkie wymagane pola: cel-dystans, średni tygodniowy kilometraż, liczba dni treningowych, wiek, waga, wzrost, płeć, co najmniej jeden rekord życiowy.
  - 2. Po wypełnieniu i przesłaniu ankiety, system AI generuje 10-tygodniowy plan treningowy.
  - 3. Po wygenerowaniu planu, użytkownik jest przekierowywany do widoku tego planu.
  - 4. Pod ankietą znajduje się disclaimer prawny.

---

- ID: US-006
- Tytuł: Przeglądanie aktywnego planu treningowego
- Opis: Jako użytkownik z aktywnym planem, chcę móc przeglądać listę wszystkich treningów w moim planie, aby wiedzieć, co mam do zrobienia każdego dnia.
- Kryteria akceptacji:
  - 1. Po zalogowaniu, domyślnym widokiem jest lista dni treningowych.
  - 2. Lista jest posortowana chronologicznie, zaczynając od dnia, w którym plan został wygenerowany.
  - 3. Każdy element listy (kafelek) reprezentuje jeden dzień i zawiera datę oraz pełny opis treningu.
  - 4. Aplikacja po załadowaniu zawsze pokazuje listę od góry.

---

- ID: US-007
- Tytuł: Oznaczanie treningu jako wykonanego
- Opis: Jako użytkownik, chcę móc oznaczyć dany trening jako "wykonany", aby śledzić swoje postępy.
- Kryteria akceptacji:
  - 1. Każdy kafelek treningowy posiada interaktywny element (np. checkbox lub przycisk) do oznaczenia go jako wykonanego.
  - 2. Po oznaczeniu, status wizualny kafelka zmienia się, aby jednoznacznie wskazywać, że trening został ukończony.
  - 3. Akcja jest zapisywana w systemie.

---

- ID: US-008
- Tytuł: Cofanie oznaczenia treningu jako wykonanego
- Opis: Jako użytkownik, chcę mieć możliwość cofnięcia oznaczenia treningu jako "wykonany" na wypadek, gdybym zrobił to przez pomyłkę.
- Kryteria akceptacji:
  - 1. Użytkownik może cofnąć oznaczenie wykonania treningu poprzez ponowną interakcję z tym samym elementem.
  - 2. Po cofnięciu, status wizualny kafelka wraca do stanu początkowego.
  - 3. Zmiana jest zapisywana w systemie.

---

- ID: US-009
- Tytuł: Generowanie nowego planu (nadpisanie istniejącego)
- Opis: Jako użytkownik, który ma już aktywny plan, chcę móc wygenerować nowy plan treningowy, aby dostosować go do nowych celów, co spowoduje zastąpienie starego planu.
- Kryteria akceptacji:
  - 1. Użytkownik ma dostęp do opcji wygenerowania nowego planu (np. przycisk "Nowy Plan").
  - 2. Po kliknięciu, wyświetlana jest ankieta (może być wstępnie wypełniona danymi z poprzedniej ankiety).
  - 3. Przed wygenerowaniem nowego planu i nadpisaniem starego, wyświetlane jest okno dialogowe z prośbą o potwierdzenie akcji.
  - 4. Po potwierdzeniu, stary plan jest zastępowany nowym, 10-tygodniowym planem.

---

- ID: US-010
- Tytuł: Wyświetlanie dni odpoczynku
- Opis: Jako użytkownik, chcę wyraźnie widzieć w moim planie dni przeznaczone na odpoczynek, aby wiedzieć, kiedy nie mam zaplanowanego treningu.
- Kryteria akceptacji:
  - 1. Dni bez treningu są reprezentowane przez dedykowany kafelek.
  - 2. Kafelek dnia wolnego zawiera informację "Odpoczynek".
  - 3. Kafelek dnia wolnego nie posiada opcji oznaczenia jako "wykonany".

---

- ID: US-011
- Tytuł: Przeglądanie profilu użytkownika
- Opis: Jako użytkownik, chcę mieć dostęp do strony mojego profilu, gdzie mogę zobaczyć dane, które podałem podczas ostatniego generowania planu.
- Kryteria akceptacji:
  - 1. W aplikacji znajduje się link do strony profilu użytkownika.
  - 2. Strona profilu wyświetla w trybie "tylko do odczytu" dane z ostatniej ankiety (wiek, waga, wzrost, płeć, cele etc.).
  - 3. Nie ma możliwości edycji danych bezpośrednio na stronie profilu.

---

- ID: US-012
- Tytuł: Zakończenie planu treningowego
- Opis: Jako użytkownik, który ukończył swój 10-tygodniowy plan, chcę otrzymać informację zwrotną i zachętę do podjęcia kolejnych kroków.
- Kryteria akceptacji:
  - 1. Po upływie 10 tygodni od startu planu (lub po oznaczeniu ostatniego treningu), użytkownikowi wyświetla się pop-up z gratulacjami.
  - 2. Pop-up zawiera przycisk/link zachęcający do wygenerowania nowego planu treningowego.

## 6. Metryki sukcesu

Głównym kryterium sukcesu dla wersji MVP aplikacji Athletica jest zaangażowanie użytkowników w realizację wygenerowanych planów treningowych. Sposób mierzenia sukcesu został zdefiniowany przez następujące metryki:

- 6.1. Główna metryka: Procent wykonanych treningów.
  - Opis: Dla każdego użytkownika z aktywnym planem, system będzie obliczał stosunek liczby treningów oznaczonych jako "wykonane" do całkowitej liczby treningów w planie.
  - Cel: Monitorowanie, jak aktywnie użytkownicy realizują swoje plany. Dane te są nadpisywane w momencie wygenerowania nowego planu przez użytkownika.
- 6.2. Metryka pomocnicza (do analizy wewnętrznej): Współczynnik aktywacji planu.
  - Opis: Stosunek liczby wygenerowanych planów, w których ukończono co najmniej jeden trening, do całkowitej liczby wygenerowanych planów.
  - Cel: Zrozumienie, ilu użytkowników po wygenerowaniu planu faktycznie rozpoczyna trening, co jest kluczowym wskaźnikiem wartości dostarczanej przez aplikację.
