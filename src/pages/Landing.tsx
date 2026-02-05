import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const HeroScene = lazy(() => import('@/components/landing/HeroScene').then((m) => ({ default: m.HeroScene })));
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from '@/components/ui/carousel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  ArrowUp,
  PlayCircle
} from 'lucide-react';

const TYPING_WORD = 'intelligence';
const TYPING_DELAY_MS = 120;
const TYPING_START_DELAY_MS = 800;

const TRUST_BAR_ITEMS = [
  { icon: Users, label: '100+ Practitioners', sub: 'Trust our platform' },
  { icon: Database, label: 'Evidence-based', sub: 'Real repertory data' },
  { icon: UserCheck, label: 'Doctor-controlled', sub: 'You decide, we assist' },
  { icon: Shield, label: 'GDPR compliant', sub: 'Data protection standards' },
];

const STICKY_CTA_SCROLL_THRESHOLD = 400;
const STICKY_CTA_SHOW_AGAIN_SECONDS = 30;

function getEndOfTodayMs(): number {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [stickyCTADismissedUntil, setStickyCTADismissedUntil] = useState<number | null>(null);
  const [showStickyCTADismissOptions, setShowStickyCTADismissOptions] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [activeNavSection, setActiveNavSection] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '', role: 'practitioner', notifyOnLaunch: false });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testimonialCarouselApi, setTestimonialCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 600);
      const canShow = stickyCTADismissedUntil === null || Date.now() > stickyCTADismissedUntil;
      if (canShow && window.scrollY > STICKY_CTA_SCROLL_THRESHOLD) {
        setShowStickyCTA(true);
      } else if (window.scrollY <= STICKY_CTA_SCROLL_THRESHOLD) {
        setShowStickyCTA(false);
        setShowStickyCTADismissOptions(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stickyCTADismissedUntil]);

  // Clear "show again in 30 sec" after 30 sec so bar can show on next scroll
  useEffect(() => {
    if (stickyCTADismissedUntil === null) return;
    const delay = stickyCTADismissedUntil - Date.now();
    if (delay <= 0) return;
    const t = setTimeout(() => setStickyCTADismissedUntil(null), delay);
    return () => clearTimeout(t);
  }, [stickyCTADismissedUntil]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Testimonials carousel: sync active index and optional auto-advance
  useEffect(() => {
    if (!testimonialCarouselApi) return;
    const onSelect = () => setActiveTestimonial(testimonialCarouselApi.selectedScrollSnap());
    onSelect();
    testimonialCarouselApi.on('select', onSelect);
    return () => testimonialCarouselApi.off('select', onSelect);
  }, [testimonialCarouselApi]);
  useEffect(() => {
    if (!testimonialCarouselApi) return;
    const interval = setInterval(() => testimonialCarouselApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [testimonialCarouselApi]);

  // Typing animation for hero "intelligence"
  useEffect(() => {
    const startTimer = setTimeout(() => {
      let index = 0;
      const typeNext = () => {
        if (index <= TYPING_WORD.length) {
          setTypedText(TYPING_WORD.slice(0, index));
          index += 1;
          setTimeout(typeNext, TYPING_DELAY_MS);
        }
      };
      typeNext();
    }, TYPING_START_DELAY_MS);
    return () => clearTimeout(startTimer);
  }, []);

  // Blinking cursor
  useEffect(() => {
    const blink = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(blink);
  }, []);

  // Scroll progress (0–1) for top bar
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      setScrollProgress(scrollHeight > 0 ? scrollTop / scrollHeight : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active nav section (scroll spy)
  useEffect(() => {
    const sections = ['positioning', 'features', 'how-it-works', 'workflow', 'helps-doctors', 'comparison', 'pricing', 'faq', 'testimonials', 'contact'];
    const onScroll = () => {
      const y = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= y) {
          setActiveNavSection('#' + sections[i]);
          return;
        }
      }
      setActiveNavSection('');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
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
    { icon: Cpu, title: 'Rule-Engine-Driven Clinical Intelligence', description: 'Built on a proprietary Smart Rule Engine that applies homeopathic logic systematically — not black-box algorithms.', gradient: 'from-blue-500 to-blue-600' },
    { icon: BookOpen, title: 'Structured Case-Taking', description: 'Inspired by classical homeopathy: mind, generals, particulars, and modalities — organized for thorough case analysis.', gradient: 'from-blue-500 to-blue-600' },
    { icon: Database, title: 'Real Repertory & Clinical Data', description: 'Authentic homeopathic databases and repertory data form the foundation — validated, evidence-based sources.', gradient: 'from-blue-600 to-blue-700' },
    { icon: Eye, title: 'Transparent Insights with Visible Logic', description: 'See the reasoning behind every suggestion. Matched rubrics, scoring, and clinical context — no hidden outputs.', gradient: 'from-blue-500 to-blue-600' },
    { icon: Sparkles, title: 'AI-Enhanced, Not AI-Dependent', description: 'AI and ML enhance pattern recognition and learning — they optimize and assist, but never override clinical logic.', gradient: 'from-blue-500 to-blue-600' },
    { icon: UserCheck, title: 'Doctor-Controlled Decision Support', description: 'You remain in charge. Final diagnosis and prescription always stay with the practitioner — we assist, never decide.', gradient: 'from-blue-600 to-blue-700' }
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

  const faqItems = [
    { q: 'Who is Homeolytics for?', a: 'Homeolytics is for homeopathic practitioners — from junior doctors building confidence to experienced practitioners and busy clinics. It supports case-taking, analysis, and prescription workflow while keeping the doctor in control.' },
    { q: 'How is it different from repertory software?', a: 'Traditional repertory tools focus on repertorization. Homeolytics combines a rule-engine built on homeopathic logic, authentic repertory data, and inputs refined by 100+ doctors — with AI enhancement that never overrides clinical judgment. You get transparent, traceable suggestions and a full clinic workflow in one place.' },
    { q: 'Is my data secure?', a: 'Yes. We follow a privacy-first approach. Patient and clinic data are encrypted and handled according to strict data protection standards. We do not sell your data.' },
    { q: 'Does Homeolytics prescribe remedies?', a: 'No. Homeolytics assists with case analysis and suggests rubrics and remedies based on rule logic and repertory data. The final prescription decision always remains with you, the practitioner.' },
    { q: 'Can I try before I commit?', a: 'Yes. You can request a demo or join the waitlist with no commitment. We\'ll show you how the platform works and get back to you within 24 hours.' },
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
    <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
      {/* Skip link - accessibility */}
      <a
        href="#positioning"
        className="focus-ring fixed left-4 top-4 z-[100] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg opacity-0 focus:opacity-100 focus:z-[100] transition-opacity"
      >
        Skip to main content
      </a>

      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-1 scroll-progress-bar pointer-events-none"
        style={{ ['--scroll-progress' as string]: scrollProgress }}
        aria-hidden
      />

      {/* Navigation - enhanced header & navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || mobileMenuOpen
          ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-stone-200/80 dark:border-slate-800/80 shadow-lg shadow-stone-200/20 dark:shadow-slate-900/50' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? 'h-16 lg:h-16' : 'h-20 lg:h-20'}`}>
            {/* Logo / Brand */}
            <a href="#" className="flex items-center group transition-transform group-hover:scale-[1.02]">
              <img src="/logo.png" alt="Homeolytics - Where homeopathy meets intelligence" className="h-10 sm:h-11 w-auto object-contain" />
            </a>

            {/* Desktop Navigation - scroll spy highlight */}
            <div className="hidden lg:flex items-center gap-1">
              {[
                { href: '#features', label: 'Features' },
                { href: '#workflow', label: 'Workflow' },
                { href: '#comparison', label: 'Compare' },
                { href: '#pricing', label: 'Pricing' },
                { href: '#faq', label: 'FAQ' },
                { href: '#contact', label: 'Contact' }
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`focus-ring relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                    activeNavSection === item.href
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50'
                      : 'text-stone-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/50'
                  }`}
                >
                  {item.label}
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ${
                    activeNavSection === item.href ? 'w-3/4' : 'w-0 group-hover:w-3/4'
                  }`} />
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="h-6 w-px bg-stone-200 dark:bg-slate-700" />
              <Link to="/auth">
                <Button variant="ghost" className="font-medium text-stone-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 rounded-lg transition-colors">
                  Login
                </Button>
              </Link>
              <a href="#contact">
                <Button className="gap-2 rounded-xl px-6 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all">
                  Request Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            {/* Mobile menu button - 44px min touch target */}
            <button 
              className="lg:hidden p-3 min-w-[44px] min-h-[44px] rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-stone-200/80 dark:border-slate-700 shadow-sm hover:bg-blue-50 dark:hover:bg-blue-950/50 active:bg-blue-100 dark:active:bg-blue-900/50 transition-all touch-manipulation"
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
                { href: '#faq', label: 'FAQ', icon: '→' },
                { href: '#contact', label: 'Contact', icon: '→' }
              ].map((item) => (
                <a 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="flex items-center justify-between py-4 px-4 rounded-xl bg-stone-50/80 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/50 active:bg-blue-100 dark:active:bg-blue-900/50 border border-stone-100/80 dark:border-slate-700/50 transition-all group min-h-[52px] touch-manipulation"
                >
                  <span className="text-base font-semibold text-stone-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">{item.label}</span>
                  <ChevronRight className="h-5 w-5 text-stone-500 dark:text-slate-400 group-hover:text-blue-500 shrink-0" />
                </a>
              ))}
              <div className="pt-4 mt-4 border-t border-stone-200 dark:border-slate-800 space-y-3">
                <Link to="/auth" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl h-14 text-base font-semibold border-2 border-stone-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all">
                    Login
                  </Button>
                </Link>
                <a href="#contact" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-xl h-14 text-base font-semibold gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25">
                    Request Demo
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - enhanced with gradients + CSS animated background */}
      <section className="relative pt-24 sm:pt-28 lg:pt-44 pb-20 sm:pb-28 lg:pb-40 overflow-hidden bg-gradient-to-br from-blue-50/60 via-[#f5f7f6] to-blue-50/40 dark:from-blue-950/30 dark:via-[#0f172a] dark:to-blue-950/20 landing-hero-bg">
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        </ErrorBoundary>
        {/* Fallback when 3D is disabled: subtle dashboard mock */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 flex items-center justify-center opacity-30 dark:opacity-20" aria-hidden>
          <div className="w-[320px] h-[200px] rounded-2xl border border-blue-200/50 dark:border-blue-800/50 bg-white/40 dark:bg-slate-800/40 shadow-xl">
            <div className="p-3 flex gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400/80" />
              <span className="w-2 h-2 rounded-full bg-amber-400/80" />
              <span className="w-2 h-2 rounded-full bg-blue-400/80" />
            </div>
            <div className="px-3 pb-3 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-blue-100/80 dark:bg-blue-900/40" />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/40 to-cyan-200/30 dark:from-blue-700/25 dark:to-cyan-900/15 rounded-full blur-[160px]" />
          <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-blue-300/35 dark:bg-blue-800/20 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-200/25 dark:bg-blue-800/15 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(11,84,219,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,84,219,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 relative">
          <div className="text-center">
            <div className="hero-entrance hero-entrance-delay-1 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/90 dark:bg-slate-800/60 border border-blue-200/60 dark:border-blue-800/50 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/5 mb-8 backdrop-blur-md ring-1 ring-blue-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-400">Clinical Decision Support for Homeopathy</span>
            </div>
            <h1 className="hero-entrance hero-entrance-delay-2 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-[#1a1a1a] dark:text-white leading-[1.15] tracking-tight font-display mb-8 sm:mb-10 lg:mb-12 px-1">
              Where homeopathy meets{' '}
              <span className="inline-block bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 dark:from-blue-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                {typedText}
                <span
                  className={`inline-block w-0.5 sm:w-1 h-[0.75em] align-middle ml-0.5 bg-blue-500 dark:bg-blue-400 transition-opacity duration-75 ${
                    cursorVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden
                />
              </span>
              .
            </h1>
            <p className="hero-entrance hero-entrance-delay-3 text-base sm:text-lg lg:text-xl text-[#4a4a4a] dark:text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
              Rule-driven, data-assisted clinical decision support for homeopathic practitioners.
            </p>
            <p className="hero-entrance hero-entrance-delay-4 text-base text-[#5c5c5c] dark:text-slate-400 mb-12 max-w-xl mx-auto">
              Built on authentic repertory data and refined with insights from 100+ experienced doctors.
            </p>
            <p className="hero-entrance hero-entrance-delay-5 text-sm font-medium text-blue-800 dark:text-blue-400 mb-14 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Designed to assist doctors, not replace them
            </p>

            <div className="hero-entrance hero-entrance-delay-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#contact" className="focus-ring">
                <Button size="lg" className="gap-2 text-sm px-8 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-700 dark:from-blue-500 dark:to-blue-500 dark:hover:from-blue-600 dark:hover:to-blue-600 text-white font-medium w-full sm:w-auto shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                  Request Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#contact" className="focus-ring">
                <Button size="lg" variant="outline" className="gap-2 text-sm px-8 h-12 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-stone-700 dark:text-slate-300 w-full sm:w-auto font-medium transition-all active:scale-[0.98]">
                  Join Waitlist
                </Button>
              </a>
              <a href="#workflow" className="focus-ring inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                <PlayCircle className="h-5 w-5" />
                Watch 2-min demo
              </a>
            </div>
          </div>
        </div>
        
        {/* Hero visual - dashboard preview */}
        <div className="hero-entrance hero-entrance-delay-8 max-w-5xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16 lg:mt-24 relative">
          <div className="relative rounded-2xl border border-blue-200/70 dark:border-blue-800/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-blue-500/15 dark:shadow-blue-900/25 overflow-hidden ring-1 ring-stone-200/50 dark:ring-slate-700/50 hover:shadow-blue-500/20 dark:hover:shadow-blue-900/30 transition-shadow duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
            <div className="relative p-6 lg:p-8">
              <div className="flex gap-2 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/90" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500/90" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[{ label: 'Patients Today', value: '24', icon: Users }, { label: 'Prescriptions', value: '18', icon: FileText }, { label: 'Appointments', value: '12', icon: Calendar }, { label: 'Active Cases', value: '8', icon: TrendingUp }].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-stone-50/80 to-blue-50/40 dark:from-slate-800/80 dark:to-blue-950/40 border border-blue-100/60 dark:border-slate-700/60 hover:border-blue-200/80 dark:hover:border-blue-800/50 transition-all group">
                    <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-105 transition-transform" />
                    <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white">{item.value}</p>
                    <p className="text-xs font-medium text-[#5c5c5c] dark:text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: 'Case Analysis', icon: Search }, { label: 'Repertory', icon: BookOpen }, { label: 'Prescription', icon: FileText }].map((item, i) => (
                  <div key={i} className="h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/90 dark:from-blue-950/50 dark:to-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center gap-2 hover:from-blue-100 hover:to-blue-100/80 dark:hover:from-blue-900/60 dark:hover:to-blue-900/50 hover:border-blue-300/80 transition-all group cursor-default">
                    <item.icon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar - scroll animate */}
      <section className="scroll-animate relative py-6 sm:py-8 border-y border-blue-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {TRUST_BAR_ITEMS.map((item, index) => (
              <div
                key={index}
                className="scroll-animate scroll-animate-scale flex items-center gap-4 p-4 rounded-xl bg-stone-50/80 dark:bg-slate-800/50 border border-stone-100/80 dark:border-slate-700/50 hover:border-blue-200/80 dark:hover:border-blue-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-all duration-200 group"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">{item.label}</p>
                  <p className="text-xs text-stone-500 dark:text-slate-400 truncate">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Positioning - moved up for trust */}
      <section id="positioning" className="section-padding bg-gradient-to-b from-[#f8f7f5] via-[#faf9f7] to-white dark:from-slate-900/50 dark:via-slate-900/70 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 lg:mb-20 scroll-animate">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Core positioning</p>
            <h2 className="section-heading-accent text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-white mb-8 tracking-tight font-display">
              Doctor decides. Intelligence assists.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="scroll-animate scroll-animate-left rounded-2xl border border-blue-200/60 dark:border-blue-800/50 shadow-lg shadow-blue-500/8 bg-white dark:bg-slate-800/40 overflow-hidden p-8 hover:shadow-xl hover:shadow-blue-500/15 hover:border-blue-300/70 dark:hover:border-blue-700/60 transition-all duration-300 ring-1 ring-blue-500/5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">What Homeolytics IS</h3>
              </div>
              <ul className="space-y-4 text-[#4a4a4a] dark:text-slate-300 text-sm leading-relaxed">
                <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" /> Clinical decision-support for case-taking and analysis</li>
                <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" /> Rule-engine-driven, principle-based logic</li>
                <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" /> An assistant that enhances your clinical judgment</li>
                <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" /> Transparent, traceable insights</li>
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

      {/* Differentiators - compact enhanced badges (below Core positioning) */}
      <section className="py-8 sm:py-10 border-y border-blue-200/40 dark:border-slate-700/60 bg-gradient-to-r from-white via-blue-50/40 to-blue-50/30 dark:from-slate-900/80 dark:via-blue-950/25 dark:to-slate-900/80 shadow-[inset_0_1px_0_rgba(11,84,219,0.06)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
            {differentiators.map((item, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-lg bg-white/95 dark:bg-slate-800/70 border border-blue-100/80 dark:border-slate-600/50 shadow-[0_1px_3px_rgba(11,84,219,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] text-[13px] font-medium text-[#2d2d2d] dark:text-slate-100 hover:border-blue-300/80 dark:hover:border-blue-500/40 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 hover:scale-[1.02] hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/50 shrink-0">
                  <item.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USP Section - Why Homeolytics (enhanced) */}
      <section id="features" className="section-padding relative overflow-hidden bg-gradient-to-b from-white via-blue-50/20 to-[#f8f7f5] dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 relative">
          <div className="text-center mb-16 lg:mb-20 scroll-animate">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Why Homeolytics</p>
            <h2 className="section-heading-accent text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a1a1a] dark:text-white mb-4 tracking-tight font-display">
              Rule-driven. Transparent. Trusted.
            </h2>
            <p className="text-lg text-[#4a4a4a] dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Clinically guided logic and transparent insights — built for practitioners who value control and clarity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {usps.map((usp, index) => (
              <Card
                key={index}
                className="scroll-animate scroll-animate-scale group relative rounded-2xl border border-stone-200/80 dark:border-slate-700/50 overflow-hidden p-6 lg:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-300/70 dark:hover:border-blue-700/60 hover:-translate-y-1.5 bg-white dark:bg-slate-800/60 ring-1 ring-stone-100/50 dark:ring-slate-700/30 hover:ring-blue-400/20"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${usp.gradient} flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:shadow-blue-500/30 transition-all duration-300`}>
                  <usp.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-3 leading-snug">{usp.title}</h3>
                <p className="text-sm text-[#4a4a4a] dark:text-slate-300 leading-relaxed">{usp.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How Homeolytics Works - visual flow */}
      <section id="how-it-works" className="section-padding bg-gradient-to-b from-[#f8f7f5] via-white to-blue-50/25 dark:from-slate-950 dark:via-slate-900/50 dark:to-blue-950/30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20 lg:mb-28 scroll-animate">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">How it works</p>
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
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/20 group-hover:scale-105 group-hover:shadow-blue-500/30 transition-all">
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

          <div className="mt-20 lg:mt-24 p-8 lg:p-10 rounded-2xl bg-gradient-to-br from-blue-50/90 to-blue-50/80 dark:from-blue-950/50 dark:to-blue-950/40 border border-blue-200/70 dark:border-blue-700/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/5 scroll-animate">
            <p className="text-[#4a4a4a] dark:text-slate-300 text-center max-w-2xl mx-auto leading-relaxed">
              <span className="font-semibold text-[#1a1a1a] dark:text-white">No black-box outputs.</span> Every suggestion is traceable to repertory data, rule logic, and clinician-validated patterns. AI enhances pattern recognition — never overrides homeopathic principles.
            </p>
          </div>
        </div>
      </section>

      {/* End-to-End Clinical Workflow - moved up */}
      <section id="workflow" className="section-padding bg-gradient-to-b from-blue-50/25 via-white to-[#f8f7f5] dark:from-blue-950/20 dark:via-slate-900/50 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 scroll-animate">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Clinic & patient management</p>
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
                className="flex items-start gap-5 p-6 rounded-2xl border border-stone-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 shadow-sm hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200/60 dark:hover:border-blue-800/50 transition-all duration-300 group"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  {index + 1}
                </div>
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-stone-100 dark:bg-slate-700/60 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors">
                  <step.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
              <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-stone-200/60 dark:border-slate-700/50 hover:border-blue-200/60 dark:hover:border-blue-800/40 transition-colors">
                <Check className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#3d3d3d] dark:text-slate-300 font-medium">{usp}</p>
              </div>
            ))}
          </div>

          <div className="scroll-animate text-center p-6 rounded-2xl bg-gradient-to-r from-blue-50/90 to-blue-50/70 dark:from-blue-950/30 dark:to-blue-950/20 border border-blue-200/70 dark:border-blue-800/50 shadow-sm ring-1 ring-blue-500/5">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Doctor decides. Intelligence assists. Everything in one place — designed to support your workflow, not replace it.
            </p>
          </div>
        </div>
      </section>

      {/* How It Helps Doctors */}
      <section id="helps-doctors" className="section-padding bg-gradient-to-b from-white via-stone-50/30 to-white dark:from-slate-900/30 dark:via-slate-900/50 dark:to-slate-900/30">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20 scroll-animate">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Who it helps</p>
            <h2 className="section-heading-accent text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-white mb-8 tracking-tight font-display">
              How it helps doctors
            </h2>
            <p className="text-[#4a4a4a] dark:text-slate-400 mt-4 max-w-xl mx-auto">
              Whether you're building experience or scaling your practice.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {howItHelps.map((item, index) => (
              <Card key={index} className="scroll-animate scroll-animate-scale group rounded-2xl border border-stone-200/80 dark:border-slate-700/50 overflow-hidden p-6 lg:p-8 hover:shadow-xl hover:border-blue-200/50 dark:hover:border-blue-800/50 hover:-translate-y-1 transition-all bg-white dark:bg-slate-800/30" style={{ transitionDelay: `${index * 100}ms` }}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
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
      <section id="comparison" className="section-padding bg-gradient-to-b from-[#f8f7f5] via-white to-blue-50/10 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 scroll-animate">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Why Homeolytics</p>
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
                    <th className="sticky left-0 z-10 text-left py-5 px-6 bg-stone-50 dark:bg-slate-800 min-w-[200px]">
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
                    <th className="text-center py-5 px-4 bg-gradient-to-b from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-x-2 border-t-2 border-blue-200 dark:border-blue-800">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                          <Stethoscope className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Homeolytics</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-700/50">
                  {/* Clinical Foundation */}
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Classical homeopathy foundation</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-blue-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800"><Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Rule-based clinical logic</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800"><Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Authentic repertory & clinical databases</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-blue-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800"><Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Inputs refined by experienced doctors</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Limited</span></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">✓ 100+ doctors</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">AI-enhanced pattern recognition</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-blue-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800"><Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Doctor-controlled decisions</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-blue-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800"><Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Transparent reasoning & logic trails</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Partial</span></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800"><Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Ethical clinical boundaries</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Limited</span></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800"><Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto" /></td>
                  </tr>
                  {/* Accessibility & Platform - highlighted section */}
                  <tr className="bg-stone-50/80 dark:bg-slate-800/40">
                    <td colSpan={4} className="py-3 px-6">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Accessibility & Platform</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Installation requirement</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Desktop install</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Cloud-based</span></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Cloud-native</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Device accessibility</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">PC / Laptop</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Mostly desktop</span></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Mobile • Tablet • Desktop</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Dedicated mobile app</td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><X className="h-5 w-5 text-stone-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800"><Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Ease of use & learning curve</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Complex</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Variable</span></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Simple & doctor-friendly</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Cost accessibility</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">High & rigid</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Variable</span></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-blue-200 dark:border-blue-800">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Designed to be accessible</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-10 py-4 px-6 text-sm text-stone-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800/90 min-w-[200px]">Future-ready architecture</td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">Limited</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-xs text-stone-500 dark:text-slate-500">AI-dependent</span></td>
                    <td className="py-4 px-4 text-center bg-blue-50/30 dark:bg-blue-950/20 border-x-2 border-b-2 border-blue-200 dark:border-blue-800 rounded-br-xl">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Built to evolve</span>
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
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/40 dark:to-blue-950/20 border-2 border-blue-200/80 dark:border-blue-800/60 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
                  <Stethoscope className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-bold">Homeolytics</span> focuses on <span className="font-semibold">clinically guided intelligence</span>.
                </p>
              </div>
            </div>

            {/* Short explanation */}
            <div className="max-w-3xl mx-auto text-center px-6 py-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-700/50 shadow-xl shadow-stone-200/25 dark:shadow-slate-900/40 ring-1 ring-stone-100/80 dark:ring-slate-700/30">
              <p className="text-base text-stone-700 dark:text-slate-300 leading-relaxed">
                Homeolytics combines a <span className="font-semibold text-blue-700 dark:text-blue-400">proprietary smart rule engine</span>, authentic homeopathic databases, and insights refined by <span className="font-semibold text-blue-700 dark:text-blue-400">experienced doctors</span> — enhanced by AI and machine learning — to support confident clinical decisions <span className="font-semibold text-blue-700 dark:text-blue-400">across devices</span>.
              </p>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-900/40 transition-colors">
                <Check className="h-4 w-4" /> Classical foundation
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-900/40 transition-colors">
                <Check className="h-4 w-4" /> AI-enhanced
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-900/40 transition-colors">
                <Check className="h-4 w-4" /> Doctor-controlled
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-900/40 transition-colors">
                <Smartphone className="h-4 w-4" /> Mobile-first
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What Homeolytics Does NOT Do - confidence builder */}
      <section id="does-not-do" className="section-padding bg-gradient-to-b from-blue-50/10 to-[#f8f7f5] dark:from-slate-900/50 dark:to-slate-950">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 scroll-animate">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Clear boundaries</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#1a1a1a] dark:text-white tracking-tight font-display">
              What Homeolytics does not do
            </h2>
            <p className="text-[#4a4a4a] dark:text-slate-300 mt-4">Confidence and safety.</p>
          </div>

          <div className="space-y-4">
            {doesNotDo.map((item, index) => (
              <div key={index} className="scroll-animate flex items-center gap-4 py-5 px-6 rounded-xl bg-white dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-lg hover:border-blue-200/60 dark:hover:border-blue-800/50 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0 ring-1 ring-red-200/50 dark:ring-red-900/30 group-hover:ring-red-300/60 transition-all">
                  <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
                <p className="text-[#3d3d3d] dark:text-slate-300 font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ - accordion */}
      <section id="faq" className="section-padding bg-gradient-to-b from-[#f8f7f5] via-white to-blue-50/20 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 scroll-animate">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">FAQ</p>
            <h2 className="section-heading-accent text-3xl sm:text-4xl font-semibold text-[#1a1a1a] dark:text-white mb-6 tracking-tight font-display">
              Common questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="scroll-animate w-full rounded-2xl border border-stone-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/50 overflow-hidden">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="px-6 border-stone-200/80 dark:border-slate-700/60">
                <AccordionTrigger className="text-left text-stone-900 dark:text-white hover:no-underline hover:text-blue-600 dark:hover:text-blue-400 py-5">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-stone-600 dark:text-slate-400 pb-5 pt-0">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Pricing Section - moved up for conversion */}
      <section id="pricing" className="section-padding bg-gradient-to-b from-blue-50/20 via-white to-stone-50/30 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20 scroll-animate">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Pricing</p>
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
                    ? 'border-2 border-blue-400 dark:border-blue-600 shadow-2xl shadow-blue-500/20 bg-gradient-to-b from-white to-blue-50/40 dark:from-slate-800 dark:to-blue-950/40 lg:scale-[1.02] z-10 ring-4 ring-blue-500/15' 
                    : 'border border-stone-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {plan.popular && (
                  <div className="ribbon-pulse absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-2.5 text-xs font-semibold tracking-widest uppercase">
                    Most popular
                  </div>
                )}
                <CardHeader className={`${plan.popular ? 'pt-12' : 'pt-8'} pb-6 px-8`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.popular ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-stone-200 dark:bg-slate-700'
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
                    <p className="text-sm text-stone-500 dark:text-slate-500 mt-2 flex items-center gap-2">
                      or ₹{plan.yearlyPrice}/year
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">Save 17%</span>
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pb-8 px-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3 text-sm">
                        <Check className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-500 flex-shrink-0" />
                        <span className="text-stone-600 dark:text-slate-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a href="#contact" className="block">
                        <Button
                          className={`focus-ring w-full rounded-lg h-11 text-sm font-medium transition-all ${
                            plan.popular
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20'
                              : 'border-2 border-blue-200 dark:border-blue-800 text-stone-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-400 dark:hover:border-blue-600'
                          }`}
                          variant={plan.popular ? 'default' : 'outline'}
                        >
                          {plan.cta}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-center">
                      We&apos;ll contact you within 24 hours.
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - carousel with arrows + dots */}
      <section id="testimonials" className="section-padding bg-gradient-to-b from-stone-50/80 via-white to-stone-50/50 dark:from-slate-900/30 dark:via-slate-900/50 dark:to-slate-900/30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20 scroll-animate">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Testimonials</p>
            <h2 className="section-heading-accent text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] dark:text-white mb-8 tracking-tight font-display">
              What practitioners say
            </h2>
            <p className="text-[#4a4a4a] dark:text-slate-300 max-w-xl mx-auto">
              From homeopaths who value structure, transparency, and clinical control.
            </p>
          </div>

          <div className="scroll-animate relative px-8 sm:px-12">
            <Carousel setApi={setTestimonialCarouselApi} opts={{ align: 'start', loop: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="pl-4 md:basis-1/2">
                    <Card className="rounded-2xl border border-stone-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-200/60 dark:hover:border-blue-800/50">
                      <CardContent className="p-6 lg:p-8">
                        <span className="text-5xl font-serif text-blue-400/80 dark:text-blue-600/80 leading-none select-none" aria-hidden>"</span>
                        <p className="text-stone-700 dark:text-slate-300 text-base lg:text-lg leading-relaxed mb-6 -mt-4 pl-1">
                          {testimonial.content}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20">
                            <span className="text-base font-bold text-white">{testimonial.image}</span>
                          </div>
                          <div>
                            <p className="font-medium text-stone-900 dark:text-white">{testimonial.name}</p>
                            <p className="text-sm text-stone-500 dark:text-slate-500">{testimonial.role}, {testimonial.location}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 border-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50" />
              <CarouselNext className="right-0 border-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50" />
            </Carousel>
            <div className="flex justify-center gap-2.5 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => testimonialCarouselApi?.scrollTo(index)}
                  aria-label={`View testimonial ${index + 1}`}
                  className={`focus-ring h-2.5 rounded-full transition-all duration-300 ${
                    activeTestimonial === index ? 'bg-gradient-to-r from-blue-500 to-blue-600 w-8 shadow-sm shadow-blue-500/20' : 'bg-stone-300 dark:bg-slate-600 w-2.5 hover:bg-blue-400/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ethics, Data & Privacy - final trust before CTA */}
      <section id="ethics" className="section-padding bg-gradient-to-b from-blue-50/25 via-[#f8f7f5] to-stone-50/50 dark:from-slate-900/50 dark:via-slate-900/70 dark:to-slate-950">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 scroll-animate">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Ethics & privacy</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#1a1a1a] dark:text-white tracking-tight font-display">
              Responsible. Secure. Transparent.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <Card className="scroll-animate rounded-2xl border border-blue-200/60 dark:border-blue-800/50 shadow-lg shadow-blue-500/5 overflow-hidden p-6 lg:p-8 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300/60 bg-white dark:bg-slate-800/40 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-white">Responsible Intelligence</h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                Rule-based, principle-driven logic. No data selling. We enhance clinical practice — we don't replace judgment.
              </p>
            </Card>
            <Card className="scroll-animate rounded-2xl border border-stone-200/80 dark:border-slate-700/80 shadow-lg overflow-hidden p-6 lg:p-8 hover:shadow-xl hover:border-blue-200/50 dark:hover:border-blue-800/50 bg-white dark:bg-slate-800/40 transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center ring-1 ring-blue-200/60 dark:ring-blue-800/50 shrink-0">
                  <Lock className="h-5 w-5 text-blue-700 dark:text-blue-400" />
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
      <section className="section-padding relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 dark:from-blue-700 dark:via-blue-700 dark:to-blue-800 shadow-2xl shadow-blue-900/20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight font-display drop-shadow-sm">
            Ready to see Homeolytics?
          </h2>
          <p className="text-lg text-blue-100/90 mb-12 max-w-2xl mx-auto">
            Request a demo or join the waitlist. We&apos;ll show you how rule-driven intelligence can support your practice.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact">
              <Button size="lg" className="gap-2 text-lg px-12 h-14 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-semibold w-full sm:w-auto shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300">
                Request Demo
                <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href="#contact">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-12 h-14 border-2 border-white/80 bg-white/5 backdrop-blur text-white hover:bg-white/20 hover:border-white rounded-xl font-semibold w-full sm:w-auto transition-all active:scale-[0.98]">
                Join Waitlist
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-padding bg-gradient-to-b from-[#f8f7f5] via-white to-blue-50/25 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="scroll-animate scroll-animate-left">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Contact</p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#1a1a1a] dark:text-white mb-6 tracking-tight font-display">
                Let&apos;s get in touch
              </h2>
              <p className="text-[#4a4a4a] dark:text-slate-300 mb-10 leading-relaxed">
                Have questions? Our team is here to help. Reach out and we&apos;ll get back to you within 24 hours.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-200/50 dark:ring-blue-800/50 group-hover:ring-blue-300/60 transition-all">
                    <Phone className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Phone Support</p>
                    <p className="text-muted-foreground">+91 98765 43210</p>
                    <p className="text-sm text-muted-foreground">Mon-Sat, 9 AM - 7 PM IST</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-200/50 dark:ring-blue-800/50 group-hover:ring-blue-300/60 transition-all">
                    <Mail className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Email Us</p>
                    <p className="text-muted-foreground">support@homeolytics.com</p>
                    <p className="text-sm text-muted-foreground">We reply within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Office</p>
                    <p className="text-muted-foreground">123 Tech Park, Sector 62</p>
                    <p className="text-muted-foreground">Noida, UP 201301</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="scroll-animate scroll-animate-right rounded-2xl border border-blue-200/60 dark:border-blue-800/50 shadow-xl shadow-stone-200/20 dark:shadow-slate-900/40 overflow-hidden bg-white dark:bg-slate-800/50 ring-1 ring-stone-100/80 dark:ring-slate-700/30 hover:shadow-2xl hover:border-blue-300/60 transition-all duration-300">
              <CardContent className="p-6 lg:p-8">
                <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-6">Send us a message</h3>
                {contactStatus === 'success' ? (
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-6 text-center">
                    <CheckCircle2 className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                    <p className="font-semibold text-blue-800 dark:text-blue-300">You&apos;re on the list!</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">We&apos;ll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <form
                    className="space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const err: Record<string, string> = {};
                      if (!contactForm.name.trim()) err.name = 'Name is required';
                      if (!contactForm.email.trim()) err.email = 'Email is required';
                      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) err.email = 'Enter a valid email';
                      if (!contactForm.phone.trim()) err.phone = 'Phone is required';
                      setContactErrors(err);
                      if (Object.keys(err).length > 0) return;
                      setContactStatus('sending');
                      setTimeout(() => {
                        setContactStatus('success');
                        setContactForm({ name: '', phone: '', email: '', message: '', role: 'practitioner', notifyOnLaunch: false });
                      }, 800);
                    }}
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Name *</label>
                        <input
                          type="text"
                          value={contactForm.name}
                          onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                          className={`medical-input focus-ring border rounded-xl ${contactErrors.name ? 'border-red-500' : 'border-stone-200 dark:border-slate-600'} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                          placeholder="Dr. John Doe"
                        />
                        {contactErrors.name && <p className="text-xs text-red-500 mt-1">{contactErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Phone *</label>
                        <input
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
                          className={`medical-input focus-ring border rounded-xl ${contactErrors.phone ? 'border-red-500' : 'border-stone-200 dark:border-slate-600'} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                          placeholder="+91 98765 43210"
                        />
                        {contactErrors.phone && <p className="text-xs text-red-500 mt-1">{contactErrors.phone}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                        className={`medical-input focus-ring border rounded-xl ${contactErrors.email ? 'border-red-500' : 'border-stone-200 dark:border-slate-600'} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                        placeholder="you@example.com"
                      />
                      {contactErrors.email && <p className="text-xs text-red-500 mt-1">{contactErrors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">I am a</label>
                      <select
                        value={contactForm.role}
                        onChange={(e) => setContactForm((p) => ({ ...p, role: e.target.value }))}
                        className="medical-input focus-ring w-full rounded-xl border border-stone-200 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="practitioner">Practitioner</option>
                        <option value="clinic_owner">Clinic owner</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                      <textarea
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                        className="medical-input focus-ring resize-none border border-stone-200 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                        placeholder="Tell us about your clinic..."
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contactForm.notifyOnLaunch}
                        onChange={(e) => setContactForm((p) => ({ ...p, notifyOnLaunch: e.target.checked }))}
                        className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-stone-600 dark:text-slate-400">Notify me on launch</span>
                    </label>
                    <Button
                      type="submit"
                      disabled={contactStatus === 'sending'}
                      className="focus-ring w-full h-14 rounded-xl text-base font-semibold shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-70"
                    >
                      {contactStatus === 'sending' ? 'Sending…' : 'Request Demo / Join Waitlist'}
                      {contactStatus !== 'sending' && <ArrowRight className="h-5 w-5 ml-2" />}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 lg:py-28 bg-gradient-to-br from-[#0f1729] via-[#0c1420] to-[#08231f] dark:from-[#0a0f1a] dark:via-[#081118] dark:to-[#061912] text-stone-300 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/12 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Mandatory Disclaimer */}
          <div className="mb-14 p-6 sm:p-8 rounded-2xl bg-slate-800/40 dark:bg-slate-900/50 border border-blue-500/20 dark:border-blue-700/30 backdrop-blur-sm shadow-xl shadow-black/10">
            <p className="text-slate-300 text-center text-sm lg:text-base leading-relaxed max-w-3xl mx-auto">
              <strong className="text-white font-semibold">Homeolytics is a clinical decision-support platform.</strong> It assists homeopathic practitioners in case-taking, analysis, and remedy selection. Final diagnosis and prescription remain with the practitioner. Homeolytics does not replace professional medical judgment.
            </p>
          </div>

          {/* Main Footer Content */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-white/20">
                  <img src="/logo.png" alt="Homeolytics - Where homeopathy meets intelligence" className="h-10 w-auto object-contain" />
                </div>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed max-w-md text-[15px]">
                Rule-driven clinical decision support for homeopathic practitioners. Built on authentic repertory data and refined with insights from experienced doctors.
              </p>
              
              {/* Social Media Links */}
              <div className="flex gap-3 mb-6">
                <a href="#" className="group w-11 h-11 rounded-xl bg-slate-700/60 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 border border-slate-600/50 hover:border-transparent" aria-label="Website">
                  <Globe className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                </a>
                <a href="#" className="group w-11 h-11 rounded-xl bg-slate-700/60 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 border border-slate-600/50 hover:border-transparent" aria-label="LinkedIn">
                  <MessageSquare className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                </a>
                <a href="#" className="group w-11 h-11 rounded-xl bg-slate-700/60 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 border border-slate-600/50 hover:border-transparent" aria-label="WhatsApp">
                  <Phone className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                </a>
              </div>

              {/* Waitlist CTA */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-blue-500/20 dark:border-blue-700/30 shadow-xl shadow-black/5">
                <p className="text-sm font-semibold text-white mb-1">Stay Updated</p>
                <p className="text-xs text-slate-400 mb-4">Join the waitlist for early access</p>
                <a href="#contact">
                  <Button className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all duration-200 hover:shadow-blue-500/30 hover:scale-[1.02]">
                    Join Waitlist
                  </Button>
                </a>
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider flex items-center gap-2 text-blue-400/90">
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
                    <a href={item.href} className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group text-sm">
                      <ArrowRight className="h-4 w-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 shrink-0" />
                      <span className="group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider flex items-center gap-2 text-blue-400/90">
                <Users className="h-4 w-4" />
                Company
              </h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group text-sm">
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">About Us</span>
                  </a>
                </li>
                <li>
                  <a href="#contact" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group text-sm">
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">Contact</span>
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Legal & Support Links */}
            <div>
              <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider flex items-center gap-2 text-blue-400/90">
                <Shield className="h-4 w-4" />
                Legal & Support
              </h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group text-sm">
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">Privacy Policy</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group text-sm">
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">Terms of Service</span>
                  </a>
                </li>
                <li>
                  <a href="#ethics" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group text-sm">
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
                  <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors">Privacy</a>
                  <span className="text-slate-600 w-1 h-1 rounded-full bg-slate-600" aria-hidden />
                  <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors">Terms</a>
                </div>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md leading-relaxed">
                Clinical decision-support platform. Final diagnosis and prescription remain with the practitioner.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky CTA bar - appears on scroll; dismiss options: show again in 30s / don't show today */}
      <div
        className={`fixed left-0 right-0 z-40 bottom-0 sm:bottom-0 transition-all duration-300 ease-out ${
          showStickyCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
        }`}
      >
        <div className="bg-white dark:bg-slate-900 border-t border-stone-200 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            {!showStickyCTADismissOptions ? (
              <>
                <p className="text-sm sm:text-base font-medium text-stone-700 dark:text-slate-200 text-center sm:text-left order-2 sm:order-1">
                  See how Homeolytics can support your practice.
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
                  <a
                    href="#contact"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 sm:px-6 sm:py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all active:scale-[0.98]"
                  >
                    Request Demo
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowStickyCTADismissOptions(true)}
                    className="flex-shrink-0 p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Dismiss options"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-stone-600 dark:text-slate-300 text-center sm:text-left order-2 sm:order-1">
                  When should we show this again?
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setStickyCTADismissedUntil(Date.now() + STICKY_CTA_SHOW_AGAIN_SECONDS * 1000);
                      setShowStickyCTADismissOptions(false);
                      setShowStickyCTA(false);
                    }}
                    className="flex-1 sm:flex-none rounded-xl px-4 py-3 text-sm font-semibold border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    Show again in {STICKY_CTA_SHOW_AGAIN_SECONDS} sec
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStickyCTADismissedUntil(getEndOfTodayMs());
                      setShowStickyCTADismissOptions(false);
                      setShowStickyCTA(false);
                    }}
                    className="flex-1 sm:flex-none rounded-xl px-4 py-3 text-sm font-semibold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Don&apos;t show today
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Back to top button - shift up when sticky CTA is visible */}
      <a
        href="#"
        className={`fixed z-40 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 touch-manipulation ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        } ${showStickyCTA ? 'bottom-20 sm:bottom-20 right-4 sm:right-6' : 'bottom-6 right-4 sm:right-6'}`}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </a>
    </div>
  );
};

export default Landing;
