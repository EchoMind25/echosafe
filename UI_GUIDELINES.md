# ECHO MIND COMPLIANCE - UI/UX GUIDELINES
**Version:** 1.3 | **Date:** January 17, 2026 | **Privacy-First Edition**

---

## DESIGN PHILOSOPHY

**Core Principle:** Professional compliance tool with privacy-first values and modern, approachable UX

**Inspiration:**
- Apple.com (clean, spacious, confident)
- Linear.app (modern, fast, intuitive)
- Stripe (professional, trustworthy)
- DuckDuckGo (privacy-focused, transparent)

**NOT:**
- Cluttered enterprise dashboards
- Generic SaaS templates
- Overly technical interfaces
- Dark patterns or tracking-heavy designs

---

## BRAND IDENTITY

### Echo Mind Teal
```
Primary: #14b8a6 (Teal-500)
Dark:    #0f766e (Teal-700)
Light:   #5eead4 (Teal-300)
```

### Status Colors
```
Success (Clean):     #10b981 (Green-500)
Warning (Caution):   #f59e0b (Amber-500)
Danger (Blocked):    #ef4444 (Red-500)
Info:                #3b82f6 (Blue-500)
Privacy (Shield):    #8b5cf6 (Purple-500)
```

### Neutral Palette
```
Gray-900: #0f172a (Primary text)
Gray-600: #475569 (Secondary text)
Gray-400: #94a3b8 (Placeholder)
Gray-300: #cbd5e1 (Borders)
Gray-100: #f1f5f9 (Backgrounds)
White:    #ffffff (Cards, surfaces)
```

---

## TYPOGRAPHY

### Font Family
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Font Scale
```
Display:  48px / 3rem    (Landing hero)
H1:       36px / 2.25rem (Page titles)
H2:       28px / 1.75rem (Section headers)
H3:       20px / 1.25rem (Card titles)
Body:     16px / 1rem    (Default text)
Small:    14px / 0.875rem (Labels, captions)
Tiny:     12px / 0.75rem (Meta info)
```

### Font Weights
```
Regular:  400 (Body text)
Medium:   500 (Emphasized text)
Semibold: 600 (Headings, buttons)
Bold:     700 (Important headings)
```

### Line Heights
```
Tight:    1.25 (Headings)
Normal:   1.5  (Body text)
Relaxed:  1.75 (Long-form content)
```

---

## SPACING SYSTEM

**8px Base Grid**

```
XS:  4px  / 0.25rem (Tight spacing)
SM:  8px  / 0.5rem  (Between elements)
MD:  16px / 1rem    (Default spacing)
LG:  24px / 1.5rem  (Section spacing)
XL:  32px / 2rem    (Large gaps)
2XL: 48px / 3rem    (Major sections)
3XL: 64px / 4rem    (Page sections)
4XL: 96px / 6rem    (Landing page)
```

---

## COMPONENTS

### Buttons

**Primary Button**
```tsx
<button className="
  bg-teal-500 hover:bg-teal-600
  text-white font-semibold
  px-6 py-3 rounded-lg
  shadow-sm hover:shadow-md
  transition-all duration-150
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Upload Leads
</button>
```

**Secondary Button**
```tsx
<button className="
  bg-white hover:bg-gray-50
  text-teal-700 font-semibold
  border border-gray-300
  px-6 py-3 rounded-lg
  shadow-sm hover:shadow
  transition-all duration-150
">
  View History
</button>
```

**Danger Button**
```tsx
<button className="
  bg-red-500 hover:bg-red-600
  text-white font-semibold
  px-6 py-3 rounded-lg
  shadow-sm hover:shadow-md
  transition-all duration-150
">
  Delete All Data
</button>
```

**Privacy Action Button**
```tsx
<button className="
  bg-purple-500 hover:bg-purple-600
  text-white font-semibold
  px-6 py-3 rounded-lg
  shadow-sm hover:shadow-md
  transition-all duration-150
  flex items-center gap-2
">
  <Shield className="w-5 h-5" />
  Export My Data
</button>
```

---

### Cards

**Standard Card**
```tsx
<div className="
  bg-white rounded-xl
  border border-gray-200
  p-6
  shadow-sm hover:shadow-md
  transition-shadow duration-150
">
  {/* Content */}
</div>
```

**Highlighted Card (for metrics)**
```tsx
<div className="
  bg-gradient-to-br from-teal-50 to-white
  rounded-xl border border-teal-200
  p-6 shadow-sm
">
  <div className="text-sm text-gray-600 mb-1">Clean Leads</div>
  <div className="text-3xl font-bold text-teal-700">1,247</div>
</div>
```

**Privacy Guarantee Card**
```tsx
<div className="
  bg-gradient-to-br from-purple-50 to-white
  rounded-xl border border-purple-200
  p-6 shadow-sm
">
  <div className="flex items-start gap-3">
    <Shield className="w-6 h-6 text-purple-600 flex-shrink-0" />
    <div>
      <h3 className="font-semibold text-gray-900 mb-2">
        Privacy-First Guarantee
      </h3>
      <p className="text-sm text-gray-600">
        We don't track you, profile you, or sell your data. 
        Your leads stay yours. Delete anytime.
      </p>
    </div>
  </div>
</div>
```

---

### Forms

**Input Field**
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Email Address
  </label>
  <input
    type="email"
    className="
      w-full px-4 py-3 rounded-lg
      border border-gray-300
      focus:ring-2 focus:ring-teal-500 focus:border-teal-500
      text-base
      placeholder:text-gray-400
      transition-colors duration-150
    "
    placeholder="you@example.com"
  />
</div>
```

**Industry Selection Dropdown**
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Your Industry
  </label>
  <select className="
    w-full px-4 py-3 rounded-lg
    border border-gray-300
    focus:ring-2 focus:ring-teal-500 focus:border-teal-500
    bg-white text-gray-900
    cursor-pointer
  ">
    <option value="">Select your industry...</option>
    <option value="real-estate-residential">Real Estate - Residential</option>
    <option value="real-estate-commercial">Real Estate - Commercial</option>
    <option value="solar">Solar Sales</option>
    <option value="insurance-life">Insurance - Life</option>
    <option value="insurance-health">Insurance - Health</option>
    <option value="other">Other (please specify)</option>
  </select>
  <p className="text-xs text-gray-500">
    This helps us tailor AI compliance insights to your specific industry. 
    We don't track or profile your usage.
  </p>
</div>
```

**File Upload**
```tsx
<div className="
  border-2 border-dashed border-gray-300
  rounded-lg p-12 text-center
  hover:border-teal-400 hover:bg-teal-50
  transition-colors duration-150
  cursor-pointer
">
  <div className="text-teal-600 mb-2">
    <Upload className="w-12 h-12 mx-auto" />
  </div>
  <p className="text-gray-700 font-medium">
    Drop CSV file here or click to browse
  </p>
  <p className="text-sm text-gray-500 mt-1">
    Max 50MB, up to 100K leads
  </p>
  <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
    <Shield className="w-3 h-3" />
    File processed securely, not stored permanently
  </p>
</div>
```

---

### Privacy Notices

**Inline Privacy Notice**
```tsx
<div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
  <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
  <p className="text-sm text-gray-700">
    <strong className="text-purple-900">Privacy Note:</strong> This analysis was generated 
    in real-time and is not stored. No user profiling or tracking.
  </p>
</div>
```

**Data Deletion Warning**
```tsx
<div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
  <div>
    <h4 className="font-semibold text-red-900 mb-1">⚠️ Permanent Deletion</h4>
    <p className="text-sm text-red-800 mb-2">
      This will permanently delete ALL your data:
    </p>
    <ul className="text-sm text-red-800 space-y-1 ml-4">
      <li>• All {leadCount} leads</li>
      <li>• Upload history</li>
      <li>• Compliance reports</li>
      <li>• Integration settings</li>
    </ul>
    <p className="text-sm text-red-700 mt-2 font-medium">
      This cannot be undone. Export your data first if needed.
    </p>
  </div>
</div>
```

---

### Tables

**Data Table**
```tsx
<div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="w-full">
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
          Name
        </th>
        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
          Phone
        </th>
        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
          Status
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200 bg-white">
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm text-gray-900">John Doe</td>
        <td className="px-6 py-4 text-sm text-gray-600">(801) 555-1234</td>
        <td className="px-6 py-4">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            ✓ Clean
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### Badges/Tags

**Status Badge**
```tsx
// Safe
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
  ✓ Clean
</span>

// Caution
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
  ⚠ Caution
</span>

// Blocked
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
  ✕ Blocked
</span>

// Privacy
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center gap-1">
  <Shield className="w-3 h-3" />
  Privacy-First
</span>
```

---

### Modals

**Standard Modal**
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
    <h2 className="text-xl font-bold text-gray-900 mb-4">
      Confirm Deletion
    </h2>
    <p className="text-gray-600 mb-6">
      Are you sure you want to delete all your data? This cannot be undone.
    </p>
    <div className="flex gap-3 justify-end">
      <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
        Cancel
      </button>
      <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
        Delete
      </button>
    </div>
  </div>
</div>
```

**Privacy Policy Modal**
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Shield className="w-6 h-6 text-purple-600" />
        Privacy Policy
      </h2>
      <button className="text-gray-400 hover:text-gray-600">
        <X className="w-6 h-6" />
      </button>
    </div>
    
    <div className="prose prose-sm max-w-none">
      <h3>What We Track</h3>
      <ul>
        <li>Upload count (abuse prevention only)</li>
        <li>Error logs (no personal data)</li>
        <li>Feature usage clicks (aggregate only)</li>
      </ul>
      
      <h3>What We Don't Track</h3>
      <ul>
        <li>Individual lead outcomes</li>
        <li>User behavior patterns</li>
        <li>Cross-user analytics</li>
        <li>AI analysis results (displayed once, not stored)</li>
      </ul>
      
      <h3>Your Data Rights</h3>
      <ul>
        <li>Export all data anytime</li>
        <li>Delete all data anytime</li>
        <li>60-day grace period after cancellation</li>
      </ul>
    </div>
    
    <div className="mt-6 flex justify-end">
      <button className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
        I Understand
      </button>
    </div>
  </div>
</div>
```

---

### Loading States

**Spinner**
```tsx
<div className="flex items-center justify-center py-12">
  <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
</div>
```

**Skeleton Loader**
```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>
```

**Progress Bar**
```tsx
<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
  <div 
    className="bg-teal-500 h-full transition-all duration-300"
    style={{ width: '65%' }}
  />
</div>
```

---

## PRIVACY-FIRST MESSAGING

### Landing Page Hero

```tsx
<section className="py-20 px-4 bg-gradient-to-b from-teal-50 to-white">
  <div className="max-w-4xl mx-auto text-center">
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-800 text-sm font-medium mb-6">
      <Shield className="w-4 h-4" />
      Privacy-First Compliance
    </div>
    
    <h1 className="text-5xl font-bold text-gray-900 mb-6">
      DNC Scrubbing That Doesn't Track You
    </h1>
    
    <p className="text-xl text-gray-600 mb-8">
      AI-powered compliance for real estate. Unlimited scrubbing, 
      industry-specific insights, and complete data control.
      <br />
      <strong className="text-gray-900">No tracking. No profiling. No data selling.</strong>
    </p>
    
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
      <button className="bg-teal-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-teal-600">
        Start Free Trial
      </button>
      <button className="bg-white text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold border border-gray-300 hover:bg-gray-50">
        See How We're Different
      </button>
    </div>
    
    <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <Check className="w-5 h-5 text-green-500" />
        $47/month unlimited
      </div>
      <div className="flex items-center gap-2">
        <Check className="w-5 h-5 text-green-500" />
        Your data, your control
      </div>
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-500" />
        Privacy guaranteed
      </div>
    </div>
  </div>
</section>
```

### Privacy Features Section

```tsx
<section className="py-20 px-4">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Privacy-First By Design
      </h2>
      <p className="text-lg text-gray-600">
        Most competitors track everything you do and sell your data. We never will.
      </p>
    </div>
    
    <div className="grid md:grid-cols-3 gap-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">No Tracking</h3>
        <p className="text-sm text-gray-600">
          We don't track your behavior, build profiles, or monitor patterns. 
          Real-time analysis only.
        </p>
      </div>
      
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Your Data, Your Control</h3>
        <p className="text-sm text-gray-600">
          Export anytime. Delete anytime. No questions asked. 
          60-day grace period after cancellation.
        </p>
      </div>
      
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Ban className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Never Sold</h3>
        <p className="text-sm text-gray-600">
          Competitors sell your lead data to other agents. 
          We never will. Your leads stay yours.
        </p>
      </div>
    </div>
  </div>
</section>
```

---

## VOICE & TONE

### Voice Characteristics
- **Direct:** Get to the point quickly
- **Honest:** No hiding fees or complexity
- **Privacy-conscious:** Transparent about data practices
- **Empowering:** Users are smart, we help
- **Compliance-focused:** Serious about TCPA, but not scary

### Example Copy

**Good (Privacy-First):**
- "We don't track you. We don't sell your data. We don't build profiles."
- "Your leads stay yours. Delete anytime, no questions asked."
- "Real-time AI analysis. Nothing stored. Enterprise privacy guaranteed."
- "Scrub your leads, stay compliant, own your data."

**Bad:**
- "Revolutionize your lead management with our cutting-edge AI platform!"
- "Our proprietary algorithms leverage machine learning..."
- "Join thousands of agents who trust us!" (implies tracking)
- "We analyze your patterns to improve performance" (privacy violation)

---

## PAGE LAYOUTS

### Landing Page
```tsx
<div className="min-h-screen">
  {/* Privacy Badge in Header */}
  <header className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/logo.svg" alt="Echo Mind Compliance" className="h-8" />
        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
          Privacy-First
        </span>
      </div>
      <nav className="flex items-center gap-6">
        <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
        <a href="#privacy" className="text-gray-600 hover:text-gray-900">Privacy</a>
        <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
        <button className="bg-teal-500 text-white px-4 py-2 rounded-lg">
          Sign Up
        </button>
      </nav>
    </div>
  </header>
  
  {/* Hero with privacy messaging */}
  <section className="py-20 px-4 bg-gradient-to-b from-teal-50 to-white">
    {/* See above */}
  </section>
  
  {/* Privacy features */}
  <section className="py-20 px-4">
    {/* See above */}
  </section>
  
  {/* Core features */}
  <section className="py-20 px-4 bg-gray-50">
    {/* Standard feature grid */}
  </section>
  
  {/* Pricing */}
  <section className="py-20 px-4">
    {/* Pricing cards with privacy guarantees */}
  </section>
  
  {/* Privacy Policy CTA */}
  <section className="py-20 px-4 bg-purple-50">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Read Our Privacy Promise
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        We believe in transparency. Read exactly what we do (and don't do) with your data.
      </p>
      <button className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700">
        View Privacy Policy
      </button>
    </div>
  </section>
</div>
```

### Dashboard (with privacy controls visible)
```tsx
<div className="min-h-screen bg-gray-50">
  {/* Top nav (desktop) */}
  <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <img src="/logo.svg" alt="Echo Mind" className="h-8" />
        <div className="flex gap-6">
          <a href="/dashboard" className="text-teal-600 font-medium">Dashboard</a>
          <a href="/crm" className="text-gray-600 hover:text-gray-900">My CRM</a>
          <a href="/settings" className="text-gray-600 hover:text-gray-900">Settings</a>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700">
          <Shield className="w-4 h-4" />
          Privacy Controls
        </button>
        <div className="w-8 h-8 bg-teal-100 rounded-full" />
      </div>
    </div>
  </nav>
  
  {/* Main content */}
  <main className="max-w-7xl mx-auto px-4 py-8 pb-20 md:pb-8">
    {/* Quick stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Metric cards */}
      {/* Include privacy reminder */}
      <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
        <div className="flex items-center gap-2 text-purple-900 mb-2">
          <Shield className="w-5 h-5" />
          <span className="text-sm font-medium">Privacy Mode</span>
        </div>
        <p className="text-xs text-purple-700">
          Real-time analysis only. No tracking.
        </p>
      </div>
    </div>
    
    {/* Upload section */}
    <div className="bg-white rounded-xl p-6 mb-8">
      {/* Upload interface */}
    </div>
    
    {/* Recent uploads */}
    <div className="bg-white rounded-xl p-6">
      {/* Table or list */}
    </div>
  </main>
  
  {/* Bottom nav (mobile) */}
  <nav className="md:hidden">
    {/* Mobile bottom navigation */}
  </nav>
</div>
```

---

## ACCESSIBILITY

### ARIA Labels
```tsx
<button aria-label="Delete lead">
  <Trash className="w-4 h-4" />
</button>

<button aria-label="View privacy policy">
  <Shield className="w-4 h-4" />
</button>
```

### Keyboard Navigation
- All interactive elements focusable
- Tab order logical
- Enter/Space triggers buttons
- Escape closes modals
- Privacy controls accessible via keyboard

### Color Contrast
- Text on white: Minimum AA (4.5:1)
- Large text: Minimum 3:1
- Interactive elements: Visible focus states
- Privacy notices: High contrast purple

### Screen Readers
```tsx
<div role="status" aria-live="polite">
  {statusMessage}
</div>

<div role="alert" aria-live="assertive">
  Privacy notice: This analysis was not stored
</div>
```

---

## BRAND ASSETS NEEDED

**Logos:**
- `logo-full-color.svg` (Primary with teal)
- `logo-white.svg` (Dark backgrounds)
- `logo-icon.svg` (Favicon, app icon)
- `logo-with-shield.svg` (Privacy variant)
- `favicon.ico` (32×32)
- `apple-touch-icon.png` (180×180)

**Icons:**
- Shield icon for privacy messaging
- Lock icon for data security
- Ban icon for "no tracking"

**Colors in Code:**
```css
/* Tailwind config */
colors: {
  teal: {
    50: '#f0fdfa',
    500: '#14b8a6',
    700: '#0f766e',
  },
  purple: {
    50: '#faf5ff',
    500: '#8b5cf6',
    700: '#6d28d9',
  }
}
```

---

**Document:** UI/UX Guidelines  
**Version:** 1.3 (Privacy-First Edition)  
**For:** Claude Opus 4.5 (Cursor AI)  
**See Also:** CORE_REFERENCE.md, CORE_PRD.md, DATABASE.md, TECH_ARCHITECTURE.md
