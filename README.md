# iStock - Precision Livestock Management Platform

An AI-powered livestock health and nutrition application that provides farmers with immediate, citable diagnostic and treatment advice. Built with React, TypeScript, Firebase, and modern web technologies.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![Firebase](https://img.shields.io/badge/Firebase-12.5-orange.svg)

## 🚀 Features

- **AI-Powered Health Consultation**: Ask questions about livestock health and get immediate, citable advice
- **Feed Optimization**: Calculate least-cost feed rations based on ingredients and nutritional requirements
- **Ingredient Library**: Manage and save feed ingredients with nutritional information
- **Health Records**: View and manage your chat history and health consultations
- **User Profiles**: Personalized experience with user names and preferences
- **Dark Mode**: Beautiful dark and light themes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation and screen reader support

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Firebase Setup](#firebase-setup)
- [Environment Variables](#environment-variables)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Contributing](#contributing)

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ and pnpm (recommended) or npm/yarn
- Firebase account (for production) or Firebase Emulator (for development)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd iStock

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env and add your Firebase configuration
```

### Quick Start

```bash
# Start development server
pnpm dev

# The app will be available at http://localhost:5173
```

## 📁 Project Structure

```
iStock/
├── apps/
│   └── web/                 # React frontend application
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── contexts/    # React contexts
│       │   ├── hooks/       # Custom React hooks
│       │   ├── lib/         # Utility functions
│       │   ├── pages/       # Page components
│       │   └── test/        # Test utilities
│       ├── public/          # Static assets
│       └── package.json
├── packages/
│   └── shared/              # Shared Zod schemas and types
├── docs/                     # Project documentation
│   ├── adr/                 # Architectural Decision Records
│   ├── architecture.md      # Architecture overview
│   ├── accessibility.md     # Accessibility guide
│   └── code-organization.md # Code organization guide
└── package.json             # Root package.json
```

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server

# Code Quality
pnpm typecheck        # Type-check TypeScript
pnpm lint             # Run ESLint

# Testing
pnpm test             # Run tests in watch mode
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Run tests with coverage report

# Build
pnpm build            # Build for production
pnpm preview          # Preview production build
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with React and TypeScript rules
- **Formatting**: Consistent code style throughout
- **Naming**: Follow established conventions (see `docs/code-organization.md`)

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Test Structure

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: Feature workflow tests
- **Test Utilities**: Located in `src/test/utils.tsx`

### Writing Tests

Tests are co-located with components or in test files:

```typescript
// Example test
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<MyComponent />);
    expect(getByText('Hello')).toBeInTheDocument();
  });
});
```

## 🏗️ Building for Production

```bash
# Build the application
pnpm build

# The production build will be in apps/web/dist/

# Preview the production build
pnpm preview
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Firebase security rules set up
- [ ] Build completes without errors
- [ ] All tests pass
- [ ] TypeScript type checking passes
- [ ] ESLint passes with zero warnings

## 🔥 Firebase Setup

### Initial Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing

2. **Enable Services**
   - Authentication: Email/Password
   - Firestore Database

3. **Get Configuration**
   - Project Settings → Your apps → Web app
   - Copy the Firebase configuration

4. **Set Environment Variables**
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

5. **Set Up Security Rules**
   - See [SETUP_FIRESTORE_RULES.md](./SETUP_FIRESTORE_RULES.md) for detailed instructions
   - Copy the security rules to Firestore Console

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    match /users/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    match /chats/{chatId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    match /feedOptimizations/{feedId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    match /ingredients/{ingredientId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

For detailed setup instructions, see:
- [SETUP_FIRESTORE_RULES.md](./SETUP_FIRESTORE_RULES.md)
- [FIREBASE_SETUP_INSTRUCTIONS.md](./FIREBASE_SETUP_INSTRUCTIONS.md)
- [docs/firebase-setup.md](./docs/firebase-setup.md)

## 🔐 Environment Variables

### Required Variables

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Optional Variables

```env
# Firebase Emulator (for local development)
VITE_USE_FIREBASE_EMULATOR=false
VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080

# Analytics (optional)
VITE_FIREBASE_MEASUREMENT_ID=

# Sentry (optional, for error tracking)
VITE_SENTRY_DSN=
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Architecture](./docs/architecture.md)**: High-level architecture overview
- **[Code Organization](./docs/code-organization.md)**: Code structure and conventions
- **[Accessibility](./docs/accessibility.md)**: Accessibility features and testing
- **[ADRs](./docs/adr/README.md)**: Architectural Decision Records
- **[Firebase Setup](./docs/firebase-setup.md)**: Detailed Firebase setup guide

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18.2, TypeScript 5.9
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: React Context API, TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Backend**: Firebase (Auth, Firestore)
- **Build Tool**: Vite 7
- **Testing**: Vitest, React Testing Library

### Key Design Decisions

See [Architectural Decision Records](./docs/adr/README.md) for detailed rationale:

- [Monorepo Structure](./docs/adr/0001-monorepo-structure.md)
- [Frontend Architecture](./docs/adr/0002-frontend-architecture.md)
- [Accessibility-First Design](./docs/adr/0003-accessibility-first-design.md)
- [State Management](./docs/adr/0004-state-management.md)
- [Styling Approach](./docs/adr/0005-styling-approach.md)

## ♿ Accessibility

This project follows WCAG 2.1 Level AA standards:

- ✅ Full keyboard navigation
- ✅ Screen reader support (ARIA labels)
- ✅ Focus management and indicators
- ✅ Skip links for navigation
- ✅ Proper semantic HTML
- ✅ Color contrast compliance

See [docs/accessibility.md](./docs/accessibility.md) for details.

## 🐛 Troubleshooting

### Common Issues

**Firestore Permission Errors**
- Ensure security rules are set up correctly
- See [SETUP_FIRESTORE_RULES.md](./SETUP_FIRESTORE_RULES.md)

**Build Errors**
- Run `pnpm install` to ensure dependencies are installed
- Check TypeScript errors: `pnpm typecheck`
- Check ESLint errors: `pnpm lint`

**Firebase Connection Issues**
- Verify environment variables are set correctly
- Check Firebase Console for project status
- Verify security rules are published

## 🤝 Contributing

1. Follow the code style guidelines
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass
5. Ensure TypeScript type checking passes
6. Ensure ESLint passes with zero warnings

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/) for accessible component primitives
- [Lucide Icons](https://lucide.dev/) for beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- [Firebase](https://firebase.google.com/) for backend services

---

**Built with ❤️ for farmers and livestock management**
