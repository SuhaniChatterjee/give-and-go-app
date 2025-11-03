import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, LogOut, Package, MapPin, Calendar, Clock, CheckCircle } from "lucide-react";
import { useRealtimeDonations } from "@/hooks/useRealtimeDonations";
import NotificationsPanel from "@/components/NotificationsPanel";
import RouteMap from "@/components/RouteMap";

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [availableDonations, setAvailableDonations] = useState<any[]>([]);
  const [assignedDonations, setAssignedDonations] = useState<any[]>([]);
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

    if (data.role !== "volunteer") {
      navigate("/auth");
      toast({
        title: "Access Denied",
        description: "This dashboard is for volunteers only.",
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

    // Fetch available donations (pending or assigned but not to this volunteer)
    const { data: available, error: availError } = await supabase
      .from("donations")
      .select("*")
      .in("status", ["pending", "assigned"])
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch assigned donations
    const { data: assigned, error: assignedError } = await supabase
      .from("donations")
      .select("*")
      .eq("assigned_volunteer_id", session.user.id)
      .order("created_at", { ascending: false });

    if (availError || assignedError) {
      console.error("Error fetching donations:", availError || assignedError);
      toast({
        title: "Error",
        description: "Failed to load donations.",
        variant: "destructive",
      });
    } else {
      setAvailableDonations(available || []);
      setAssignedDonations(assigned || []);
    }
    setLoading(false);
  };

  const handleAcceptDonation = async (donationId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("donations")
      .update({
        status: "accepted",
        assigned_volunteer_id: session.user.id,
      })
      .eq("id", donationId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept donation.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Donation accepted! It's now in your assignments.",
      });
      fetchDonations();
    }
  };

  const handleUpdateStatus = async (donationId: string, newStatus: string) => {
    const { error } = await supabase
      .from("donations")
      .update({ status: newStatus })
      .eq("id", donationId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status Updated",
        description: `Donation marked as ${newStatus}.`,
      });
      fetchDonations();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const stats = {
    assigned: assignedDonations.filter((d) =>
      ["accepted", "in_progress"].includes(d.status)
    ).length,
    completed: assignedDonations.filter((d) => d.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold text-foreground">DonateConnect</span>
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
          <h1 className="text-4xl font-bold mb-2">Volunteer Dashboard</h1>
          <p className="text-muted-foreground">
            Accept pickups and help deliver donations to communities in need
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Assignments</p>
                  <p className="text-3xl font-bold">{stats.assigned}</p>
                </div>
                <Package className="h-12 w-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed Pickups</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-success opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Assignments */}
        <Card className="shadow-medium mb-8">
          <CardHeader>
            <CardTitle>My Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignedDonations.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No active assignments. Accept available donations below.
              </p>
            ) : (
              <div className="space-y-4">
                {assignedDonations.map((donation) => (
                  <Card key={donation.id} className="border-2 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{donation.item_category}</h3>
                            <Badge>{donation.status}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{donation.item_description}</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{donation.pickup_address}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {new Date(donation.preferred_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {donation.preferred_time_slot}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {donation.status === "accepted" && (
                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => handleUpdateStatus(donation.id, "in_progress")}
                        >
                          Mark as In Progress
                        </Button>
                      )}
                       {donation.status === "in_progress" && (
                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => handleUpdateStatus(donation.id, "completed")}
                        >
                          Mark as Completed
                        </Button>
                      )}
                      
                      {/* Route Map */}
                      {donation.geo_lat && donation.geo_lng && (
                        <div className="mt-4">
                          <RouteMap
                            donorLat={donation.geo_lat}
                            donorLng={donation.geo_lng}
                            donorAddress={donation.pickup_address}
                            volunteerLat={profile?.geo_lat}
                            volunteerLng={profile?.geo_lng}
                            volunteerName={profile?.full_name}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Donations */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Available Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading available pickups...</p>
            ) : availableDonations.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No available pickups at the moment.
              </p>
            ) : (
              <div className="space-y-4">
                {availableDonations.map((donation) => (
                  <Card key={donation.id} className="hover:shadow-soft transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{donation.item_category}</h3>
                          <p className="text-muted-foreground mb-3">{donation.item_description}</p>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{donation.pickup_address}</span>
                            </div>
                            <div className="flex items-center gap-4">
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
                        </div>
                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => handleAcceptDonation(donation.id)}
                          disabled={donation.assigned_volunteer_id !== null}
                        >
                          Accept
                        </Button>
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

export default VolunteerDashboard;
