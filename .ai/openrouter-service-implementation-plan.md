# Plan Implementacji Usługi OpenRouter

## 1. Opis Usługi

Usługa `OpenRouterService` będzie odpowiedzialna za komunikację z API OpenRouter w celu generowania odpowiedzi z modeli LLM. Usługa umożliwi:

- Wysyłanie zapytań do różnych modeli AI dostępnych przez OpenRouter
- Obsługę komunikatów systemowych i użytkownika
- Wymuszanie ustrukturyzowanych odpowiedzi poprzez JSON Schema
- Konfigurację parametrów modelu (temperatura, max tokens, itp.)
- Centralizację logiki obsługi błędów i retry mechanism
- Type-safe interfejs dla wszystkich operacji

## 2. Opis Konstruktora

Konstruktor usługi przyjmuje opcjonalną konfigurację i inicjalizuje bazowe ustawienia:

```typescript
interface OpenRouterConfig {
  apiKey?: string;              // Klucz API (domyślnie z env)
  baseURL?: string;             // URL bazowy API (domyślnie: https://openrouter.ai/api/v1)
  defaultModel?: string;        // Domyślny model
  timeout?: number;             // Timeout w ms (domyślnie: 30000)
  maxRetries?: number;          // Max liczba ponownych prób (domyślnie: 3)
  retryDelay?: number;          // Opóźnienie między próbami w ms (domyślnie: 1000)
}

constructor(config?: OpenRouterConfig)
```

**Przykład użycia:**

```typescript
const service = new OpenRouterService({
  defaultModel: 'anthropic/claude-3.5-sonnet',
  timeout: 45000,
  maxRetries: 2
});
```

## 3. Publiczne Metody i Pola

### 3.1 Główna metoda `complete()`

Główna metoda do wykonywania zapytań do API:

```typescript
interface CompletionRequest {
  systemMessage?: string;        // Komunikat systemowy (opcjonalny)
  userMessage: string;           // Komunikat użytkownika (wymagany)
  model?: string;                // Nazwa modelu (opcjonalnie override defaultModel)
  responseFormat?: ResponseFormat; // Schemat JSON dla odpowiedzi
  parameters?: ModelParameters;   // Parametry modelu
}

interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;                // Nazwa schematu
    strict: boolean;             // Strict mode (zawsze true)
    schema: JSONSchema;          // Obiekt JSON Schema
  };
}

interface ModelParameters {
  temperature?: number;          // 0.0 - 2.0 (domyślnie: 1.0)
  maxTokens?: number;           // Max liczba tokenów w odpowiedzi
  topP?: number;                // 0.0 - 1.0 (domyślnie: 1.0)
  frequencyPenalty?: number;    // -2.0 - 2.0 (domyślnie: 0)
  presencePenalty?: number;     // -2.0 - 2.0 (domyślnie: 0)
  stop?: string[];              // Sekwencje stop
}

interface CompletionResponse<T = unknown> {
  content: T;                    // Sparsowana odpowiedź (typed jeśli podano schema)
  rawContent: string;           // Surowa odpowiedź tekstowa
  model: string;                // Użyty model
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls';
}

async complete<T = unknown>(request: CompletionRequest): Promise<CompletionResponse<T>>
```

**Przykład 1: Podstawowe zapytanie**

```typescript
const response = await service.complete({
  userMessage: 'Jakie są korzyści z biegania?',
  model: 'openai/gpt-4-turbo'
});

console.log(response.content);
```

**Przykład 2: Z komunikatem systemowym**

```typescript
const response = await service.complete({
  systemMessage: 'Jesteś ekspertem od biegania i treningu.',
  userMessage: 'Stwórz plan treningowy na 10 tygodni',
  parameters: {
    temperature: 0.7,
    maxTokens: 2000
  }
});
```

**Przykład 3: Z ustrukturyzowaną odpowiedzią (response_format)**

```typescript
interface TrainingDay {
  day: number;
  type: string;
  distance: number;
  duration: number;
  description: string;
}

const response = await service.complete<TrainingDay[]>({
  systemMessage: 'Jesteś ekspertem od planowania treningów biegowych.',
  userMessage: 'Stwórz tygodniowy plan treningowy',
  responseFormat: {
    type: 'json_schema',
    json_schema: {
      name: 'training_week',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          days: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'number' },
                type: { type: 'string' },
                distance: { type: 'number' },
                duration: { type: 'number' },
                description: { type: 'string' }
              },
              required: ['day', 'type', 'distance', 'duration', 'description'],
              additionalProperties: false
            }
          }
        },
        required: ['days'],
        additionalProperties: false
      }
    }
  }
});

// TypeScript wie, że response.content ma typ TrainingDay[]
response.content.forEach(day => {
  console.log(day.type, day.distance);
});
```

### 3.2 Metoda `streamComplete()`

Dla długich odpowiedzi, opcjonalna metoda do streamowania:

```typescript
async *streamComplete(request: CompletionRequest): AsyncGenerator<string, void, unknown>
```

**Przykład użycia:**

```typescript
for await (const chunk of service.streamComplete({
  userMessage: 'Napisz długi artykuł o bieganiu'
})) {
  process.stdout.write(chunk);
}
```

### 3.3 Metoda `listModels()`

Pobiera listę dostępnych modeli z OpenRouter:

```typescript
interface ModelInfo {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  contextLength: number;
}

async listModels(): Promise<ModelInfo[]>
```

### 3.4 Pole `config`

Publiczne pole tylko do odczytu z aktualną konfiguracją:

```typescript
readonly config: Readonly<Required<OpenRouterConfig>>
```

## 4. Prywatne Metody i Pola

### 4.1 Pole `apiKey`

```typescript
private readonly apiKey: string
```

Przechowuje klucz API, inicjalizowany z config lub `import.meta.env.OPENROUTER_API_KEY`.

### 4.2 Metoda `buildRequestBody()`

```typescript
private buildRequestBody(request: CompletionRequest): object
```

Buduje ciało zapytania HTTP zgodnie z formatem OpenRouter API:

```typescript
{
  model: string,
  messages: Array<{
    role: 'system' | 'user' | 'assistant',
    content: string
  }>,
  response_format?: {
    type: 'json_schema',
    json_schema: {
      name: string,
      strict: true,
      schema: object
    }
  },
  temperature?: number,
  max_tokens?: number,
  top_p?: number,
  frequency_penalty?: number,
  presence_penalty?: number,
  stop?: string[]
}
```

### 4.3 Metoda `executeWithRetry()`

```typescript
private async executeWithRetry<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T>
```

Implementuje mechanizm retry z exponential backoff dla przejściowych błędów (429, 503, 504).

### 4.4 Metoda `parseResponse()`

```typescript
private parseResponse<T>(rawResponse: string, hasSchema: boolean): T
```

Parsuje odpowiedź z API:
- Jeśli `hasSchema = true`, parsuje JSON i waliduje zgodność ze schematem
- Jeśli `hasSchema = false`, zwraca surowy tekst jako T

### 4.5 Metoda `validateSchema()`

```typescript
private validateSchema(schema: JSONSchema): void
```

Waliduje poprawność JSON Schema przed wysłaniem do API.

### 4.6 Metoda `handleError()`

```typescript
private handleError(error: unknown): never
```

Centralna metoda do obsługi i przekształcania błędów.

## 5. Obsługa Błędów

### 5.1 Custom Error Classes

```typescript
// Bazowa klasa błędów usługi
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

// Błąd konfiguracji
export class ConfigurationError extends OpenRouterError {
  constructor(message: string, cause?: unknown) {
    super(message, 'CONFIGURATION_ERROR', undefined, cause);
    this.name = 'ConfigurationError';
  }
}

// Błąd walidacji
export class ValidationError extends OpenRouterError {
  constructor(message: string, cause?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, cause);
    this.name = 'ValidationError';
  }
}

// Błąd API
export class ApiError extends OpenRouterError {
  constructor(
    message: string,
    statusCode: number,
    public readonly response?: unknown,
    cause?: unknown
  ) {
    super(message, 'API_ERROR', statusCode, cause);
    this.name = 'ApiError';
  }
}

// Błąd timeout
export class TimeoutError extends OpenRouterError {
  constructor(message: string, cause?: unknown) {
    super(message, 'TIMEOUT_ERROR', 408, cause);
    this.name = 'TimeoutError';
  }
}

// Błąd rate limit
export class RateLimitError extends OpenRouterError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    cause?: unknown
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, cause);
    this.name = 'RateLimitError';
  }
}

// Błąd parsowania
export class ParseError extends OpenRouterError {
  constructor(message: string, cause?: unknown) {
    super(message, 'PARSE_ERROR', undefined, cause);
    this.name = 'ParseError';
  }
}
```

### 5.2 Scenariusze Błędów

**Scenariusz 1: Brak klucza API**

```typescript
// Walidacja w konstruktorze
if (!this.apiKey) {
  throw new ConfigurationError(
    'OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or pass apiKey in config.'
  );
}
```

**Scenariusz 2: Nieprawidłowy klucz API**

```typescript
// W handleError() dla statusu 401
if (statusCode === 401) {
  throw new ApiError(
    'Invalid API key. Please check your OpenRouter API key.',
    401,
    errorData
  );
}
```

**Scenariusz 3: Rate limiting**

```typescript
// W handleError() dla statusu 429
if (statusCode === 429) {
  const retryAfter = response.headers.get('retry-after');
  throw new RateLimitError(
    'Rate limit exceeded. Please try again later.',
    retryAfter ? parseInt(retryAfter) : undefined
  );
}
```

**Scenariusz 4: Timeout żądania**

```typescript
// W executeWithRetry()
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ...
  });
} catch (error) {
  if (error.name === 'AbortError') {
    throw new TimeoutError(
      `Request timeout after ${this.config.timeout}ms`,
      error
    );
  }
  throw error;
} finally {
  clearTimeout(timeoutId);
}
```

**Scenariusz 5: Błędny JSON Schema**

```typescript
// W validateSchema()
if (!schema || typeof schema !== 'object') {
  throw new ValidationError('Invalid JSON schema: schema must be an object');
}

if (!schema.type) {
  throw new ValidationError('Invalid JSON schema: missing type property');
}
```

**Scenariusz 6: Model nie istnieje**

```typescript
// W handleError() dla statusu 404
if (statusCode === 404 && errorData?.error?.includes('model')) {
  throw new ApiError(
    `Model not found. Please check the model name.`,
    404,
    errorData
  );
}
```

**Scenariusz 7: Odpowiedź nie jest poprawnym JSON (gdy oczekiwano schema)**

```typescript
// W parseResponse()
if (hasSchema) {
  try {
    return JSON.parse(rawResponse) as T;
  } catch (error) {
    throw new ParseError(
      'Failed to parse JSON response. The model may not have returned valid JSON.',
      error
    );
  }
}
```

**Scenariusz 8: Błąd sieci**

```typescript
// W handleError()
if (error instanceof TypeError && error.message.includes('fetch')) {
  throw new OpenRouterError(
    'Network error. Please check your internet connection.',
    'NETWORK_ERROR',
    undefined,
    error
  );
}
```

**Scenariusz 9: Przekroczono max tokens**

```typescript
// W parseResponse() sprawdzanie finish_reason
if (finishReason === 'length') {
  console.warn('Response was truncated due to max_tokens limit');
}
```

**Scenariusz 10: Content filter**

```typescript
// W parseResponse()
if (finishReason === 'content_filter') {
  throw new ApiError(
    'Response was filtered due to content policy violation',
    400,
    { finishReason }
  );
}
```

## 6. Kwestie Bezpieczeństwa

### 6.1 Ochrona klucza API

```typescript
// 1. Nigdy nie loguj klucza API
console.log('Making request to OpenRouter'); // ✅ OK
console.log(`API Key: ${this.apiKey}`);      // ❌ NIGDY

// 2. Używaj zmiennych środowiskowych
const apiKey = import.meta.env.OPENROUTER_API_KEY;

// 3. Nie przekazuj klucza z frontendu - zawsze używaj API route
// ❌ ZŁE: Wywołanie bezpośrednio z React component
// ✅ DOBRE: Wywołanie przez /api/generate endpoint
```

### 6.2 Walidacja wejścia

```typescript
// Waliduj wszystkie parametry przed wysłaniem do API
if (request.parameters?.temperature !== undefined) {
  if (request.parameters.temperature < 0 || request.parameters.temperature > 2) {
    throw new ValidationError('Temperature must be between 0 and 2');
  }
}

if (request.parameters?.maxTokens !== undefined) {
  if (request.parameters.maxTokens < 1) {
    throw new ValidationError('maxTokens must be positive');
  }
}
```

### 6.3 Sanityzacja komunikatów użytkownika

```typescript
// Usuń potencjalnie niebezpieczne znaki
private sanitizeMessage(message: string): string {
  // Guard clause
  if (!message || typeof message !== 'string') {
    throw new ValidationError('Message must be a non-empty string');
  }

  // Trim whitespace
  const trimmed = message.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Message cannot be empty');
  }

  if (trimmed.length > 100000) {
    throw new ValidationError('Message is too long (max 100000 characters)');
  }

  return trimmed;
}
```

### 6.4 Rate limiting po stronie aplikacji

```typescript
// Implementacja prostego rate limiter
private lastRequestTime = 0;
private readonly minRequestInterval = 100; // ms

private async enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - this.lastRequestTime;

  if (timeSinceLastRequest < this.minRequestInterval) {
    await new Promise(resolve =>
      setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
    );
  }

  this.lastRequestTime = Date.now();
}
```

### 6.5 Timeout na poziomie zapytania

```typescript
// Zawsze używaj timeout dla zapytań HTTP
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: { /* ... */ }
  });
} finally {
  clearTimeout(timeoutId);
}
```

### 6.6 HTTPS tylko

```typescript
// Zawsze używaj HTTPS
constructor(config?: OpenRouterConfig) {
  this.baseURL = config?.baseURL ?? 'https://openrouter.ai/api/v1';

  // Walidacja URL
  if (!this.baseURL.startsWith('https://')) {
    throw new ConfigurationError('Base URL must use HTTPS protocol');
  }
}
```

## 7. Plan Wdrożenia Krok Po Kroku

### Krok 1: Przygotowanie struktury plików

Utwórz następujące pliki w projekcie:

```
src/
  lib/
    openrouter/
      openrouter.service.ts          # Główna klasa usługi
      openrouter.types.ts            # Typy TypeScript
      openrouter.errors.ts           # Custom error classes
      openrouter.utils.ts            # Funkcje pomocnicze
      openrouter.test.ts             # Testy jednostkowe (opcjonalne)
```

### Krok 2: Implementacja typów (openrouter.types.ts)

```typescript
// src/lib/openrouter/openrouter.types.ts

/**
 * Konfiguracja usługi OpenRouter
 */
export interface OpenRouterConfig {
  /** Klucz API OpenRouter (domyślnie z import.meta.env.OPENROUTER_API_KEY) */
  apiKey?: string;

  /** URL bazowy API (domyślnie: https://openrouter.ai/api/v1) */
  baseURL?: string;

  /** Domyślny model do użycia */
  defaultModel?: string;

  /** Timeout zapytania w ms (domyślnie: 30000) */
  timeout?: number;

  /** Maksymalna liczba ponownych prób (domyślnie: 3) */
  maxRetries?: number;

  /** Opóźnienie między próbami w ms (domyślnie: 1000) */
  retryDelay?: number;
}

/**
 * JSON Schema definition
 */
export interface JSONSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  additionalProperties?: boolean;
  enum?: unknown[];
  const?: unknown;
  [key: string]: unknown;
}

/**
 * Format odpowiedzi z JSON Schema
 */
export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: true;
    schema: JSONSchema;
  };
}

/**
 * Parametry modelu
 */
export interface ModelParameters {
  /** Temperatura (0.0 - 2.0, domyślnie: 1.0) */
  temperature?: number;

  /** Maksymalna liczba tokenów w odpowiedzi */
  maxTokens?: number;

  /** Top P sampling (0.0 - 1.0, domyślnie: 1.0) */
  topP?: number;

  /** Frequency penalty (-2.0 - 2.0, domyślnie: 0) */
  frequencyPenalty?: number;

  /** Presence penalty (-2.0 - 2.0, domyślnie: 0) */
  presencePenalty?: number;

  /** Sekwencje stop */
  stop?: string[];
}

/**
 * Zapytanie do API
 */
export interface CompletionRequest {
  /** Komunikat systemowy (opcjonalny) */
  systemMessage?: string;

  /** Komunikat użytkownika (wymagany) */
  userMessage: string;

  /** Nazwa modelu (opcjonalnie override defaultModel) */
  model?: string;

  /** Format odpowiedzi (JSON Schema) */
  responseFormat?: ResponseFormat;

  /** Parametry modelu */
  parameters?: ModelParameters;
}

/**
 * Odpowiedź z API
 */
export interface CompletionResponse<T = unknown> {
  /** Sparsowana odpowiedź (typed jeśli podano schema) */
  content: T;

  /** Surowa odpowiedź tekstowa */
  rawContent: string;

  /** Użyty model */
  model: string;

  /** Statystyki użycia tokenów */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** Powód zakończenia generowania */
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls';
}

/**
 * Informacje o modelu
 */
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  contextLength: number;
}

/**
 * Wiadomość w formacie OpenRouter API
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Ciało zapytania do OpenRouter API
 */
export interface OpenRouterRequestBody {
  model: string;
  messages: Message[];
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

/**
 * Odpowiedź z OpenRouter API
 */
export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Krok 3: Implementacja błędów (openrouter.errors.ts)

```typescript
// src/lib/openrouter/openrouter.errors.ts

/**
 * Bazowa klasa błędów usługi OpenRouter
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'OpenRouterError';

    // Zachowaj stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Błąd konfiguracji usługi
 */
export class ConfigurationError extends OpenRouterError {
  constructor(message: string, cause?: unknown) {
    super(message, 'CONFIGURATION_ERROR', undefined, cause);
    this.name = 'ConfigurationError';
  }
}

/**
 * Błąd walidacji danych wejściowych
 */
export class ValidationError extends OpenRouterError {
  constructor(message: string, cause?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, cause);
    this.name = 'ValidationError';
  }
}

/**
 * Błąd API
 */
export class ApiError extends OpenRouterError {
  constructor(
    message: string,
    statusCode: number,
    public readonly response?: unknown,
    cause?: unknown
  ) {
    super(message, 'API_ERROR', statusCode, cause);
    this.name = 'ApiError';
  }
}

/**
 * Błąd timeout
 */
export class TimeoutError extends OpenRouterError {
  constructor(message: string, cause?: unknown) {
    super(message, 'TIMEOUT_ERROR', 408, cause);
    this.name = 'TimeoutError';
  }
}

/**
 * Błąd rate limit
 */
export class RateLimitError extends OpenRouterError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    cause?: unknown
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, cause);
    this.name = 'RateLimitError';
  }
}

/**
 * Błąd parsowania odpowiedzi
 */
export class ParseError extends OpenRouterError {
  constructor(message: string, cause?: unknown) {
    super(message, 'PARSE_ERROR', undefined, cause);
    this.name = 'ParseError';
  }
}
```

### Krok 4: Implementacja funkcji pomocniczych (openrouter.utils.ts)

```typescript
// src/lib/openrouter/openrouter.utils.ts

import type { JSONSchema, ModelParameters } from './openrouter.types';
import { ValidationError } from './openrouter.errors';

/**
 * Waliduje parametry modelu
 */
export function validateParameters(parameters: ModelParameters): void {
  if (parameters.temperature !== undefined) {
    if (parameters.temperature < 0 || parameters.temperature > 2) {
      throw new ValidationError('Temperature must be between 0 and 2');
    }
  }

  if (parameters.maxTokens !== undefined) {
    if (parameters.maxTokens < 1) {
      throw new ValidationError('maxTokens must be positive');
    }
  }

  if (parameters.topP !== undefined) {
    if (parameters.topP < 0 || parameters.topP > 1) {
      throw new ValidationError('topP must be between 0 and 1');
    }
  }

  if (parameters.frequencyPenalty !== undefined) {
    if (parameters.frequencyPenalty < -2 || parameters.frequencyPenalty > 2) {
      throw new ValidationError('frequencyPenalty must be between -2 and 2');
    }
  }

  if (parameters.presencePenalty !== undefined) {
    if (parameters.presencePenalty < -2 || parameters.presencePenalty > 2) {
      throw new ValidationError('presencePenalty must be between -2 and 2');
    }
  }
}

/**
 * Waliduje JSON Schema
 */
export function validateSchema(schema: JSONSchema): void {
  // Guard clauses
  if (!schema || typeof schema !== 'object') {
    throw new ValidationError('Invalid JSON schema: schema must be an object');
  }

  if (!schema.type) {
    throw new ValidationError('Invalid JSON schema: missing type property');
  }

  // Walidacja properties dla typu object
  if (schema.type === 'object') {
    if (schema.properties && typeof schema.properties !== 'object') {
      throw new ValidationError('Invalid JSON schema: properties must be an object');
    }
  }

  // Walidacja items dla typu array
  if (schema.type === 'array') {
    if (!schema.items) {
      throw new ValidationError('Invalid JSON schema: array type must have items property');
    }
  }
}

/**
 * Sanityzuje komunikat użytkownika
 */
export function sanitizeMessage(message: string): string {
  // Guard clauses
  if (!message || typeof message !== 'string') {
    throw new ValidationError('Message must be a non-empty string');
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Message cannot be empty');
  }

  if (trimmed.length > 100000) {
    throw new ValidationError('Message is too long (max 100000 characters)');
  }

  return trimmed;
}

/**
 * Opóźnienie dla retry mechanism
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sprawdza czy błąd jest przejściowy (można retry)
 */
export function isRetryableError(statusCode?: number): boolean {
  if (!statusCode) return false;

  // 429 - Rate Limit
  // 503 - Service Unavailable
  // 504 - Gateway Timeout
  return [429, 503, 504].includes(statusCode);
}

/**
 * Oblicza opóźnienie dla exponential backoff
 */
export function calculateBackoff(retryCount: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, retryCount);
}
```

### Krok 5: Implementacja głównej usługi (openrouter.service.ts)

```typescript
// src/lib/openrouter/openrouter.service.ts

import type {
  OpenRouterConfig,
  CompletionRequest,
  CompletionResponse,
  ModelInfo,
  OpenRouterRequestBody,
  OpenRouterResponse,
  Message,
} from './openrouter.types';
import {
  OpenRouterError,
  ConfigurationError,
  ValidationError,
  ApiError,
  TimeoutError,
  RateLimitError,
  ParseError,
} from './openrouter.errors';
import {
  validateParameters,
  validateSchema,
  sanitizeMessage,
  delay,
  isRetryableError,
  calculateBackoff,
} from './openrouter.utils';

/**
 * Usługa do komunikacji z OpenRouter API
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly defaultModel: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  // Rate limiting
  private lastRequestTime = 0;
  private readonly minRequestInterval = 100; // ms

  /**
   * Publiczna konfiguracja (read-only)
   */
  public readonly config: Readonly<Required<OpenRouterConfig>>;

  constructor(config: OpenRouterConfig = {}) {
    // Pobierz klucz API z config lub env
    this.apiKey = config.apiKey ?? import.meta.env.OPENROUTER_API_KEY;

    // Guard clause - walidacja klucza API
    if (!this.apiKey) {
      throw new ConfigurationError(
        'OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or pass apiKey in config.'
      );
    }

    // Inicjalizacja konfiguracji z domyślnymi wartościami
    this.baseURL = config.baseURL ?? 'https://openrouter.ai/api/v1';
    this.defaultModel = config.defaultModel ?? 'openai/gpt-4-turbo';
    this.timeout = config.timeout ?? 30000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;

    // Walidacja URL
    if (!this.baseURL.startsWith('https://')) {
      throw new ConfigurationError('Base URL must use HTTPS protocol');
    }

    // Ustaw publiczną konfigurację
    this.config = Object.freeze({
      apiKey: '***', // Nie ujawniaj klucza
      baseURL: this.baseURL,
      defaultModel: this.defaultModel,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
    });
  }

  /**
   * Główna metoda do wykonywania zapytań do API
   */
  async complete<T = unknown>(
    request: CompletionRequest
  ): Promise<CompletionResponse<T>> {
    // Guard clauses - walidacja wejścia
    if (!request.userMessage) {
      throw new ValidationError('userMessage is required');
    }

    // Sanityzacja komunikatów
    const userMessage = sanitizeMessage(request.userMessage);
    const systemMessage = request.systemMessage
      ? sanitizeMessage(request.systemMessage)
      : undefined;

    // Walidacja parametrów modelu
    if (request.parameters) {
      validateParameters(request.parameters);
    }

    // Walidacja JSON Schema
    if (request.responseFormat) {
      validateSchema(request.responseFormat.json_schema.schema);
    }

    // Buduj ciało zapytania
    const body = this.buildRequestBody({
      ...request,
      userMessage,
      systemMessage,
    });

    // Wykonaj zapytanie z retry mechanism
    const response = await this.executeWithRetry(() =>
      this.makeRequest(body)
    );

    // Parsuj odpowiedź
    return this.parseResponse<T>(response, !!request.responseFormat);
  }

  /**
   * Pobiera listę dostępnych modeli
   */
  async listModels(): Promise<ModelInfo[]> {
    const url = `${this.baseURL}/models`;

    const response = await this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          await this.handleHttpError(res);
        }

        return await res.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new TimeoutError(
            `Request timeout after ${this.timeout}ms`,
            error
          );
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    });

    // Mapuj odpowiedź na ModelInfo
    return response.data?.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description || '',
      pricing: {
        prompt: model.pricing?.prompt || 0,
        completion: model.pricing?.completion || 0,
      },
      contextLength: model.context_length || 0,
    })) || [];
  }

  /**
   * Stream completion (opcjonalna metoda)
   */
  async *streamComplete(
    request: CompletionRequest
  ): AsyncGenerator<string, void, unknown> {
    // Guard clauses
    if (!request.userMessage) {
      throw new ValidationError('userMessage is required');
    }

    // Nie można używać stream ze schematem
    if (request.responseFormat) {
      throw new ValidationError('Stream mode is not compatible with responseFormat');
    }

    const userMessage = sanitizeMessage(request.userMessage);
    const systemMessage = request.systemMessage
      ? sanitizeMessage(request.systemMessage)
      : undefined;

    if (request.parameters) {
      validateParameters(request.parameters);
    }

    const body = this.buildRequestBody({
      ...request,
      userMessage,
      systemMessage,
    });

    // Dodaj stream: true
    const streamBody = { ...body, stream: true };

    await this.enforceRateLimit();

    const url = `${this.baseURL}/chat/completions`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': import.meta.env.SITE || 'https://localhost:3000',
          'X-Title': 'Athletica',
        },
        body: JSON.stringify(streamBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleHttpError(response);
      }

      if (!response.body) {
        throw new ApiError('No response body', 500);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                yield content;
              }
            } catch (e) {
              // Ignoruj błędy parsowania pojedynczych chunków
              continue;
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(
          `Request timeout after ${this.timeout}ms`,
          error
        );
      }
      throw this.handleError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Buduje ciało zapytania HTTP
   */
  private buildRequestBody(request: CompletionRequest): OpenRouterRequestBody {
    const messages: Message[] = [];

    // Dodaj komunikat systemowy jeśli istnieje
    if (request.systemMessage) {
      messages.push({
        role: 'system',
        content: request.systemMessage,
      });
    }

    // Dodaj komunikat użytkownika
    messages.push({
      role: 'user',
      content: request.userMessage,
    });

    const body: OpenRouterRequestBody = {
      model: request.model ?? this.defaultModel,
      messages,
    };

    // Dodaj response_format jeśli istnieje
    if (request.responseFormat) {
      body.response_format = request.responseFormat;
    }

    // Dodaj parametry modelu
    if (request.parameters) {
      if (request.parameters.temperature !== undefined) {
        body.temperature = request.parameters.temperature;
      }
      if (request.parameters.maxTokens !== undefined) {
        body.max_tokens = request.parameters.maxTokens;
      }
      if (request.parameters.topP !== undefined) {
        body.top_p = request.parameters.topP;
      }
      if (request.parameters.frequencyPenalty !== undefined) {
        body.frequency_penalty = request.parameters.frequencyPenalty;
      }
      if (request.parameters.presencePenalty !== undefined) {
        body.presence_penalty = request.parameters.presencePenalty;
      }
      if (request.parameters.stop !== undefined) {
        body.stop = request.parameters.stop;
      }
    }

    return body;
  }

  /**
   * Wykonuje zapytanie HTTP do API
   */
  private async makeRequest(body: OpenRouterRequestBody): Promise<OpenRouterResponse> {
    await this.enforceRateLimit();

    const url = `${this.baseURL}/chat/completions`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': import.meta.env.SITE || 'https://localhost:3000',
          'X-Title': 'Athletica',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleHttpError(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(
          `Request timeout after ${this.timeout}ms`,
          error
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parsuje odpowiedź z API
   */
  private parseResponse<T>(
    response: OpenRouterResponse,
    hasSchema: boolean
  ): CompletionResponse<T> {
    // Guard clause
    if (!response.choices || response.choices.length === 0) {
      throw new ParseError('No choices in response');
    }

    const choice = response.choices[0];
    const rawContent = choice.message.content;
    const finishReason = choice.finish_reason as CompletionResponse['finishReason'];

    // Sprawdź finish_reason
    if (finishReason === 'content_filter') {
      throw new ApiError(
        'Response was filtered due to content policy violation',
        400,
        { finishReason }
      );
    }

    if (finishReason === 'length') {
      console.warn('Response was truncated due to max_tokens limit');
    }

    let content: T;

    // Parsuj JSON jeśli jest schema
    if (hasSchema) {
      try {
        content = JSON.parse(rawContent) as T;
      } catch (error) {
        throw new ParseError(
          'Failed to parse JSON response. The model may not have returned valid JSON.',
          error
        );
      }
    } else {
      content = rawContent as T;
    }

    return {
      content,
      rawContent,
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      finishReason,
    };
  }

  /**
   * Wykonuje operację z retry mechanism
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Sprawdź czy możemy retry
      const statusCode = error instanceof ApiError ? error.statusCode : undefined;
      const canRetry = isRetryableError(statusCode) && retryCount < this.maxRetries;

      if (!canRetry) {
        throw error;
      }

      // Oblicz opóźnienie z exponential backoff
      const delayMs = calculateBackoff(retryCount, this.retryDelay);

      console.warn(
        `Request failed with status ${statusCode}. Retrying in ${delayMs}ms... (attempt ${retryCount + 1}/${this.maxRetries})`
      );

      await delay(delayMs);

      return this.executeWithRetry(operation, retryCount + 1);
    }
  }

  /**
   * Obsługuje błędy HTTP
   */
  private async handleHttpError(response: Response): Promise<never> {
    const statusCode = response.status;
    let errorData: any;

    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const errorMessage = errorData?.error?.message || errorData?.message || response.statusText;

    // 401 - Unauthorized
    if (statusCode === 401) {
      throw new ApiError(
        'Invalid API key. Please check your OpenRouter API key.',
        401,
        errorData
      );
    }

    // 429 - Rate Limit
    if (statusCode === 429) {
      const retryAfter = response.headers.get('retry-after');
      throw new RateLimitError(
        errorMessage || 'Rate limit exceeded. Please try again later.',
        retryAfter ? parseInt(retryAfter) : undefined
      );
    }

    // 404 - Not Found (model)
    if (statusCode === 404 && errorMessage.toLowerCase().includes('model')) {
      throw new ApiError(
        `Model not found. Please check the model name.`,
        404,
        errorData
      );
    }

    // 400 - Bad Request
    if (statusCode === 400) {
      throw new ValidationError(errorMessage, errorData);
    }

    // 500+ - Server Error
    if (statusCode >= 500) {
      throw new ApiError(
        `OpenRouter server error: ${errorMessage}`,
        statusCode,
        errorData
      );
    }

    // Inne błędy
    throw new ApiError(errorMessage, statusCode, errorData);
  }

  /**
   * Centralna metoda obsługi błędów
   */
  private handleError(error: unknown): never {
    // Jeśli to już nasz błąd, przekaż dalej
    if (error instanceof OpenRouterError) {
      throw error;
    }

    // Błędy sieci
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new OpenRouterError(
        'Network error. Please check your internet connection.',
        'NETWORK_ERROR',
        undefined,
        error
      );
    }

    // Nieznane błędy
    throw new OpenRouterError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }

  /**
   * Wymusza rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      await delay(this.minRequestInterval - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }
}
```

### Krok 6: Eksport z index file

Utwórz plik `src/lib/openrouter/index.ts` dla wygodnego importu:

```typescript
// src/lib/openrouter/index.ts

export { OpenRouterService } from './openrouter.service';

export type {
  OpenRouterConfig,
  CompletionRequest,
  CompletionResponse,
  ModelParameters,
  ResponseFormat,
  JSONSchema,
  ModelInfo,
} from './openrouter.types';

export {
  OpenRouterError,
  ConfigurationError,
  ValidationError,
  ApiError,
  TimeoutError,
  RateLimitError,
  ParseError,
} from './openrouter.errors';
```

### Krok 7: Dodanie zmiennej środowiskowej

Upewnij się, że plik `.env` zawiera klucz API:

```bash
# .env
OPENROUTER_API_KEY=your_api_key_here
```

I dodaj go do `.env.example`:

```bash
# .env.example
OPENROUTER_API_KEY=
```

### Krok 8: Przykład użycia w API endpoint

Utwórz endpoint API do generowania planów treningowych:

```typescript
// src/pages/api/generate-plan.ts

import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/openrouter';
import type { CompletionRequest } from '@/lib/openrouter';
import { z } from 'zod';

export const prerender = false;

// Schemat walidacji wejścia
const requestSchema = z.object({
  goal: z.string().min(1),
  experience: z.string().min(1),
  weeklyDistance: z.number().positive(),
});

// Typ planu treningowego
interface TrainingPlan {
  weeks: Array<{
    weekNumber: number;
    days: Array<{
      day: number;
      type: string;
      distance: number;
      duration: number;
      description: string;
    }>;
  }>;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Sprawdź autentykację
    const session = await locals.supabase.auth.getSession();

    if (!session.data.session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Parsuj i waliduj wejście
    const body = await request.json();
    const input = requestSchema.parse(body);

    // Inicjalizuj usługę OpenRouter
    const openRouter = new OpenRouterService({
      defaultModel: 'anthropic/claude-3.5-sonnet',
      timeout: 60000, // 60s dla dłuższych planów
    });

    // Przygotuj zapytanie
    const completionRequest: CompletionRequest = {
      systemMessage: `Jesteś ekspertem od planowania treningów biegowych.
Tworzysz spersonalizowane, 10-tygodniowe plany treningowe dla biegaczy.
Każdy plan powinien zawierać mix treningów: długie biegi, interwały, tempo runs i dni odpoczynku.`,

      userMessage: `Stwórz 10-tygodniowy plan treningowy dla biegacza:
- Cel: ${input.goal}
- Doświadczenie: ${input.experience}
- Tygodniowy dystans: ${input.weeklyDistance} km`,

      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'training_plan',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              weeks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    weekNumber: { type: 'number' },
                    days: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          day: { type: 'number' },
                          type: { type: 'string' },
                          distance: { type: 'number' },
                          duration: { type: 'number' },
                          description: { type: 'string' },
                        },
                        required: ['day', 'type', 'distance', 'duration', 'description'],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ['weekNumber', 'days'],
                  additionalProperties: false,
                },
              },
            },
            required: ['weeks'],
            additionalProperties: false,
          },
        },
      },

      parameters: {
        temperature: 0.7,
        maxTokens: 4000,
      },
    };

    // Wykonaj zapytanie
    const response = await openRouter.complete<TrainingPlan>(completionRequest);

    // Zapisz plan w bazie danych (opcjonalnie)
    // await locals.supabase.from('training_plans').insert({
    //   user_id: session.data.session.user.id,
    //   plan: response.content,
    // });

    // Zwróć plan
    return new Response(
      JSON.stringify({
        plan: response.content,
        usage: response.usage,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating plan:', error);

    // Obsłuż różne typy błędów
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { status: 400 }
      );
    }

    // Importuj typy błędów z usługi
    const {
      ValidationError,
      RateLimitError,
      TimeoutError
    } = await import('@/lib/openrouter');

    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400 }
      );
    }

    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: error.retryAfter
        }),
        { status: 429 }
      );
    }

    if (error instanceof TimeoutError) {
      return new Response(
        JSON.stringify({ error: 'Request timeout' }),
        { status: 408 }
      );
    }

    // Ogólny błąd
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
```

### Krok 9: Przykład użycia w komponencie React

```typescript
// src/components/TrainingPlanGenerator.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TrainingPlanGeneratorProps {
  onPlanGenerated: (plan: any) => void;
}

export function TrainingPlanGenerator({ onPlanGenerated }: TrainingPlanGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState('');
  const [weeklyDistance, setWeeklyDistance] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal,
          experience,
          weeklyDistance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const data = await response.json();
      onPlanGenerated(data.plan);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="goal" className="block text-sm font-medium mb-1">
          Cel treningowy
        </label>
        <Input
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="np. Przebiec maraton w czasie poniżej 4 godzin"
          required
        />
      </div>

      <div>
        <label htmlFor="experience" className="block text-sm font-medium mb-1">
          Doświadczenie
        </label>
        <Input
          id="experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="np. Początkujący, średniozaawansowany"
          required
        />
      </div>

      <div>
        <label htmlFor="distance" className="block text-sm font-medium mb-1">
          Tygodniowy dystans (km)
        </label>
        <Input
          id="distance"
          type="number"
          value={weeklyDistance}
          onChange={(e) => setWeeklyDistance(parseFloat(e.target.value))}
          placeholder="np. 40"
          min="1"
          required
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Generowanie...' : 'Wygeneruj plan'}
      </Button>
    </form>
  );
}
```

### Krok 10: Testowanie

Utwórz prosty test w pliku `src/lib/openrouter/openrouter.test.ts`:

```typescript
// src/lib/openrouter/openrouter.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { OpenRouterService } from './openrouter.service';
import { ConfigurationError, ValidationError } from './openrouter.errors';

describe('OpenRouterService', () => {
  describe('Constructor', () => {
    it('should throw ConfigurationError if API key is not provided', () => {
      // Usuń klucz z env
      const originalKey = import.meta.env.OPENROUTER_API_KEY;
      delete (import.meta.env as any).OPENROUTER_API_KEY;

      expect(() => new OpenRouterService()).toThrow(ConfigurationError);

      // Przywróć klucz
      (import.meta.env as any).OPENROUTER_API_KEY = originalKey;
    });

    it('should throw ConfigurationError if baseURL is not HTTPS', () => {
      expect(() => new OpenRouterService({
        apiKey: 'test-key',
        baseURL: 'http://example.com'
      })).toThrow(ConfigurationError);
    });

    it('should initialize with default config', () => {
      const service = new OpenRouterService({ apiKey: 'test-key' });

      expect(service.config.baseURL).toBe('https://openrouter.ai/api/v1');
      expect(service.config.timeout).toBe(30000);
      expect(service.config.maxRetries).toBe(3);
    });
  });

  describe('complete()', () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService({ apiKey: 'test-key' });
    });

    it('should throw ValidationError if userMessage is empty', async () => {
      await expect(
        service.complete({ userMessage: '' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if temperature is out of range', async () => {
      await expect(
        service.complete({
          userMessage: 'test',
          parameters: { temperature: 3 }
        })
      ).rejects.toThrow(ValidationError);
    });

    // Dodaj więcej testów...
  });
});
```

## Podsumowanie

Ten plan implementacji zawiera:

1. **Pełną strukturę typów TypeScript** dla wszystkich operacji
2. **Kompleksową obsługę błędów** z custom error classes
3. **Mechanizm retry** z exponential backoff
4. **Rate limiting** po stronie klienta
5. **Walidację wejścia** dla wszystkich parametrów
6. **Obsługę JSON Schema** dla ustrukturyzowanych odpowiedzi
7. **Timeout mechanism** dla długich zapytań
8. **Bezpieczne zarządzanie kluczem API**
9. **Opcjonalne streamowanie** dla długich odpowiedzi
10. **Przykłady użycia** w API endpoints i komponentach React

Usługa jest gotowa do wdrożenia zgodnie z architekturą projektu Athletica i najlepszymi praktykami TypeScript/Astro.
