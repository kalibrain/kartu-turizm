# Kartu Turizm Website

## Overview

This is a static website for Kartu Turizm, a Turkish tourism and transportation company specializing in student transportation services. The website is built with vanilla HTML, CSS, and JavaScript, designed to be fast, mobile-friendly, and fully responsive.

## System Architecture

The application follows a traditional static website architecture:

- **Frontend**: Pure HTML5, CSS3, and vanilla JavaScript
- **Structure**: Multi-page website with consistent navigation
- **Styling**: Custom CSS with responsive design principles
- **Interactivity**: Client-side JavaScript for form handling and UI interactions
- **Deployment**: Static file hosting (no server-side processing required)

## Key Components

### Pages Structure
- `index.html` - Homepage with hero section and company overview
- `hakkimizda.html` - About page (company information and values)
- `hizmetler.html` - Services page (transportation and tourism services)
- `ogrenci-kayit.html` - Student registration form
- `iletisim.html` - Contact page with company details

### Core Files
- `styles.css` - Comprehensive stylesheet with responsive design
- `script.js` - JavaScript functionality for navigation, forms, and interactions
- `/attached_assets/` - Additional resources and requirements

### Navigation System
- Fixed header navigation with mobile hamburger menu
- Consistent navigation across all pages
- Active state management for current page indication
- Mobile-responsive toggle functionality

### Form System
- Student registration form with validation
- Contact form functionality
- Distance calculation feature (mock implementation)
- Modal system for contract/agreement display
- Form validation and error handling

## Data Flow

1. **User Navigation**: Static page routing through HTML links
2. **Form Submission**: Client-side validation → data collection → (future backend integration)
3. **Distance Calculation**: Mock function returns "3.2 km" for demo purposes
4. **Mobile Menu**: Toggle functionality for responsive navigation

## External Dependencies

Currently, the website has minimal external dependencies:
- Uses system fonts (Arial fallback)
- No external CSS frameworks (custom CSS)
- No external JavaScript libraries
- Emoji icons for visual elements

Future considerations may include:
- Google Maps API for real distance calculations
- Email service integration for form submissions
- Analytics tracking

## Deployment Strategy

**Current**: Static file hosting
- Files can be served from any static hosting service
- No server-side processing required
- CDN-friendly for fast global delivery

**Future Considerations**:
- Form submission will require backend integration
- Database for storing student registrations
- Email notification system

## Changelog

- June 29, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.