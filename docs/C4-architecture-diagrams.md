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
        WebApp["📱 Web Application<br/>(React + TypeScript)<br/>---<br/>• Responsive UI with Tailwind CSS<br/>• Week selector (1-52)<br/>• Real-time calculations<br/>• Dark mode support"]
        
        API["⚙️ API Server<br/>(Express + TypeScript)<br/>---<br/>• RESTful endpoints<br/>• Session management<br/>• Initialization gating<br/>• Background seeding"]
        
        DB[("💾 PostgreSQL Database<br/>(Neon Serverless)<br/>---<br/>• Users & Sessions<br/>• Weekly Schedule (52 weeks)<br/>• Product Inventory<br/>• Application tracking")]
    end
    
    ReplitAuth["🔐 Replit Auth Service<br/>(OIDC Provider)<br/>---<br/>Google SSO authentication"]
    
    NZLA["📚 NZLA Website<br/>---<br/>Content reference only"]
    
    User -->|"HTTPS<br/>(Port 5000)"| WebApp
    WebApp -->|"API Requests<br/>(JSON/REST)"| API
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
- **Web Application**: React-based SPA with Vite, handles all UI and user interactions
- **API Server**: Express backend managing business logic, authentication, and data persistence
- **PostgreSQL Database**: Stores users, weekly schedules, and inventory data
- **Replit Auth**: External OAuth provider for secure Google SSO

---

## Level 3: Component Diagram - API Server

```mermaid
graph TB
    WebApp["📱 Web Application"]
    
    subgraph APIServer["⚙️ API Server (Express)"]
        Routes["🛣️ Route Handlers<br/>---<br/>• /api/schedule/:week<br/>• /api/lawn-size<br/>• /api/inventory<br/>• /api/user"]
        
        AuthMW["🔒 Auth Middleware<br/>---<br/>• Session validation<br/>• Protected routes<br/>• User context"]
        
        InitMW["⏳ Initialization Middleware<br/>---<br/>• Checks isInitialized flag<br/>• Returns 503 if not ready<br/>• Gates schedule endpoints"]
        
        Storage["📦 Storage Interface<br/>---<br/>• IStorage abstraction<br/>• CRUD operations<br/>• Type-safe methods"]
        
        Startup["🚀 Startup Module<br/>---<br/>• Background initialization<br/>• Async seeding orchestration<br/>• Error handling"]
        
        Seeder["🌱 Schedule Seeder<br/>---<br/>• Parses NZLA guide data<br/>• Upsert operations (idempotent)<br/>• All 52 weeks pre-loaded"]
        
        ORM["🗃️ Drizzle ORM<br/>---<br/>• Type-safe queries<br/>• Schema validation<br/>• Migration management"]
    end
    
    DB[("💾 PostgreSQL Database")]
    Auth["🔐 Replit Auth"]
    
    WebApp -->|"HTTP Requests"| Routes
    Routes --> AuthMW
    Routes --> InitMW
    AuthMW --> Storage
    InitMW --> Storage
    Routes --> Storage
    Storage --> ORM
    ORM --> DB
    AuthMW --> Auth
    Startup --> Seeder
    Seeder --> ORM
    
    style Routes fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    style AuthMW fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    style InitMW fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff
    style Storage fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style Startup fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style Seeder fill:#14b8a6,stroke:#0d9488,stroke-width:2px,color:#fff
    style ORM fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    style APIServer fill:#f3f4f6,stroke:#8b5cf6,stroke-width:3px
```

**Description**: Shows the internal components of the API Server:
- **Route Handlers**: Define API endpoints for schedule, lawn size, inventory, and user data
- **Auth Middleware**: Validates sessions and protects authenticated routes
- **Initialization Middleware**: Prevents race conditions by gating schedule requests until seeding completes
- **Storage Interface**: Abstraction layer for all database operations
- **Startup Module**: Orchestrates background initialization after server starts
- **Schedule Seeder**: Pre-loads all 52 weeks of NZLA application data
- **Drizzle ORM**: Type-safe database access layer

---

## Level 3: Component Diagram - Web Application

```mermaid
graph TB
    User[("👤 User")]
    
    subgraph WebApp["📱 Web Application (React)"]
        Pages["📄 Pages<br/>---<br/>• Home (public)<br/>• Dashboard (protected)"]
        
        Components["🧩 Components<br/>---<br/>• Header & Navigation<br/>• Week Selector<br/>• Lawn Size Calculator<br/>• Product Cards<br/>• Inventory Manager"]
        
        Auth["🔐 Auth Hook<br/>---<br/>• useAuth()<br/>• Session state<br/>• Route protection"]
        
        Query["📡 React Query<br/>---<br/>• Data fetching<br/>• Cache management<br/>• Optimistic updates"]
        
        Router["🧭 Wouter Router<br/>---<br/>• Client-side routing<br/>• Protected routes<br/>• Navigation"]
        
        UI["🎨 UI Components<br/>---<br/>• shadcn/ui primitives<br/>• Tailwind styling<br/>• Dark mode support"]
    end
    
    API["⚙️ API Server"]
    
    User --> Pages
    Pages --> Components
    Pages --> Router
    Components --> Auth
    Components --> Query
    Components --> UI
    Query --> API
    Auth --> API
    
    style Pages fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    style Components fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style Auth fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    style Query fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style Router fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff
    style UI fill:#14b8a6,stroke:#0d9488,stroke-width:2px,color:#fff
    style WebApp fill:#f3f4f6,stroke:#3b82f6,stroke-width:3px
```

**Description**: Shows the internal structure of the React Web Application:
- **Pages**: Home (public) and Dashboard (protected) route components
- **Components**: Reusable UI elements for lawn care features
- **Auth Hook**: Manages authentication state and route protection
- **React Query**: Handles server state synchronization and caching
- **Wouter Router**: Lightweight client-side routing
- **UI Components**: shadcn/ui component library with Tailwind CSS

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

## Key Architectural Decisions

### 1. **Tiered Access Model**
- **Public**: Home page with basic calculator (local state)
- **Protected**: Dashboard with persistent storage and inventory

### 2. **Race Condition Prevention**
- Server starts immediately (passes health checks)
- Schedule seeding runs in background
- Middleware gates schedule endpoints with 503 until ready
- Prevents serving empty data during deployment

### 3. **Data Pre-seeding**
- All 52 weeks loaded at startup
- Idempotent upsert operations (safe restarts)
- Database-driven scheduler (not hardcoded)

### 4. **Authentication Strategy**
- Replit Auth (OIDC) for Google SSO
- Server-side sessions in PostgreSQL
- Client-side route guards

### 5. **Frontend Architecture**
- React Query for server state
- Local state for public features
- Optimistic updates for inventory

### 6. **Scalability Considerations**
- Serverless PostgreSQL (Neon)
- Stateless API server
- Client-side caching
- Background initialization
