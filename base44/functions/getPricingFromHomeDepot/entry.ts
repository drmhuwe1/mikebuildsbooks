import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    // Get request data
    const { materialDescription, zipCode } = await req.json();

    if (!materialDescription || !zipCode) {
      return Response.json({ error: "materialDescription and zipCode required" }, { status: 400 });
    }

    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    if (!SERPAPI_KEY) {
      console.error("SERPAPI_KEY environment variable not set");
      return Response.json(null); // Fail silently
    }

    // Call SerpAPI Home Depot engine
    const url = `https://serpapi.com/search.json?engine=home_depot&q=${encodeURIComponent(materialDescription)}&delivery_zip=${encodeURIComponent(zipCode)}&ps=5&api_key=${SERPAPI_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      return Response.json(null); // No results, fail silently
    }

    // Return top 3 results
    const results = data.products.slice(0, 3).map(p => ({
      title: p.title,
      price: p.price,
      extracted_price: p.extracted_price,
      brand: p.brand,
      rating: p.rating,
      link: p.link,
      product_id: p.product_id,
    }));

    return Response.json(results);
  } catch (error) {
    console.error("Error in getPricingFromHomeDepot:", error.message);
    return Response.json(null); // Fail silently on error
  }
});