# Weekly Testing Checklist for Tattoo-Shops Application

## 🎯 Purpose
Run these tests weekly to ensure optimal performance, security, and reliability of the Universal Inc. Tattoo Artist Directory platform.

---

## 1️⃣ Backend API Tests

### Authentication & Authorization
- [ ] OAuth login flow (sign up and sign in)
- [ ] Session token validation and expiration
- [ ] Protected endpoints reject unauthenticated requests
- [ ] User can only access/modify their own data (IDOR protection)
- [ ] Artist ownership verification on portfolio/booking operations

### Artist Management
- [ ] Create new artist profile
- [ ] Update existing artist profile (owner only)
- [ ] Fetch artist by ID
- [ ] Search artists by location, style, and filters
- [ ] Delete artist (should cascade to portfolio/bookings)

### Portfolio Management
- [ ] Add portfolio images with valid URLs
- [ ] Delete portfolio images (owner only)
- [ ] Fetch portfolio by artist ID
- [ ] Image URLs are accessible and load correctly

### Booking System
- [ ] Create booking with all required fields
- [ ] Validate future date requirement
- [ ] Fetch bookings by customer
- [ ] Fetch bookings by artist (owner only)
- [ ] Update booking status (authorized users only)
- [ ] Prevent duplicate bookings for same time slot

### Payment Integration
- [ ] Stripe checkout session creation
- [ ] Webhook handling for payment success
- [ ] Webhook idempotency check
- [ ] Deposit amount calculation and storage
- [ ] Payment failure webhook handling

### Reviews & Ratings
- [ ] Submit review with rating and text
- [ ] Upload review photos
- [ ] Calculate average rating correctly
- [ ] Fetch reviews by artist ID
- [ ] Prevent duplicate reviews from same user

### Favorites System
- [ ] Add artist to favorites
- [ ] Remove artist from favorites
- [ ] Prevent duplicate favorites (unique constraint)
- [ ] Fetch user's favorite artists

---

## 2️⃣ Security Tests

### SSRF Protection
- [ ] Voice transcription blocks private IPs (127.0.0.1, 10.x.x.x, 192.168.x.x)
- [ ] Voice transcription blocks IPv6 private ranges (::1, fc00::/7, fe80::/10)
- [ ] Voice transcription blocks IPv4-mapped IPv6 (::ffff:192.168.1.1)
- [ ] Voice transcription requires HTTPS URLs
- [ ] DNS rebinding protection works correctly

### XSS Protection
- [ ] Email subjects don't contain HTML entities
- [ ] Email body properly escapes user input (shop names, artist names, customer names)
- [ ] InfoWindow content in maps is HTML-escaped
- [ ] Review text and comments are sanitized

### CSRF Protection
- [ ] OAuth state parameter uses crypto-secure random values
- [ ] OAuth state is validated on callback
- [ ] State nonces are stored securely in sessionStorage
- [ ] Multiple concurrent login attempts don't conflict

### Input Validation
- [ ] Email addresses are validated
- [ ] Phone numbers are validated
- [ ] URLs are validated and sanitized
- [ ] Date inputs require future dates for bookings
- [ ] Numeric inputs handle NaN/Infinity correctly

### Rate Limiting (if implemented)
- [ ] API endpoints have rate limits
- [ ] Excessive requests return 429 Too Many Requests
- [ ] Rate limits reset after time window

---

## 3️⃣ Frontend Tests

### User Interface
- [ ] All pages load without console errors
- [ ] Navigation links work correctly
- [ ] Header shows correct auth state (logged in/out)
- [ ] Sign up button navigates to /signup (not /login)
- [ ] Footer links are clickable (not buttons)
- [ ] Dynamic copyright year displays current year

### Forms & Validation
- [ ] Booking form validates all required fields
- [ ] Contact form submits correctly
- [ ] Artist registration form captures all data
- [ ] Form error messages are user-friendly
- [ ] Submit buttons disable during loading
- [ ] Labels are associated with inputs (htmlFor/id)

### Accessibility (WCAG 2.1)
- [ ] All interactive elements have proper labels
- [ ] Keyboard navigation works (Tab, Enter, Arrow keys)
- [ ] Screen reader announcements are correct
- [ ] Color contrast meets AA standards
- [ ] Forms have proper aria-labels
- [ ] Error messages are announced
- [ ] Viewport allows pinch-to-zoom

### Responsive Design
- [ ] Mobile view (320px-767px) displays correctly
- [ ] Tablet view (768px-1023px) displays correctly
- [ ] Desktop view (1024px+) displays correctly
- [ ] Images scale appropriately
- [ ] Touch targets are at least 44x44px

### Map Functionality
- [ ] Google Maps loads correctly
- [ ] Markers display for all shops
- [ ] InfoWindows show correct shop information
- [ ] Map handles no results gracefully
- [ ] Geolocation works (if permitted)

---

## 4️⃣ Performance Tests

### Page Load Times
- [ ] Homepage loads in < 3 seconds
- [ ] Artist browse page loads in < 3 seconds
- [ ] Artist profile loads in < 2 seconds
- [ ] Search results display in < 2 seconds

### API Response Times
- [ ] Artist search returns in < 500ms
- [ ] Single artist fetch returns in < 200ms
- [ ] Portfolio fetch returns in < 300ms
- [ ] Booking creation completes in < 1 second

### Database Performance
- [ ] Complex queries use proper indexes
- [ ] No N+1 query problems
- [ ] Connection pool doesn't exhaust
- [ ] Query execution time < 100ms for most queries

### Asset Optimization
- [ ] Images are properly compressed
- [ ] CSS/JS bundles are minified
- [ ] Unused code is tree-shaken
- [ ] Static assets use CDN (if configured)
- [ ] Font loading doesn't block render

### Lighthouse Scores (Target)
- [ ] Performance: > 90
- [ ] Accessibility: > 95
- [ ] Best Practices: > 90
- [ ] SEO: > 90

---

## 5️⃣ Database Tests

### Data Integrity
- [ ] Foreign key constraints are enforced
- [ ] Unique constraints prevent duplicates (favorites)
- [ ] Cascade deletes work correctly
- [ ] Nullable fields handle NULL properly
- [ ] Timestamps auto-update on modification

### Migrations
- [ ] All migrations run successfully
- [ ] Migration rollback works (if needed)
- [ ] Schema matches drizzle definition
- [ ] No orphaned records after migrations

### Backup & Recovery
- [ ] Database backup runs successfully
- [ ] Backup restore works correctly
- [ ] Data consistency after restore
- [ ] Backup size is reasonable

---

## 6️⃣ Integration Tests

### End-to-End User Flows
- [ ] **New User Registration**
  1. Click "Sign Up Free"
  2. Complete OAuth flow
  3. Land on homepage as authenticated user
  
- [ ] **Book an Appointment**
  1. Browse artists
  2. View artist profile
  3. Click "Book Now"
  4. Fill booking form
  5. Complete Stripe checkout
  6. Receive confirmation email
  
- [ ] **Artist Profile Setup**
  1. Register as artist
  2. Complete profile information
  3. Upload portfolio images
  4. Profile appears in search
  
- [ ] **Leave a Review**
  1. Complete booking
  2. Navigate to artist profile
  3. Submit review with rating
  4. Review appears on profile
  5. Average rating updates

### Third-Party Integrations
- [ ] Stripe payments process successfully
- [ ] Email delivery via Resend works
- [ ] S3 image uploads succeed
- [ ] Google Maps API loads
- [ ] OAuth provider (Manus) responds

---

## 7️⃣ Error Handling Tests

### User-Facing Errors
- [ ] Network errors show friendly messages
- [ ] 404 pages display correctly
- [ ] 500 errors show error boundary
- [ ] Form validation errors are clear
- [ ] Empty states display appropriately

### Developer Errors
- [ ] Backend errors are logged
- [ ] Stack traces are hidden in production
- [ ] Error messages don't leak sensitive data
- [ ] Sentry/error tracking captures issues (if configured)

### Edge Cases
- [ ] Concurrent bookmark attempts
- [ ] Checkout URL missing handling
- [ ] DNS resolution failures
- [ ] Image upload failures
- [ ] Expired sessions redirect to login

---

## 8️⃣ Browser & Device Testing

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Device Testing
- [ ] iPhone (various models)
- [ ] Android phones
- [ ] iPad/tablets
- [ ] Desktop (various resolutions)

---

## 9️⃣ Monitoring & Logs

### Application Metrics
- [ ] Server response times are normal
- [ ] Error rate is < 1%
- [ ] Active user sessions are tracked
- [ ] Database query performance is logged

### Business Metrics
- [ ] New artist registrations (weekly count)
- [ ] Bookings created (weekly count)
- [ ] Revenue from deposits (weekly total)
- [ ] Active users (weekly active)
- [ ] Search queries (top searches)

---

## 🔟 Deployment & Infrastructure

### Build Process
- [ ] `pnpm build` completes without errors
- [ ] TypeScript compilation succeeds
- [ ] No console warnings in production build
- [ ] Bundle sizes are reasonable

### Environment Variables
- [ ] All required env vars are set
- [ ] OAuth credentials are valid
- [ ] Database connection string works
- [ ] Stripe keys are correct
- [ ] S3/storage credentials work

### Server Health
- [ ] Health check endpoint responds
- [ ] CPU usage is < 70%
- [ ] Memory usage is < 80%
- [ ] Disk space is > 20% free
- [ ] No zombie processes

---

## 📊 Test Execution Commands

```bash
# Backend unit tests
pnpm test

# TypeScript type checking
pnpm check

# Frontend component tests (if configured)
pnpm test:frontend

# E2E tests (if configured)
pnpm test:e2e

# Lighthouse audit
pnpm lighthouse

# Database health check
pnpm db:health

# Build verification
pnpm build
```

---

## 📝 Weekly Checklist Summary

**Priority: HIGH** (Must Pass)
- [ ] All authentication flows work
- [ ] Payments process successfully
- [ ] No security vulnerabilities
- [ ] Critical user flows complete
- [ ] Production build succeeds

**Priority: MEDIUM** (Should Pass)
- [ ] Performance metrics meet targets
- [ ] All pages load correctly
- [ ] Forms validate properly
- [ ] Email delivery works

**Priority: LOW** (Nice to Have)
- [ ] UI polish improvements
- [ ] Edge case handling
- [ ] Browser compatibility
- [ ] Analytics tracking

---

## 🚨 When Tests Fail

1. **Document the failure** in GitHub Issues
2. **Assess severity** (Critical/High/Medium/Low)
3. **Create hotfix** for Critical/High issues
4. **Schedule fix** for Medium/Low issues
5. **Re-run tests** after fix is deployed

---

## 📅 Test Schedule

- **Weekly:** Run full checklist (estimated 2-3 hours)
- **Daily:** Run smoke tests on critical flows
- **Pre-deployment:** Run full test suite
- **Post-deployment:** Verify critical functionality

---

*Last Updated: January 2026*
*Next Review: Run this checklist every Monday morning*
