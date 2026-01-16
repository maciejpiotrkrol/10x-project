# Testing Recommendations - Where to Start

This document provides a prioritized list of components and utilities to test, with examples already created.

## 📊 Test Coverage Summary

### ✅ Already Tested (Examples Created)
- ✅ **Formatters** (`formatTime`, `formatGender`) - 6 tests passing
- ✅ **Date Helpers** - 29 tests passing ⭐ NEW
- ✅ **Workout Helpers** - 14 tests passing ⭐ NEW
- ✅ **Auth Schemas** - 32 tests passing ⭐ NEW
- ✅ **Button Component** - 7 tests passing

**Total: 88 tests passing** 🎉

---

## 🎯 Recommended Testing Priority

### **TIER 1: Pure Utility Functions** ⭐⭐⭐⭐⭐ (Start Here)

These are the easiest to test and provide immediate value. All have example tests created:

#### ✅ 1. **Date Helpers** - COMPLETED
- **File**: `src/lib/utils/date-helpers.ts`
- **Test**: `tests/unit/utils/date-helpers.test.ts`
- **Status**: ✅ 29 tests passing
- **Functions tested:**
  - `formatDate()` - ISO date to DD.MM.YYYY
  - `isToday()` - Check if date is today
  - `getTodayDateString()` - Get today as YYYY-MM-DD
  - `isPast()` - Check if date is in past
  - `isFuture()` - Check if date is in future

**Coverage**: 100% - All functions tested

---

#### ✅ 2. **Workout Helpers** - COMPLETED
- **File**: `src/lib/utils/workout-helpers.ts`
- **Test**: `tests/unit/utils/workout-helpers.test.ts`
- **Status**: ✅ 14 tests passing
- **Functions tested:**
  - `calculateWeekStats()` - Calculate completion stats per week
  - `groupWorkoutsByWeeks()` - Group 70 days into 10 weeks

**Coverage**: 100% - All functions tested

**What was tested:**
- Empty arrays edge cases
- Rest days exclusion logic
- Correct week grouping (1-7, 8-14, ..., 64-70)
- Stats calculation (completed vs total)
- Order preservation

---

#### ✅ 3. **Formatters** - COMPLETED
- **Files**: `src/lib/utils/formatTime.ts`, `formatGender.ts`
- **Test**: `tests/unit/utils/formatters.test.ts`
- **Status**: ✅ 6 tests passing
- **Functions tested:**
  - `formatTime()` - Seconds to HH:MM:SS or MM:SS
  - `formatGender()` - M/F to Polish labels

**Coverage**: 100%

---

#### 4. **Training Plan Service - Pure Function**
- **File**: `src/lib/services/training-plan.service.ts`
- **Function**: `calculateCompletionStats()`
- **Status**: ❌ Not yet tested
- **Priority**: High ⭐⭐⭐⭐⭐

**What to test:**
```typescript
describe('calculateCompletionStats', () => {
  it('should calculate 0% for no completed workouts');
  it('should calculate 50% for half completed');
  it('should calculate 100% for all completed');
  it('should exclude rest days from total count');
  it('should mark plan as completed when all workouts done');
  it('should mark plan as completed when end date passed');
  it('should handle edge case: 0 workouts (all rest days)');
});
```

**Estimated time**: 30-45 minutes

---

### **TIER 2: Validation Schemas** ⭐⭐⭐⭐⭐ (Security Critical)

#### ✅ 5. **Auth Schemas** - COMPLETED
- **File**: `src/lib/validation/auth.schemas.ts`
- **Test**: `tests/unit/validation/auth-schemas.test.ts`
- **Status**: ✅ 32 tests passing
- **Schemas tested:**
  - `signupSchema` - Email + password (min 8 chars)
  - `loginSchema` - Email + password (min 1 char)
  - `forgotPasswordSchema` - Email only
  - `resetPasswordSchema` - Token + password (min 8 chars)

**Coverage**: 100% - All schemas tested

**What was tested:**
- Valid inputs (various email formats)
- Invalid inputs (malformed emails, short passwords)
- Empty/missing fields
- Edge cases (special characters, unicode)
- Multiple validation errors

---

### **TIER 3: Simple Components** ⭐⭐⭐ (Good for Learning)

#### 6. **EmptyState Component**
- **File**: `src/components/EmptyState.tsx`
- **Status**: ❌ Not yet tested
- **Priority**: Medium ⭐⭐⭐

**What to test:**
```typescript
describe('EmptyState Component', () => {
  it('should render "no-plan" variant with default text');
  it('should render "no-profile" variant with default text');
  it('should render custom message when provided');
  it('should render custom CTA text when provided');
  it('should link to correct URL for each variant');
  it('should render button with proper accessibility');
});
```

**Why start here:**
- Simple presentational component
- No complex state or side effects
- Good introduction to React Testing Library
- Tests variants and default values

**Estimated time**: 1 hour

---

#### ✅ 7. **Button Component** - COMPLETED
- **File**: `src/components/ui/button.tsx`
- **Test**: `tests/unit/components/Button.test.tsx`
- **Status**: ✅ 7 tests passing

---

### **TIER 4: Complex Components** ⭐⭐⭐⭐ (More Challenging)

#### 8. **WorkoutDayCard Component** ⭐ RECOMMENDED NEXT
- **File**: `src/components/dashboard/WorkoutDayCard.tsx`
- **Status**: ❌ Not yet tested
- **Priority**: Very High ⭐⭐⭐⭐⭐

**Why important:**
- Core component (used 70 times per dashboard)
- Complex business logic (rest day validation)
- Good test coverage value
- Accessibility features to test

**What to test:**
```typescript
describe('WorkoutDayCard', () => {
  describe('Rest Day', () => {
    it('should show "Odpoczynek" badge');
    it('should not show completion checkbox');
    it('should show "Dzień wolny od treningów" message');
  });

  describe('Regular Workout', () => {
    it('should show workout description');
    it('should show completion checkbox');
    it('should call onToggleCompleted when checkbox clicked');
    it('should prevent event propagation on checkbox click');
  });

  describe('Completed Workout', () => {
    it('should show "Wykonano" badge');
    it('should show checkbox as checked');
    it('should have green border');
  });

  describe('Expandable Description', () => {
    it('should show collapsed description by default');
    it('should expand description on card click');
    it('should toggle on Enter key');
    it('should toggle on Space key');
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label');
    it('should be keyboard navigable');
    it('should have accessible checkbox label');
  });
});
```

**Estimated time**: 2-3 hours

---

#### 9. **PlanHeader Component**
- **File**: `src/components/dashboard/PlanHeader.tsx`
- **Status**: ❌ Not yet tested
- **Priority**: High ⭐⭐⭐⭐

**What to test:**
- Progress bar percentage calculation
- "Wykonano X z Y treningów" text
- Date formatting
- Edge cases (0%, 100% completion)

**Estimated time**: 1-2 hours

---

### **TIER 5: Custom Hooks** ⭐⭐⭐⭐⭐ (Advanced but Critical)

#### 10. **useWorkoutToggle Hook**
- **File**: `src/components/hooks/useWorkoutToggle.ts`
- **Status**: ❌ Not yet tested
- **Priority**: Very High ⭐⭐⭐⭐⭐

**What to test:**
```typescript
import { renderHook, act } from '@testing-library/react';

describe('useWorkoutToggle', () => {
  it('should initialize with provided workouts');
  it('should toggle workout completion optimistically');
  it('should update completed_at timestamp');
  it('should rollback on API error');
  it('should prevent marking rest days as completed');
  it('should show error toast for rest days');
  it('should show success toast on completion');
  it('should show error toast on API failure');
  it('should redirect to login on 401');
  it('should set isUpdating during API call');
});
```

**Mocking required:**
- `fetch` API
- `sonner` toast
- `window.location.href`

**Estimated time**: 3-4 hours

---

#### 11. **useScrollToToday Hook**
- **File**: `src/components/hooks/useScrollToToday.ts`
- **Status**: ❌ Not yet tested
- **Priority**: Medium ⭐⭐⭐

**What to test:**
- Finds today's workout correctly
- Returns null when no workout for today
- Handles past/future dates

**Estimated time**: 1 hour

---

## 📅 Recommended 3-Week Testing Plan

### **Week 1: Foundation (Pure Functions)**

**Goal**: Build confidence with easy wins

**Day 1-2**: ✅ DONE
- ✅ Date helpers (29 tests)
- ✅ Workout helpers (14 tests)

**Day 3**:
- ⏳ Training plan service: `calculateCompletionStats()`
- **Estimated**: 7 tests, 45 min

**Day 4-5**: ✅ DONE
- ✅ Auth schemas (32 tests)

**End of Week 1 Target**: ~88 tests passing ✅ ACHIEVED

---

### **Week 2: Components**

**Goal**: Learn React Testing Library patterns

**Day 1-2**:
- ⏳ EmptyState component
- **Estimated**: 6 tests, 1 hour

**Day 3-5**:
- ⏳ WorkoutDayCard component (HIGH PRIORITY)
- **Estimated**: 20+ tests, 2-3 hours

**End of Week 2 Target**: ~115 tests passing

---

### **Week 3: Hooks & Integration**

**Goal**: Test complex logic with mocking

**Day 1-3**:
- ⏳ useWorkoutToggle hook
- **Estimated**: 10 tests, 3-4 hours

**Day 4-5**:
- ⏳ Integration tests for API endpoints
- **Estimated**: 5-10 tests, 2-3 hours

**End of Week 3 Target**: ~135+ tests passing

---

## 🚀 Quick Start Commands

```bash
# Run all tests
npm test

# Run specific test file
npm run test:run -- tests/unit/utils/date-helpers.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode (recommended for debugging)
npm run test:ui

# Run only tests matching a pattern
npm test -- -t "calculateWeekStats"
```

---

## 📝 Test File Templates

### Pure Function Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/path/to/function';

describe('myFunction', () => {
  it('should handle normal case', () => {
    expect(myFunction('input')).toBe('expected');
  });

  it('should handle edge case', () => {
    expect(myFunction('')).toBe('default');
  });

  it('should throw on invalid input', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render with props', () => {
    render(<MyComponent text="Hello" />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<MyComponent onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Test Template

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMyHook());

    expect(result.current.value).toBe(0);
  });

  it('should update state on action', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.increment();
    });

    expect(result.current.value).toBe(1);
  });
});
```

---

## 🎓 Learning Resources

### Created Examples
1. ✅ **Date Helpers** - Pure functions with date mocking
2. ✅ **Workout Helpers** - Business logic with complex data
3. ✅ **Auth Schemas** - Zod validation testing
4. ✅ **Button** - Basic component testing

### Documentation
- `tests/README.md` - Comprehensive testing guide
- `.ai/rules/vitest-unit-testing.mdc` - Best practices
- `TESTING-SETUP.md` - Setup documentation

### External Resources
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 📊 Coverage Goals (from Test Plan)

Based on `.ai/athletica-test-plan.md`:

- **Services & Utils**: ≥ 80% coverage ⭐ PRIORITY
- **Components**: ≥ 70% coverage
- **Overall Project**: ≥ 80% coverage

**Current Status** (after completing recommendations):
- ✅ Utils: ~90% (date-helpers, workout-helpers, formatters)
- ✅ Validation: 100% (auth schemas)
- ⏳ Components: ~5% (only Button tested)
- ⏳ Hooks: 0% (not started)

**Next Focus**: Components and Hooks to reach 70% component coverage

---

## 🏆 Success Metrics

After completing all Tier 1-3 (recommended first 3 weeks):

- ✅ **88 tests passing** (current)
- 🎯 **135+ tests passing** (target after 3 weeks)
- 🎯 **80%+ coverage** for utils
- 🎯 **70%+ coverage** for components
- 🎯 **All P0 critical paths tested** (auth, plan generation, dashboard)

---

## 💡 Pro Tips

1. **Start with pure functions** - Easiest to test, fastest feedback
2. **Use watch mode** - `npm test` for instant feedback
3. **One test at a time** - Use `.only()` to focus
4. **Follow AAA pattern** - Arrange, Act, Assert
5. **Test behavior, not implementation** - Test what users see
6. **Mock external dependencies** - Keep tests fast and reliable
7. **Use descriptive test names** - "should do X when Y"
8. **Check coverage** - `npm run test:coverage` regularly

---

**Good luck with testing! 🚀**

Start with the completed examples and gradually move to more complex components and hooks.
