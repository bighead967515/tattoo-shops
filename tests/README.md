# Test Suite Documentation

This directory contains comprehensive automated tests for the Universal Inc. Tattoo Artist Directory application.

## Test Structure

```
tests/
├── backend/           # Backend API tests
│   ├── auth.test.ts          # Authentication & authorization
│   ├── artists.test.ts       # Artist CRUD operations
│   ├── bookings.test.ts      # Booking system
│   ├── payments.test.ts      # Stripe payment integration
│   ├── security.test.ts      # Security (SSRF, XSS, CSRF)
│   └── database.test.ts      # Database integrity & queries
├── frontend/          # Frontend component tests
│   ├── accessibility.test.ts # WCAG 2.1 compliance
│   └── error-handling.test.ts # Error scenarios
├── integration/       # End-to-end user flows
│   └── user-flows.test.ts    # Complete user journeys
└── performance/       # Performance benchmarks
    └── metrics.test.ts       # Load times, bundle size
```

## Running Tests

### All Tests
```bash
pnpm test
```

### Watch Mode (for development)
```bash
pnpm test --watch
```

### Coverage Report
```bash
pnpm test --coverage
```

### Specific Test File
```bash
pnpm test tests/backend/auth.test.ts
```

### Specific Test Suite
```bash
pnpm test -t "Authentication"
```

## Test Categories

### Backend Tests (tests/backend/)

#### auth.test.ts
- OAuth login flow validation
- Session token management
- Protected endpoint authorization
- IDOR prevention
- Artist ownership verification

#### artists.test.ts
- Artist profile CRUD operations
- Search and filter functionality
- Rating calculations
- Data validation

#### bookings.test.ts
- Booking creation and validation
- Future date requirements
- Status management
- Duplicate prevention
- Payment integration

#### payments.test.ts
- Stripe checkout session creation
- Webhook event handling
- Payment success/failure flows
- Idempotency checks
- Refund processing

#### security.test.ts
- SSRF protection (IPv4/IPv6)
- XSS prevention (HTML escaping)
- CSRF protection (state validation)
- Input validation
- SQL injection prevention

#### database.test.ts
- Schema constraints (NOT NULL, UNIQUE, FK)
- Cascading deletes
- Index performance
- Data integrity
- Transaction handling
- Migration management

### Frontend Tests (tests/frontend/)

#### accessibility.test.ts
- Keyboard navigation
- ARIA labels and roles
- Form label associations
- Screen reader support
- Color contrast (WCAG AA)
- Touch target sizes
- Focus indicators

#### error-handling.test.ts
- Network error handling
- API error responses (400, 401, 403, 404, 500)
- Validation errors
- File upload errors
- Loading states
- Empty states
- Offline handling
- Session expiration

### Integration Tests (tests/integration/)

#### user-flows.test.ts
- New user registration
- Complete booking flow (search → book → pay → confirm)
- Artist profile setup
- Review submission
- Search and filter workflows
- User dashboard interactions

### Performance Tests (tests/performance/)

#### metrics.test.ts
- Page load times (< 3s)
- First Contentful Paint (< 1.8s)
- Largest Contentful Paint (< 2.5s)
- Time to Interactive (< 3.8s)
- Cumulative Layout Shift (< 0.1)
- Bundle size (< 300KB gzipped)
- Image optimization
- API response times (< 500ms)
- Database query performance (< 100ms)
- Lighthouse scores (> 90)

## Writing New Tests

### Test Structure
```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = processInput(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Best Practices

1. **Descriptive Names**: Use clear, descriptive test names
2. **Single Responsibility**: Each test should verify one thing
3. **Arrange-Act-Assert**: Follow the AAA pattern
4. **Mock External Dependencies**: Mock API calls, database queries, etc.
5. **Test Edge Cases**: Include tests for error scenarios
6. **Keep Tests Fast**: Avoid unnecessary delays or complex setup

### Mocking

Currently, tests use simple mocks:
```typescript
// Mock API response
const result = { success: true, data: {} };
expect(result.success).toBe(true);
```

For integration tests, consider using:
- **MSW (Mock Service Worker)** for API mocking
- **Playwright** or **Cypress** for E2E tests
- **Testing Library** for React component tests

## Coverage Goals

- **Backend API**: > 80% coverage
- **Security Functions**: 100% coverage
- **Critical User Flows**: 100% coverage
- **Frontend Components**: > 70% coverage

## Integration with CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test --coverage
```

## Maintenance

- **Weekly Execution**: Run full test suite every Monday (see WEEKLY_TESTS.md)
- **Before Deployment**: Run all tests before production deployment
- **After Changes**: Run relevant tests after code changes
- **Update Tests**: Keep tests in sync with code changes

## Troubleshooting

### Tests Won't Run
```bash
# Check Vitest is installed
pnpm list vitest

# Reinstall dependencies
pnpm install
```

### Import Errors
```bash
# Check path aliases in vitest.config.ts
# Verify file paths match actual structure
```

### Slow Tests
```bash
# Run specific test file instead of all tests
pnpm test tests/backend/auth.test.ts

# Use watch mode for development
pnpm test --watch
```

## Future Enhancements

1. **Real API Integration Tests**: Connect to test database
2. **E2E Tests**: Add Playwright/Cypress for full browser tests
3. **Component Tests**: Add React Testing Library for UI components
4. **Performance Monitoring**: Integrate Lighthouse CI
5. **Visual Regression**: Add screenshot comparison tests
6. **Load Testing**: Add stress tests for high traffic scenarios

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
