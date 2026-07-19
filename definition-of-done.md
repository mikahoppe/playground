# Definition of Done

A change is **done** only when every applicable item below is satisfied. Skip items with a written reason; do not skip silently.

## Functionality
- [ ] acceptance criteria / requirements
- [ ] empty, loading, and error states
- [ ] feature flag / rollout plan

## Accessibility
- [ ] keyboard accessible
- [ ] ARIA roles, states, and labels
- [ ] visible focus indicator on all interactive elements
- [ ] color contrast
- [ ] accessibility checked
- [ ] `prefers-reduced-motion`

## Components & Design
- [ ] Storybook story added
- [ ] responsive across breakpoints
- [ ] light and dark mode verified
- [ ] uses design tokens / theme, not hardcoded values

## Testing
- [ ] unit tests added
- [ ] end-to-end tests added (Playwright)
- [ ] Storybook tests added

## Code Quality
- [ ] `bun run build` passes
- [ ] `bun lint` passes (Biome)
- [ ] `bun format` applied

## Performance & Security
- [ ] no unnecessary re-renders
- [ ] no secrets committed
- [ ] input validated / sanitized
- [ ] bundle-size impact considered for new dependencies

## Documentation & Delivery
- [ ] documentation updated
