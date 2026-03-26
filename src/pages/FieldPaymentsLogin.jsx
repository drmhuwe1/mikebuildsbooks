import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, DollarSign } from "lucide-react";

export default function FieldPaymentsLogin() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Get owner access record
      const ownerAccess = await base44.entities.OwnerAccess.filter({ owner_email: email });
      
      if (ownerAccess.length === 0) {
        setError("Email not found. Contact your administrator.");
        setLoading(false);
        return;
      }

      const access = ownerAccess[0];

      if (!access.is_enabled) {
        setError("This account has been disabled.");
        setLoading(false);
        return;
      }

      // Verify PIN if required
      if (access.require_pin && pin !== access.pin_code) {
        setError("Invalid PIN code.");
        setLoading(false);
        return;
      }

      // Log access
      await base44.entities.OwnerAccess.update(access.id, {
        last_access_date: new Date().toISOString(),
        access_count: (access.access_count || 0) + 1
      });

      // Store session and navigate
      const portalType = access.portal_type || "field_payments";
      sessionStorage.setItem("fieldOpsUser", JSON.stringify({ email, accessId: access.id, portalType }));
      navigate(portalType === "field_operations" ? "/FieldOperationsPortal" : "/FieldPayments");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <div className="p-8">
          {/* Logo/Header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <DollarSign className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Field Payments</h1>
          </div>

          <p className="text-center text-sm text-muted-foreground mb-6">
            Collect customer payments on-site
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="owner@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                PIN Code
              </label>
              <Input
                type="password"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="h-10"
                maxLength="4"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">4-digit PIN (if required)</p>
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full h-10 font-semibold"
            >
              {loading ? "Authenticating..." : "Access Field Payments"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Only authorized owners can access this area.
              <br />
              <Link to="/" className="text-primary hover:underline font-semibold">
                Back to Main App
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}