/**
 * Permit Fee Intelligence Helper
 * Manages parsing and formatting of permit-related fees from AI searches
 */

export const feeCategories = {
  application: "Permit Application",
  building: "Building Permit",
  zoning: "Zoning Permit",
  variance: "Zoning Variance",
  inspection: "Inspection",
  review: "Plan Review",
  filing: "Filing",
  deck: "Deck Permit",
  roof: "Roof Permit",
  other: "Other",
};

export const parsePermitFees = (aiResponse) => {
  const fees = [];
  const lines = aiResponse.split("\n");
  let currentFee = null;

  lines.forEach(line => {
    const trimmed = line.trim();

    // Look for fee entries
    if (trimmed.match(/^-?\s*Fee\s+Name:|^-?\s*\d+\./)) {
      if (currentFee && currentFee.name) {
        fees.push(currentFee);
      }
      currentFee = createEmptyFee();
    }

    if (currentFee) {
      // Parse fee name
      if (trimmed.includes("Fee Name:")) {
        currentFee.name = extractValue(trimmed, "Fee Name:");
      } else if (trimmed.match(/^\d+\.\s+/)) {
        const match = trimmed.match(/^\d+\.\s+(.+?)(?:\s*[-:]|$)/);
        if (match) currentFee.name = match[1].trim();
      }

      // Parse amount
      if (
        trimmed.includes("Amount:") ||
        trimmed.includes("Estimated Amount:") ||
        trimmed.includes("Cost:")
      ) {
        const amount = extractDollarAmount(trimmed);
        if (amount) currentFee.amount = amount;
      }

      // Parse fee type
      if (trimmed.includes("Fee Type:") || trimmed.includes("Type:")) {
        const type = extractValue(trimmed, "Type:")
          .toLowerCase()
          .replace(/fee\s+type[:\s]*/i, "");
        currentFee.type = ["fixed", "percentage", "range", "value-based"].includes(
          type
        )
          ? type
          : "fixed";
      }

      // Parse description
      if (trimmed.includes("Description:")) {
        currentFee.description = extractValue(trimmed, "Description:");
      }

      // Parse dependencies
      if (trimmed.includes("Depends On:")) {
        currentFee.dependsOn = extractValue(trimmed, "Depends On:");
      }

      // Parse confidence
      if (trimmed.includes("Confidence:")) {
        const conf = extractValue(trimmed, "Confidence:").toLowerCase();
        currentFee.confidence = ["high", "medium", "low"].includes(conf)
          ? conf
          : "medium";
      }

      // Parse source
      if (trimmed.includes("Source:")) {
        currentFee.source = extractValue(trimmed, "Source:");
      }

      // Parse notes
      if (trimmed.includes("Notes:")) {
        currentFee.notes = extractValue(trimmed, "Notes:");
      }
    }
  });

  if (currentFee && currentFee.name) {
    fees.push(currentFee);
  }

  return fees.filter(f => f.name);
};

const createEmptyFee = () => ({
  name: "",
  amount: 0,
  type: "fixed",
  description: "",
  dependsOn: "",
  confidence: "medium",
  source: "",
  notes: "",
});

const extractValue = (line, key) => {
  const parts = line.split(key);
  return parts[1]?.trim().replace(/^[\s:]*/, "") || "";
};

const extractDollarAmount = (text) => {
  const match = text.match(/\$?([\d,]+\.?\d*)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ""));
  }
  return 0;
};

export const categorizeFee = (feeName) => {
  const name = feeName.toLowerCase();

  if (name.includes("building")) return "building";
  if (name.includes("zoning")) {
    if (name.includes("variance")) return "variance";
    return "zoning";
  }
  if (name.includes("application")) return "application";
  if (name.includes("inspection")) return "inspection";
  if (name.includes("review")) return "review";
  if (name.includes("filing")) return "filing";
  if (name.includes("deck")) return "deck";
  if (name.includes("roof")) return "roof";

  return "other";
};

export const formatFeeForBid = (fee) => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: fee.name,
    description: fee.description,
    amount: fee.amount,
    type: fee.type,
    category: categorizeFee(fee.name),
    confidence: fee.confidence,
    source: fee.source,
    dependsOn: fee.dependsOn,
    notes: fee.notes,
    included: fee.confidence === "high" || fee.amount > 0,
  };
};

export const estimateTotalPermitFees = (fees) => {
  return fees
    .filter(f => f.included)
    .reduce((sum, f) => sum + (f.amount || 0), 0);
};

export const getFeeWarnings = (fees) => {
  const warnings = [];

  fees.forEach(fee => {
    if (fee.confidence === "low") {
      warnings.push(
        `${fee.name} has low confidence - verify with building department`
      );
    }

    if (fee.dependsOn) {
      warnings.push(
        `${fee.name} may depend on ${fee.dependsOn} - confirm final amount`
      );
    }

    if (fee.type !== "fixed" && fee.amount > 0) {
      warnings.push(
        `${fee.name} is ${fee.type} - actual amount may vary from estimate`
      );
    }
  });

  return warnings;
};

export const generateFeeDisclaimer = () => {
  return `Permit fees are AI-assisted estimates based on official public information and project inputs. Final fees should always be confirmed with your local building and zoning office before submission. Fees may vary based on project value, square footage, additional reviews, or other factors specific to your municipality.`;
};