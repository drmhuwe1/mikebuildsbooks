import { base44 } from "@/api/base44Client";

/**
 * Requests a multi-page contractor blueprint PDF from the generateSpecDrawings
 * backend function and triggers a browser download. The function returns a
 * base64 data URL so we can stream it through functions.invoke.
 */
export async function downloadPermitBlueprint(projectType, data) {
  const res = await base44.functions.invoke("generateSpecDrawings", { projectType, data });
  const result = res?.data || {};
  if (!result.dataUrl) {
    throw new Error(result.error || "Blueprint generation failed");
  }
  const a = document.createElement("a");
  a.href = result.dataUrl;
  a.download = result.filename || `permit-blueprints-${projectType || "project"}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}