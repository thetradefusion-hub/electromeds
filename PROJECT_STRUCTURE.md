# Project Structure

This document describes the organization and structure of the ElectroMed codebase.

## 📁 Directory Structure

```
electromed/
├── backend/                 # Backend API (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── scripts/         # Database seed scripts
│   │   └── utils/           # Utility functions
│   └── docs/                # Backend documentation
│
├── src/                     # Frontend source code (React + TypeScript)
│   ├── components/          # React components
│   │   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── consultation/    # Consultation components
│   │   ├── patients/        # Patient-related components
│   │   ├── appointments/    # Appointment components
│   │   ├── notifications/   # Notification components
│   │   ├── superadmin/      # SuperAdmin panel components
│   │   ├── saas-admin/      # SaaS Admin components
│   │   └── ui/              # Reusable UI components (shadcn/ui)
│   │
│   ├── pages/               # Page components (routes)
│   │   ├── Dashboard.tsx
│   │   ├── Patients.tsx
│   │   ├── Consultation.tsx
│   │   ├── Prescriptions.tsx
│   │   ├── SuperAdmin.tsx
│   │   └── ...
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.tsx       # Authentication hook
│   │   ├── usePatients.ts     # Patient data hook
│   │   ├── usePrescriptions.ts
│   │   └── ...
│   │
│   ├── lib/                  # Library code
│   │   ├── api/              # API service layer
│   │   │   ├── auth.api.ts
│   │   │   ├── patient.api.ts
│   │   │   ├── prescription.api.ts
│   │   │   └── index.ts      # Barrel exports
│   │   ├── api.ts            # Axios instance & config
│   │   └── utils.ts          # Utility functions
│   │
│   ├── utils/                # Utility functions
│   │   ├── apiErrorHandler.ts
│   │   ├── exportUtils.ts
│   │   ├── generatePrescriptionPDF.ts
│   │   └── index.ts          # Barrel exports
│   │
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── constants/            # Application constants
│   │   └── index.ts
│   │
│   ├── config/               # Configuration files
│   │   └── index.ts
│   │
│   ├── i18n/                 # Internationalization
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── en.json
│   │       └── hi.json
│   │
│   ├── data/                 # Mock data (for development)
│   │   └── mockData.ts
│   │
│   ├── integrations/        # Third-party integrations
│   │   └── supabase/        # Supabase types (legacy)
│   │
│   ├── App.tsx               # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css             # Global styles
│
└── public/                   # Static assets
```

## 🗂️ Key Directories

### `/src/components`
React components organized by feature:
- **layout/**: Layout components (Header, Sidebar, MobileNav, etc.)
- **dashboard/**: Dashboard-specific components
- **consultation/**: Consultation-related components
- **patients/**: Patient management components
- **superadmin/**: SuperAdmin panel components
- **saas-admin/**: SaaS Admin components
- **ui/**: Reusable UI components (shadcn/ui)

### `/src/pages`
Page-level components that correspond to routes:
- Each file represents a route/page
- Uses MainLayout for consistent layout
- Handles page-specific logic and state

### `/src/hooks`
Custom React hooks for data fetching and state management:
- **useAuth.tsx**: Authentication and user management
- **usePatients.ts**: Patient data operations
- **usePrescriptions.ts**: Prescription operations
- **useSymptoms.ts**: Symptom management
- **useMedicines.ts**: Medicine management
- And more...

### `/src/lib/api`
API service layer:
- Each file corresponds to a backend resource
- Uses centralized axios instance from `api.ts`
- Exports typed API functions
- All exports available via `@/lib/api` (barrel export)

### `/src/utils`
Utility functions:
- **apiErrorHandler.ts**: Error handling utilities
- **exportUtils.ts**: Data export functions (CSV, etc.)
- **generatePrescriptionPDF.ts**: PDF generation
- **generatePatientHistoryPDF.ts**: Patient history PDF

### `/src/constants`
Application constants:
- API configuration
- User roles
- Status values
- Date formats
- Storage keys
- Routes
- Common data

### `/src/config`
Configuration management:
- Environment variables
- App configuration
- API configuration
- Storage configuration

## 📦 Barrel Exports

The project uses barrel exports (index.ts files) for cleaner imports:

```typescript
// Instead of:
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/hooks/usePatients';

// You can use:
import { useAuth, usePatients } from '@/hooks';

// API imports:
import { patientApi, prescriptionApi } from '@/lib/api';
```

## 🔄 Import Patterns

### Recommended Import Order:
1. React/External libraries
2. Internal components
3. Hooks
4. API services
5. Utils
6. Types
7. Constants/Config
8. Styles

### Example:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { MainLayout } from '@/components';
import { useAuth, usePatients } from '@/hooks';
import { patientApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Patient } from '@/types';
import { ROUTES } from '@/constants';
```

## 🎯 Naming Conventions

- **Components**: PascalCase (e.g., `PatientCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `usePatients.ts`)
- **Utils**: camelCase (e.g., `apiErrorHandler.ts`)
- **Types**: PascalCase interfaces/types (e.g., `Patient`, `Prescription`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_CONFIG`, `USER_ROLES`)
- **Files**: camelCase for utilities, PascalCase for components

## 📝 Code Organization Principles

1. **Feature-based organization**: Components grouped by feature/domain
2. **Separation of concerns**: API calls in `/lib/api`, hooks in `/hooks`
3. **Reusability**: Common components in `/components/ui`
4. **Type safety**: All types defined in `/types`
5. **Centralized config**: Constants and config in dedicated folders
6. **Barrel exports**: Index files for cleaner imports

## 🔧 Adding New Features

When adding a new feature:

1. **API**: Add to `/src/lib/api/[feature].api.ts`
2. **Types**: Add to `/src/types/index.ts` or create new type file
3. **Hooks**: Add to `/src/hooks/use[Feature].ts`
4. **Components**: Add to appropriate folder in `/src/components`
5. **Pages**: Add to `/src/pages/[Feature].tsx`
6. **Constants**: Add to `/src/constants/index.ts` if needed
7. **Update exports**: Add to relevant `index.ts` files

## 📚 Documentation

- **Backend docs**: `/backend/docs/`
- **API endpoints**: `/backend/docs/API_ENDPOINTS.md`
- **Schema design**: `/backend/docs/MONGODB_SCHEMA_DESIGN.md`
- **Setup instructions**: `/SETUP_INSTRUCTIONS.md`

---

**Last Updated**: January 2025

