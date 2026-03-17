# Voldemort

A modern, minimal Angular application with authentication functionality.

## Features

- **Authentication**: Complete login and registration system
- **Modern UI**: Clean, responsive design with Tailwind-inspired styling
- **TypeScript**: Full type safety throughout the application
- **Testing**: Comprehensive test coverage for authentication features
- **Environment Configuration**: Configurable settings via .env files
- **Route Guards**: Protected routes for authenticated users
- **State Management**: Reactive authentication state management

## Tech Stack

- **Angular 21** - Modern Angular framework
- **TypeScript** - Type-safe development
- **SCSS** - Styling with CSS preprocessor
- **Lucide Angular** - Beautiful icon library
- **Jasmine** - Testing framework
- **RxJS** - Reactive programming

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Voldemort
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
ng serve
```

The application will be available at `http://localhost:4200`.

## Environment Configuration

The application uses environment variables configured in `.env`:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api

# Authentication Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# App Configuration
APP_NAME=Voldemort
APP_VERSION=1.0.0

# UI Configuration
PRIMARY_COLOR=#6366f1
SECONDARY_COLOR=#8b5cf6
```

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Route guards
│   │   ├── models/          # TypeScript interfaces
│   │   └── services/        # Core services
│   ├── features/
│   │   ├── auth/            # Authentication components
│   │   └── dashboard/       # Dashboard components
│   ├── shared/              # Shared components
│   ├── app.config.ts        # App configuration
│   ├── app.routes.ts        # Route configuration
│   └── app.ts              # Root component
├── environments/           # Environment configurations
└── styles.scss            # Global styles
```

## Authentication Flow

1. **Registration**: Users can create an account with email, name, and password
2. **Login**: Existing users can authenticate with their credentials
3. **Protected Routes**: Dashboard and other protected areas require authentication
4. **Token Management**: JWT tokens are stored and managed securely
5. **Auto-logout**: Users are logged out when tokens expire

## Available Routes

- `/` - Redirects to dashboard (if authenticated) or login
- `/auth/login` - Login page (public)
- `/auth/register` - Registration page (public)
- `/dashboard` - Protected dashboard (authenticated users only)

## Testing

Run the test suite:

```bash
# Unit tests
ng test

# End-to-end tests
ng e2e

# Test coverage
ng test --code-coverage
```

### Test Coverage

- **Authentication Service**: Complete coverage of login, register, logout, and token management
- **Components**: Login and register component testing
- **Guards**: Auth and public guard testing
- **Forms**: Form validation and submission testing

## Building

Create a production build:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Development

### Adding New Features

1. Create feature modules in `src/app/features/`
2. Add components, services, and models
3. Update routing configuration
4. Write comprehensive tests
5. Update documentation

### Code Style

- Use TypeScript for all new code
- Follow Angular style guide
- Write descriptive commit messages
- Include tests for new functionality
- Use meaningful variable and function names

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Base URL for API requests | `http://localhost:3000/api` |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` |
| `APP_NAME` | Application name | `Voldemort` |
| `PRIMARY_COLOR` | Primary theme color | `#6366f1` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
