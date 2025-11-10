import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Package, 
  User,
  Navigation as NavigationIcon,
  CheckCircle,
  Upload
} from "lucide-react";
import RouteMap from "@/components/RouteMap";
import ImageUpload from "@/components/ImageUpload";

const AssignmentDetail = () => {
  const { donationId } = useParams<{ donationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [donation, setDonation] = useState<any>(null);
  const [donor, setDonor] = useState<any>(null);
  const [volunteer, setVolunteer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [proofImages, setProofImages] = useState<string[]>([]);

  useEffect(() => {
    fetchAssignmentDetails();
    fetchVolunteerProfile();
  }, [donationId]);

  const fetchAssignmentDetails = async () => {
    if (!donationId) return;

    try {
      // Fetch donation details
      const { data: donationData, error: donationError } = await supabase
        .from("donations")
        .select("*")
        .eq("id", donationId)
        .single();

      if (donationError) throw donationError;
      setDonation(donationData);

      // Fetch donor profile
      const { data: donorData, error: donorError } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", donationData.donor_id)
        .single();

      if (donorError) throw donorError;
      setDonor(donorData);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      toast({
        title: "Error",
        description: "Failed to load assignment details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteerProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (data) setVolunteer(data);
  };

  const maskPhoneNumber = (phone: string) => {
    if (!phone) return "Not provided";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 4) return "***-****";
    return `***-***-${cleaned.slice(-4)}`;
  };

  const getFirstName = (fullName: string) => {
    if (!fullName) return "Donor";
    return fullName.split(" ")[0];
  };

  const handleStartNavigation = () => {
    if (!donation?.geo_lat || !donation?.geo_lng) {
      toast({
        title: "Location unavailable",
        description: "GPS coordinates not available for this pickup.",
        variant: "destructive",
      });
      return;
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${donation.geo_lat},${donation.geo_lng}`;
    window.open(googleMapsUrl, "_blank");
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!donationId) return;

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
        description: `Assignment marked as ${newStatus}.`,
      });
      fetchAssignmentDetails();
    }
  };

  const handleImageUpload = (urls: string[]) => {
    setProofImages(urls);
  };

  const handleCompletePickup = async () => {
    if (!donationId) return;
    
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Create pickup event
      const { error: eventError } = await supabase
        .from("pickup_events")
        .insert({
          donation_id: donationId,
          volunteer_id: session.user.id,
          status: "completed",
          proof_image: proofImages[0] || null,
          notes: "Pickup completed successfully"
        });

      if (eventError) throw eventError;

      // Update donation status
      await handleUpdateStatus("completed");

      toast({
        title: "Success!",
        description: "Pickup marked as completed.",
      });

      setTimeout(() => navigate("/volunteer-dashboard"), 1500);
    } catch (error) {
      console.error("Error completing pickup:", error);
      toast({
        title: "Error",
        description: "Failed to complete pickup.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading assignment details...</p>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Assignment not found</p>
          <Button onClick={() => navigate("/volunteer-dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/volunteer-dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Assignment Details</h1>
              <p className="text-muted-foreground">Complete pickup and delivery</p>
            </div>
            <Badge className="text-lg px-4 py-2">{donation.status}</Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Details */}
          <div className="space-y-6">
            {/* Donation Details */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Donation Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-semibold text-lg">{donation.item_category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p>{donation.item_description || "No description provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                  <p>{donation.item_quantity} item(s)</p>
                </div>
                {donation.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Special Notes</p>
                    <p className="text-sm italic">{donation.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pickup Details */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Pickup Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Address</p>
                  <p className="font-medium">{donation.pickup_address}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Date
                    </p>
                    <p className="font-medium">
                      {new Date(donation.preferred_date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Time Slot
                    </p>
                    <p className="font-medium">{donation.preferred_time_slot}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Donor Contact */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Donor Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-medium">{getFirstName(donor?.full_name)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone (Masked)</p>
                  <p className="font-medium">{maskPhoneNumber(donor?.phone)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Full contact available after marking as "In Progress"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="shadow-medium bg-primary/5 border-primary/20">
              <CardContent className="pt-6 space-y-3">
                {donation.status === "accepted" && (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleStartNavigation}
                    >
                      <NavigationIcon className="h-5 w-5 mr-2" />
                      Start Navigation in Google Maps
                    </Button>
                    <Button
                      className="w-full"
                      variant="hero"
                      size="lg"
                      onClick={() => handleUpdateStatus("in_progress")}
                    >
                      Mark as In Progress
                    </Button>
                  </>
                )}

                {donation.status === "in_progress" && (
                  <>
                    <Button
                      className="w-full mb-4"
                      size="lg"
                      onClick={handleStartNavigation}
                    >
                      <NavigationIcon className="h-5 w-5 mr-2" />
                      Navigate to Pickup
                    </Button>
                    
                    <div className="bg-background p-4 rounded-lg">
                      <p className="text-sm font-medium mb-3">Upload Proof of Pickup</p>
                      <ImageUpload 
                        onImagesChange={handleImageUpload} 
                        maxImages={3}
                        existingImages={proofImages}
                      />
                      {proofImages.length > 0 && (
                        <p className="text-sm text-success mt-2">✓ Image uploaded</p>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      variant="hero"
                      size="lg"
                      onClick={handleCompletePickup}
                      disabled={uploading || proofImages.length === 0}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      {uploading ? "Completing..." : "Complete Pickup"}
                    </Button>
                    
                    {proofImages.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Upload proof image to complete
                      </p>
                    )}
                  </>
                )}

                {donation.status === "completed" && (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                    <p className="font-semibold text-lg">Pickup Completed!</p>
                    <p className="text-sm text-muted-foreground">Thank you for your service</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Map */}
          <div className="lg:sticky lg:top-8 h-fit">
            {donation.geo_lat && donation.geo_lng && (
              <RouteMap
                donorLat={donation.geo_lat}
                donorLng={donation.geo_lng}
                donorAddress={donation.pickup_address}
                volunteerLat={volunteer?.geo_lat}
                volunteerLng={volunteer?.geo_lng}
                volunteerName={volunteer?.full_name}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
