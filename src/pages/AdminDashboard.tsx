import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, LogOut, Package, Users, Truck, TrendingUp } from "lucide-react";
import { useRealtimeDonations } from "@/hooks/useRealtimeDonations";
import NotificationsPanel from "@/components/NotificationsPanel";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    fetchData();
  }, []);

  useRealtimeDonations(loadData);

  useEffect(() => {
    checkAuth();
    fetchData();
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
    
    if (roleData && !['admin', 'ngo'].includes(roleData.role)) {
      navigate("/auth");
      toast({
        title: "Access Denied",
        description: "This dashboard is for admins and NGOs only.",
        variant: "destructive",
      });
      return;
    }

    setProfile(data);
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch all donations
    const { data: donationsData, error: donationsError } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch all profiles (admins/NGOs can see all via RLS)
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch all user roles for stats
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (donationsError || profilesError || rolesError) {
      console.error("Error fetching data:", donationsError || profilesError || rolesError);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } else {
      setDonations(donationsData || []);
      // Merge role from user_roles into profiles for display
      const profilesWithRoles = (profilesData || []).map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        return { ...profile, role: userRole?.role || 'donor' };
      });
      setProfiles(profilesWithRoles);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const stats = {
    totalDonations: donations.length,
    pendingDonations: donations.filter((d) => d.status === "pending").length,
    completedDonations: donations.filter((d) => d.status === "completed").length,
    totalDonors: profiles.filter((p) => p.role === "donor").length,
    totalVolunteers: profiles.filter((p) => p.role === "volunteer").length,
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold text-foreground">KindKart Admin</span>
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
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage the entire donation ecosystem
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Donations</p>
                  <p className="text-3xl font-bold">{stats.totalDonations}</p>
                </div>
                <Package className="h-12 w-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold">{stats.pendingDonations}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-secondary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Donors</p>
                  <p className="text-3xl font-bold">{stats.totalDonors}</p>
                </div>
                <Users className="h-12 w-12 text-success opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Volunteers</p>
                  <p className="text-3xl font-bold">{stats.totalVolunteers}</p>
                </div>
                <Truck className="h-12 w-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Donations */}
        <Card className="shadow-medium mb-8">
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading donations...</p>
            ) : donations.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No donations yet.</p>
            ) : (
              <div className="space-y-4">
                {donations.slice(0, 10).map((donation) => (
                  <Card key={donation.id} className="hover:shadow-soft transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{donation.item_category}</h3>
                            <Badge variant={donation.status === "completed" ? "default" : "secondary"}>
                              {donation.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{donation.item_description}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {donation.item_quantity} | Date:{" "}
                            {new Date(donation.preferred_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Overview */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Users Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading users...</p>
            ) : (
              <div className="space-y-4">
                {profiles.slice(0, 10).map((profile) => (
                  <Card key={profile.id} className="hover:shadow-soft transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{profile.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{profile.phone}</p>
                        </div>
                        <Badge>{profile.role}</Badge>
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

export default AdminDashboard;
