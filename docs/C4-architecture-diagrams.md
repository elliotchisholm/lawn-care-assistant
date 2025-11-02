# C4 Architecture Diagrams - Lawn Care Application

## Level 1: System Context Diagram

```mermaid
graph TB
    User[("👤 Lawn Care User<br/>(Person)")]
    LawnApp["🌿 Lawn Care Application<br/>(Software System)<br/>---<br/>Provides weekly NZLA product<br/>recommendations and inventory<br/>tracking for lawn maintenance"]
    NZLA["📚 NZLA Website<br/>(External System)<br/>---<br/>Source of official<br/>application guide data"]
    ReplitAuth["🔐 Replit Auth<br/>(External System)<br/>---<br/>Handles Google SSO<br/>authentication"]
    
    User -->|"Uses to manage lawn care<br/>and track products"| LawnApp
    LawnApp -->|"References application<br/>guide content"| NZLA
    LawnApp -->|"Authenticates users via<br/>Google SSO (OIDC)"| ReplitAuth
    
    style LawnApp fill:#10b981,stroke:#059669,stroke-width:3px,color:#fff
    style User fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    style NZLA fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff
    style ReplitAuth fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff
```

**Description**: Shows the Lawn Care Application in context with its users and external dependencies. Users interact with the system to get personalized lawn care recommendations based on the official NZLA guide, with optional authentication for advanced features.

---

## Level 2: Container Diagram

```mermaid
graph TB
    User[("👤 Lawn Care User")]
    
    subgraph LawnCareSystem["🌿 Lawn Care Application"]
        WebApp["📱 Web Application<br/>(React + TypeScript)<br/>---<br/>• Single-page app (SPA)<br/>• Week selector (1-52)<br/>• Real-time calculations<br/>• Dark mode support<br/>• Custom React Query pattern"]
        
        API["⚙️ API Server<br/>(Express + TypeScript)<br/>---<br/>• RESTful endpoints<br/>• Session management<br/>• Product name normalization<br/>• Background seeding<br/>• Unit conversion support"]
        
        DB[("💾 PostgreSQL Database<br/>(Neon Serverless)<br/>---<br/>• Users & Sessions<br/>• Weekly Schedule (52 weeks)<br/>• Product Inventory<br/>• Applied Weeks (with undo)")]
    end
    
    ReplitAuth["🔐 Replit Auth Service<br/>(OIDC Provider)<br/>---<br/>Google SSO authentication"]
    
    NZLA["📚 NZLA Website<br/>---<br/>Content reference only"]
    
    User -->|"HTTPS<br/>(Port 5000)"| WebApp
    WebApp -->|"API Requests<br/>(JSON/REST)<br/>Custom queryFn"| API
    API -->|"SQL Queries<br/>(Drizzle ORM)"| DB
    API -->|"OAuth 2.0<br/>OIDC Flow"| ReplitAuth
    WebApp -.->|"Attribution link<br/>(reference only)"| NZLA
    
    style WebApp fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    style API fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    style DB fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style ReplitAuth fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff
    style NZLA fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff
    style LawnCareSystem fill:#ecfdf5,stroke:#10b981,stroke-width:3px
```

**Description**: Shows the high-level technical containers that make up the application:
- **Web Application**: React-based SPA with Vite, handles all UI and user interactions with custom React Query pattern for user-scoped caching
- **API Server**: Express backend managing business logic, authentication, data persistence, and product name normalization
- **PostgreSQL Database**: Stores users, weekly schedules, inventory data, and applied weeks with undo support
- **Replit Auth**: External OAuth provider for secure Google SSO

---

## Level 3: Component Diagram - API Server

```mermaid
graph TB
    WebApp["📱 Web Application"]
    
    subgraph APIServer["⚙️ API Server (Express)"]
        Routes["🛣️ Route Handlers<br/>---<br/>• /api/schedule/:week<br/>• /api/lawn-size<br/>• /api/inventory<br/>• /api/applied-weeks/:week<br/>• /api/user"]
        
        AuthMW["🔒 Auth Middleware<br/>---<br/>• Session validation<br/>• Protected routes<br/>• User context"]
        
        InitMW["⏳ Initialization Middleware<br/>---<br/>• Checks isInitialized flag<br/>• Returns 503 if not ready<br/>• Gates schedule endpoints"]
        
        ProductNorm["🏷️ Product Name Normalizer<br/>---<br/>• Canonical name mapping<br/>• Case-insensitive matching<br/>• NZLA prefix handling"]
        
        Storage["📦 Storage Interface<br/>---<br/>• IStorage abstraction<br/>• CRUD operations<br/>• Type-safe methods<br/>• Unit conversion support"]
        
        Startup["🚀 Startup Module<br/>---<br/>• Background initialization<br/>• Async seeding orchestration<br/>• Error handling"]
        
        Seeder["🌱 Schedule Seeder<br/>---<br/>• Parses NZLA guide data<br/>• Upsert operations (idempotent)<br/>• All 52 weeks pre-loaded<br/>• Per-product type support"]
        
        ORM["🗃️ Drizzle ORM<br/>---<br/>• Type-safe queries<br/>• Schema validation<br/>• Migration management"]
    end
    
    DB[("💾 PostgreSQL Database")]
    Auth["🔐 Replit Auth"]
    
    WebApp -->|"HTTP Requests"| Routes
    Routes --> AuthMW
    Routes --> InitMW
    Routes --> ProductNorm
    AuthMW --> Storage
    InitMW --> Storage
    ProductNorm --> Storage
    Routes --> Storage
    Storage --> ORM
    ORM --> DB
    AuthMW --> Auth
    Startup --> Seeder
    Seeder --> ORM
    
    style Routes fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    style AuthMW fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    style InitMW fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff
    style ProductNorm fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff
    style Storage fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style Startup fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style Seeder fill:#14b8a6,stroke:#0d9488,stroke-width:2px,color:#fff
    style ORM fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    style APIServer fill:#f3f4f6,stroke:#8b5cf6,stroke-width:3px
```

**Description**: Shows the internal components of the API Server:
- **Route Handlers**: Define API endpoints for schedule, lawn size, inventory, applied weeks, and user data
- **Auth Middleware**: Validates sessions and protects authenticated routes
- **Initialization Middleware**: Prevents race conditions by gating schedule requests until seeding completes
- **Product Name Normalizer**: Ensures consistent product naming across all operations
- **Storage Interface**: Abstraction layer for all database operations with unit conversion support
- **Startup Module**: Orchestrates background initialization after server starts
- **Schedule Seeder**: Pre-loads all 52 weeks of NZLA application data with per-product types
- **Drizzle ORM**: Type-safe database access layer

---

## Level 3: Component Diagram - Web Application

```mermaid
graph TB
    User[("👤 User")]
    
    subgraph WebApp["📱 Web Application (React)"]
        Pages["📄 Single-Page App<br/>---<br/>• Conditional rendering<br/>• Public & protected features<br/>• Unified experience"]
        
        Components["🧩 Components<br/>---<br/>• Header & Theme Toggle<br/>• Week Selector (1-52)<br/>• Lawn Size Calculator<br/>• Product Cards<br/>• Inventory Manager<br/>• Purchase Recommendations<br/>• Mark as Applied Dialog"]
        
        Auth["🔐 Auth Hook<br/>---<br/>• useAuth()<br/>• Session state<br/>• Feature unlocking"]
        
        Query["📡 React Query<br/>---<br/>• Custom queryFn pattern<br/>• User-scoped caching<br/>• Cache invalidation<br/>• Optimistic updates"]
        
        UnitConv["🔢 Unit Conversions<br/>---<br/>• kg ↔ g<br/>• L ↔ ml<br/>• Display formatting"]
        
        UI["🎨 UI Components<br/>---<br/>• shadcn/ui primitives<br/>• Tailwind styling<br/>• Dark mode support<br/>• Loading states"]
    end
    
    API["⚙️ API Server"]
    
    User --> Pages
    Pages --> Components
    Components --> Auth
    Components --> Query
    Components --> UnitConv
    Components --> UI
    Query --> API
    Auth --> API
    
    style Pages fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    style Components fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style Auth fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    style Query fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style UnitConv fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff
    style UI fill:#14b8a6,stroke:#0d9488,stroke-width:2px,color:#fff
    style WebApp fill:#f3f4f6,stroke:#3b82f6,stroke-width:3px
```

**Description**: Shows the internal structure of the React Web Application:
- **Single-Page App**: Unified page with conditional rendering for public/protected features
- **Components**: Comprehensive lawn care feature components including inventory and application tracking
- **Auth Hook**: Manages authentication state and feature unlocking
- **React Query**: Custom queryFn pattern for user-scoped caching and cache invalidation
- **Unit Conversions**: Bidirectional conversions between metric units
- **UI Components**: shadcn/ui component library with Tailwind CSS and dark mode

---

## Data Flow Diagram - Weekly Schedule Retrieval

```mermaid
sequenceDiagram
    actor User
    participant WebApp as Web Application
    participant API as API Server
    participant InitMW as Init Middleware
    participant DB as PostgreSQL
    
    Note over API,DB: Server Startup (t=0s)
    API->>API: Start listening on port 5000 ✅
    API->>API: Initialize in background
    API->>DB: Seed weekly schedule (52 weeks)
    DB-->>API: Seeding complete
    API->>API: Set isInitialized = true
    
    Note over User,DB: User Requests Week (t=6s+)
    User->>WebApp: Select Week 41
    WebApp->>API: GET /api/schedule/41
    API->>InitMW: Check initialization
    InitMW->>InitMW: isInitialized? ✅
    InitMW->>DB: Query week 41
    DB-->>InitMW: Return schedule data
    InitMW-->>API: Week 41 data
    API-->>WebApp: JSON response
    WebApp->>WebApp: Calculate quantities (lawn size)
    WebApp-->>User: Display products & amounts
    
    Note over User,DB: Early Request (t=2s, during init)
    User->>WebApp: Select Week 20
    WebApp->>API: GET /api/schedule/20
    API->>InitMW: Check initialization
    InitMW->>InitMW: isInitialized? ❌
    InitMW-->>API: 503 Service Unavailable
    API-->>WebApp: Error response
    WebApp-->>User: "Failed to load..." (temporary)
```

**Description**: Shows the complete flow of retrieving weekly schedule data, including the deployment race condition prevention with initialization gating.

---

## Data Flow Diagram - Mark as Applied with Inventory Adjustment

```mermaid
sequenceDiagram
    actor User
    participant WebApp as Web Application
    participant ProductCard as Product Card
    participant Dialog as Mark as Applied Dialog
    participant Query as React Query
    participant API as API Server
    participant DB as PostgreSQL
    
    Note over User,DB: User Marks Week 42 as Applied
    User->>ProductCard: Click "Mark Week 42 as Applied"
    ProductCard->>Query: Check inventory (custom queryFn)
    Query->>API: GET /api/inventory
    API->>DB: Query user inventory
    DB-->>API: Return inventory items
    API-->>Query: Inventory data
    Query-->>ProductCard: Cached inventory
    ProductCard->>Dialog: Open with inventory preview
    Dialog-->>User: Show before/after amounts
    
    Note over User,Dialog: User Confirms Application
    User->>Dialog: Click "Mark as Applied"
    Dialog->>Query: Mutation: Mark as applied
    Query->>API: POST /api/applied-weeks/42
    API->>API: Normalize product names
    API->>DB: Begin transaction
    API->>DB: Insert applied_weeks record
    API->>DB: Adjust inventory (-2kg, -200ml, -50ml)
    API->>DB: Store original amounts for undo
    DB-->>API: Transaction complete
    API-->>Query: Success response
    Query->>Query: Invalidate inventory cache
    Query->>Query: Invalidate applied-weeks cache
    Query-->>Dialog: Mutation success
    Dialog-->>ProductCard: Close dialog
    ProductCard->>ProductCard: Show "Week 42 Applied" badge
    ProductCard->>ProductCard: Show undo button
    ProductCard-->>User: Updated UI (2kg, 300ml, 50ml)
    
    Note over User,DB: User Undoes Application
    User->>ProductCard: Click undo button
    ProductCard->>Query: Mutation: Undo application
    Query->>API: DELETE /api/applied-weeks/42
    API->>DB: Begin transaction
    API->>DB: Delete applied_weeks record
    API->>DB: Restore original inventory (4kg, 500ml, 100ml)
    DB-->>API: Transaction complete
    API-->>Query: Success response
    Query->>Query: Invalidate caches
    Query-->>ProductCard: Mutation success
    ProductCard->>ProductCard: Hide badge, show button
    ProductCard-->>User: Restored UI (4kg, 500ml, 100ml)
```

**Description**: Shows the complete flow of marking a week as applied, including inventory adjustment with undo support. Highlights the custom queryFn pattern, cache invalidation, and transactional database operations.

---

## Data Flow Diagram - React Query Custom QueryFn Pattern

```mermaid
sequenceDiagram
    participant Component as ProductCard/InventoryManager
    participant Query as React Query
    participant DefaultFn as Default QueryFn
    participant CustomFn as Custom QueryFn
    participant API as API Server
    
    Note over Component,API: ❌ Problem: Default QueryFn (WRONG)
    Component->>Query: useQuery({ queryKey: ["/api/inventory", userId] })
    Query->>DefaultFn: Join array elements with "/"
    DefaultFn->>DefaultFn: URL = "/api/inventory/abc123"
    DefaultFn->>API: GET /api/inventory/abc123
    API-->>DefaultFn: 404 Not Found ❌
    
    Note over Component,API: ✅ Solution: Custom QueryFn (CORRECT)
    Component->>Query: useQuery({<br/>  queryKey: ["/api/inventory", userId],<br/>  queryFn: async () => fetch("/api/inventory")
    Query->>CustomFn: Call custom queryFn
    CustomFn->>CustomFn: URL = "/api/inventory" (hardcoded)
    CustomFn->>API: GET /api/inventory (with credentials)
    API->>API: Extract userId from session
    API-->>CustomFn: 200 OK with user inventory ✅
    CustomFn-->>Query: Return data
    Query->>Query: Cache with key ["/api/inventory", userId]
    Query-->>Component: Cached data (user-scoped)
```

**Description**: Illustrates the critical React Query custom queryFn pattern that fixes URL construction issues while maintaining user-scoped cache keys for security and proper cache invalidation.

---

## Key Architectural Decisions

### 1. **Single-Page Application with Conditional Rendering**
- All features on one page (/)
- Public features: Week selector, lawn size calculator (local state), product recommendations
- Protected features: Inventory management, purchase recommendations, mark as applied
- Features unlock seamlessly after authentication
- No page navigation required

### 2. **Custom React Query Pattern for User-Scoped Caching**
- **Problem**: Default queryFn joins ALL cache key array elements with "/" to build URLs
- **Impact**: `["/api/inventory", userId]` → `/api/inventory/123` (404 error)
- **Solution**: Custom queryFn explicitly constructs correct URL while keeping userId in cache key
- **Applied in**: ProductCard (inventory + applied-weeks), InventoryManager, PurchaseRecommendations
- **Security**: User ID in cache key prevents cross-user data leakage
- **Pattern**: `queryFn: async () => fetch("/api/endpoint", { credentials: "include" })`

### 3. **Product Name Normalization**
- Canonical product names defined in `shared/canonicalProductNames.ts`
- Normalization handles: case-insensitivity, "NZLA" prefix variations, "Plus" vs "+"
- Applied across: inventory operations, weekly applications, purchase recommendations
- Database migration script ensures historical data consistency
- One inventory entry per product per user (database constraint)

### 4. **Mark as Applied with Undo Support**
- Transactional inventory adjustments (kg↔g, L↔ml conversions)
- Stores original inventory amounts for accurate undo restoration
- "Store zero" design: insufficient inventory sets to 0 (not negative)
- Conditional rendering: button replaced by badge when applied
- Cache invalidation ensures immediate UI updates across all components

### 5. **Race Condition Prevention**
- Server starts immediately (passes health checks)
- Schedule seeding runs in background
- Middleware gates schedule endpoints with 503 until ready
- Prevents serving empty data during deployment
- Idempotent upsert operations (safe restarts)

### 6. **Authentication Strategy**
- Replit Auth (OIDC) for Google SSO
- Server-side sessions in PostgreSQL
- Session-based user identification (not client-provided IDs)
- Client-side feature unlocking (no route redirects)
- All protected routes validate session server-side

### 7. **Unit Conversion System**
- Bidirectional conversions: kg↔g, L↔ml
- Display formatting for user-friendly units
- Backend stores user's original units
- Consistent conversion logic shared across frontend/backend
- Preserves precision during undo operations

### 8. **Cache Security and Invalidation**
- All user-scoped queries include user ID in cache key
- Prevents cross-user data leakage
- Invalidation after mutations: inventory, applied weeks
- Optimistic updates for responsive UX
- Custom queryFn maintains security while fixing URL construction

### 9. **Database Schema Design**
- Weekly Schedule: 52 weeks pre-seeded with per-product types
- Inventory: Unique constraint per user per product
- Applied Weeks: Stores week number, user ID, and adjustment details for undo
- Canonical product names ensure referential integrity
- PostgreSQL constraints prevent duplicate applications

### 10. **Scalability Considerations**
- Serverless PostgreSQL (Neon)
- Stateless API server (session store in DB)
- Client-side caching with React Query
- Background initialization doesn't block startup
- User-scoped data isolation for horizontal scaling
