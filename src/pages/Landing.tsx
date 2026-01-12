import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  FileText, 
  Users, 
  Brain, 
  Calendar, 
  MessageSquare,
  Shield,
  Check,
  Star,
  ArrowRight,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Sparkles,
  Globe,
  Zap,
  Heart,
  TrendingUp,
  Award,
  Play,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all elements with scroll-animate classes
    const animatedElements = document.querySelectorAll(
      '.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale'
    );
    
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Smooth scroll handler for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href !== '#') {
          e.preventDefault();
          const targetElement = document.querySelector(href);
          if (targetElement) {
            const offset = 80; // Account for fixed navbar
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Smart Patient Records',
      description: 'Complete patient history with AI-powered insights and predictive health analytics.',
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      delay: '0ms'
    },
    {
      icon: Brain,
      title: 'AI Diagnostics',
      description: 'Upload reports and get instant AI analysis with treatment recommendations.',
      gradient: 'from-violet-500 via-purple-600 to-fuchsia-700',
      delay: '100ms'
    },
    {
      icon: FileText,
      title: 'Digital Prescriptions',
      description: 'Generate branded e-prescriptions with auto symptom-medicine mapping.',
      gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
      delay: '200ms'
    },
    {
      icon: Calendar,
      title: 'Appointment Hub',
      description: 'Smart scheduling with automated reminders and waitlist management.',
      gradient: 'from-orange-500 via-amber-600 to-yellow-600',
      delay: '300ms'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Connect',
      description: 'Share prescriptions and appointment updates instantly via WhatsApp.',
      gradient: 'from-green-500 via-emerald-600 to-teal-700',
      delay: '400ms'
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: 'HIPAA compliant with end-to-end encryption and secure cloud storage.',
      gradient: 'from-slate-600 via-slate-700 to-zinc-800',
      delay: '500ms'
    }
  ];

  const plans = [
    {
      name: 'Starter',
      price: '999',
      yearlyPrice: '9,990',
      description: 'Perfect for solo practitioners',
      features: [
        '1 Doctor Account',
        'Up to 100 Patients',
        'Digital Prescriptions',
        'Basic Appointments',
        'Email Support',
        '10 AI Analyses/month'
      ],
      popular: false,
      cta: 'Start Free Trial',
      icon: Zap
    },
    {
      name: 'Professional',
      price: '2,499',
      yearlyPrice: '24,990',
      description: 'Best for growing clinics',
      features: [
        'Up to 3 Doctors',
        'Unlimited Patients',
        'AI Report Analysis',
        'WhatsApp Integration',
        'Priority Support',
        '100 AI Analyses/month',
        'Custom Branding',
        'Analytics Dashboard'
      ],
      popular: true,
      cta: 'Start Free Trial',
      icon: TrendingUp
    },
    {
      name: 'Enterprise',
      price: '4,999',
      yearlyPrice: '49,990',
      description: 'For hospitals & chains',
      features: [
        'Unlimited Doctors',
        'Unlimited Everything',
        'Multi-branch Support',
        'White-label Solution',
        'Dedicated Manager',
        'Unlimited AI Analyses',
        'API Access',
        'SSO & LDAP'
      ],
      popular: false,
      cta: 'Contact Sales',
      icon: Award
    }
  ];

  const testimonials = [
    {
      name: 'Dr. Rajesh Sharma',
      role: 'Homoeopathy Specialist',
      location: 'Delhi',
      content: 'ElectroMed has transformed my clinic operations. The AI analysis saves me 3+ hours daily. My patients love the digital prescriptions!',
      rating: 5,
      image: 'RS'
    },
    {
      name: 'Dr. Priya Patel',
      role: 'General Physician',
      location: 'Mumbai',
      content: 'The Hindi language support is amazing! My staff finds it incredibly easy to use. Best investment for my practice.',
      rating: 5,
      image: 'PP'
    },
    {
      name: 'Dr. Anil Kumar',
      role: 'Clinic Director',
      location: 'Bangalore',
      content: 'Managing 5 doctors and 1000+ patients is now seamless. The analytics help me make better business decisions.',
      rating: 5,
      image: 'AK'
    },
    {
      name: 'Dr. Sunita Verma',
      role: 'Pediatrician',
      location: 'Jaipur',
      content: 'Appointment no-shows reduced by 50% with automated reminders. The ROI is incredible!',
      rating: 5,
      image: 'SV'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Active Doctors', icon: Users },
    { value: '1 Cr+', label: 'Prescriptions', icon: FileText },
    { value: '99.99%', label: 'Uptime', icon: Zap },
    { value: '4.9/5', label: 'Rating', icon: Star }
  ];

  const trustedBy = [
    'Apollo Clinics', 'Medanta', 'Fortis', 'Max Healthcare', 'AIIMS Doctors'
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-accent shadow-lg">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-accent rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">ElectroMed</h1>
                <p className="text-[10px] text-muted-foreground font-medium hidden sm:block">AI-Powered Clinic Software</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </a>
              <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group">
                Reviews
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </a>
              <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </a>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" className="font-semibold">Login</Button>
              </Link>
              <Link to="/auth">
                <Button className="gap-2 rounded-xl px-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="lg:hidden touch-target rounded-xl hover:bg-secondary/80 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-950 border-b-2 border-primary/20 shadow-2xl p-6 space-y-3 animate-slide-up">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)} 
              className="flex items-center justify-between py-4 px-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all active:scale-[0.98]"
            >
              <span className="text-base font-semibold text-foreground">Features</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)} 
              className="flex items-center justify-between py-4 px-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all active:scale-[0.98]"
            >
              <span className="text-base font-semibold text-foreground">Pricing</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </a>
            <a 
              href="#testimonials" 
              onClick={() => setMobileMenuOpen(false)} 
              className="flex items-center justify-between py-4 px-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all active:scale-[0.98]"
            >
              <span className="text-base font-semibold text-foreground">Reviews</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </a>
            <a 
              href="#contact" 
              onClick={() => setMobileMenuOpen(false)} 
              className="flex items-center justify-between py-4 px-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all active:scale-[0.98]"
            >
              <span className="text-base font-semibold text-foreground">Contact</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </a>
            <div className="pt-4 space-y-3 border-t-2 border-border">
              <Link to="/auth" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full rounded-xl h-14 text-base font-semibold border-2">
                  Login
                </Button>
              </Link>
              <Link to="/auth" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-xl h-14 text-base font-semibold gap-2 shadow-lg shadow-primary/25">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-accent/20 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-r from-primary/8 to-accent/8 rounded-full blur-[180px]" />
          {/* Additional floating gradients */}
          <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 left-10 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-32 left-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-white/10 hidden lg:flex items-center justify-center animate-bounce-soft" style={{ animationDuration: '3s' }}>
          <Heart className="w-7 h-7 text-blue-500" />
        </div>
        <div className="absolute top-48 right-20 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-white/10 hidden lg:flex items-center justify-center animate-bounce-soft" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <FileText className="w-6 h-6 text-emerald-500" />
        </div>
        <div className="absolute bottom-32 left-20 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-sm border border-white/10 hidden lg:flex items-center justify-center animate-bounce-soft" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <Zap className="w-5 h-5 text-orange-500" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-5xl mx-auto">
            {/* Enhanced Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-violet-500/10 to-accent/10 border border-primary/30 shadow-lg shadow-primary/10 mb-6 lg:mb-8 animate-fade-in hover:scale-105 transition-transform duration-300">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-bold text-foreground">#1 Rated Clinic Management Software in India</span>
              <Badge className="bg-gradient-to-r from-primary to-violet-500 text-white border-0 text-xs font-bold shadow-md">NEW</Badge>
            </div>
            
            {/* Enhanced Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-foreground leading-[1.1] mb-6 lg:mb-8 tracking-tight animate-slide-up">
              <span className="block">Manage Your Clinic</span>
              <span className="block mt-3 relative">
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary via-violet-500 to-accent bg-clip-text text-transparent animate-gradient">
                    10x Faster
                  </span>
                  <svg className="absolute -bottom-4 left-0 w-full h-5 text-primary/50 animate-pulse" viewBox="0 0 200 20" preserveAspectRatio="none">
                    <path d="M0,15 Q50,5 100,15 T200,15" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
              <span className="block mt-4 text-xl sm:text-2xl lg:text-3xl text-muted-foreground font-medium">
                with <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-semibold">AI-Powered Intelligence</span>
              </span>
            </h1>
            
            {/* Enhanced Subheadline */}
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 lg:mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
              AI-powered patient management, smart prescriptions, and seamless appointments — 
              <span className="text-foreground font-semibold"> all in one beautiful platform.</span>
            </p>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link to="/auth">
                <Button size="lg" className="gap-3 text-base lg:text-lg px-10 h-16 lg:h-[72px] w-full sm:w-auto rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.03] transition-all duration-300 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 border-0">
                  <span className="font-bold">Start Free Trial</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-3 text-base lg:text-lg px-10 h-16 lg:h-[72px] rounded-2xl border-2 hover:bg-secondary/80 hover:border-primary/30 transition-all group backdrop-blur-sm bg-background/50">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-violet-500/30 transition-all group-hover:scale-110">
                  <Play className="h-5 w-5 text-primary fill-primary" />
                </div>
                <span className="font-semibold">Watch Demo</span>
              </Button>
            </div>

            {/* Enhanced Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm sm:text-base text-muted-foreground animate-fade-in" style={{ animationDelay: '300ms' }}>
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/20">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="font-medium">No credit card</span>
              </span>
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="font-medium">14-day free trial</span>
              </span>
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                <span className="font-medium">Cancel anytime</span>
              </span>
            </div>
          </div>

          {/* Enhanced Dashboard Preview */}
          <div className="mt-16 lg:mt-24 relative animate-scale-in" style={{ animationDelay: '400ms' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative mx-auto max-w-6xl">
              <div className="absolute -inset-6 bg-gradient-to-r from-primary/30 via-violet-500/30 to-accent/30 rounded-3xl blur-3xl opacity-60 animate-pulse" />
              <div className="relative bg-card/95 backdrop-blur-xl border-2 border-primary/20 rounded-3xl shadow-2xl overflow-hidden hover:border-primary/40 transition-all duration-500">
                <div className="bg-secondary/50 px-4 py-3 flex items-center gap-2 border-b border-border/50">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive/70" />
                    <div className="w-3 h-3 rounded-full bg-warning/70" />
                    <div className="w-3 h-3 rounded-full bg-accent/70" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-background rounded-lg text-xs text-muted-foreground">
                      electromed.app/dashboard
                    </div>
                  </div>
                </div>
                <div className="p-6 lg:p-8 bg-gradient-to-br from-background to-secondary/30">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Today's Patients", value: '24', icon: Users, color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20', border: 'border-blue-500/20' },
                      { label: 'Prescriptions', value: '18', icon: FileText, color: 'text-emerald-500', bg: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20', border: 'border-emerald-500/20' },
                      { label: 'Appointments', value: '12', icon: Calendar, color: 'text-orange-500', bg: 'bg-gradient-to-br from-orange-500/20 to-orange-600/20', border: 'border-orange-500/20' },
                      { label: 'Revenue', value: '₹24K', icon: TrendingUp, color: 'text-violet-500', bg: 'bg-gradient-to-br from-violet-500/20 to-violet-600/20', border: 'border-violet-500/20' }
                    ].map((stat, i) => (
                      <div key={i} className="group p-5 rounded-2xl bg-gradient-to-br from-card to-secondary/30 border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-1">{stat.value}</p>
                        <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-32 lg:h-40 bg-gradient-to-br from-secondary/50 to-secondary rounded-2xl flex items-center justify-center border border-border/30">
                    <p className="text-muted-foreground text-sm">Interactive Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 lg:py-16 border-y border-border/50 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8">TRUSTED BY DOCTORS FROM</p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            {trustedBy.map((brand, index) => (
              <div key={index} className="text-lg lg:text-xl font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`scroll-animate scroll-animate-scale relative group p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-card to-secondary/30 border border-border/50 hover:border-primary/30 transition-all hover:shadow-xl`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm lg:text-base text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px] -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 lg:mb-20 scroll-animate">
            <Badge className="mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary border-primary/20" variant="outline">
              <Zap className="h-3 w-3 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
              Everything You Need,
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Nothing You Don't
              </span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Built by doctors, for doctors. Every feature is designed to save you time and help you focus on what matters — your patients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`scroll-animate scroll-animate-scale group relative border-2 border-border/50 hover:border-primary/50 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 bg-gradient-to-br from-card to-secondary/20`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-4 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 group-hover:shadow-2xl`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl lg:text-2xl font-bold group-hover:text-primary transition-colors mb-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-base lg:text-lg leading-relaxed text-muted-foreground">{feature.description}</CardDescription>
                  <div className="mt-6 flex items-center text-primary font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                    Learn more <ArrowUpRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 lg:py-32 bg-gradient-to-b from-secondary/30 to-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 lg:mb-20 scroll-animate">
            <Badge className="mb-4 px-4 py-2 rounded-full bg-accent/10 text-accent border-accent/20" variant="outline">
              <Heart className="h-3 w-3 mr-2" />
              Simple Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
              Choose Your Perfect Plan
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free for 14 days. No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`scroll-animate scroll-animate-scale relative rounded-3xl overflow-hidden transition-all duration-300 ${
                  plan.popular 
                    ? 'border-2 border-primary shadow-2xl shadow-primary/20 lg:scale-105 z-10' 
                    : 'border-border/50 hover:border-primary/30 hover:shadow-xl'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-accent text-white text-center py-2.5 text-sm font-bold tracking-wide">
                    ⭐ MOST POPULAR
                  </div>
                )}
                <CardHeader className={`${plan.popular ? 'pt-14' : ''} pb-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-primary to-accent' 
                        : 'bg-secondary'
                    }`}>
                      <plan.icon className={`w-6 h-6 ${plan.popular ? 'text-white' : 'text-foreground'}`} />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="pt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-foreground">₹{plan.price}</span>
                      <span className="text-muted-foreground text-lg">/mo</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2 flex-wrap">
                      <span>or ₹{plan.yearlyPrice}/year</span>
                      <Badge variant="secondary">Save 17%</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          plan.popular ? 'bg-primary/20' : 'bg-accent/20'
                        }`}>
                          <Check className={`h-3 w-3 ${plan.popular ? 'text-primary' : 'text-accent'}`} />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className="block">
                    <Button 
                      className={`w-full rounded-2xl h-14 text-base font-semibold transition-all ${
                        plan.popular 
                          ? 'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30' 
                          : ''
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 lg:mb-20 scroll-animate">
            <Badge className="mb-4 px-4 py-2 rounded-full bg-warning/10 text-warning border-warning/20" variant="outline">
              <Star className="h-3 w-3 mr-2 fill-current" />
              Customer Stories
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
              Loved by 10,000+ Doctors
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it. Hear from healthcare professionals who transformed their practice.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className={`scroll-animate scroll-animate-scale relative border-border/50 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
                  activeTestimonial === index ? 'ring-2 ring-primary/30' : ''
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-6 lg:p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground text-lg lg:text-xl leading-relaxed mb-6 font-medium">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">{testimonial.image}</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">{testimonial.name}</p>
                      <p className="text-muted-foreground">{testimonial.role}, {testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Testimonial Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  activeTestimonial === index 
                    ? 'bg-primary w-8' 
                    : 'bg-border hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-600 to-accent animate-gradient" style={{ backgroundSize: '200% 200%' }} />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 scroll-animate scroll-animate-scale">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-white/90 font-medium">Join 10,000+ Happy Doctors</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight scroll-animate">
            Ready to Transform
            <span className="block">Your Practice?</span>
          </h2>
          <p className="text-lg lg:text-xl text-white/80 mb-10 max-w-2xl mx-auto scroll-animate scroll-animate-delay-200">
            Start your free trial today. No credit card required. 
            Get up and running in under 5 minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-lg px-12 h-[72px] bg-white text-primary hover:bg-white/95 shadow-2xl hover:shadow-white/50 rounded-2xl font-bold w-full sm:w-auto hover:scale-105 transition-all duration-300 border-0">
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="gap-2 text-lg px-12 h-[72px] border-2 border-white/80 bg-white/10 backdrop-blur-sm text-white hover:bg-white/25 hover:border-white hover:text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-white/10 w-full sm:w-auto"
            >
              <Phone className="h-5 w-5" />
              <span className="font-bold">Talk to Sales</span>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/70">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              14-day free trial
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 lg:py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="scroll-animate scroll-animate-left">
              <Badge className="mb-4 rounded-full" variant="outline">Contact Us</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Let's Get in Touch
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Have questions? Our team is here to help. Reach out and we'll get back to you within 24 hours.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Phone Support</p>
                    <p className="text-muted-foreground">+91 98765 43210</p>
                    <p className="text-sm text-muted-foreground">Mon-Sat, 9 AM - 7 PM IST</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Email Us</p>
                    <p className="text-muted-foreground">support@electromed.app</p>
                    <p className="text-sm text-muted-foreground">We reply within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Office</p>
                    <p className="text-muted-foreground">123 Tech Park, Sector 62</p>
                    <p className="text-muted-foreground">Noida, UP 201301</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="scroll-animate scroll-animate-right rounded-3xl border-border/50 overflow-hidden">
              <CardContent className="p-6 lg:p-8">
                <h3 className="text-xl font-bold text-foreground mb-6">Send us a message</h3>
                <form className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                      <input 
                        type="text" 
                        className="medical-input"
                        placeholder="Dr. John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                      <input 
                        type="tel" 
                        className="medical-input"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <input 
                      type="email" 
                      className="medical-input"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                    <textarea 
                      rows={4}
                      className="medical-input resize-none"
                      placeholder="Tell us about your clinic..."
                    />
                  </div>
                  <Button className="w-full h-14 rounded-xl text-base font-semibold shadow-lg">
                    Send Message
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative py-16 lg:py-20 bg-gradient-to-br from-foreground via-foreground to-slate-900 text-background overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Main Footer Content */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-accent shadow-xl shadow-primary/30">
                  <Stethoscope className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-background">ElectroMed</h3>
                  <p className="text-sm text-background/70 font-medium">AI-Powered Clinic Software</p>
                </div>
              </div>
              <p className="text-background/80 mb-6 leading-relaxed max-w-md">
                India's #1 clinic management software. Trusted by 10,000+ doctors across the country. Transform your practice with AI-powered solutions.
              </p>
              
              {/* Social Media Links */}
              <div className="flex gap-3 mb-6">
                <a 
                  href="#" 
                  className="group w-11 h-11 rounded-xl bg-background/10 hover:bg-gradient-to-br hover:from-primary hover:to-accent flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/30"
                  aria-label="Website"
                >
                  <Globe className="h-5 w-5 text-background/70 group-hover:text-white transition-colors" />
                </a>
                <a 
                  href="#" 
                  className="group w-11 h-11 rounded-xl bg-background/10 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30"
                  aria-label="Facebook"
                >
                  <MessageSquare className="h-5 w-5 text-background/70 group-hover:text-white transition-colors" />
                </a>
                <a 
                  href="#" 
                  className="group w-11 h-11 rounded-xl bg-background/10 hover:bg-gradient-to-br hover:from-emerald-500 hover:to-emerald-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-emerald-500/30"
                  aria-label="WhatsApp"
                >
                  <Phone className="h-5 w-5 text-background/70 group-hover:text-white transition-colors" />
                </a>
                <a 
                  href="#" 
                  className="group w-11 h-11 rounded-xl bg-background/10 hover:bg-gradient-to-br hover:from-violet-500 hover:to-violet-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-violet-500/30"
                  aria-label="LinkedIn"
                >
                  <TrendingUp className="h-5 w-5 text-background/70 group-hover:text-white transition-colors" />
                </a>
              </div>

              {/* Newsletter Subscription */}
              <div className="p-4 rounded-2xl bg-background/5 border border-background/10">
                <p className="text-sm font-semibold text-background mb-2">Stay Updated</p>
                <p className="text-xs text-background/60 mb-3">Get the latest updates and features</p>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-xl bg-background/10 border border-background/20 text-background placeholder:text-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  />
                  <Button className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-sm font-semibold shadow-lg shadow-primary/30">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h4 className="font-bold text-background mb-6 text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Product
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Features</span>
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Pricing</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Integrations</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>API Docs</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Changelog</span>
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h4 className="font-bold text-background mb-6 text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>About Us</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Careers</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Blog</span>
                  </a>
                </li>
                <li>
                  <a href="#contact" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Contact</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Partners</span>
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Legal & Support Links */}
            <div>
              <h4 className="font-bold text-background mb-6 text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-warning" />
                Legal & Support
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Privacy Policy</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Terms of Service</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>HIPAA Compliance</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Security</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Help Center</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="pt-8 border-t-2 border-background/20">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <p className="text-background/70 text-sm">
                  © 2024 ElectroMed. All rights reserved.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <a href="#" className="text-background/60 hover:text-background transition-colors">Privacy</a>
                  <span className="text-background/30">•</span>
                  <a href="#" className="text-background/60 hover:text-background transition-colors">Terms</a>
                  <span className="text-background/30">•</span>
                  <a href="#" className="text-background/60 hover:text-background transition-colors">Cookies</a>
                </div>
              </div>
              <div className="flex items-center gap-2 text-background/70 text-sm">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-destructive fill-destructive animate-pulse" />
                <span>in</span>
                <span className="font-semibold text-background">India</span>
                <Award className="h-4 w-4 text-warning ml-1" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
