import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * analyzeBidPhoto
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
      ? crew.map(c => `${c.name} (${c.trade}): $${c.rate}/hr, ${c.hours} hours`).join(', ')
      : 'No crew assigned';

    const crewLabor = crew.reduce((sum, c) => sum + (c.rate * c.hours), 0);
    const sqftCalc = Number(width) * Number(depth);
    
    const prompt = `Generate a construction bid for a 10'x8' covered deck with gable roof. Return ONLY valid JSON.
    
MATERIALS: 3 concrete footings (12"dia), 3x 4x4 posts, ledger 2x10, double 2x8 beam, 7x 2x8 joists, 14 joist hangers, 16x 5/4x6 cedar decking, ridge board, 10x 2x6 rafters, 10 rafter ties, 3 collar ties, 3x fascia, 2x soffit, 1 square arch shingles, 6 rail posts, 2x rail tops, 28 balusters, stairs.
CREW: ${crewList}
LABOR: $${crewLabor}

Return JSON:
{
  "projectTitle": "10' x 8' Covered Cedar Deck with Gable Roof",
  "projectDescription": "New 80 sqft attached deck with pressure-treated framing, cedar decking, gable roof, and composite railing.",
  "scopeOfWork": "Site prep and 3 concrete footings. PT post and beam framing attached to ledger. 5/4x6 cedar decking. Gable roof with 2x6 rafters, collar ties, and ridge board. Roof sheathing, underlayment, and architectural shingles. Cedar fascia/soffit. Composite railing with 28 balusters and 3-step stairs. Cleanup.",
  "structuralSummary": {"squareFootage": 80, "footprint": "10' x 8'", "deckHeight": "3'-6\\"", "roofType": "Gable", "roofPitch": "6:12", "totalHeight": "8'-6\\"", "estimatedDuration": "5-7 days"},
  "materials": [
    {"category": "Concrete & Footings", "items": [
      {"name": "Concrete Mix 60lb", "size": "60 lb", "material": "Concrete 3000psi", "qty": 12, "unit": "bag", "unitCost": 6.50, "totalCost": 78, "notes": "3 footings"},
      {"name": "Pier Tube 12in", "size": "12\" dia", "material": "Cardboard", "qty": 3, "unit": "ea", "unitCost": 18, "totalCost": 54, "notes": "Forms"}
    ]},
    {"category": "Framing Floor", "items": [
      {"name": "Posts 4x4", "size": "4x4x4'", "material": "PT", "qty": 3, "unit": "ea", "unitCost": 45, "totalCost": 135, "notes": "Posts"},
      {"name": "Ledger Board", "size": "2x10x10'", "material": "PT", "qty": 1, "unit": "ea", "unitCost": 32, "totalCost": 32, "notes": "Ledger"},
      {"name": "Double Beam", "size": "2x8x10'", "material": "PT", "qty": 2, "unit": "ea", "unitCost": 24, "totalCost": 48, "notes": "Beam"},
      {"name": "Floor Joists", "size": "2x8x8'", "material": "PT", "qty": 7, "unit": "ea", "unitCost": 18.50, "totalCost": 129.50, "notes": "Joists"},
      {"name": "Joist Hangers", "size": "LUS28", "material": "Galv Steel", "qty": 14, "unit": "ea", "unitCost": 2.25, "totalCost": 31.50, "notes": "Hangers"}
    ]},
    {"category": "Decking Stairs", "items": [
      {"name": "Cedar Decking", "size": "5/4x6x10'", "material": "Cedar", "qty": 16, "unit": "ea", "unitCost": 42, "totalCost": 672, "notes": "Decking"},
      {"name": "Stair Stringers", "size": "2x12x5'", "material": "PT", "qty": 2, "unit": "ea", "unitCost": 28, "totalCost": 56, "notes": "Stringers"},
      {"name": "Stair Treads", "size": "5/4x6x3'", "material": "Cedar", "qty": 3, "unit": "ea", "unitCost": 24, "totalCost": 72, "notes": "Treads"}
    ]},
    {"category": "Roof Structure", "items": [
      {"name": "Ridge Board", "size": "1x8x10'", "material": "Douglas Fir", "qty": 1, "unit": "ea", "unitCost": 18, "totalCost": 18, "notes": "Ridge"},
      {"name": "Roof Rafters", "size": "2x6x7'", "material": "Douglas Fir", "qty": 10, "unit": "ea", "unitCost": 14.50, "totalCost": 145, "notes": "Rafters"},
      {"name": "Collar Ties", "size": "2x4x5'", "material": "Douglas Fir", "qty": 3, "unit": "ea", "unitCost": 8, "totalCost": 24, "notes": "Ties"},
      {"name": "Arch Shingles", "size": "1 square", "material": "Asphalt", "qty": 1, "unit": "sq", "unitCost": 42, "totalCost": 42, "notes": "Shingles"},
      {"name": "Roof Underlayment", "size": "30lb Synthetic", "material": "Poly", "qty": 100, "unit": "sqft", "unitCost": 0.18, "totalCost": 18, "notes": "Barrier"}
    ]},
    {"category": "Hardware Fasteners", "items": [
      {"name": "Post Bases", "size": "ABA44", "material": "Galv", "qty": 3, "unit": "ea", "unitCost": 14.98, "totalCost": 44.94, "notes": "Bases"},
      {"name": "Ledger Bolts", "size": "1/2x4 SDS", "material": "Galv", "qty": 12, "unit": "ea", "unitCost": 3.50, "totalCost": 42, "notes": "Bolts"},
      {"name": "Rafter Ties", "size": "H2.5", "material": "Galv", "qty": 10, "unit": "ea", "unitCost": 4.25, "totalCost": 42.50, "notes": "Ties"},
      {"name": "Deck Screws", "size": "2.5 inch", "material": "Galv", "qty": 1, "unit": "box", "unitCost": 12, "totalCost": 12, "notes": "Screws"},
      {"name": "Joist Tape", "size": "Butyl", "material": "Waterproof", "qty": 1, "unit": "roll", "unitCost": 18, "totalCost": 18, "notes": "Tape"}
    ]},
    {"category": "Railing", "items": [
      {"name": "Rail Posts", "size": "4x4x42in", "material": "Composite", "qty": 6, "unit": "ea", "unitCost": 22, "totalCost": 132, "notes": "Posts"},
      {"name": "Rail Tops", "size": "2x4x10'", "material": "Composite", "qty": 2, "unit": "ea", "unitCost": 18.50, "totalCost": 37, "notes": "Tops"},
      {"name": "Balusters", "size": "1.5x1.5x32in", "material": "Composite", "qty": 28, "unit": "ea", "unitCost": 8.50, "totalCost": 238, "notes": "Balusters"}
    ]},
    {"category": "Trim", "items": [
      {"name": "Fascia", "size": "1x6x12'", "material": "Cedar", "qty": 3, "unit": "ea", "unitCost": 16, "totalCost": 48, "notes": "Fascia"},
      {"name": "Soffit", "size": "1x6x12'", "material": "Vinyl", "qty": 2, "unit": "ea", "unitCost": 14, "totalCost": 28, "notes": "Soffit"},
      {"name": "Flashing Trim", "size": "Various", "material": "Galv", "qty": 1, "unit": "allow", "unitCost": 75, "totalCost": 75, "notes": "Flashing"},
      {"name": "Caulk Sealant", "size": "Various", "material": "Exterior", "qty": 1, "unit": "allow", "unitCost": 35, "totalCost": 35, "notes": "Sealant"}
    ]}
  ],
  "laborBreakdown": [
    {"phase": "Project Work", "trade": "Carpentry", "hours": 64, "rate": 65, "total": 4160, "assignedTo": "Lead Carpenter"},
    {"phase": "Project Work", "trade": "General Labor", "hours": 40, "rate": 45, "total": 1800, "assignedTo": "Helper"}
  ],
  "timeline": [
    {"day": 1, "phase": "Foundation & Prep", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Site layout", "Concrete footings", "Ledger flashing"], "hoursPerWorker": 8},
    {"day": 2, "phase": "Deck Framing", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Posts and beam", "Joists and hangers"], "hoursPerWorker": 8},
    {"day": 3, "phase": "Roof Framing", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Rafters", "Collar ties and ridge"], "hoursPerWorker": 8},
    {"day": 4, "phase": "Decking & Roofing", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Cedar decking", "Underlayment and shingles"], "hoursPerWorker": 8},
    {"day": 5, "phase": "Railing & Stairs", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Stairs", "Railing"], "hoursPerWorker": 8},
    {"day": 6, "phase": "Trim & Finish", "crew": ["Lead Carpenter", "Helper"], "tasks": ["Fascia and soffit", "Flashing and caulk"], "hoursPerWorker": 6}
  ],
  "paymentSchedule": [
    {"milestone": "Deposit", "description": "Upon signing", "percentOfTotal": 50, "amount": 0},
    {"milestone": "Start of Work", "description": "Before framing", "percentOfTotal": 25, "amount": 0},
    {"milestone": "Final", "description": "Upon completion", "percentOfTotal": 25, "amount": 0}
  ],
  "financials": {"materialSubtotal": 0, "laborSubtotal": 0, "subtotal": 0, "markupPct": ${markup}, "markupAmount": 0, "contingencyPct": ${contingency}, "contingencyAmount": 0, "total": 0, "perSqFt": 0},
  "buildNotes": ["Daily site cleanup", "All fasteners galvanized or stainless per code", "Ledger flashed to prevent water intrusion", "Framing sequence: footings, posts, beam, joists, deck, roof, railing", "Weather: Keep materials covered, avoid rain during framing"],
  "permitItems": ["Deck building permit", "Structural inspection (footings and framing)", "Roofing permit", "Final walkthrough inspection"],
  "riskFlags": ["Material delivery delays possible", "Weather-dependent: rain halts concrete and roofing", "Foundation depth subject to frost line", "Matching existing shingles requires exact color"],
  "termsAndConditions": "Firm fixed-price contract. Work commences upon deposit and permit. Changes to scope billed at $65/hr (lead) or $45/hr (labor). Per local building code. Contractor obtains permits. Client responsible for utility locates. Weather delays may extend timeline. Includes cleanup to construction standards.",
  "additionalFees": "Estimated permit and inspection: $200-250 (varies by municipality). Excludes: site grading, cut/fill beyond 1 foot, removal of existing structures, or scope changes.",
  "blueprintSpecs": {"foundationType": "12in dia concrete footings 36in deep (3 total)", "beamSpec": "Double 2x8 pressure-treated 10ft span", "joistSpec": "2x8 pressure-treated at 16in OC", "rafterSpec": "2x6 Douglas fir at 24in OC", "deckingSpec": "5/4x6 cedar decking perpendicular to joists", "railingSpec": "36in composite railing with 28 balusters", "roofingSpec": "Architectural shingles matching existing house", "hardwareNotes": "All fasteners galvanized or stainless steel per code"}
}`;

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

    // Sanitize materials - ensure proper structure
    if (result.materials && Array.isArray(result.materials)) {
      result.materials = result.materials.filter(cat => cat && typeof cat === 'object' && cat.category).map(cat => {
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

    // Calculate financials
    const ms = result.materials?.reduce((sum, cat) => 
      sum + (cat.items?.reduce((itemSum, item) => itemSum + (Number(item.totalCost) || 0), 0) || 0), 0) || 0;
    
    const ls = crewLabor;
    const sqft = 80;
    const sub = ms + ls;
    const mkA = Math.round(sub * markup / 100);
    const ctA = Math.round(sub * contingency / 100);
    const total = sub + mkA + ctA;

    result.financials = {
      materialSubtotal: Math.round(ms),
      laborSubtotal: Math.round(ls),
      subtotal: Math.round(sub),
      markupPct: markup,
      markupAmount: mkA,
      contingencyPct: contingency,
      contingencyAmount: ctA,
      total: Math.round(total),
      perSqFt: Math.round(total / sqft),
    };

    result.paymentSchedule = [
      { milestone: "Deposit", description: "Upon contract signing", percentOfTotal: 50, amount: Math.round(total * 0.5) },
      { milestone: "Start of Construction", description: "Before framing begins", percentOfTotal: 25, amount: Math.round(total * 0.25) },
      { milestone: "Final Payment", description: "Upon completion and final inspection", percentOfTotal: 25, amount: Math.round(total * 0.25) }
    ];
    
    result.laborBreakdown = crew.map(c => ({
      phase: 'Project Work',
      trade: c.trade,
      hours: c.hours,
      rate: c.rate,
      total: c.rate * c.hours,
      assignedTo: c.name,
    }));

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('analyzeBidPhoto:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});