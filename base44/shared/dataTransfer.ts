// Shared configuration for full-app data export / import.
// Used by both exportAllData and importAllData backend functions.

// Ordered list of every user-data entity in the app. Order is kept roughly
// parent-before-child for readability, but the two-phase import handles
// circular foreign-key references (e.g. Job <-> Bid) on its own.
export const EXPORT_ENTITIES: string[] = [
  "Client",
  "Subcontractor",
  "AppSettings",
  "BankAccount",
  "Bill",
  "PersonalBill",
  "ContractTemplate",
  "FinancialGoal",
  "FinancialScenario",
  "FinancialAlert",
  "Subscription",
  "BugReport",
  "OwnerAccess",
  "OwnerPayment",
  "Job",
  "Bid",
  "Contract",
  "Municipality",
  "Inspection",
  "ChangeOrder",
  "JobReceipt",
  "MaterialCost",
  "JobStage",
  "JobTask",
  "DailyLog",
  "JobPhoto",
  "PermitProject",
  "Document",
  "DocumentDelivery",
  "Invoice",
  "ManagerPayment",
  "SubcontractorPayment",
  "SubcontractorLedgerPayment",
  "SubcontractorWorkEntry",
  "SubPaysheet",
  "PaymentLedger",
  "FieldActivityLog",
  "FieldPaymentsAudit",
];

// Built-in fields auto-managed by the platform — must be stripped on import.
export const BUILTIN_FIELDS = ["id", "created_date", "updated_date", "created_by_id"];

// Array-of-ID fields not caught by the scalar "_id" heuristic.
// { EntityName: { fieldName: targetEntityName } }
export const ARRAY_ID_FIELDS: Record<string, Record<string, string>> = {
  Job: { change_orders: "ChangeOrder" },
};

export const ENTITY_SET = new Set(EXPORT_ENTITIES);

// If fieldName is a scalar foreign key (ends in "_id"), return the target
// entity name when an entity with that PascalCase name exists in our set.
// e.g. "client_id" -> "Client", "bank_account_id" -> "BankAccount".
export function fkTarget(fieldName: string): string | null {
  if (!fieldName.endsWith("_id")) return null;
  if (fieldName === "id" || fieldName === "created_by_id") return null;
  const base = fieldName.slice(0, -3);
  const pascal = base
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return ENTITY_SET.has(pascal) ? pascal : null;
}