import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  Plus,
  Package,
  Clock,
  CheckCircle,
  LogOut,
  Calendar,
  Download,
} from "lucide-react";
import { useRealtimeDonations } from "@/hooks/useRealtimeDonations";
import NotificationsPanel from "@/components/NotificationsPanel";
import { generateDonationReceipt } from "@/utils/pdfGenerator";

const DonorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDonations = useCallback(() => {
    fetchDonations();
  }, []);

  useRealtimeDonations(loadDonations);

  useEffect(() => {
    checkAuth();
    fetchDonations();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchProfile(session.user.id);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    // Check role from user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .limit(1)
      .single();
    
    if (roleData && roleData.role !== 'donor') {
      navigate("/auth");
      toast({
        title: "Access Denied",
        description: "This dashboard is for donors only.",
        variant: "destructive",
      });
      return;
    }

    setProfile(data);
  };

  const fetchDonations = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("donor_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching donations:", error);
      toast({
        title: "Error",
        description: "Failed to load your donations.",
        variant: "destructive",
      });
    } else {
      setDonations(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDownloadReceipt = (donation: any) => {
    generateDonationReceipt({
      donationId: donation.id.slice(0, 8).toUpperCase(),
      donorName: profile?.full_name || 'Donor',
      itemCategory: donation.item_category,
      itemDescription: donation.item_description,
      quantity: donation.item_quantity,
      pickupAddress: donation.pickup_address,
      pickupDate: donation.preferred_date,
      volunteerName: 'Volunteer', // In production, fetch volunteer name
      completedAt: donation.updated_at
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", label: "Pending" },
      assigned: { variant: "default", label: "Assigned" },
      accepted: { variant: "default", label: "Accepted" },
      in_progress: { variant: "default", label: "In Progress" },
      completed: { variant: "success", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const stats = {
    total: donations.length,
    pending: donations.filter((d) => d.status === "pending" || d.status === "assigned").length,
    completed: donations.filter((d) => d.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold text-foreground">KindKart</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsPanel />
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Donor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your donations and track your impact on the community
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Donations</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-12 w-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Pickups</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-12 w-12 text-secondary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-success opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <Button variant="hero" size="lg" onClick={() => navigate("/donor/schedule")}>
            <Plus className="mr-2 h-5 w-5" />
            Schedule New Donation
          </Button>
        </div>

        {/* Donations List */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Your Donations</CardTitle>
            <CardDescription>Track and manage all your donation pickups</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading your donations...</p>
            ) : donations.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-xl font-semibold mb-2">No donations yet</p>
                <p className="text-muted-foreground mb-6">
                  Start making a difference by scheduling your first donation
                </p>
                <Button variant="hero" onClick={() => navigate("/donor/schedule")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Donation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {donations.map((donation) => (
                  <Card key={donation.id} className="hover:shadow-soft transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{donation.item_category}</h3>
                            {getStatusBadge(donation.status)}
                          </div>
                          <p className="text-muted-foreground mb-2">{donation.item_description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(donation.preferred_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {donation.preferred_time_slot}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="text-2xl font-bold text-primary">{donation.item_quantity}</p>
                          {donation.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => handleDownloadReceipt(donation)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Receipt
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DonorDashboard;
