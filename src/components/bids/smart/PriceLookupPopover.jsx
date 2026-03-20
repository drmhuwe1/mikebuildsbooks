import React from "react";
import { ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function PriceLookupPopover({ results, onSelectPrice, isLoading, triggerLabel = "Verify Price" }) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="xs" className="text-xs gap-1 whitespace-nowrap">
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Home Depot Results</p>
          {results.map((product, i) => (
            <div key={i} className="p-2 border rounded-md hover:bg-muted/30 transition-colors">
              <p className="text-xs font-medium leading-tight line-clamp-2">{product.title}</p>
              {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">{product.price}</span>
                  {product.rating && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {product.rating}
                    </span>
                  )}
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onSelectPrice(product.extracted_price)}
                  className="text-xs gap-1"
                >
                  Use ${product.extracted_price}
                </Button>
              </div>
              {product.link && (
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
          <div className="pt-1 border-t text-xs text-muted-foreground flex items-center gap-1">
            <span>Powered by Home Depot</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}