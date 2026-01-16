# Athletica

## Project Description

Athletica is a Minimum Viable Product (MVP) web application designed to simplify the process of planning running training. Using artificial intelligence (AI), the application generates personalized, 10-week training plans based on user-provided data. Key functionalities include a user account system, a survey to determine goals and skill level, a plan generation module, and a simple interface for viewing and tracking training progress. The application is aimed at amateur runners looking for an easy and effective way to create a tailored training plan.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

### Frontend

- **Framework**: [Astro 5](https://astro.build/) & [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind 4](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)

### Backend

- **Platform**: [Supabase](https://supabase.io/)
  - **Database**: PostgreSQL
  - **Authentication**: Supabase Auth
  - **SDK**: Backend-as-a-Service

### AI

- **Service**: [Openrouter.ai](https://openrouter.ai/) for access to various AI models.

### DevOps

- **CI/CD**: [GitHub Actions](https://github.com/features/actions)
- **Hosting**: [DigitalOcean](https://www.digitalocean.com/) (via Docker)

### Testing

- **Unit & Integration Tests**: [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/react)
- **E2E Tests**: [Playwright](https://playwright.dev/) (cross-browser testing)
- **API Testing**: [Supertest](https://github.com/ladjs/supertest)
- **Mocking**: [MSW (Mock Service Worker)](https://mswjs.io/)

## Getting Started Locally

### Prerequisites

- Node.js version `22.14.0` (as specified in the `.nvmrc` file). We recommend using a version manager like `nvm`.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/athletica.git
    cd athletica
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project by copying the example file:

    ```bash
    cp .env.example .env
    ```

    You will need to add your Supabase and Openrouter.ai API keys to this file.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:4321](http://localhost:4321) to view the application in your browser.

## Available Scripts

In the project directory, you can run the following commands:

- `npm run dev`
  - Runs the app in development mode.

- `npm run build`
  - Builds the app for production.

- `npm run preview`
  - Previews the production build locally.

- `npm run lint`
  - Lints the codebase using ESLint.

- `npm run lint:fix`
  - Lints and automatically fixes issues.

- `npm run format`
  - Formats code using Prettier.

- `npm test`
  - Runs unit tests in watch mode.

- `npm run test:coverage`
  - Runs tests with coverage report.

- `npm run test:e2e`
  - Runs E2E tests with Playwright.

## Testing

The project uses a comprehensive testing setup with Vitest and Playwright:

- **Unit Tests**: Testing individual functions and components (Vitest + React Testing Library)
- **Integration Tests**: Testing API endpoints and service integration
- **E2E Tests**: Testing complete user flows (Playwright)

**Quick Start:**

```bash
# Run unit tests in watch mode
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

**Documentation:**

- [Testing Setup Guide](TESTING-SETUP.md) - Complete setup documentation
- [Testing Guide](tests/README.md) - How to write and run tests
- [Test Plan](.ai/athletica-test-plan.md) - Comprehensive test plan with scenarios

## Project Scope

### Key Features (MVP)

- **User Authentication**: Secure user registration, login, and password reset.
- **AI-Powered Plan Generation**: A multi-step survey captures user goals, fitness level, and personal data to generate a personalized 10-week running plan.
- **Interactive Training Plan**: A clean user interface to view the daily training schedule.
- **Progress Tracking**: Users can mark each workout as "completed" to track their progress.
- **User Profile**: A read-only profile page displaying the data provided in the last survey.

### Out of Scope for MVP

The following features are not included in the current MVP version:

- Importing/exporting training plans.
- Social sharing of plans.
- Integrations with third-party platforms like Strava or Garmin Connect.
- Native mobile applications.
- Editing or deleting individual workouts within a generated plan.

## Project Status

**Current Status: MVP (Minimum Viable Product)**

This project is currently in the MVP stage. The project is under active development to introduce new features and improvements.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
