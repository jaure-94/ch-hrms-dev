# Mobile Responsive Design Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to make the HR Management System fully mobile responsive. The application is built with React 18, TypeScript, Tailwind CSS, and shadcn/ui components. The plan addresses all pages, components, layouts, and nested routes to ensure optimal user experience across all device sizes (mobile phones, tablets, and desktops).

## Current State Analysis

### Application Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Library**: shadcn/ui (Radix UI based)
- **Routing**: Wouter
- **Breakpoint Strategy**: Currently uses `use-mobile.tsx` hook with 768px breakpoint

### Current Issues Identified
1. **Sidebar Navigation**: Fixed position sidebar (w-64/w-16) with fixed content margin (ml-64/ml-16) doesn't adapt to mobile
2. **Tables**: Wide tables with many columns overflow on small screens
3. **Forms**: Grid layouts may not stack properly on mobile
4. **Cards**: Multi-column grid layouts don't adapt well
5. **Page Headers**: Button groups may overflow
6. **Modals/Dialogs**: May be too large for mobile screens
7. **Breadcrumbs**: May overflow on small screens
8. **Filters and Search**: Horizontal layouts don't stack on mobile

## Breakpoint Strategy

Based on Tailwind CSS standard breakpoints and industry best practices:
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (sm to lg)
- **Desktop**: > 1024px (lg+)

Additional custom breakpoint consideration:
- **Mobile Navigation Threshold**: 768px (md) - matches existing `use-mobile` hook

## Implementation Plan

### Phase 1: Core Layout & Navigation Infrastructure

#### 1.1 Update Tailwind Configuration
- [ ] Review and ensure Tailwind breakpoints are properly configured
- [ ] Verify custom breakpoints if any are needed
- [ ] Ensure responsive utilities are available

#### 1.2 Create Mobile Navigation System
- [ ] Create mobile-aware sidebar wrapper component
- [ ] Implement Sheet/Drawer component for mobile sidebar navigation
- [ ] Update `App.tsx` to conditionally render mobile vs desktop sidebar
- [ ] Add mobile menu trigger button (hamburger menu)
- [ ] Implement mobile sidebar state management
- [ ] Ensure sidebar closes on route navigation on mobile
- [ ] Add backdrop/overlay for mobile sidebar

#### 1.3 Update Main Layout Container
- [ ] Modify `App.tsx` ProtectedRouter to remove fixed margins on mobile
- [ ] Implement responsive margin-left classes: `ml-0 md:ml-16 lg:ml-64`
- [ ] Ensure smooth transitions between mobile and desktop layouts
- [ ] Add top padding for mobile to account for potential mobile header

#### 1.4 Update Sidebar Component (`components/sidebar.tsx`)
- [ ] Add mobile detection using `useIsMobile` hook
- [ ] Convert fixed sidebar to hidden on mobile, Sheet/Drawer on mobile
- [ ] Update sidebar width classes: `hidden md:block` for desktop, Sheet for mobile
- [ ] Ensure company selector is mobile-friendly
- [ ] Make navigation items touch-friendly (increase tap targets to 44x44px minimum)
- [ ] Add close button for mobile sidebar
- [ ] Update user profile dropdown to work in mobile sidebar context

### Phase 2: Component-Level Responsive Updates

#### 2.1 Page Header Component (`components/page-header.tsx`)
- [ ] Make header responsive with proper padding: `px-4 sm:px-6`
- [ ] Ensure title text scales: `text-2xl sm:text-3xl`
- [ ] Stack button groups vertically on mobile: `flex-col sm:flex-row`
- [ ] Make button text wrap or use icons-only on small screens
- [ ] Add responsive spacing: `gap-2 sm:gap-3`
- [ ] Ensure logo scales appropriately

#### 2.2 Breadcrumb Component (`components/breadcrumb.tsx`)
- [ ] Add horizontal scroll for long breadcrumb paths on mobile
- [ ] Truncate middle items on small screens if needed
- [ ] Ensure touch-friendly tap targets
- [ ] Add `overflow-x-auto` with proper styling
- [ ] Consider collapsible breadcrumbs for very long paths

#### 2.3 Card Components
- [ ] Update all Card components to use responsive padding: `p-4 sm:p-6`
- [ ] Ensure card headers are responsive: `text-lg sm:text-xl`
- [ ] Make card grids responsive:
  - Single column on mobile: `grid-cols-1`
  - Two columns on tablet: `md:grid-cols-2`
  - Three+ columns on desktop: `lg:grid-cols-3` or `xl:grid-cols-4`

#### 2.4 Button Components
- [ ] Ensure all buttons meet minimum touch target size (44x44px)
- [ ] Make button groups stack on mobile: `flex-col sm:flex-row`
- [ ] Consider icon-only buttons for mobile where appropriate
- [ ] Ensure button text doesn't overflow
- [ ] Add responsive sizing: `text-sm sm:text-base`

### Phase 3: Page-Level Responsive Updates

#### 3.1 Dashboard Page (`pages/dashboard.tsx`)
- [ ] Update stats cards grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [ ] Make stat card content responsive (font sizes, spacing)
- [ ] Ensure icon sizes scale: `w-8 h-8 sm:w-12 sm:h-12`
- [ ] Update recent activities list for mobile
- [ ] Make activity items stack properly on mobile
- [ ] Add responsive padding: `p-4 sm:p-6`
- [ ] Ensure PageHeader actions stack on mobile

#### 3.2 Employees Page (`pages/employees.tsx`)
- [ ] Make search and filter section stack on mobile:
  - `flex-col md:flex-row` for container
  - Full width inputs on mobile: `w-full md:w-48` for selects
- [ ] Update EmployeeTable component (see section 3.3)
- [ ] Ensure page header buttons stack
- [ ] Add responsive padding and spacing

#### 3.3 Employee Table Component (`components/employee-table.tsx`)
- [ ] Create mobile card view for table rows on small screens
- [ ] Implement table-to-card transformation:
  - Show table on `md:` breakpoint and above
  - Show card view below `md:` breakpoint
- [ ] Each card should display:
  - Employee avatar and name
  - Key information (position, department, status)
  - Actions menu (View, Edit, Download, Delete)
- [ ] Hide less critical columns on mobile table view if keeping table
- [ ] Make table horizontally scrollable as fallback: `overflow-x-auto`
- [ ] Ensure pagination controls are mobile-friendly
- [ ] Make action buttons touch-friendly
- [ ] Consider sticky header for scrollable table

#### 3.4 Company Page (`pages/company.tsx`)
- [ ] Update main grid layout: `grid-cols-1 lg:grid-cols-3`
- [ ] Make company details section full width on mobile
- [ ] Update department cards grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- [ ] Ensure department cards are readable on mobile
- [ ] Make contact information stack properly
- [ ] Update stats cards to stack on mobile
- [ ] Ensure edit button is accessible on mobile

#### 3.5 Department Details Page (`pages/department-details.tsx`)
- [ ] Update stats cards grid: `grid-cols-2 md:grid-cols-4` (2x2 on mobile)
- [ ] Make filter buttons wrap on mobile: `flex-wrap`
- [ ] Ensure job role cards stack properly
- [ ] Update card layouts for mobile readability
- [ ] Make action buttons stack or wrap appropriately
- [ ] Ensure breadcrumb is scrollable if needed

#### 3.6 Onboarding Page (`pages/onboarding.tsx`)
- [ ] Make progress bar responsive
- [ ] Update step labels to truncate or wrap on mobile
- [ ] Ensure form card uses proper mobile padding
- [ ] Update OnboardingForm component (see section 3.7)

#### 3.7 Onboarding Form Component (`components/onboarding-form.tsx`)
- [ ] Update all form field grids to stack on mobile:
  - `grid-cols-1 md:grid-cols-2` for two-column layouts
- [ ] Ensure form sections have proper spacing on mobile
- [ ] Make date pickers mobile-friendly
- [ ] Update select dropdowns to be full width on mobile
- [ ] Ensure multi-step navigation buttons are mobile-friendly
- [ ] Make checkboxes and radio buttons touch-friendly (larger tap targets)
- [ ] Ensure form validation messages display properly on mobile

#### 3.8 Contracts Page (`pages/contracts.tsx`)
- [ ] Apply same table-to-card pattern as EmployeeTable
- [ ] Update filters to stack on mobile
- [ ] Ensure contract cards show essential information
- [ ] Make action buttons accessible on mobile
- [ ] Update page header actions to stack

#### 3.9 Contracts Table/List
- [ ] Implement card view for mobile (similar to employee table)
- [ ] Show essential contract information in cards
- [ ] Make table scrollable horizontally as alternative
- [ ] Ensure action menus are accessible on mobile

#### 3.10 Users Page (`pages/users.tsx`)
- [ ] Apply table-to-card pattern
- [ ] Update filters to stack
- [ ] Ensure user cards display key information
- [ ] Make role badges and status indicators clear on mobile

#### 3.11 Logs Page (`pages/logs.tsx`)
- [ ] Implement card view for log entries on mobile
- [ ] Make table scrollable horizontally as fallback
- [ ] Update filters to stack
- [ ] Ensure timestamp and action details are readable
- [ ] Consider collapsible log details for mobile

#### 3.12 Login Page (`pages/login.tsx`)
- [ ] Ensure form is centered and properly sized on mobile
- [ ] Make input fields full width with proper padding
- [ ] Ensure button is full width on mobile: `w-full`
- [ ] Update card padding: `p-4 sm:p-6`
- [ ] Ensure logo and branding scale appropriately
- [ ] Test on various mobile screen sizes

#### 3.13 Signup Page (`pages/signup.tsx`)
- [ ] Make multi-step form mobile-friendly
- [ ] Update form grids to stack: `grid-cols-1 sm:grid-cols-2`
- [ ] Ensure step indicator is readable on mobile
- [ ] Make progress indicator responsive
- [ ] Update all form fields for mobile
- [ ] Ensure validation messages display properly

#### 3.14 Edit Employee Page (`pages/edit-employee.tsx`)
- [ ] Update form grids to stack on mobile
- [ ] Ensure all form sections are accessible
- [ ] Make date pickers mobile-friendly
- [ ] Update button groups to stack on mobile
- [ ] Ensure long forms can scroll properly

#### 3.15 Edit User Page (`pages/edit-user.tsx`)
- [ ] Apply same responsive form patterns
- [ ] Update form layouts for mobile
- [ ] Ensure role selection is mobile-friendly

#### 3.16 Create User Page (`pages/create-user.tsx`)
- [ ] Update form grids to stack
- [ ] Ensure all form fields are accessible
- [ ] Make validation messages display properly

#### 3.17 Edit Company Page (`pages/edit-company.tsx`)
- [ ] Update EditCompanyForm component for mobile
- [ ] Ensure form sections stack properly
- [ ] Make all inputs full width on mobile

#### 3.18 Edit Company Form Component (`components/edit-company-form.tsx`)
- [ ] Update form grids: `grid-cols-1 md:grid-cols-2`
- [ ] Ensure text areas are readable on mobile
- [ ] Make file uploads mobile-friendly
- [ ] Update button layouts

#### 3.19 Company Setup Page (`pages/company-setup.tsx`)
- [ ] Make multi-step form mobile-friendly
- [ ] Update step indicator for mobile
- [ ] Ensure all form sections stack properly
- [ ] Update progress display

#### 3.20 Create Department Page (`pages/create-department.tsx`)
- [ ] Update form layouts for mobile
- [ ] Ensure all fields are accessible
- [ ] Make form validation mobile-friendly

#### 3.21 Edit Department Page (`pages/edit-department.tsx`)
- [ ] Apply responsive form patterns
- [ ] Update layouts for mobile

#### 3.22 Contract Template Page (`pages/contract-template.tsx`)
- [ ] Make template editor mobile-friendly
- [ ] Ensure text areas are readable
- [ ] Update action buttons
- [ ] Consider simplified mobile view if editor is too complex

#### 3.23 Contract Generate Page (`pages/contract-generate.tsx`)
- [ ] Update form layouts for mobile
- [ ] Ensure employee selection is mobile-friendly
- [ ] Make form sections accessible

#### 3.24 User Profile Page (`pages/user-profile.tsx`)
- [ ] Update profile layout for mobile
- [ ] Ensure profile information displays properly
- [ ] Make edit actions accessible

#### 3.25 Not Found Page (`pages/not-found.tsx`)
- [ ] Ensure 404 page is mobile-friendly
- [ ] Update text and button sizes
- [ ] Ensure navigation back button is accessible

### Phase 4: Modal and Dialog Responsiveness

#### 4.1 Employee Details Modal (`components/employee-details-modal.tsx`)
- [ ] Update Dialog to be mobile-friendly
- [ ] Make modal full screen on mobile or near-full screen
- [ ] Ensure content is scrollable
- [ ] Update grid layouts to stack: `grid-cols-1 md:grid-cols-2`
- [ ] Make action buttons stack on mobile
- [ ] Ensure close button is accessible
- [ ] Test with Drawer component for bottom sheet on mobile

#### 4.2 Contract View Modal (`components/contract-view-modal.tsx`)
- [ ] Make modal responsive: `max-w-full md:max-w-4xl`
- [ ] Ensure content scrolls properly
- [ ] Update layouts to stack on mobile
- [ ] Make download button accessible
- [ ] Consider using Drawer for mobile viewing

#### 4.3 Update Dialog Component (`components/ui/dialog.tsx`)
- [ ] Review Dialog component for mobile responsiveness
- [ ] Ensure it handles small screens properly
- [ ] Consider max-width constraints: `max-w-[calc(100vw-2rem)] sm:max-w-lg`
- [ ] Ensure proper padding on mobile: `p-4 sm:p-6`
- [ ] Test with various content sizes

#### 4.4 Update Alert Dialog Component
- [ ] Ensure alert dialogs are mobile-friendly
- [ ] Make buttons stack on mobile
- [ ] Ensure text is readable
- [ ] Update padding and spacing

### Phase 5: Form Component Responsiveness

#### 5.1 Input Components (`components/ui/input.tsx`)
- [ ] Ensure inputs are full width by default on mobile
- [ ] Verify proper padding and sizing
- [ ] Ensure placeholder text is readable
- [ ] Test with various input types

#### 5.2 Select Components
- [ ] Ensure select dropdowns work well on mobile
- [ ] Verify touch-friendly interaction
- [ ] Ensure dropdown content is scrollable
- [ ] Test with many options

#### 5.3 Textarea Components
- [ ] Ensure textareas are readable on mobile
- [ ] Verify proper resizing
- [ ] Ensure scrollability

#### 5.4 Date Picker Components
- [ ] Ensure date pickers are mobile-friendly
- [ ] Verify calendar opens properly on mobile
- [ ] Test touch interactions
- [ ] Consider native date inputs on mobile where appropriate

#### 5.5 Checkbox and Radio Components
- [ ] Ensure touch targets are at least 44x44px
- [ ] Verify labels are clickable
- [ ] Ensure proper spacing

#### 5.6 Form Validation Messages
- [ ] Ensure error messages display properly on mobile
- [ ] Verify messages don't overflow
- [ ] Ensure proper positioning

### Phase 6: Utility Components and Hooks

#### 6.1 Update use-mobile Hook (`hooks/use-mobile.tsx`)
- [ ] Review current implementation
- [ ] Ensure it works correctly with SSR if applicable
- [ ] Consider adding tablet breakpoint if needed
- [ ] Document usage patterns

#### 6.2 Create Responsive Utilities
- [ ] Create utility functions for responsive breakpoints if needed
- [ ] Create responsive spacing utilities
- [ ] Document usage

### Phase 7: Table Component Improvements

#### 7.1 Create Table Wrapper Component
- [ ] Create reusable responsive table wrapper
- [ ] Implement automatic card view conversion on mobile
- [ ] Add horizontal scroll fallback option
- [ ] Make configurable per use case

#### 7.2 Table Card View Pattern
- [ ] Standardize card view layout for tables
- [ ] Ensure consistent information hierarchy
- [ ] Make actions accessible
- [ ] Ensure status indicators are clear

#### 7.3 Table Scrollable Pattern (Fallback)
- [ ] Implement proper horizontal scroll styling
- [ ] Add scroll indicators if needed
- [ ] Ensure table headers are readable
- [ ] Consider sticky header option

### Phase 8: Typography and Spacing

#### 8.1 Typography Scale
- [ ] Ensure font sizes are readable on mobile
- [ ] Use responsive typography utilities
- [ ] Test line heights and spacing
- [ ] Ensure headings scale appropriately

#### 8.2 Spacing System
- [ ] Use responsive spacing utilities throughout
- [ ] Ensure proper padding and margins on mobile
- [ ] Test spacing on various screen sizes
- [ ] Maintain consistent spacing system

### Phase 9: Touch Interactions and Accessibility

#### 9.1 Touch Targets
- [ ] Audit all interactive elements
- [ ] Ensure minimum 44x44px touch targets
- [ ] Add appropriate padding to small buttons
- [ ] Test on actual mobile devices

#### 9.2 Gesture Support
- [ ] Consider swipe gestures for mobile sidebar
- [ ] Implement pull-to-refresh if appropriate
- [ ] Test scrolling behaviors

#### 9.3 Accessibility
- [ ] Ensure proper ARIA labels on mobile
- [ ] Test with screen readers on mobile
- [ ] Ensure keyboard navigation works
- [ ] Verify focus indicators are visible
- [ ] Test with assistive technologies

#### 9.4 Cross-Browser Compatibility
- [ ] Test on iOS Safari
- [ ] Test on Chrome Android
- [ ] Test on Firefox Mobile
- [ ] Test on Samsung Internet
- [ ] Verify viewport meta tag is correct
- [ ] Test landscape and portrait orientations

### Phase 10: Performance Optimization

#### 10.1 Mobile Performance
- [ ] Optimize images for mobile
- [ ] Consider lazy loading for below-fold content
- [ ] Minimize JavaScript bundle size
- [ ] Test page load times on mobile networks

#### 10.2 Responsive Images
- [ ] Ensure logos scale properly
- [ ] Use appropriate image sizes
- [ ] Consider srcset if needed

#### 10.3 Bundle Size
- [ ] Review and optimize imports
- [ ] Consider code splitting if needed
- [ ] Minimize CSS bundle

### Phase 11: Testing and Quality Assurance

#### 11.1 Device Testing
- [ ] Test on iPhone (various sizes)
- [ ] Test on Android phones (various sizes)
- [ ] Test on tablets (iPad, Android tablets)
- [ ] Test in landscape and portrait
- [ ] Test with different screen densities

#### 11.2 Browser Testing
- [ ] iOS Safari
- [ ] Chrome Android
- [ ] Firefox Mobile
- [ ] Samsung Internet
- [ ] Edge Mobile

#### 11.3 Feature Testing
- [ ] Test all navigation flows
- [ ] Test all forms
- [ ] Test all modals and dialogs
- [ ] Test all tables and lists
- [ ] Test search and filters
- [ ] Test pagination
- [ ] Test user interactions

#### 11.4 Responsive Design Testing Tools
- [ ] Use browser DevTools responsive mode
- [ ] Test at standard breakpoints
- [ ] Test at edge cases (very small, very large)
- [ ] Verify no horizontal scrolling

#### 11.5 Accessibility Testing
- [ ] Run accessibility audits
- [ ] Test with screen readers
- [ ] Verify keyboard navigation
- [ ] Check color contrast ratios
- [ ] Verify focus indicators

### Phase 12: Documentation and Guidelines

#### 12.1 Create Responsive Design Guidelines
- [ ] Document breakpoint strategy
- [ ] Document responsive patterns used
- [ ] Create component usage guidelines
- [ ] Document mobile-specific considerations

#### 12.2 Code Documentation
- [ ] Add comments for responsive implementations
- [ ] Document complex responsive logic
- [ ] Update component documentation

#### 12.3 Style Guide Updates
- [ ] Update style guide with responsive patterns
- [ ] Document spacing and typography scales
- [ ] Include mobile examples

## Implementation Priority

### High Priority (MVP Mobile Support)
1. Phase 1: Core Layout & Navigation Infrastructure
2. Phase 2: Component-Level Responsive Updates (Page Header, Breadcrumb, Cards, Buttons)
3. Phase 3: Dashboard, Employees, Company, Login pages
4. Phase 4: Modal responsiveness
5. Phase 9: Touch Interactions and Accessibility basics

### Medium Priority (Enhanced Mobile Experience)
1. Phase 3: Remaining pages
2. Phase 5: Form Component Responsiveness
3. Phase 7: Table Component Improvements
4. Phase 8: Typography and Spacing refinement

### Low Priority (Polish and Optimization)
1. Phase 6: Utility Components
2. Phase 10: Performance Optimization
3. Phase 11: Comprehensive Testing
4. Phase 12: Documentation

## Best Practices to Follow

### 1. Mobile-First Approach
- Start with mobile styles as base
- Add desktop enhancements with `md:`, `lg:`, `xl:` prefixes
- Test mobile experience first

### 2. Progressive Enhancement
- Ensure core functionality works on all devices
- Enhance experience on larger screens
- Don't rely on JavaScript for critical layout

### 3. Touch-Friendly Design
- Minimum 44x44px touch targets
- Adequate spacing between interactive elements
- Clear visual feedback for interactions

### 4. Performance
- Minimize layout shifts
- Optimize images
- Lazy load non-critical content
- Test on slow networks

### 5. Accessibility
- Maintain semantic HTML
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast

### 6. Clean Code Practices
- Use Tailwind responsive utilities consistently
- Create reusable responsive components
- Avoid inline styles
- Document complex responsive logic
- Follow existing code patterns

### 7. Cross-Browser Compatibility
- Test on major mobile browsers
- Use standard CSS features
- Provide fallbacks where needed
- Test on real devices

### 8. Responsive Patterns
- Use flexbox and grid with responsive breakpoints
- Implement container queries where appropriate (if supported)
- Use relative units (rem, em, %) over fixed pixels
- Test at multiple breakpoints

## Technical Considerations

### Viewport Meta Tag
Ensure `index.html` has proper viewport meta tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
```

### CSS Variables
Leverage existing CSS variables for consistent theming across breakpoints.

### State Management
Ensure mobile sidebar state is properly managed and doesn't conflict with desktop state.

### Route Handling
Ensure navigation works correctly on mobile, including closing mobile menu on navigation.

### Loading States
Ensure loading states are mobile-friendly and don't cause layout shifts.

## Testing Checklist

### Layout Testing
- [ ] No horizontal scrolling on any page
- [ ] Content doesn't overflow containers
- [ ] Images scale properly
- [ ] Text is readable without zooming
- [ ] Spacing is appropriate on all screen sizes

### Navigation Testing
- [ ] Mobile menu opens and closes properly
- [ ] Navigation items are accessible
- [ ] Active states are clear
- [ ] Breadcrumbs work on mobile
- [ ] Back navigation works

### Form Testing
- [ ] All form fields are accessible
- [ ] Forms submit correctly
- [ ] Validation messages display properly
- [ ] Date pickers work on mobile
- [ ] File uploads work

### Table/List Testing
- [ ] Tables convert to cards on mobile
- [ ] All information is accessible
- [ ] Actions are accessible
- [ ] Pagination works

### Modal/Dialog Testing
- [ ] Modals are mobile-friendly
- [ ] Content is scrollable
- [ ] Close buttons work
- [ ] Backdrop interactions work

### Interaction Testing
- [ ] All buttons are tappable
- [ ] Touch targets are adequate
- [ ] Swipe gestures work (if implemented)
- [ ] Scroll behaviors are smooth

## Success Criteria

1. **Functional**: All features work on mobile devices
2. **Usable**: Users can complete all tasks on mobile
3. **Accessible**: Application meets WCAG 2.1 AA standards
4. **Performant**: Pages load in under 3 seconds on 4G
5. **Consistent**: Design is consistent across device sizes
6. **Tested**: Tested on major mobile browsers and devices

## Timeline Estimate

- **Phase 1-2**: 2-3 days
- **Phase 3**: 5-7 days
- **Phase 4**: 1-2 days
- **Phase 5**: 2-3 days
- **Phase 6-8**: 2-3 days
- **Phase 9**: 2 days
- **Phase 10**: 1-2 days
- **Phase 11**: 3-5 days
- **Phase 12**: 1-2 days

**Total Estimated Time**: 20-30 days (depending on team size and experience)

## Notes

- This plan assumes implementation with existing Tailwind CSS setup
- All changes should maintain backward compatibility
- Consider user feedback during implementation
- Iterate based on testing results
- Document decisions and patterns as you go



