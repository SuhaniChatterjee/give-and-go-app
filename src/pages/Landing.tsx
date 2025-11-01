import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Calendar, Truck, Users, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-donation.jpg";
import iconSchedule from "@/assets/icon-schedule.jpg";
import iconPickup from "@/assets/icon-pickup.jpg";
import iconImpact from "@/assets/icon-impact.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold text-foreground">DonateConnect</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Transform Your <span className="text-primary">Surplus</span> Into{" "}
                <span className="text-secondary">Impact</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Connect donors with communities in need. Schedule donation pickups, track your
                impact, and be part of a compassionate movement that transforms lives.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth?mode=signup&role=donor">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Start Donating <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/auth?mode=signup&role=volunteer">
                  <Button variant="warm" size="lg" className="w-full sm:w-auto">
                    Become a Volunteer
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Community members sorting donations together"
                className="rounded-2xl shadow-strong w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A simple, transparent process that makes giving back easier than ever
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-all duration-300 shadow-soft hover:shadow-medium">
              <CardContent className="pt-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-light flex items-center justify-center">
                  <img src={iconSchedule} alt="Schedule icon" className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-center">Schedule Pickup</h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  List your donation items and choose a convenient pickup time. Upload photos and
                  provide details effortlessly.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-secondary transition-all duration-300 shadow-soft hover:shadow-medium">
              <CardContent className="pt-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/20 flex items-center justify-center">
                  <img src={iconPickup} alt="Pickup icon" className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-center">Volunteer Pickup</h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Our verified volunteers are assigned and notified. Track your pickup in real-time
                  with GPS routing.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-success transition-all duration-300 shadow-soft hover:shadow-medium">
              <CardContent className="pt-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
                  <img src={iconImpact} alt="Impact icon" className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-center">Make an Impact</h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Your donations reach those in need. View your impact history and contribution to
                  the community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-xl opacity-90">Donations Completed</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-xl opacity-90">Active Volunteers</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50+</div>
              <div className="text-xl opacity-90">Partner NGOs</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100K+</div>
              <div className="text-xl opacity-90">Lives Impacted</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our community of compassionate donors and volunteers. Together, we can transform
            surplus into hope.
          </p>
          <Link to="/auth?mode=signup">
            <Button variant="hero" size="lg">
              Join DonateConnect Today <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 fill-primary" />
            <span className="font-semibold">DonateConnect</span>
          </div>
          <p className="text-sm opacity-80">
            © 2025 Community Donation Pickup Scheduling System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
