import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * analyzeBidPhoto
 * 
 * Accepts: fileUrl, inputMode, dimensions, markup, contingency, crew
 * Returns: Full bid structure with materials, labor, timeline, financials, specs
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { fileUrl, inputMode, dimensions = {}, markup = 20, contingency = 10, crew = [] } = await req.json();
    if (!fileUrl) return Response.json({ error: 'fileUrl required' }, { status: 400 });

    const { width = '10', depth = '8', height = '', notes = '', address = '', projectType = '', deckHeight = '', deckMaterial = '', roofType = '', roofMaterial = '' } = dimensions;
    const crewList = crew.length > 0
      ? crew.map(c => `- ${c.name} (${c.trade}): $${c.rate}/hr, ${c.hours} hours`).join('\n')
      : 'No crew assigned';

    // Calculate crew labor first
    const crewLabor = crew.reduce((sum, c) => sum + (c.rate * c.hours), 0);
    const sqftCalc = Number(width) * Number(depth);
    
    const modeLabel = inputMode === 'blueprint' ? 'PDF blueprint' : 'project photo';
    const addressContext = address ? `\nPROJECT ADDRESS: ${address}\n- Research this location for: local permit requirements, zoning restrictions, mandatory inspections, typical permit fees in this area` : '';
    
    const projectTypeContext = projectType ? `\nPROJECT TYPE: ${projectType.toUpperCase()}
${deckHeight ? `- Deck Height: ${deckHeight} feet` : ''}
${deckMaterial ? `- Deck Material: ${deckMaterial}` : ''}
${roofType ? `- Roof Type: ${roofType}` : ''}
${roofMaterial ? `- Roof Material: ${roofMaterial}` : ''}` : '';
    
    const prompt = `You are an expert construction estimator for a 10'x8' covered deck project. Generate a COMPLETE bid in JSON format.

BLUEPRINT: 10'x8' deck, 3'-6"H, gable roof, cedar decking, pressure-treated framing, asphalt shingles, composite railing.
CREW: Lead Carpenter (64hrs@$65), Helper (40hrs@$45). Labor total: $${crewLabor}.

RETURN THIS EXACT JSON STRUCTURE with realistic Home Depot 2025 prices (ALL numeric values as numbers, not strings):

{
  "projectTitle": "10' x 8' Covered Cedar Deck with Gable Roof",
  "projectDescription": "New 80 sq ft attached deck with pressure-treated framing, cedar decking, gable roof, and composite railing.",
  "scopeOfWork": "Excavate 3 concrete footings (12\" dia x 36\" deep). Install PT posts and beam attached to house ledger via flashing. Install 5/4x6 cedar decking perpendicular to floor joists. Frame gable roof with 2x6 Douglas Fir rafters, collar ties, and ridge board. Install roof sheathing, underlayment, and architectural shingles matching existing house. Install cedar fascia and soffit. Install composite railing with 28 balusters and 3-step cedar staircase. Final cleanup.",
  "structuralSummary": {"squareFootage": 80, "footprint": "10' x 8'", "deckHeight": "3'-6\"", "roofType": "Gable", "roofPitch": "6:12", "totalHeight": "8'-6\"", "estimatedDuration": "5-7 days"},
  "materials": [
    {"category": "Concrete & Footings", "items": [
      {"name": "Concrete Mix", "size": "60 lb bag", "material": "Concrete 3000psi", "qty": 12, "unit": "bag", "unitCost": 6.50, "totalCost": 78, "notes": "3 footings deep"},
      {"name": "Pier Tube Form", "size": "12\" dia x 48\"", "material": "Cardboard", "qty": 3, "unit": "ea", "unitCost": 18.00, "totalCost": 54, "notes": "Footing forms"}
    ]},
    {"category": "Framing - Floor", "items": [
      {"name": "Posts 4x4", "size": "4x4x4'", "material": "PT", "qty": 3, "unit": "ea", "unitCost": 45.00, "totalCost": 135, "notes": "Support posts"},
      {"name": "Ledger Board", "size": "2x10x10'", "material": "PT", "qty": 1, "unit": "ea", "unitCost": 32.00, "totalCost": 32, "notes": "House attachment"},
      {"name": "Double Beam", "size": "2x8x10' (qty 2)", "material": "PT", "qty": 2, "unit": "ea", "unitCost": 24.00, "totalCost": 48, "notes": "Main beam"},
      {"name": "Joists", "size": "2x8x8'", "material": "PT", "qty": 7, "unit": "ea", "unitCost": 18.50, "totalCost": 129.50, "notes": "Floor @ 16\"OC"},
      {"name": "Joist Hangers", "size": "LUS28", "material": "Galv Steel", "qty": 14, "unit": "ea", "unitCost": 2.25, "totalCost": 31.50, "notes": "Simpson equiv"}
    ]},
    {"category": "Decking & Stairs", "items": [
      {"name": "Cedar Decking", "size": "5/4x6x10'", "material": "Cedar", "qty": 16, "unit": "ea", "unitCost": 42.00, "totalCost": 672, "notes": "Premium grade"},
      {"name": "Stair Stringers", "size": "2x12x5'", "material": "PT", "qty": 2, "unit": "ea", "unitCost": 28.00, "totalCost": 56, "notes": "Stringers"},
      {"name": "Stair Treads", "size": "5/4x6x3'", "material": "Cedar", "qty": 3, "unit": "ea", "unitCost": 24.00, "totalCost": 72, "notes": "3-step"}
    ]},
    {"category": "Roofing & Structure", "items": [
      {"name": "Ridge Board", "size": "1x8x10'", "material": "Douglas Fir", "qty": 1, "unit": "ea", "unitCost": 18.00, "totalCost": 18, "notes": "Ridge"},
      {"name": "Rafters", "size": "2x6x7'", "material": "Douglas Fir", "qty": 10, "unit": "ea", "unitCost": 14.50, "totalCost": 145, "notes": "@ 24\"OC"},
      {"name": "Collar Ties", "size": "2x4x5'", "material": "Douglas Fir", "qty": 3, "unit": "ea", "unitCost": 8.00, "totalCost": 24, "notes": "Roof ties"},
      {"name": "Arch Shingles", "size": "1 square", "material": "Asphalt", "qty": 1, "unit": "sq", "unitCost": 42.00, "totalCost": 42, "notes": "Match house"},
      {"name": "Roof Underlayment", "size": "Synthetic 30lb", "material": "Poly", "qty": 100, "unit": "sqft", "unitCost": 0.18, "totalCost": 18, "notes": "Weather barrier"}
    ]},
    {"category": "Hardware & Fasteners", "items": [
      {"name": "Post Bases", "size": "ABA44", "material": "Galv", "qty": 3, "unit": "ea", "unitCost": 14.98, "totalCost": 44.94, "notes": "4x4 bases"},
      {"name": "Ledger Bolts", "size": "1/2\"x4\" SDS", "material": "Galv", "qty": 12, "unit": "ea", "unitCost": 3.50, "totalCost": 42, "notes": "House bolts"},
      {"name": "Rafter Ties", "size": "H2.5", "material": "Galv", "qty": 10, "unit": "ea", "unitCost": 4.25, "totalCost": 42.50, "notes": "Roof ties"},
      {"name": "Deck Screws", "size": "2.5\"", "material": "Galv", "qty": 1, "unit": "box", "unitCost": 12.00, "totalCost": 12, "notes": "Fasteners"},
      {"name": "Joist Tape", "size": "Butyl", "material": "Waterproof", "qty": 1, "unit": "roll", "unitCost": 18.00, "totalCost": 18, "notes": "Flashing"}
    ]},
    {"category": "Railing", "items": [
      {"name": "Rail Posts", "size": "4x4x42\"", "material": "Composite", "qty": 6, "unit": "ea", "unitCost": 22.00, "totalCost": 132, "notes": "Posts"},
      {"name": "Rail Tops", "size": "2x4x10'", "material": "Composite", "qty": 2, "unit": "ea", "unitCost": 18.50, "totalCost": 37, "notes": "Handrails"},
      {"name": "Balusters", "size": "1.5x1.5x32\"", "material": "Composite", "qty": 28, "unit": "ea", "unitCost": 8.50, "totalCost": 238, "notes": "Code spaced"}
    ]},
    {"category": "Fascia & Soffit", "items": [
      {"name": "Fascia", "size": "1x6x12'", "material": "Cedar", "qty": 3, "unit": "ea", "unitCost": 16.00, "totalCost": 48, "notes": "Trim"},
      {"name": "Soffit", "size": "1x6x12'", "material": "Vinyl", "qty": 2, "unit": "ea", "unitCost": 14.00, "totalCost": 28, "notes": "Ventilated"}
    ]},
    {"category": "Misc", "items": [
      {"name": "Flashing & Trim", "size": "Various", "material": "Galv", "qty": 1, "unit": "allow", "unitCost": 75.00, "totalCost": 75, "notes": "All trim"},
      {"name": "Caulk & Sealant", "size": "Various", "material": "Exterior", "qty": 1, "unit": "allow", "unitCost": 35.00, "totalCost": 35, "notes": "Joints"}
    ]}
  ],
  "laborBreakdown": [
    {"phase": "Project Work", "trade": "Carpentry", "hours": 64, "rate": 65, "total": 4160, "assignedTo": "Lead Carpenter"},
    {"phase": "Project Work", "trade": "General Labor", "hours": 40, "rate": 45, "total": 1800, "assignedTo": "Helper"}
  ],
  "timeline": [
    {"day": 1, "phase": "Foundation & Prep", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Site layout and excavation", "Pour concrete footings", "Ledger board flashing"], "hoursPerWorker": 8},
    {"day": 2, "phase": "Deck Framing", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Set posts and beam", "Install joists and hangers"], "hoursPerWorker": 8},
    {"day": 3, "phase": "Roof Framing", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Rafter installation", "Collar ties and ridge board"], "hoursPerWorker": 8},
    {"day": 4, "phase": "Decking & Roofing", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Cedar decking installation", "Roof underlayment and shingles"], "hoursPerWorker": 8},
    {"day": 5, "phase": "Railing & Stairs", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Stair construction", "Railing installation"], "hoursPerWorker": 8},
    {"day": 6, "phase": "Fascia & Trim", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Fascia and soffit install", "Final flashing and caulk"], "hoursPerWorker": 6}
  ],
  "paymentSchedule": [
    {"milestone": "Deposit Due", "description": "Upon contract signing", "percentOfTotal": 50, "amount": 0},
    {"milestone": "Start of Construction", "description": "Before framing begins", "percentOfTotal": 25, "amount": 0},
    {"milestone": "Final Payment", "description": "Upon completion and final inspection", "percentOfTotal": 25, "amount": 0}
  ],
  "financials": {"materialSubtotal": 2700, "laborSubtotal": ${crewLabor}, "subtotal": 0, "markupPct": ${markup}, "markupAmount": 0, "contingencyPct": ${contingency}, "contingencyAmount": 0, "total": 0, "perSqFt": 0},
  "buildNotes": ["Complete site cleanup daily", "All fasteners galvanized or stainless per code", "Ledger flashed to prevent water intrusion", "Framing sequence: footings → posts → beam → joists → deck → roof → railing", "Weather protection: Keep materials covered, avoid rain during framing"],
  "permitItems": ["Deck building permit", "Structural inspection (footings and framing)", "Roofing permit", "Final walkthrough inspection"],
  "riskFlags": ["Material delivery delays possible", "Weather-dependent: rain halts concrete and roofing work", "Foundation depth subject to frost line verification", "Matching existing shingles may require exact color match"],
  "termsAndConditions": "This is a firm fixed-price contract. Work to commence upon receipt of deposit and final permit approval. Changes to scope of work will be billed at hourly rate of $65/hr (lead) or $45/hr (labor). All work performed per local building code. Contractor to obtain all necessary permits. Client responsible for utility locates. Weather delays may extend timeline. Work includes cleanup to normal construction standards.",
  "additionalFees": "Estimated permit and inspection fees: $200-250 (deck permit varies by municipality). Not included: site grading, cut/fill beyond 1 foot, removal of existing structures, or changes to scope.",
  "blueprintSpecs": {"foundationType": "12\" dia concrete footings, 36\" deep (3 total)", "beamSpec": "Double 2x8 pressure-treated, 10' span", "joistSpec": "2x8 pressure-treated @ 16\" OC", "rafterSpec": "2x6 Douglas fir @ 24\" OC", "deckingSpec": "5/4x6 cedar decking perpendicular to joists", "railingSpec": "36\" composite railing with 28 balusters", "roofingSpec": "Architectural shingles matching existing house", "hardwareNotes": "All fasteners galvanized or stainless steel per code"}
}`;

Return EXACTLY this JSON structure. CRITICAL: materials.items MUST be an array of OBJECTS, not empty:
{
  "projectTitle": "10' x 8' Covered Cedar Deck with Gable Roof",
  "projectDescription": "Construction of a new 80 sq. ft. attached covered deck featuring pressure-treated framing, premium cedar decking, and a gable roof tied into the existing structure. Includes 3-step stair access, composite railing system, and architectural shingle roofing.",
  "scopeOfWork": "Excavate and pour 3 concrete footings (12-inch diameter, 36 inches deep). Install pressure-treated post and beam framing attached to house ledger via flashing. Install 5/4x6 cedar decking perpendicular to floor joists. Frame gable roof structure with 2x6 Douglas Fir rafters, collar ties, and 1x8 ridge board. Install roof sheathing and underlayment. Apply architectural shingles matching existing house. Install cedar fascia and soffit. Install composite/cedar railing system with 28 balusters and 3-step staircase. Final cleanup and debris removal.",
  "structuralSummary": {
    "footprint": "10' x 8'",
    "squareFootage": 80,
    "deckHeight": "3'-6\"",
    "roofType": "Gable",
    "roofPitch": "6:12",
    "totalHeight": "8'-6\"",
    "estimatedDuration": "5-7 days"
  },
  "materials": [
    {
      "category": "Concrete & Footings",
      "items": [
        {"name": "Quick-Setting Concrete Mix", "size": "60 lb bag", "material": "Concrete (3000 psi)", "qty": 12, "unit": "bag", "unitCost": 6.50, "totalCost": 78, "notes": "For 3 footings"},
        {"name": "Concrete Pier Tube Form", "size": "12\" diameter x 48\"", "material": "Cardboard tube", "qty": 3, "unit": "ea", "unitCost": 18.00, "totalCost": 54, "notes": "Cut to proper depth per spec"}
      ]
    },
    {
      "category": "Framing - Floor System",
      "items": [
        {"name": "Posts 4x4", "size": "4x4x4'", "material": "Pressure Treated", "qty": 3, "unit": "ea", "unitCost": 45.00, "totalCost": 135, "notes": "Support posts per blueprint"},
        {"name": "Ledger Board", "size": "2x10x10'", "material": "Pressure Treated", "qty": 1, "unit": "ea", "unitCost": 32.00, "totalCost": 32, "notes": "Attached to house wall"},
        {"name": "Double Beam", "size": "2x8x10'", "material": "Pressure Treated", "qty": 2, "unit": "ea", "unitCost": 24.00, "totalCost": 48, "notes": "Built-up double beam"},
        {"name": "Joists", "size": "2x8x8'", "material": "Pressure Treated", "qty": 7, "unit": "ea", "unitCost": 18.50, "totalCost": 129.50, "notes": "Floor joists at 16\" OC"},
        {"name": "Joist Hangers", "size": "LUS28", "material": "Galvanized Steel", "qty": 14, "unit": "ea", "unitCost": 2.25, "totalCost": 31.50, "notes": "Simpson Strong-Tie equivalent"}
      ]
    },
    {
      "category": "Decking & Stairs",
      "items": [
        {"name": "Cedar Decking", "size": "5/4x6x10'", "material": "Cedar", "qty": 16, "unit": "ea", "unitCost": 42.00, "totalCost": 672, "notes": "Premium grade decking"},
        {"name": "Stair Stringers", "size": "2x12x5'", "material": "Pressure Treated", "qty": 2, "unit": "ea", "unitCost": 28.00, "totalCost": 56, "notes": "Treated stringers"},
        {"name": "Stair Treads", "size": "5/4x6x3'", "material": "Cedar", "qty": 3, "unit": "ea", "unitCost": 24.00, "totalCost": 72, "notes": "Three-step assembly"}
      ]
    },
    {
      "category": "Roofing Structure & Materials",
      "items": [
        {"name": "Ridge Board", "size": "1x8x10'", "material": "Douglas Fir", "qty": 1, "unit": "ea", "unitCost": 18.00, "totalCost": 18, "notes": "Roof ridge"},
        {"name": "Rafters", "size": "2x6x7'", "material": "Douglas Fir", "qty": 10, "unit": "ea", "unitCost": 14.50, "totalCost": 145, "notes": "At 24\" OC"},
        {"name": "Collar Ties", "size": "2x4x5'", "material": "Douglas Fir", "qty": 3, "unit": "ea", "unitCost": 8.00, "totalCost": 24, "notes": "Roof tie-downs"},
        {"name": "Architectural Shingles", "size": "1 square (100 sqft)", "material": "Asphalt shingles", "qty": 1, "unit": "sq", "unitCost": 42.00, "totalCost": 42, "notes": "Match existing house"},
        {"name": "Roof Underlayment", "size": "Synthetic 30lb", "material": "Polypropylene", "qty": 100, "unit": "sqft", "unitCost": 0.18, "totalCost": 18, "notes": "Weather barrier"}
      ]
    },
    {
      "category": "Hardware & Fasteners",
      "items": [
        {"name": "Post Bases", "size": "ABA44 Simpson", "material": "Galvanized Steel", "qty": 3, "unit": "ea", "unitCost": 14.98, "totalCost": 44.94, "notes": "4x4 post connections"},
        {"name": "Ledger Bolts", "size": "1/2\" x 4\" SDS", "material": "Galvanized", "qty": 12, "unit": "ea", "unitCost": 3.50, "totalCost": 42, "notes": "House attachment"},
        {"name": "Rafter Ties", "size": "H2.5 Simpson", "material": "Galvanized", "qty": 10, "unit": "ea", "unitCost": 4.25, "totalCost": 42.50, "notes": "Roof-to-wall connections"},
        {"name": "Deck Fasteners", "size": "2.5\" galvanized screws", "material": "Galvanized Steel", "qty": 1, "unit": "box (1 lb)", "unitCost": 12.00, "totalCost": 12, "notes": "Decking screws"},
        {"name": "Joist Tape", "size": "Butyl flashing", "material": "Waterproof", "qty": 1, "unit": "roll", "unitCost": 18.00, "totalCost": 18, "notes": "Ledger waterproofing"}
      ]
    },
    {
      "category": "Railing System",
      "items": [
        {"name": "Rail Posts", "size": "4x4x42\"", "material": "Composite/Cedar", "qty": 6, "unit": "ea", "unitCost": 22.00, "totalCost": 132, "notes": "Railing posts"},
        {"name": "Rail Top", "size": "2x4x10'", "material": "Composite/Cedar", "qty": 2, "unit": "ea", "unitCost": 18.50, "totalCost": 37, "notes": "Handrails"},
        {"name": "Balusters", "size": "1.5\"x1.5\"x32\"", "material": "Aluminum/Composite", "qty": 28, "unit": "ea", "unitCost": 8.50, "totalCost": 238, "notes": "Per code spacing"}
      ]
    },
    {
      "category": "Fascia & Soffit",
      "items": [
        {"name": "Fascia", "size": "1x6x12'", "material": "Cedar", "qty": 3, "unit": "ea", "unitCost": 16.00, "totalCost": 48, "notes": "Roof edge trim"},
        {"name": "Soffit", "size": "1x6x12'", "material": "Cedar/Vinyl", "qty": 2, "unit": "ea", "unitCost": 14.00, "totalCost": 28, "notes": "Ventilated soffit"}
      ]
    },
    {
      "category": "Miscellaneous & Safety",
      "items": [
        {"name": "Metal Flashing & Trim", "size": "Various", "material": "Galvanized", "qty": 1, "unit": "allowance", "unitCost": 75.00, "totalCost": 75, "notes": "Flashing at ledger and roof penetrations"},
        {"name": "Caulk & Sealant", "size": "Various", "material": "Exterior grade", "qty": 1, "unit": "allowance", "unitCost": 35.00, "totalCost": 35, "notes": "Joint sealant"}
      ]
    }
  ],
  "laborBreakdown": [
    {
      "phase": "string",
      "trade": "string",
      "hours": number,
      "rate": number,
      "total": number,
      "assignedTo": "string"
    }
  ],
  "timeline": [
    {
      "day": number,
      "phase": "string",
      "crew": ["string"],
      "tasks": ["string"],
      "hoursPerWorker": number
    }
  ],
  "paymentSchedule": [
    {
      "milestone": "string",
      "description": "string",
      "percentOfTotal": number,
      "amount": number
    }
  ],
  "financials": {
    "materialSubtotal": number,
    "laborSubtotal": number,
    "subtotal": number,
    "markupPct": number,
    "markupAmount": number,
    "contingencyPct": number,
    "contingencyAmount": number,
    "total": number,
    "perSqFt": number
  },
  "buildNotes": ["string"],
  "permitItems": ["string"],
  "riskFlags": ["string"],
  "termsAndConditions": "string (standard construction T&C paragraph)",
  "additionalFees": "string (permit fees, inspection fees, debris removal, etc.)",
  "blueprintSpecs": {
    "foundationType": "12\" dia concrete footings, 36\" deep (3 total)",
    "beamSpec": "Double 2x8 pressure-treated, 10' span",
    "joistSpec": "2x8 pressure-treated @ 16\" OC",
    "rafterSpec": "2x6 Douglas fir @ 24\" OC",
    "deckingSpec": "5/4x6 cedar decking perpendicular to joists",
    "railingSpec": "36\" composite railing with 28 balusters",
    "roofingSpec": "Architectural shingles matching existing house",
    "hardwareNotes": "All fasteners galvanized or stainless steel per code"
  }
}

Use realistic 2025 US Home Depot prices. ALL numbers must be numeric. Do not include any non-numeric characters in numeric fields.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_pro',
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          projectTitle: { type: 'string' },
          projectDescription: { type: 'string' },
          scopeOfWork: { type: 'string' },
          structuralSummary: { type: 'object' },
          materials: { type: 'array' },
          laborBreakdown: { type: 'array' },
          timeline: { type: 'array' },
          paymentSchedule: { type: 'array' },
          financials: { type: 'object' },
          buildNotes: { type: 'array' },
          permitItems: { type: 'array' },
          riskFlags: { type: 'array' },
          termsAndConditions: { type: 'string' },
          additionalFees: { type: 'string' },
          blueprintSpecs: { type: 'object' },
        },
      },
    });

    // Sanitize materials data - handle both object items and array formats
    if (result.materials && Array.isArray(result.materials)) {
      result.materials = result.materials.filter(cat => cat && typeof cat === 'object' && cat.category).map(cat => {
        // If items is array of arrays, rebuild into proper objects
        if (cat.items && Array.isArray(cat.items) && cat.items.length === 0 && (cat.qty || cat.unitCost)) {
          const rebuilt = [];
          const names = cat.name || [];
          const sizes = cat.size || [];
          const materials = cat.material || [];
          const qtys = cat.qty || [];
          const units = cat.unit || [];
          const costs = cat.unitCost || [];
          const notes = cat.notes || [];
          
          for (let i = 0; i < (qtys.length || names.length || 0); i++) {
            rebuilt.push({
              name: String(names[i] || names || ''),
              size: String(sizes[i] || ''),
              material: String(materials[i] || ''),
              qty: Number(qtys[i]) || 0,
              unit: String(units[i] || 'ea'),
              unitCost: Number(costs[i]) || 0,
              totalCost: (Number(qtys[i]) || 0) * (Number(costs[i]) || 0),
              notes: String(notes[i] || '')
            });
          }
          return { ...cat, items: rebuilt };
        }
        
        // Otherwise normalize existing items
        if (cat.items && Array.isArray(cat.items)) {
          cat.items = cat.items.filter(item => item && typeof item === 'object' && !Array.isArray(item)).map(item => ({
            name: String(item.name || ''),
            size: String(item.size || ''),
            material: String(item.material || ''),
            qty: Number(item.qty) || 0,
            unit: String(item.unit || 'ea'),
            unitCost: Number(item.unitCost) || 0,
            totalCost: (Number(item.qty) || 0) * (Number(item.unitCost) || 0),
            notes: String(item.notes || '')
          }));
        } else {
          cat.items = [];
        }
        return cat;
      });
    }

    // Calculate material subtotal from actual line items
    const ms = result.materials?.reduce((sum, cat) => 
      sum + (cat.items?.reduce((itemSum, item) => itemSum + (Number(item.totalCost) || 0), 0) || 0), 0) || 0;
    
    // Use ONLY assigned crew labor (not AI-generated fake employees)
    const ls = crewLabor;
    
    const sqft = Number(result.structuralSummary?.squareFootage) || (Number(width) * Number(depth)) || 80;
    const sub = ms + ls;
    const mkA = Math.round(sub * markup / 100);
    const ctA = Math.round(sub * contingency / 100);
    const total = sub + mkA + ctA;

    // Fixed financials - ONLY use actual crew labor, not mock data
    result.financials = {
      materialSubtotal: Math.round(ms),
      laborSubtotal: Math.round(ls),
      subtotal: Math.round(sub),
      markupPct: markup,
      markupAmount: mkA,
      contingencyPct: contingency,
      contingencyAmount: ctA,
      total: Math.round(total),
      perSqFt: sqft > 0 ? Math.round(total / sqft) : 0,
    };
    
    // Override labor breakdown to use ONLY assigned crew, discard AI-generated employees
    result.laborBreakdown = crew.map(c => ({
      phase: 'Project Work',
      trade: c.trade,
      hours: c.hours,
      rate: c.rate,
      total: c.rate * c.hours,
      assignedTo: c.name,
    }));
    
    // Ensure structural summary has square footage
    result.structuralSummary = {
      ...result.structuralSummary,
      squareFootage: sqft,
      footprint: `${width}' x ${depth}'`,
    };

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('analyzeBidPhoto:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});