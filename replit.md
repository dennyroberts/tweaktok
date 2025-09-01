# Overview

This is a React-based simulation application that models social media discourse dynamics. The application features an interactive frontend for configuring and running social media behavior simulations, with real-time visualization of user interactions, content engagement patterns, and platform dynamics. The simulation explores concepts like user types (Normal, Joker, Troll, Intellectual, Journalist), content attributes (humor, insight, bait, controversy, news, dunk), and behavioral metrics including follower dynamics, engagement rates, and viral content patterns.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design tokens and dark theme optimization
- **State Management**: React hooks for local state, TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Chart.js for data visualization and simulation result displays

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Type Safety**: Full TypeScript implementation across client and server
- **Development**: Hot module replacement via Vite in development mode
- **API Design**: RESTful endpoints with /api prefix convention
- **Storage Interface**: Abstract storage layer with in-memory implementation (MemStorage)

## Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Schema**: Centralized schema definitions in shared directory for client-server consistency
- **Validation**: Zod schemas for runtime type validation and form handling
- **Migrations**: Drizzle Kit for database schema migrations

## Development Architecture
- **Monorepo Structure**: Unified client, server, and shared code organization
- **Build System**: Vite for frontend bundling, esbuild for server compilation
- **Type Checking**: Shared TypeScript configuration with path mapping
- **Code Organization**: Feature-based component structure with shared utilities

## Simulation Engine
- **Core Logic**: Complex social media behavior modeling with configurable parameters
- **User Types**: Five distinct user archetypes with unique behavioral patterns
- **Content Attributes**: Six-dimensional content classification system
- **Metrics Tracking**: Real-time calculation of engagement, virality, and user satisfaction
- **Visualization**: Multi-chart dashboard for simulation results and trends

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework for API endpoints
- **react**: Frontend UI library with hooks and modern patterns

## UI and Visualization
- **@radix-ui/***: Comprehensive accessible UI primitive components
- **chart.js**: Canvas-based charting library for simulation visualizations
- **@tanstack/react-query**: Async state management and server synchronization
- **tailwindcss**: Utility-first CSS framework with custom theme configuration

## Development and Build Tools
- **vite**: Modern build tool with HMR and optimized bundling
- **typescript**: Static type checking across the entire application
- **@replit/vite-plugin-***: Replit-specific development enhancements
- **esbuild**: Fast JavaScript bundler for server-side code

## Form Handling and Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Form validation resolver integrations
- **zod**: Schema validation library for runtime type safety

## Database and Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **drizzle-kit**: Database migration and introspection toolkit