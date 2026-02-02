import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const HeroScene = lazy(() => import('@/components/landing/HeroScene').then((m) => ({ default: m.HeroScene })));
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  FileText, 
  Users, 
  Calendar, 
  MessageSquare,
  Shield,
  Check,
  ArrowRight,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Globe,
  Zap,
  Heart,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowUpRight,
  Cpu,
  Database,
  BookOpen,
  Eye,
  Clock,
  Sparkles,
  XCircle,
  UserCheck,
  GraduationCap,
  Building2,
  Lock,
  Scale,
  Monitor,
  Smartphone,
  Cloud,
  UserPlus,
  ClipboardList,
  Search,
  RefreshCw,
  Layers,
  ArrowUp
} from 'lucide-react';

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

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

  const usps = [
    { icon: Cpu, title: 'Rule-Engine-Driven Clinical Intelligence', description: 'Built on a proprietary Smart Rule Engine that applies homeopathic logic systematically — not black-box algorithms.', gradient: 'from-teal-500 to-cyan-500' },
    { icon: BookOpen, title: 'Structured Case-Taking', description: 'Inspired by classical homeopathy: mind, generals, particulars, and modalities — organized for thorough case analysis.', gradient: 'from-emerald-500 to-teal-500' },
    { icon: Database, title: 'Real Repertory & Clinical Data', description: 'Authentic homeopathic databases and repertory data form the foundation — validated, evidence-based sources.', gradient: 'from-teal-600 to-emerald-600' },
    { icon: Eye, title: 'Transparent Insights with Visible Logic', description: 'See the reasoning behind every suggestion. Matched rubrics, scoring, and clinical context — no hidden outputs.', gradient: 'from-cyan-500 to-teal-500' },
    { icon: Clock, title: 'Reduces Cognitive Load & Saves Time', description: 'Streamline case analysis and documentation so you focus on patient care, not administrative burden.', gradient: 'from-emerald-600 to-teal-600' },
    { icon: Sparkles, title: 'AI-Enhanced, Not AI-Dependent', description: 'AI and ML enhance pattern recognition and learning — they optimize and assist, but never override clinical logic.', gradient: 'from-teal-500 to-emerald-500' },
    { icon: UserCheck, title: 'Doctor-Controlled Decision Support', description: 'You remain in charge. Final diagnosis and prescription always stay with the practitioner — we assist, never decide.', gradient: 'from-teal-600 to-cyan-500' }
  ];

  const howItWorksSteps = [
    { step: 1, title: 'Smart Rule Engine', desc: 'Built on homeopathic logic, not generic algorithms' },
    { step: 2, title: 'Authentic Data', desc: 'Real repertory and clinical databases' },
    { step: 3, title: 'Doctor Refinement', desc: 'Insights from 100+ experienced practitioners' },
    { step: 4, title: 'AI Enhancement', desc: 'Pattern recognition and learning — enhances, never overrides' },
    { step: 5, title: 'Transparent Output', desc: 'Visible logic, no black-box results' }
  ];

  const doesNotDo = [
    'Does not replace doctors',
    'Does not auto-prescribe remedies',
    'Does not override clinical judgment',
    'Does not rely on AI alone'
  ];

  const howItHelps = [
    { icon: GraduationCap, title: 'Junior Doctors', desc: 'Structure and guidance for thorough case-taking and remedy selection. Learn classical principles while building confidence.' },
    { icon: UserCheck, title: 'Experienced Doctors', desc: 'Speed and clarity. Reduce repetitive analysis, get organized insights, and document cases efficiently.' },
    { icon: Building2, title: 'Busy Clinics', desc: 'Consistency and efficiency across practitioners. Maintain quality while scaling patient volume.' }
  ];

  const workflowSteps = [
    { icon: UserPlus, title: 'First Visit', desc: 'Register the patient and capture essential details in one place' },
    { icon: ClipboardList, title: 'Structured Case-Taking', desc: 'Record mind, generals, particulars, and modalities — guided, not automated' },
    { icon: Search, title: 'Intelligent Analysis', desc: 'Rule-engine suggests rubrics and remedies; you review and refine' },
    { icon: FileText, title: 'Prescription & Planning', desc: 'Document the prescription and plan with full clinical context' },
    { icon: RefreshCw, title: 'Progress Tracking', desc: 'Track follow-ups, outcomes, and case evolution over time' },
    { icon: Layers, title: 'Unified Records', desc: 'Patient history, prescriptions, and clinic data — all in one platform' }
  ];

  const workflowUsps = [
    'Complete patient journey — from first visit to follow-ups',
    'Integrated clinic and patient management in one place',
    'Structured case-taking with intelligent, doctor-guided support',
    'Works seamlessly across web and mobile — practice anywhere'
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
        'Rule-Engine Support',
        'Digital Prescriptions',
        'Basic Appointments',
        'Email Support'
      ],
      popular: false,
      cta: 'Request Demo',
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
        'Full Decision Support',
        'WhatsApp Integration',
        'Priority Support',
        'Analytics Dashboard',
        'Custom Branding'
      ],
      popular: true,
      cta: 'Request Demo',
      icon: TrendingUp
    },
    {
      name: 'Enterprise',
      price: '4,999',
      yearlyPrice: '49,990',
      description: 'For clinics & chains',
      features: [
        'Unlimited Doctors',
        'Unlimited Everything',
        'Multi-branch Support',
        'Dedicated Manager',
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
      role: 'Classical Homeopath',
      location: 'Delhi',
      content: 'The structured case-taking and transparent remedy logic give me confidence. I see exactly why a remedy is suggested — no guesswork.',
      image: 'RS'
    },
    {
      name: 'Dr. Priya Patel',
      role: 'Electro Homeopathy Practitioner',
      location: 'Mumbai',
      content: 'The rule engine is built on real homeopathic principles. It assists my decisions without replacing my clinical judgment. Exactly what I needed.',
      image: 'PP'
    },
    {
      name: 'Dr. Anil Kumar',
      role: 'Clinic Director',
      location: 'Bangalore',
      content: 'Our junior doctors get structured guidance; our seniors save time. The platform respects classical homeopathy while bringing modern efficiency.',
      image: 'AK'
    },
    {
      name: 'Dr. Sunita Verma',
      role: 'Homeopathic Practitioner',
      location: 'Jaipur',
      content: 'I appreciate that Homeolytics doesn\'t claim to prescribe for me. It supports my thinking with clear, evidence-based insights. Trustworthy.',
      image: 'SV'
    }
  ];

  const differentiators = [
    { label: 'Smart Rule Engine', icon: Cpu },
    { label: 'Authentic Data', icon: Database },
    { label: 'Expert Refined', icon: UserCheck },
    { label: 'Complete Clinic Workflow', icon: Layers },
    { label: 'Transparent Output', icon: Eye }
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#0c1222] overflow-x-hidden overflow-y-auto">
      {/* Navigation - enhanced header & navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || mobileMenuOpen
          ? 'bg-white dark:bg-slate-900 border-b border-stone-200/80 dark:border-slate-800/80 shadow-lg shadow-stone-200/20 dark:shadow-slate-900/50' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? 'h-16 lg:h-16' : 'h-20 lg:h-20'}`}>
            {/* Logo / Brand */}
            <a href="#" className="flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md shadow-teal-500/25 group-hover:shadow-lg group-hover:shadow-teal-500/30 transition-all group-hover:scale-105">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight font-display group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">Homeolytics</h1>
                <p className="text-[10px] text-stone-500 dark:text-slate-400 font-medium hidden sm:block tracking-wide">Where homeopathy meets intelligence</p>
              </div>
            </a>

            {/* Desktop Navigation - streamlined */}
            <div className="hidden lg:flex items-center gap-1">
              {[
                { href: '#features', label: 'Features' },
                { href: '#workflow', label: 'Workflow' },
                { href: '#comparison', label: 'Compare' },
                { href: '#pricing', label: 'Pricing' },
                { href: '#contact', label: 'Contact' }
              ].map((item) => (
                <a 
                  key={item.href} 
                  href={item.href} 
                  className="relative px-4 py-2.5 text-sm font-medium text-stone-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-teal-50/80 dark:hover:bg-teal-950/50 transition-all group"
                >
                  {item.label}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full group-hover:w-3/4 transition-all duration-300" />
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="h-6 w-px bg-stone-200 dark:bg-slate-700" />
              <Link to="/auth">
                <Button variant="ghost" className="font-medium text-stone-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 rounded-lg transition-colors">
                  Login
                </Button>
              </Link>
              <a href="#contact">
                <Button className="gap-2 rounded-xl px-6 h-11 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all">
                  Request Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            {/* Mobile menu button - 44px min touch target */}
            <button 
              className="lg:hidden p-3 min-w-[44px] min-h-[44px] rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-stone-200/80 dark:border-slate-700 shadow-sm hover:bg-teal-50 dark:hover:bg-teal-950/50 active:bg-teal-100 dark:active:bg-teal-900/50 transition-all touch-manipulation"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-stone-700 dark:text-slate-300" /> : <Menu className="h-6 w-6 text-stone-700 dark:text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Mobile menu backdrop */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 top-[5rem] bg-black/20 dark:bg-black/40 z-40 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        {/* Mobile Navigation - solid background for visibility */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 shadow-2xl animate-slide-up overflow-y-auto max-h-[calc(100vh-5rem)] z-50">
            <div className="p-5 sm:p-6 space-y-1">
              {[
                { href: '#features', label: 'Features', icon: '→' },
                { href: '#workflow', label: 'Workflow', icon: '→' },
                { href: '#comparison', label: 'Compare', icon: '→' },
                { href: '#pricing', label: 'Pricing', icon: '→' },
                { href: '#contact', label: 'Contact', icon: '→' }
              ].map((item) => (
                <a 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="flex items-center justify-between py-4 px-4 rounded-xl bg-stone-50/80 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-950/50 active:bg-teal-100 dark:active:bg-teal-900/50 border border-stone-100/80 dark:border-slate-700/50 transition-all group min-h-[52px] touch-manipulation"
                >
                  <span className="text-base font-semibold text-stone-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400">{item.label}</span>
                  <ChevronRight className="h-5 w-5 text-stone-500 dark:text-slate-400 group-hover:text-teal-500 shrink-0" />
                </a>
              ))}
              <div className="pt-4 mt-4 border-t border-stone-200 dark:border-slate-800 space-y-3">
                <Link to="/auth" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl h-14 text-base font-semibold border-2 border-stone-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-all">
                    Login
                  </Button>
                </Link>
                <a href="#contact" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-xl h-14 text-base font-semibold gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25">
                    Request Demo
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - enhanced with gradients + Three.js 3D background */}
      <section className="relative pt-24 sm:pt-28 lg:pt-44 pb-20 sm:pb-28 lg:pb-40 overflow-hidden bg-gradient-to-br from-teal-50/60 via-[#f5f7f6] to-emerald-50/40 dark:from-teal-950/30 dark:via-[#0f172a] dark:to-emerald-950/20">
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        </ErrorBoundary>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-teal-300/40 to-cyan-200/30 dark:from-teal-700/25 dark:to-cyan-900/15 rounded-full blur-[160px]" />
          <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-emerald-300/35 dark:bg-emerald-800/20 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-200/25 dark:bg-teal-800/15 rounded-full blur-[120px]" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/50 border border-teal-200/50 dark:border-teal-800/50 shadow-lg shadow-teal-500/5 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-sm font-medium text-teal-800 dark:text-teal-400">Clinical Decision Support for Homeopathy</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-[#1a1a1a] dark:text-white leading-[1.15] tracking-tight font-display mb-8 sm:mb-10 lg:mb-12 px-1">
              Where homeopathy meets <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 dark:from-teal-400 dark:via-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">intelligence</span>.
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-[#4a4a4a] dark:text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
              Rule-driven, data-assisted clinical decision support for homeopathic practitioners.
            </p>
            <p className="text-base text-[#5c5c5c] dark:text-slate-400 mb-12 max-w-xl mx-auto">
              Built on authentic repertory data and refined with insights from 100+ experienced doctors.
            </p>
            <p className="text-sm font-medium text-teal-800 dark:text-teal-400 mb-14 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Designed to assist doctors, not replace them
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#contact">
                <Button size="lg" className="gap-2 text-sm px-8 h-12 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 dark:from-teal-500 dark:to-emerald-500 dark:hover:from-teal-600 dark:hover:to-emerald-600 text-white font-medium w-full sm:w-auto shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all hover:-translate-y-0.5">
                  Request Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#contact">
                <Button size="lg" variant="outline" className="gap-2 text-sm px-8 h-12 rounded-xl border-2 border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 text-stone-700 dark:text-slate-300 w-full sm:w-auto font-medium transition-all">
                  Join Waitlist
                </Button>
              </a>
            </div>
          </div>
        </div>
        
        {/* Hero visual - dashboard preview */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16 lg:mt-24 relative">
          <div className="relative rounded-2xl border border-teal-200/70 dark:border-teal-800/50 bg-white dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-teal-500/10 dark:shadow-teal-900/20 overflow-hidden ring-1 ring-stone-200/50 dark:ring-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-emerald-500/5" />
            <div className="relative p-6 lg:p-8">
              <div className="flex gap-2 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/90" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[{ label: 'Patients Today', value: '24', icon: Users }, { label: 'Prescriptions', value: '18', icon: FileText }, { label: 'Appointments', value: '12', icon: Calendar }, { label: 'Active Cases', value: '8', icon: TrendingUp }].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-stone-50/80 to-teal-50/40 dark:from-slate-800/80 dark:to-teal-950/40 border border-teal-100/60 dark:border-slate-700/60 hover:border-teal-200/80 dark:hover:border-teal-800/50 transition-all group">
                    <item.icon className="h-5 w-5 text-teal-600 dark:text-teal-400 mb-2 group-hover:scale-105 transition-transform" />
                    <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white">{item.value}</p>
                    <p className="text-xs font-medium text-[#5c5c5c] dark:text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: 'Case Analysis', icon: Search }, { label: 'Repertory', icon: BookOpen }, { label: 'Prescription', icon: FileText }].map((item, i) => (
                  <div key={i} className="h-14 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50/90 dark:from-teal-950/50 dark:to-emerald-950/40 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center gap-2 hover:from-teal-100 hover:to-emerald-100/80 dark:hover:from-teal-900/60 dark:hover:to-emerald-900/50 hover:border-teal-300/80 transition-all group cursor-default">
                    <item.icon className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators - compact enhanced badges */}
      <section className="py-8 sm:py-10 border-y border-teal-200/40 dark:border-slate-700/60 bg-gradient-to-r from-white via-emerald-50/40 to-teal-50/30 dark:from-slate-900/80 dark:via-teal-950/25 dark:to-slate-900/80 shadow-[inset_0_1px_0_rgba(20,184,166,0.06)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
            {differentiators.map((item, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-lg bg-white/95 dark:bg-slate-800/70 border border-teal-100/80 dark:border-slate-600/50 shadow-[0_1px_3px_rgba(20,184,166,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] text-[13px] font-medium text-[#2d2d2d] dark:text-slate-100 hover:border-teal-300/80 dark:hover:border-teal-500/40 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 transition-all duration-200"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-900/50 shrink-0">
                  <item.icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Positioning - moved up for trust */}
      <section id="positioning" className="section-padding bg-gradient-to-b from-[#f8f7f5] via-[#faf9f7] to-white dark:from-slate-900/50 dark:via-slate-900/70 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 lg:mb-20 scroll-animate">
            <p className="text-sm font-medium text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-4">Core positioning</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-white mb-6 tracking-tight font-display">
              Doctor decides. Intelligence assists.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="scroll-animate scroll-animate-left rounded-2xl border border-teal-200/60 dark:border-teal-800/50 shadow-lg shadow-teal-500/8 bg-white dark:bg-slate-800/40 overflow-hidden p-8 hover:shadow-xl hover:shadow-teal-500/15 hover:border-teal-300/70 dark:hover:border-teal-700/60 transition-all duration-300 ring-1 ring-teal-500/5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">What Homeolytics IS</h3>
              </div>
              <ul className="space-y-4 text-[#4a4a4a] dark:text-slate-300 text-sm leading-relaxed">
                <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-0.5 text-teal-600 flex-shrink-0" /> Clinical decision-support for case-taking and analysis</li>
                <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-0.5 text-teal-600 flex-shrink-0" /> Rule-engine-driven, principle-based logic</li>
                <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-0.5 text-teal-600 flex-shrink-0" /> An assistant that enhances your clinical judgment</li>
                <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-0.5 text-teal-600 flex-shrink-0" /> Transparent, traceable insights</li>
              </ul>
            </Card>
            <Card className="scroll-animate scroll-animate-right rounded-2xl border border-stone-200/80 dark:border-slate-700/80 shadow-lg shadow-stone-200/20 dark:shadow-slate-900/30 bg-white dark:bg-slate-800/40 overflow-hidden p-8 hover:shadow-xl hover:border-stone-300/80 dark:hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-slate-700 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-stone-500 dark:text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">What Homeolytics is NOT</h3>
              </div>
              <ul className="space-y-4 text-[#4a4a4a] dark:text-slate-300 text-sm leading-relaxed">
                <li className="flex items-start gap-3"><XCircle className="h-4 w-4 mt-0.5 text-stone-400 flex-shrink-0" /> A replacement for doctors</li>
                <li className="flex items-start gap-3"><XCircle className="h-4 w-4 mt-0.5 text-stone-400 flex-shrink-0" /> An auto-prescription tool</li>
                <li className="flex items-start gap-3"><XCircle className="h-4 w-4 mt-0.5 text-stone-400 flex-shrink-0" /> Pure AI — we are rule-driven first</li>
                <li className="flex items-start gap-3"><XCircle className="h-4 w-4 mt-0.5 text-stone-400 flex-shrink-0" /> A black-box system</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* USP Section - Key features early */}
      <section id="features" className="section-padding bg-gradient-to-b from-white via-teal-50/10 to-[#f8f7f5] dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20 lg:mb-24 scroll-animate">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Why Homeolytics</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-white mb-6 tracking-tight font-display">
              Rule-driven. Transparent. Trusted.
            </h2>
            <p className="text-lg text-[#4a4a4a] dark:text-slate-400 max-w-xl mx-auto">
              Clinically guided logic and transparent insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {usps.map((usp, index) => (
              <Card 
                key={index} 
                className="scroll-animate scroll-animate-scale group rounded-2xl border border-stone-200/80 dark:border-slate-700/50 overflow-hidden p-6 lg:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/15 hover:border-teal-300/60 dark:hover:border-teal-700/50 hover:-translate-y-1 bg-white dark:bg-slate-800/40 ring-1 ring-stone-100/50 dark:ring-slate-700/30 hover:ring-teal-500/10"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${usp.gradient} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform`}>
                  <usp.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-[#1a1a1a] dark:text-white mb-3">{usp.title}</h3>
                <p className="text-sm text-[#4a4a4a] dark:text-slate-300 leading-relaxed">{usp.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How Homeolytics Works - visual flow */}
      <section id="how-it-works" className="section-padding bg-gradient-to-b from-[#f8f7f5] via-white to-emerald-50/25 dark:from-slate-950 dark:via-slate-900/50 dark:to-teal-950/30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20 lg:mb-28 scroll-animate">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">How it works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-stone-900 dark:text-white mb-6 tracking-tight font-display">
              Transparent, principle-based
            </h2>
            <p className="text-lg text-stone-600 dark:text-slate-400 max-w-xl mx-auto">
              Demystifying how insights are generated.
            </p>
          </div>

          {/* Visual flow - steps with arrows */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 lg:gap-6 flex-wrap">
            {howItWorksSteps.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="scroll-animate scroll-animate-scale flex flex-col items-center text-center group" style={{ transitionDelay: `${index * 100}ms` }}>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mb-5 shadow-lg shadow-teal-500/25 ring-2 ring-teal-500/20 group-hover:scale-105 group-hover:shadow-teal-500/30 transition-all">
                    <span className="text-sm font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#1a1a1a] dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-[#5c5c5c] dark:text-slate-400 leading-relaxed max-w-[140px]">{item.desc}</p>
                </div>
                {index < howItWorksSteps.length - 1 && (
                  <ChevronRight className="hidden lg:block w-5 h-5 text-stone-300 dark:text-slate-600 flex-shrink-0 -mt-8" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-20 lg:mt-24 p-8 lg:p-10 rounded-2xl bg-gradient-to-br from-teal-50/90 to-emerald-50/80 dark:from-teal-950/50 dark:to-emerald-950/40 border border-teal-200/70 dark:border-teal-700/50 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500/5 scroll-animate">
            <p className="text-[#4a4a4a] dark:text-slate-300 text-center max-w-2xl mx-auto leading-relaxed">
              <span className="font-semibold text-[#1a1a1a] dark:text-white">No black-box outputs.</span> Every suggestion is traceable to repertory data, rule logic, and clinician-validated patterns. AI enhances pattern recognition — never overrides homeopathic principles.
            </p>
          </div>
        </div>
      </section>

      {/* End-to-End Clinical Workflow - moved up */}
      <section id="workflow" className="section-padding bg-gradient-to-b from-emerald-50/25 via-white to-[#f8f7f5] dark:from-teal-950/20 dark:via-slate-900/50 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 scroll-animate">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Clinic & patient management</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-white tracking-tight font-display">
              End-to-end clinical workflow
            </h2>
            <p className="text-[#4a4a4a] dark:text-slate-300 mt-4 max-w-2xl mx-auto">
              Unified patient and clinic management — from first visit through prescription and follow-ups. One platform, one workflow.
            </p>
          </div>

          <div className="scroll-animate space-y-4 mb-16">
            {workflowSteps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-5 p-6 rounded-2xl border border-stone-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 shadow-sm hover:shadow-lg hover:shadow-teal-500/5 hover:border-teal-200/60 dark:hover:border-teal-800/50 transition-all duration-300 group"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                  {index + 1}
                </div>
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-stone-100 dark:bg-slate-700/60 flex items-center justify-center group-hover:bg-teal-50 dark:group-hover:bg-teal-950/30 transition-colors">
                  <step.icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1a1a1a] dark:text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-[#4a4a4a] dark:text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
                {index < workflowSteps.length - 1 && (
                  <ChevronRight className="hidden sm:block flex-shrink-0 h-5 w-5 text-stone-300 dark:text-slate-600 mt-2" />
                )}
              </div>
            ))}
          </div>

          <div className="scroll-animate grid sm:grid-cols-2 gap-4 mb-12">
            {workflowUsps.map((usp, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-stone-200/60 dark:border-slate-700/50 hover:border-teal-200/60 dark:hover:border-teal-800/40 transition-colors">
                <Check className="h-5 w-5 text-teal-600 dark:text-teal-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#3d3d3d] dark:text-slate-300 font-medium">{usp}</p>
              </div>
            ))}
          </div>

          <div className="scroll-animate text-center p-6 rounded-2xl bg-gradient-to-r from-teal-50/90 to-emerald-50/70 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200/70 dark:border-teal-800/50 shadow-sm ring-1 ring-teal-500/5">
            <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">
              Doctor decides. Intelligence assists. Everything in one place — designed to support your workflow, not replace it.
            </p>
          </div>
        </div>
      </section>

      {/* How It Helps Doctors */}
      <section id="helps-doctors" className="section-padding bg-gradient-to-b from-white via-stone-50/30 to-white dark:from-slate-900/30 dark:via-slate-900/50 dark:to-slate-900/30">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20 scroll-animate">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Who it helps</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-white tracking-tight font-display">
              How it helps doctors
            </h2>
            <p className="text-[#4a4a4a] dark:text-slate-400 mt-4 max-w-xl mx-auto">
              Whether you're building experience or scaling your practice.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {howItHelps.map((item, index) => (
              <Card key={index} className="scroll-animate scroll-animate-scale group rounded-2xl border border-stone-200/80 dark:border-slate-700/50 overflow-hidden p-6 lg:p-8 hover:shadow-xl hover:border-teal-200/50 dark:hover:border-teal-800/50 hover:-translate-y-1 transition-all bg-white dark:bg-slate-800/30" style={{ transitionDelay: `${index * 100}ms` }}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-base font-semibold text-[#1a1a1a] dark:text-white mb-3">{item.title}</h3>
                <p className="text-sm text-[#4a4a4a] dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Comparison - Comprehensive Table */}
      <section id="comparison" className="section-padding bg-gradient-to-b from-[#f8f7f5] via-white to-teal-50/10 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 scroll-animate">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Why Homeolytics</p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-white tracking-tight font-display">
              See the difference
            </h2>
            <p className="text-[#4a4a4a] dark:text-slate-300 mt-4 max-w-2xl mx-auto">
              A clear comparison of capabilities across traditional tools, generic AI, and Homeolytics.
            </p>
          </div>

          {/* Comparison Table - horizontal scroll on mobile */}
          <div className="scroll-animate rounded-2xl border border-stone-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 shadow-xl shadow-stone-200/30 dark:shadow-slate-900/50 overflow-hidden ring-1 ring-stone-200/50 dark:ring-slate-700/50">
            <p className="text-xs text-center text-stone-500 dark:text-slate-500 py-2 px-4 lg:hidden">← Swipe to scroll table →</p>
            <div className="overflow-x-auto scrollbar-thin -mx-4 sm:mx-0 px-4 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-[700px]">
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-stone-200 dark:border-slate-700">
                    <th className="text-left py-5 px-6 bg-stone-50/80 dark:bg-slate-800/50">
                      <span className="text-sm font-semibold text-stone-700 dark:text-slate-300">Capability</span>
                    </th>
                    <th className="text-center py-5 px-4 bg-stone-50/80 dark:bg-slate-800/50">
                      <div className="flex flex-col items-center gap-1">
                        <Monitor className="h-5 w-5 text-stone-500 dark:text-slate-400" />
                        <span className="text-xs font-semibold text-stone-600 dark:text-slate-400">Traditional<br/>Repertory Tools</span>
                      </div>
                    </th>
                    <th className="text-center py-5 px-4 bg-stone-50/80 dark:bg-slate-800/50">
                      <div className="flex flex-col items-center gap-1">
                        <Sparkles className="h-5 w-5 text-stone-500 dark:text-slate-400" />
                        <span className="text-xs font-semibold text-stone-600 dark:text-slate-400">Generic<br/>AI Tools</span>
                      </div>
                    </th>
                    <th className="text-center py-5 px-4 bg-gradient-to-b from-teal-50 to-teal-100/50 dark:from-teal-950/50 dark:to-teal-900/30 border-x-2 border-t-2 border-teal-200 dark:border-teal-800">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/20">
                          <Stethoscope className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-400">Homeolytics</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-700/50">
                  {/* Clinical Foundation */}
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Classical homeopathy foundation</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800"><Check className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Rule-based clinical logic</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800"><Check className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Authentic repertory & clinical databases</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800"><Check className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Inputs refined by experienced doctors</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Limited</span></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">✓ 100+ doctors</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">AI-enhanced pattern recognition</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800"><Check className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Doctor-controlled decisions</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800"><Check className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Transparent reasoning & logic trails</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Partial</span></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800"><Check className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Ethical clinical boundaries</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Limited</span></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800"><Check className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto" /></td>
                  </tr>
                  {/* Accessibility & Platform - highlighted section */}
                  <tr className="bg-stone-50/80 dark:bg-slate-800/40">
                    <td colSpan={4} className="py-3 px-6">
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Accessibility & Platform</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Installation requirement</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Desktop install</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Cloud-based</span></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">Cloud-native</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Device accessibility</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">PC / Laptop</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Mostly desktop</span></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">Mobile • Tablet • Desktop</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Dedicated mobile app</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800"><Check className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Ease of use & learning curve</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Complex</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Variable</span></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">Simple & doctor-friendly</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Cost accessibility</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">High & rigid</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Variable</span></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-teal-200 dark:border-teal-800">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">Designed to be accessible</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium">Future-ready architecture</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Limited</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">AI-dependent</span></td>
                    <td className="py-4 px-4 text-center bg-teal-50/30 dark:bg-teal-950/20 border-x-2 border-b-2 border-teal-200 dark:border-teal-800 rounded-br-xl">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">Built to evolve</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Below-table explanation */}
          <div className="mt-12 scroll-animate">
            {/* Focus comparison - 3 lines */}
            <div className="grid md:grid-cols-3 gap-4 mb-10">
              <div className="text-center p-5 rounded-xl bg-stone-100/80 dark:bg-slate-800/40 border border-stone-200/70 dark:border-slate-700/50 hover:border-stone-300/80 transition-colors">
                <Monitor className="h-6 w-6 text-stone-500 dark:text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-stone-600 dark:text-slate-400">
                  <span className="font-semibold text-stone-700 dark:text-slate-300">Traditional tools</span> focus on repertorization.
                </p>
              </div>
              <div className="text-center p-5 rounded-xl bg-stone-100/80 dark:bg-slate-800/40 border border-stone-200/70 dark:border-slate-700/50 hover:border-stone-300/80 transition-colors">
                <Sparkles className="h-6 w-6 text-stone-500 dark:text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-stone-600 dark:text-slate-400">
                  <span className="font-semibold text-stone-700 dark:text-slate-300">Generic AI tools</span> focus on automation.
                </p>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/20 border-2 border-teal-200/80 dark:border-teal-800/60 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-md shadow-teal-500/20">
                  <Stethoscope className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm text-teal-800 dark:text-teal-300">
                  <span className="font-bold">Homeolytics</span> focuses on <span className="font-semibold">clinically guided intelligence</span>.
                </p>
              </div>
            </div>

            {/* Short explanation */}
            <div className="max-w-3xl mx-auto text-center px-6 py-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-700/50 shadow-xl shadow-stone-200/25 dark:shadow-slate-900/40 ring-1 ring-stone-100/80 dark:ring-slate-700/30">
              <p className="text-base text-stone-700 dark:text-slate-300 leading-relaxed">
                Homeolytics combines a <span className="font-semibold text-teal-700 dark:text-teal-400">proprietary smart rule engine</span>, authentic homeopathic databases, and insights refined by <span className="font-semibold text-teal-700 dark:text-teal-400">experienced doctors</span> — enhanced by AI and machine learning — to support confident clinical decisions <span className="font-semibold text-teal-700 dark:text-teal-400">across devices</span>.
              </p>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200/70 dark:border-teal-800/60 text-sm font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-100/80 dark:hover:bg-teal-900/40 transition-colors">
                <Check className="h-4 w-4" /> Classical foundation
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200/70 dark:border-teal-800/60 text-sm font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-100/80 dark:hover:bg-teal-900/40 transition-colors">
                <Check className="h-4 w-4" /> AI-enhanced
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200/70 dark:border-teal-800/60 text-sm font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-100/80 dark:hover:bg-teal-900/40 transition-colors">
                <Check className="h-4 w-4" /> Doctor-controlled
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200/70 dark:border-teal-800/60 text-sm font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-100/80 dark:hover:bg-teal-900/40 transition-colors">
                <Smartphone className="h-4 w-4" /> Mobile-first
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What Homeolytics Does NOT Do - confidence builder */}
      <section id="does-not-do" className="section-padding bg-gradient-to-b from-teal-50/10 to-[#f8f7f5] dark:from-slate-900/50 dark:to-slate-950">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 scroll-animate">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Clear boundaries</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#1a1a1a] dark:text-white tracking-tight font-display">
              What Homeolytics does not do
            </h2>
            <p className="text-[#4a4a4a] dark:text-slate-300 mt-4">Confidence and safety.</p>
          </div>

          <div className="space-y-4">
            {doesNotDo.map((item, index) => (
              <div key={index} className="scroll-animate flex items-center gap-4 py-5 px-6 rounded-xl bg-white dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-lg hover:border-teal-200/60 dark:hover:border-teal-800/50 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0 ring-1 ring-red-200/50 dark:ring-red-900/30 group-hover:ring-red-300/60 transition-all">
                  <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
                <p className="text-[#3d3d3d] dark:text-slate-300 font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - moved up for conversion */}
      <section id="pricing" className="section-padding bg-gradient-to-b from-emerald-50/20 via-white to-stone-50/30 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20 scroll-animate">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Pricing</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-white mb-6 tracking-tight font-display">
              Choose your plan
            </h2>
            <p className="text-[#4a4a4a] dark:text-slate-300">
              Request a demo or join the waitlist. No commitment required.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`scroll-animate scroll-animate-scale relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  plan.popular 
                    ? 'border-2 border-teal-400 dark:border-teal-600 shadow-2xl shadow-teal-500/20 bg-gradient-to-b from-white to-teal-50/40 dark:from-slate-800 dark:to-teal-950/40 lg:scale-[1.02] z-10 ring-4 ring-teal-500/15' 
                    : 'border border-stone-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 hover:border-teal-300 dark:hover:border-teal-800 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-center py-2.5 text-xs font-semibold tracking-widest uppercase">
                    Most popular
                  </div>
                )}
                <CardHeader className={`${plan.popular ? 'pt-12' : 'pt-8'} pb-6 px-8`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.popular ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-stone-200 dark:bg-slate-700'
                    }`}>
                      <plan.icon className={`w-5 h-5 ${plan.popular ? 'text-white' : 'text-stone-600 dark:text-slate-400'}`} />
                    </div>
                    <CardTitle className="text-xl font-semibold text-stone-900 dark:text-white">{plan.name}</CardTitle>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-slate-400">{plan.description}</p>
                  <div className="pt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-semibold text-stone-900 dark:text-white tracking-tight">₹{plan.price}</span>
                      <span className="text-stone-500 dark:text-slate-500 text-base">/mo</span>
                    </div>
                    <p className="text-sm text-stone-500 dark:text-slate-500 mt-2">or ₹{plan.yearlyPrice}/year</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pb-8 px-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3 text-sm">
                        <Check className="h-4 w-4 mt-0.5 text-teal-600 dark:text-teal-500 flex-shrink-0" />
                        <span className="text-stone-600 dark:text-slate-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="#contact" className="block">
                    <Button 
                      className={`w-full rounded-lg h-11 text-sm font-medium transition-all ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/20' 
                          : 'border-2 border-teal-200 dark:border-teal-800 text-stone-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:border-teal-400 dark:hover:border-teal-600'
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="section-padding bg-gradient-to-b from-stone-50/80 via-white to-stone-50/50 dark:from-slate-900/30 dark:via-slate-900/50 dark:to-slate-900/30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20 scroll-animate">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-white mb-6 tracking-tight font-display">
              What practitioners say
            </h2>
            <p className="text-[#4a4a4a] dark:text-slate-300 max-w-xl mx-auto">
              From homeopaths who value structure, transparency, and clinical control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className={`scroll-animate scroll-animate-scale relative rounded-2xl border overflow-hidden transition-all duration-300 ${
                  activeTestimonial === index 
                    ? 'border-teal-400/60 dark:border-teal-600/60 shadow-xl shadow-teal-500/15 bg-gradient-to-br from-white to-teal-50/40 dark:from-slate-800 dark:to-teal-950/30 ring-2 ring-teal-200/60 dark:ring-teal-800/50' 
                    : 'border-stone-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-200/60 dark:hover:border-teal-800/50'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 lg:p-8">
                  <span className="text-5xl font-serif text-teal-300 dark:text-teal-700 leading-none">"</span>
                  <p className="text-stone-700 dark:text-slate-300 text-base lg:text-lg leading-relaxed mb-6 -mt-4">
                    {testimonial.content}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/20 ring-2 ring-teal-500/20">
                      <span className="text-base font-bold text-white">{testimonial.image}</span>
                    </div>
                    <div>
                      <p className="font-medium text-stone-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-stone-500 dark:text-slate-500">{testimonial.role}, {testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-2.5 mt-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                aria-label={`View testimonial ${index + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeTestimonial === index ? 'bg-gradient-to-r from-teal-500 to-emerald-500 w-8 shadow-sm shadow-teal-500/20' : 'bg-stone-300 dark:bg-slate-600 w-2.5 hover:bg-teal-400/80'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Ethics, Data & Privacy - final trust before CTA */}
      <section id="ethics" className="section-padding bg-gradient-to-b from-teal-50/25 via-[#f8f7f5] to-stone-50/50 dark:from-slate-900/50 dark:via-slate-900/70 dark:to-slate-950">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 scroll-animate">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Ethics & privacy</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#1a1a1a] dark:text-white tracking-tight font-display">
              Responsible. Secure. Transparent.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <Card className="scroll-animate rounded-2xl border border-teal-200/60 dark:border-teal-800/50 shadow-lg shadow-teal-500/5 overflow-hidden p-6 lg:p-8 hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-300/60 bg-white dark:bg-slate-800/40 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/25 ring-2 ring-teal-500/20">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-white">Responsible Intelligence</h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                Rule-based, principle-driven logic. No data selling. We enhance clinical practice — we don't replace judgment.
              </p>
            </Card>
            <Card className="scroll-animate rounded-2xl border border-stone-200/80 dark:border-slate-700/80 shadow-lg overflow-hidden p-6 lg:p-8 hover:shadow-xl hover:border-teal-200/50 dark:hover:border-teal-800/50 bg-white dark:bg-slate-800/40 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center ring-1 ring-teal-200/60 dark:ring-teal-800/50 shrink-0">
                  <Lock className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-white">Privacy-First</h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                Secure handling of patient data. Privacy-first architecture. Your data stays yours — encrypted and protected.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 dark:from-teal-700 dark:via-emerald-700 dark:to-teal-800 shadow-2xl shadow-teal-900/20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight font-display">
            Ready to see Homeolytics?
          </h2>
          <p className="text-lg text-teal-100/90 mb-12 max-w-2xl mx-auto">
            Request a demo or join the waitlist. We&apos;ll show you how rule-driven intelligence can support your practice.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact">
              <Button size="lg" className="gap-2 text-lg px-12 h-14 bg-white text-teal-700 hover:bg-teal-50 rounded-xl font-semibold w-full sm:w-auto shadow-xl shadow-teal-900/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                Request Demo
                <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href="#contact">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-12 h-14 border-2 border-white/80 bg-white/5 backdrop-blur text-white hover:bg-white/20 hover:border-white rounded-xl font-semibold w-full sm:w-auto transition-all">
                Join Waitlist
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-padding bg-gradient-to-b from-[#f8f7f5] via-white to-emerald-50/25 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="scroll-animate scroll-animate-left">
              <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Contact</p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#1a1a1a] dark:text-white mb-6 tracking-tight font-display">
                Let&apos;s get in touch
              </h2>
              <p className="text-[#4a4a4a] dark:text-slate-300 mb-10 leading-relaxed">
                Have questions? Our team is here to help. Reach out and we&apos;ll get back to you within 24 hours.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center flex-shrink-0 ring-1 ring-teal-200/50 dark:ring-teal-800/50 group-hover:ring-teal-300/60 transition-all">
                    <Phone className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Phone Support</p>
                    <p className="text-muted-foreground">+91 98765 43210</p>
                    <p className="text-sm text-muted-foreground">Mon-Sat, 9 AM - 7 PM IST</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center flex-shrink-0 ring-1 ring-teal-200/50 dark:ring-teal-800/50 group-hover:ring-teal-300/60 transition-all">
                    <Mail className="h-6 w-6 text-teal-700 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Email Us</p>
                    <p className="text-muted-foreground">support@homeolytics.com</p>
                    <p className="text-sm text-muted-foreground">We reply within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-teal-700 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Office</p>
                    <p className="text-muted-foreground">123 Tech Park, Sector 62</p>
                    <p className="text-muted-foreground">Noida, UP 201301</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="scroll-animate scroll-animate-right rounded-2xl border border-teal-200/60 dark:border-teal-800/50 shadow-xl shadow-stone-200/20 dark:shadow-slate-900/40 overflow-hidden bg-white dark:bg-slate-800/50 ring-1 ring-stone-100/80 dark:ring-slate-700/30 hover:shadow-2xl hover:border-teal-300/60 transition-all duration-300">
              <CardContent className="p-6 lg:p-8">
                <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-6">Send us a message</h3>
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
                  <Button className="w-full h-14 rounded-xl text-base font-semibold shadow-lg shadow-teal-500/20 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-teal-500/25 transition-all duration-300">
                    Request Demo / Join Waitlist
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 lg:py-28 bg-gradient-to-br from-[#0f1729] via-[#0c1420] to-[#08231f] dark:from-[#0a0f1a] dark:via-[#081118] dark:to-[#061912] text-stone-300 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/12 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-600/8 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Mandatory Disclaimer */}
          <div className="mb-14 p-6 sm:p-8 rounded-2xl bg-slate-800/40 dark:bg-slate-900/50 border border-teal-500/20 dark:border-teal-700/30 backdrop-blur-sm shadow-xl shadow-black/10">
            <p className="text-slate-300 text-center text-sm lg:text-base leading-relaxed max-w-3xl mx-auto">
              <strong className="text-white font-semibold">Homeolytics is a clinical decision-support platform.</strong> It assists homeopathic practitioners in case-taking, analysis, and remedy selection. Final diagnosis and prescription remain with the practitioner. Homeolytics does not replace professional medical judgment.
            </p>
          </div>

          {/* Main Footer Content */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25 ring-2 ring-teal-500/20">
                  <Stethoscope className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Homeolytics</h3>
                  <p className="text-sm text-teal-400/90 font-medium">Where homeopathy meets intelligence</p>
                </div>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed max-w-md text-[15px]">
                Rule-driven clinical decision support for homeopathic practitioners. Built on authentic repertory data and refined with insights from experienced doctors.
              </p>
              
              {/* Social Media Links */}
              <div className="flex gap-3 mb-6">
                <a href="#" className="group w-11 h-11 rounded-xl bg-slate-700/60 hover:bg-gradient-to-br hover:from-teal-500 hover:to-emerald-600 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 border border-slate-600/50 hover:border-transparent" aria-label="Website">
                  <Globe className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                </a>
                <a href="#" className="group w-11 h-11 rounded-xl bg-slate-700/60 hover:bg-gradient-to-br hover:from-teal-500 hover:to-emerald-600 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 border border-slate-600/50 hover:border-transparent" aria-label="LinkedIn">
                  <MessageSquare className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                </a>
                <a href="#" className="group w-11 h-11 rounded-xl bg-slate-700/60 hover:bg-gradient-to-br hover:from-teal-500 hover:to-emerald-600 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 border border-slate-600/50 hover:border-transparent" aria-label="WhatsApp">
                  <Phone className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                </a>
              </div>

              {/* Waitlist CTA */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-teal-500/20 dark:border-teal-700/30 shadow-xl shadow-black/5">
                <p className="text-sm font-semibold text-white mb-1">Stay Updated</p>
                <p className="text-xs text-slate-400 mb-4">Join the waitlist for early access</p>
                <a href="#contact">
                  <Button className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-sm font-semibold shadow-lg shadow-teal-500/20 transition-all duration-200 hover:shadow-teal-500/30 hover:scale-[1.02]">
                    Join Waitlist
                  </Button>
                </a>
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider flex items-center gap-2 text-teal-400/90">
                <Zap className="h-4 w-4" />
                Product
              </h4>
              <ul className="space-y-4">
                {[
                  { href: '#positioning', label: 'Positioning' },
                  { href: '#how-it-works', label: 'How it Works' },
                  { href: '#features', label: 'Features' },
                  { href: '#workflow', label: 'Workflow' },
                  { href: '#comparison', label: 'Comparison' },
                  { href: '#pricing', label: 'Pricing' }
                ].map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors group text-sm">
                      <ArrowRight className="h-4 w-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 shrink-0" />
                      <span className="group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider flex items-center gap-2 text-teal-400/90">
                <Users className="h-4 w-4" />
                Company
              </h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors group text-sm">
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">About Us</span>
                  </a>
                </li>
                <li>
                  <a href="#contact" className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors group text-sm">
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">Contact</span>
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Legal & Support Links */}
            <div>
              <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider flex items-center gap-2 text-teal-400/90">
                <Shield className="h-4 w-4" />
                Legal & Support
              </h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors group text-sm">
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">Privacy Policy</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors group text-sm">
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">Terms of Service</span>
                  </a>
                </li>
                <li>
                  <a href="#ethics" className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors group text-sm">
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">Data & Privacy</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="pt-10 border-t border-slate-700/80">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 text-center lg:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                <p className="text-slate-400 text-sm font-medium">
                  © 2025 Homeolytics. All rights reserved.
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <a href="#" className="text-slate-500 hover:text-teal-400 transition-colors">Privacy</a>
                  <span className="text-slate-600 w-1 h-1 rounded-full bg-slate-600" aria-hidden />
                  <a href="#" className="text-slate-500 hover:text-teal-400 transition-colors">Terms</a>
                </div>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md leading-relaxed">
                Clinical decision-support platform. Final diagnosis and prescription remain with the practitioner.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to top button */}
      <a
        href="#"
        className={`fixed bottom-6 right-4 sm:right-6 z-40 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30 flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-105 active:scale-95 touch-manipulation ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </a>
    </div>
  );
};

export default Landing;
