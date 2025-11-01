import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Heart, ArrowLeft, Loader2, Calendar } from "lucide-react";

const ScheduleDonation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    item_category: "",
    item_description: "",
    item_quantity: 1,
    pickup_address: "",
    preferred_date: "",
    preferred_time_slot: "",
    notes: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("donations").insert([
        {
          donor_id: user.id,
          ...formData,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your donation has been scheduled. A volunteer will be assigned soon.",
      });

      navigate("/donor");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/donor" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold text-foreground">DonateConnect</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-strong">
            <CardHeader>
              <CardTitle className="text-3xl">Schedule a Donation</CardTitle>
              <CardDescription>
                Fill in the details below to schedule a pickup for your donation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Item Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Item Category *</Label>
                  <Select
                    value={formData.item_category}
                    onValueChange={(value) => handleInputChange("item_category", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                      <SelectItem value="Shoes">Shoes</SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                      <SelectItem value="Toys">Toys</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Household Items">Household Items</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Item Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the items you're donating (condition, size, etc.)"
                    value={formData.item_description}
                    onChange={(e) => handleInputChange("item_description", e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity (number of items or bags) *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.item_quantity}
                    onChange={(e) => handleInputChange("item_quantity", parseInt(e.target.value))}
                    required
                  />
                </div>

                {/* Pickup Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Pickup Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your complete pickup address"
                    value={formData.pickup_address}
                    onChange={(e) => handleInputChange("pickup_address", e.target.value)}
                    required
                    rows={2}
                  />
                </div>

                {/* Preferred Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Preferred Pickup Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.preferred_date}
                    onChange={(e) => handleInputChange("preferred_date", e.target.value)}
                    required
                  />
                </div>

                {/* Time Slot */}
                <div className="space-y-2">
                  <Label htmlFor="time">Preferred Time Slot *</Label>
                  <Select
                    value={formData.preferred_time_slot}
                    onValueChange={(value) => handleInputChange("preferred_time_slot", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</SelectItem>
                      <SelectItem value="Afternoon (12 PM - 3 PM)">
                        Afternoon (12 PM - 3 PM)
                      </SelectItem>
                      <SelectItem value="Evening (3 PM - 6 PM)">Evening (3 PM - 6 PM)</SelectItem>
                      <SelectItem value="Late Evening (6 PM - 9 PM)">
                        Late Evening (6 PM - 9 PM)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions or additional information"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate("/donor")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="hero" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Pickup
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDonation;
