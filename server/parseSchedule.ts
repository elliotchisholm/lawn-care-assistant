import fs from 'fs';
import path from 'path';

interface Product {
  name: string;
  alternativeName: string | null;
  quantity: number;
  unit: string;
  type: 'liquid' | 'granular' | 'insecticide';
  productNotes: string | null;
}

interface ApplicationDay {
  dayLabel: string | null;
  products: Product[];
  dayNotes: string | null;
}

interface WeekSchedule {
  weekNumber: number;
  month: string;
  weekOfMonth: number;
  isRestWeek: boolean;
  applicationDays: ApplicationDay[];
  generalNotes: string | null;
}

function determineProductType(name: string, unit: string): 'liquid' | 'granular' | 'insecticide' {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('grub')) return 'insecticide';
  if (unit === 'kg' || unit === 'g') return 'granular';
  return 'liquid';
}

function parseProduct(line: string): Product | null {
  // Match patterns like:
  // - NZLA Wetter or Wetter 3W: 250ml
  // - Amino: 200ml
  // - NZLA All Seasons: 2kg
  // - Iron+: 200ml; (with semicolon)
  const productMatch = line.match(/^-\s+(.+?):\s+(\d+)(ml|g|kg|L);?$/);
  
  if (!productMatch) return null;
  
  const fullName = productMatch[1].trim();
  const quantity = parseInt(productMatch[2]);
  const unit = productMatch[3];
  
  // Check for alternative product (e.g., "NZLA Wetter or Wetter 3W")
  const altMatch = fullName.match(/^(.+?)\s+or\s+(.+?)$/);
  
  let name: string;
  let alternativeName: string | null = null;
  
  if (altMatch) {
    name = altMatch[1].trim();
    alternativeName = altMatch[2].trim();
  } else {
    name = fullName;
  }
  
  const type = determineProductType(name, unit);
  
  return {
    name,
    alternativeName,
    quantity,
    unit,
    type,
    productNotes: null
  };
}

export function parseScheduleMarkdown(filePath: string): WeekSchedule[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const weeks: WeekSchedule[] = [];
  
  // Split by week sections (using --- as delimiter)
  const sections = content.split(/\n---\n/);
  
  for (const section of sections) {
    const lines = section.split('\n').map(l => l.trim()).filter(l => l);
    
    // Find week header: ## January - Week 1 (ISO Week 1)
    const weekHeaderMatch = section.match(/##\s+(\w+)\s+-\s+Week\s+(\d+)\s+\(ISO Week\s+(\d+)\)/);
    
    if (!weekHeaderMatch) continue;
    
    const month = weekHeaderMatch[1];
    const weekOfMonth = parseInt(weekHeaderMatch[2]);
    const weekNumber = parseInt(weekHeaderMatch[3]);
    
    // Check if this is a rest week (no content after header)
    const contentLines = lines.slice(1); // Skip header line
    const hasContent = contentLines.some(line => 
      line.startsWith('-') || line.startsWith('**Day') || line.startsWith('**Once')
    );
    
    if (!hasContent) {
      weeks.push({
        weekNumber,
        month,
        weekOfMonth,
        isRestWeek: true,
        applicationDays: [],
        generalNotes: null
      });
      continue;
    }
    
    // Parse multi-day application
    const applicationDays: ApplicationDay[] = [];
    let currentDay: ApplicationDay | null = null;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for day label
      if (line.startsWith('**Day 1:**')) {
        if (currentDay) applicationDays.push(currentDay);
        currentDay = { dayLabel: 'Day 1', products: [], dayNotes: null };
        continue;
      } else if (line.startsWith('**Day 2 (or following days):**')) {
        if (currentDay) applicationDays.push(currentDay);
        currentDay = { dayLabel: 'Day 2 (or following days)', products: [], dayNotes: null };
        continue;
      } else if (line.startsWith('**Once foliage is dry:**')) {
        if (currentDay) applicationDays.push(currentDay);
        currentDay = { dayLabel: 'Once foliage is dry', products: [], dayNotes: null };
        continue;
      }
      
      // Check for product line or note
      if (line.startsWith('-')) {
        if (!currentDay) {
          // No day label, create default day
          currentDay = { dayLabel: null, products: [], dayNotes: null };
        }
        
        const product = parseProduct(line);
        if (product) {
          currentDay.products.push(product);
          
          // Check next line for product-specific notes (indented with spaces)
          if (i + 1 < lines.length && lines[i + 1].startsWith('  ') && lines[i + 1].includes('-')) {
            const noteMatch = lines[i + 1].match(/^\s+-\s+(.+)$/);
            if (noteMatch) {
              product.productNotes = noteMatch[1].trim();
              i++; // Skip next line as we've processed it
            }
          } else if (i + 1 < lines.length && lines[i + 1].startsWith(' -')) {
            // Single space indentation
            const noteMatch = lines[i + 1].match(/^\s-\s+(.+)$/);
            if (noteMatch) {
              product.productNotes = noteMatch[1].trim();
              i++; // Skip next line as we've processed it
            }
          }
        } else if (line.toLowerCase().includes('follow with') || line.toLowerCase().includes('irrigation')) {
          // Day-level irrigation note
          if (currentDay && !currentDay.dayNotes) {
            currentDay.dayNotes = line.replace(/^-\s*/, '');
          }
        }
      }
    }
    
    // Add the last day
    if (currentDay) {
      applicationDays.push(currentDay);
    }
    
    weeks.push({
      weekNumber,
      month,
      weekOfMonth,
      isRestWeek: false,
      applicationDays,
      generalNotes: null
    });
  }
  
  return weeks.sort((a, b) => a.weekNumber - b.weekNumber);
}

// Test parser if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scheduleFile = path.join(process.cwd(), 'attached_assets', 'nzla-application-guide_1760214730776.md');
  const weeks = parseScheduleMarkdown(scheduleFile);
  
  console.log(`Parsed ${weeks.length} weeks`);
  console.log('\nSample - Week 1:');
  console.log(JSON.stringify(weeks[0], null, 2));
  console.log('\nSample - Week 4 (Rest Week):');
  const restWeek = weeks.find(w => w.weekNumber === 4);
  console.log(JSON.stringify(restWeek, null, 2));
  console.log('\nSample - Week 17 (Multi-day):');
  const multiDay = weeks.find(w => w.weekNumber === 17);
  console.log(JSON.stringify(multiDay, null, 2));
}
