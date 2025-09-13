# Daily Felix - City of the Day

## Overview

Daily Felix - City of the Day is a modern travel companion web application that delivers AI-curated city content to users on a daily basis. Built as a full-stack TypeScript application, it provides educational travel inspiration through morning, afternoon, and evening content cards showcasing landmarks, local food, cultural insights, and budget travel tips. The platform features both free and premium subscription tiers, with premium users accessing enhanced content and features.

## User Preferences

Preferred communication style: Simple, everyday language.

**Design Preferences:**
- Time card colors will be changed daily
- Currently using Detroit official brand colors: City Green (#004445) and Spirit Green (#279989) with white text
- Applied to both hero section gradient and city preview card backgrounds

## System Architecture

### Frontend Architecture
The client-side is built with **React 18** using Vite as the build tool and development server. The application follows a modern React patterns with:

- **Component Architecture**: Modular component design using shadcn/ui components built on Radix UI primitives
- **State Management**: React Query (TanStack Query) for server state management and API caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design system variables and postcard-style shadow effects
- **PWA Support**: Progressive Web App capabilities with service worker, manifest, and offline functionality

### Backend Architecture
The server is built with **Express.js** running on Node.js with TypeScript:

- **API Structure**: RESTful endpoints organized by resource (cities, users, admin)
- **Database Layer**: Drizzle ORM with PostgreSQL using Neon serverless database
- **AI Integration**: OpenAI GPT-5 API for generating daily city content with customizable focus areas
- **Session Management**: Express sessions with PostgreSQL storage for Replit authentication

### Authentication System
- **Replit Auth**: OpenID Connect integration for seamless authentication within Replit environment
- **Session-based Auth**: HTTP-only cookies with PostgreSQL session storage
- **User Management**: Complete user lifecycle with profile data, subscription tiers, and usage tracking

### Database Design
PostgreSQL database with Drizzle ORM schema including:

- **Users Table**: User profiles, subscription status, and engagement metrics
- **Cities Table**: City metadata with publication status and AI generation settings
- **City Content Table**: Daily content cards (morning, afternoon, evening, bonus) with structured data
- **User Interactions**: Collection tracking and bucket list functionality
- **Sessions Table**: Secure session storage for authentication

### Content Generation System
- **AI-Powered Content**: OpenAI integration for generating contextual city content
- **Content Types**: Structured content cards for different times of day
- **Admin Controls**: Content approval workflow with manual editing capabilities
- **Focus Customization**: Configurable content generation (cultural, food, budget, architecture, balanced)

### Subscription & Payments
- **Stripe Integration**: Payment processing for premium subscriptions
- **Tiered Access**: Free tier with basic content, premium tier with enhanced features
- **Usage Tracking**: User statistics and engagement metrics

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **OpenAI API**: GPT-5 model for AI content generation
- **Stripe**: Payment processing and subscription management
- **Replit Authentication**: OpenID Connect provider for user authentication

### Development & Hosting
- **Vite**: Frontend build tool and development server
- **Replit Platform**: Development environment and hosting infrastructure
- **TypeScript**: Type safety across the entire application stack

### UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Custom Fonts**: Google Fonts integration (Architects Daughter, DM Sans, Fira Code, Geist Mono)

### Libraries & Tools
- **Drizzle ORM**: Type-safe database queries and migrations
- **React Query**: Server state management and caching
- **Wouter**: Lightweight React routing
- **React Hook Form**: Form handling with validation
- **Date-fns**: Date manipulation and formatting
- **Memoizee**: Function memoization for performance optimization