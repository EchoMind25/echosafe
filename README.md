# Echo Safe Compliance

**Intelligent DNC Lead Scrubbing Platform**

Built with portable architecture for future mobile app conversion.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17.0+
- npm 9.0.0+
- Supabase account
- Stripe account
- N8N instance

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in .env.local with your actual values

# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Visit http://localhost:3000

---

## 📁 Project Structure

```
echo-mind-compliance/
├── prisma/              # Database schema & migrations
├── public/              # Static assets (images, icons, manifest)
├── src/
│   ├── app/            # Next.js 14 App Router (web-specific)
│   ├── core/           # Portable logic (reusable in mobile app)
│   │   ├── services/   # Business logic
│   │   ├── hooks/      # React hooks
│   │   ├── utils/      # Pure functions
│   │   └── validation/ # Zod schemas
│   ├── components/     # React components (mostly portable)
│   ├── lib/            # Utilities & configurations
│   └── types/          # TypeScript definitions
└── docs/               # Documentation (PRD, Build Guide, API Reference)
```

**Portable Architecture:**
- `src/core/` - 100% reusable in mobile apps
- `src/components/` - 80% reusable with minor adjustments
- `src/app/` - Web-specific (Next.js routes)

---

## 🎨 Design System

**Brand Colors (Echo Safe Teal):**
- Primary: `#14b8a6` (Teal)
- Success: `#10b981` (Green - clean leads)
- Warning: `#f59e0b` (Amber - caution leads)
- Danger: `#ef4444` (Red - blocked leads)

**Typography:**
- Font: Inter (system fallback)
- Scale: 12px - 48px (mobile-first)
- Weights: 400, 500, 600, 700

**Touch Targets:**
- Minimum: 48px × 48px
- Spacing: 8px between targets

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3
- **Components:** shadcn/ui
- **State:** Zustand
- **Forms:** React Hook Form + Zod

### Backend
- **Runtime:** Next.js API routes
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **File Storage:** Supabase Storage

### Scrubbing Engine
- **Orchestration:** N8N
- **AI:** Claude API (Anthropic)
- **Phone Validation:** libphonenumber-js

### PWA
- **Service Worker:** next-pwa
- **Offline Support:** Cache-first static, Network-first API
- **Installable:** iOS, Android, Desktop

---

## 📱 Mobile-First Design

**Breakpoints:**
- Mobile: 375px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Mobile Optimizations:**
- Bottom navigation (fixed)
- Swipe actions (delete, edit)
- Pull-to-refresh
- Bottom sheets (modals)
- Touch-optimized forms

---

## 🔒 Security

**Authentication:**
- Supabase Auth (JWT)
- Protected routes (middleware)
- Session management

**Data Protection:**
- Encrypted credentials
- HTTPS only
- CORS configured
- XSS protection
- SQL injection prevention (Prisma)

**Payment Security:**
- Stripe handles card data
- PCI compliant
- Webhook verification

---

## 🧪 Testing

```bash
# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

**Manual Testing:**
- Authentication flow
- File upload & scrubbing
- CRM lead management
- CRM integrations
- Payment flow
- Mobile responsiveness

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

**Required Environment Variables:**
- Set all variables from `.env.example` in Vercel dashboard
- Configure Supabase RLS policies
- Set up Stripe webhooks
- Point domain DNS to Vercel

---

## 📚 Documentation

- **[PRD](/docs/PRD.md)** - Complete product specification
- **[Build Guide](/docs/BUILD_GUIDE.md)** - Step-by-step Cursor instructions
- **[API Reference](/docs/API_REFERENCE.md)** - API documentation (to be created)

---

## 🎯 Roadmap

### Week 1: Foundation ✓
- Project setup
- Authentication
- Layout & navigation

### Week 2: Core Features
- File upload & scrubbing
- Built-in CRM
- Upload history

### Week 3: Integrations & Polish
- CRM integrations (Follow Up Boss, Lofty, Kvcore)
- PWA configuration
- Mobile optimizations

### Phase 2 (Month 2+)
- Team accounts
- Advanced analytics
- API access
- Dark mode

---

## 🤝 Contributing

This is a proprietary project for Echo Safe Systems.

**Development Workflow:**
1. Create feature branch: `git checkout -b feature/name`
2. Make changes
3. Test thoroughly
4. Push to GitHub: `git push origin feature/name`
5. Create pull request
6. Code review
7. Merge to main

---

## 📞 Contact

- **Support:** support@tryechomind.net
- **Business Inquiries:** braxton@tryechomind.net
- **Security:** keaton@tryechomind.net
- **Website:** https://tryechomind.net

---

## 📄 License

Proprietary - Echo Safe Systems  
Copyright © 2026 Braxton, Echo Safe Automation

---

**Built with ❤️ by Echo Safe Systems**
