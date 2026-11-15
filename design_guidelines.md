# Lawn Care Web App Design Guidelines

## Design Approach
**Utility-Focused Design System Approach** - This application prioritizes functionality and usability for lawn care enthusiasts who need quick, accurate product recommendations. Using a clean, professional interface similar to agricultural/gardening tools like **The Lawn Institute** or **Scotts lawn care calculators**.

## Core Design Elements

### Color Palette
**Primary Colors:**
- Primary Green: 120 40% 25% (deep forest green for trust and nature)
- Secondary Green: 95 35% 45% (fresh grass green for vitality)
- Background: 0 0% 98% (light mode), 220 15% 12% (dark mode)
- Text: 220 20% 15% (light mode), 0 0% 95% (dark mode)

**Accent Colors:**
- Success Green: 140 60% 40% (for completed applications)
- Warning Orange: 25 85% 55% (for timing alerts)
- Neutral Gray: 210 15% 60% (for secondary information)

### Typography
- **Primary Font:** Inter (via Google Fonts CDN)
- **Headings:** Font weights 600-700, sizes from text-lg to text-3xl
- **Body Text:** Font weight 400, text-sm to text-base
- **Data/Numbers:** Font weight 500 for emphasis on measurements and quantities

### Layout System
**Spacing Units:** Consistent use of Tailwind units 2, 4, 6, and 8
- Small elements: p-2, m-2
- Standard components: p-4, gap-4
- Section spacing: py-6, mb-8
- Page margins: px-3 to px-4 (mobile), container width on desktop
- Touch targets: 44px minimum, 48 to 56px for primary actions
- Dark mode: primary and destructive are lighter in dark mode to keep text contrast at 4.5:1 or better

### Component Library

**Core Components:**
- **Input Cards:** Clean bordered containers with rounded-lg corners
- **Product Recommendation Cards:** Display product names, quantities, and application instructions
- **Date Display:** Prominent current week indicator with subtle background highlighting
- **Calculator Interface:** Large, touch-friendly input fields for lawn size
- **Application Timeline:** Visual week-by-week schedule with progress indicators

**Navigation:**
- App shell with a top bar (title, NZLA guide link, theme toggle, sign in or out)
- Four screens: This week (`/`), Schedule (`/schedule`), Stock (`/stock`), Buy (`/buy`); login is `/login`
- Bottom tab bar below 1024px (64px targets, safe-area padding, `aria-current`), left sidebar at 1024px and up
- Stock and Buy show a lock when signed out and a locked screen with a sign-in button
- The Buy tab shows a count of items to buy
- Selected week is carried in the URL (`/?week=N`)

**Overlays on mobile:**
- All dialogs and forms render through `ResponsiveSheet`: bottom drawer below 768px, centred dialog above
- Destructive confirmations use an alert dialog; apply and undo confirmations are sheets with a sticky confirm button
- Marking a week applied shows a 6 second toast with Undo

**Forms:**
- Large, accessible input fields with clear labels
- Unit indicators (m²) integrated into input styling
- Immediate validation feedback for lawn size entries

**Data Displays:**
- Product cards with clear product names and quantities
- Tank mixing instructions in easily scannable format
- Application timing warnings prominently displayed
- Irrigation requirements clearly highlighted

**Overlays:**
- Modal dialogs for detailed product information
- Toast notifications for calculation updates
- Loading states for date-based calculations

### Visual Hierarchy
- **Primary Focus:** Current week's recommendations prominently displayed
- **Secondary:** Lawn size calculator and quantity adjustments
- **Tertiary:** Application instructions and timing guidelines
- **Minimal Animations:** Subtle fade-ins for content updates, gentle highlight effects for active elements

### Professional Lawn Care Aesthetic
- Clean, scientific appearance suitable for serious lawn enthusiasts
- Emphasis on data accuracy and professional application rates
- Subtle use of lawn/grass imagery without overwhelming the functional interface
- Trust-building through clear, precise measurement displays and professional product presentations

The design prioritizes quick access to current recommendations while maintaining the detailed, technical information that serious lawn care practitioners require.