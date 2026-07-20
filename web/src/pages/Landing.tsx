import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

declare global {
  interface Window {
    Lenis?: new (options?: Record<string, unknown>) => {
      raf: (time: number) => void;
      on: (event: string, cb: (payload: { scroll: number }) => void) => void;
      destroy: () => void;
    };
  }
}

const IMAGES = {
  heroMain:
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1100&q=80",
  heroSide:
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  heroRight:
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80",
  story:
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1200&q=80",
  plans:
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
  chats:
    "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
  safety:
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
  app:
    "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80",
};

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='900'>
      <defs>
        <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
          <stop offset='0%' stop-color='#ffd9ef'/>
          <stop offset='100%' stop-color='#eadbff'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        fill='#7a567c' font-family='Arial, sans-serif' font-size='44' font-weight='700'>
        Chill Mate
      </text>
    </svg>
  `);

export default function Landing() {
  const heroMediaRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied === "1") return;
    img.dataset.fallbackApplied = "1";
    img.src = FALLBACK_IMAGE;
  };

  useEffect(() => {
    let rafId = 0;
    let lenis: { raf: (time: number) => void; destroy: () => void } | null = null;

    function initLenis() {
      if (!window.Lenis) return;
      lenis = new window.Lenis({
        duration: 1.1,
        smoothWheel: true,
        smoothTouch: false,
      });

      const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax-speed]"));
      (lenis as any).on("scroll", ({ scroll }: { scroll: number }) => {
        parallaxEls.forEach((el) => {
          const speed = Number(el.dataset.parallaxSpeed || 0.08);
          const y = (scroll - el.offsetTop) * speed;
          el.style.transform = `translate3d(0, ${y}px, 0)`;
        });
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/lenis@1.1.14/dist/lenis.min.js";
    script.async = true;
    script.onload = initLenis;
    document.body.appendChild(script);

    const revealEls = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in");
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy?.();
    };
  }, []);

  const handleHeroPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const node = heroMediaRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const mx = (x - 0.5) * 2;
    const my = (y - 0.5) * 2;
    node.style.setProperty("--mx", mx.toFixed(4));
    node.style.setProperty("--my", my.toFixed(4));
    node.style.setProperty("--px", `${Math.round(x * 100)}%`);
    node.style.setProperty("--py", `${Math.round(y * 100)}%`);
  };

  const resetHeroPointer = () => {
    const node = heroMediaRef.current;
    if (!node) return;
    node.style.setProperty("--mx", "0");
    node.style.setProperty("--my", "0");
    node.style.setProperty("--px", "50%");
    node.style.setProperty("--py", "50%");
  };

  const handlePagePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const node = pageRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    node.style.setProperty("--cx", `${x}%`);
    node.style.setProperty("--cy", `${y}%`);
  };

  return (
    <div
      ref={pageRef}
      onMouseMove={handlePagePointerMove}
      className="landing-page min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-50 text-slate-800 overflow-x-hidden font-sans"
    >
      <style>{`
        html.lenis, html.lenis body { height: auto; }
        .lenis.lenis-smooth { scroll-behavior: auto !important; }
        .landing-reveal { opacity: 0; transform: translateY(20px); transition: opacity .6s cubic-bezier(0.16, 1, 0.3, 1), transform .6s cubic-bezier(0.16, 1, 0.3, 1); }
        .landing-reveal.in { opacity: 1; transform: translateY(0); }
        
        /* Shifting Gradient Background Mesh */
        .landing-page {
          position: relative;
          --cx: 50%;
          --cy: 25%;
        }
        .landing-page::before {
          content: "";
          position: fixed;
          inset: -10%;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(circle at var(--cx) var(--cy), rgba(244,63,94,0.06), transparent 55%),
            radial-gradient(circle at 80% 20%, rgba(99,102,241,0.08), transparent 60%),
            radial-gradient(circle at 20% 70%, rgba(245,158,11,0.05), transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(236,72,153,0.06), transparent 55%);
          filter: blur(80px);
          transition: background 0.2s ease-out;
        }
        
        .landing-page > * { position: relative; z-index: 1; }
        
        /* Glass Header */
        .chill-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: rgba(253, 247, 255, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        .hero-media {
          position: relative;
          min-height: 520px;
          --mx: 0;
          --my: 0;
          --px: 50%;
          --py: 50%;
          perspective: 1000px;
        }
        
        .hero-layer {
          position: absolute;
          transition: transform .2s ease-out;
        }
        
        /* Immersive Floating Cards */
        .hero-card {
          overflow: hidden;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 20px 40px -10px rgba(15, 10, 30, 0.15);
          width: 100%;
          height: 100%;
          transition: transform .2s ease-out, box-shadow .2s ease;
          transform:
            translate3d(calc(var(--mx) * 12px), calc(var(--my) * 12px), 0)
            rotateY(calc(var(--mx) * 5deg))
            rotateX(calc(var(--my) * -5deg));
          transform-style: preserve-3d;
        }
        
        .hero-media:hover .hero-card { 
          box-shadow: 0 30px 60px -15px rgba(15, 10, 30, 0.25); 
        }
        
        .hero-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .hero-main { inset: 0px 20% 0px 0; }
        .hero-right-a { width: 33%; height: 75%; right: 5%; top: 5%; }
        .hero-right-b { width: 28%; height: 60%; right: -5%; bottom: 5%; }
        
        /* Brand Glow effect on scroll */
        .nav-glow {
          position: relative;
        }
        .nav-glow::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 2px;
          background: linear-gradient(90deg, #f43f5e, #6366f1, #f59e0b, #f43f5e);
          background-size: 300% 100%;
          animation: glowMove 8s linear infinite;
          opacity: 0.75;
        }
        @keyframes glowMove {
          0% { background-position: 0% 0%; }
          100% { background-position: 300% 0%; }
        }
        
        /* Shimmering CTA Glow */
        .cta-glow-btn {
          position: relative;
          overflow: hidden;
        }
        .cta-glow-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <header className="chill-nav nav-glow">
        <div className="max-w-7xl mx-auto w-[90vw] py-3.5 flex items-center justify-between gap-4">
          <Link to="/landing" className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 font-display">
            Chill Mate
          </Link>
          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-white/60 bg-white/40 backdrop-blur-md px-2 py-1.5">
            {[
              { id: "date", label: "Dating" },
              { id: "friends", label: "Campus Plans" },
              { id: "stories", label: "Stories" },
              { id: "safety", label: "Safety" },
              { id: "support", label: "Contact" }
            ].map((item) => (
              <a key={item.id} href={`#${item.id}`} className="px-4.5 py-2 rounded-full text-sm font-semibold text-slate-700 hover:bg-white/80 hover:text-pink-600 transition">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-4.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white transition-all hover:border-pink-300">
              Log in
            </Link>
            <Link to="/register" className="rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white px-5 py-2.5 text-sm font-semibold soft-glow-brand transition-all hover:scale-[1.02]">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="date" className="hero min-h-[90vh] flex items-center py-8 sm:py-16">
        <div className="max-w-7xl mx-auto w-[90vw] grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div className="reveal" data-parallax-speed="0.04">
            <span className="inline-flex items-center rounded-full border border-pink-200/60 bg-pink-50/65 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-rose-600 tracking-wide">
              🏫 Campus swiping & matching app
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6.5xl leading-[1.08] font-black tracking-tight text-slate-900 font-display">
              Find Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-indigo-600">
                Campus Vibe
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed">
              Swipe, match, and connect with verified students at your university. Meet people who share your vibe, join spontaneous chill plans, and start campus stories.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/register" className="cta-glow-btn rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 text-white px-7 py-4 text-base font-bold soft-glow-brand hover:scale-[1.03] transition-all">
                Get Started Free
              </Link>
              <a href="#video" className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm px-6 py-4 text-base font-semibold text-slate-700 hover:bg-white hover:border-pink-300 transition-all">
                What Students Say
              </a>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md px-4.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Trusted by 1,000+ students on campus
            </div>
          </div>

          <div
            ref={heroMediaRef}
            className="hero-media reveal"
            onMouseMove={handleHeroPointerMove}
            onMouseLeave={resetHeroPointer}
          >
            <div className="hero-layer hero-main" data-parallax-speed="0.06">
              <div className="hero-card rounded-3xl border border-white/50">
                <img src={IMAGES.heroMain} alt="College students laughing on campus" loading="lazy" onError={handleImageError} />
              </div>
            </div>
            <div className="hero-layer hero-right-a" data-parallax-speed="0.11">
              <div className="hero-card rounded-3xl border border-white/50">
                <img src={IMAGES.heroSide} alt="Verified student profile" loading="lazy" onError={handleImageError} />
              </div>
            </div>
            <div className="hero-layer hero-right-b" data-parallax-speed="0.15">
              <div className="hero-card rounded-3xl border border-white/50">
                <img src={IMAGES.heroRight} alt="Smiling student outdoors" loading="lazy" onError={handleImageError} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="friends" className="py-20 relative">
        <div className="max-w-7xl mx-auto w-[90vw]">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-extrabold tracking-[0.25em] uppercase text-rose-600 font-display">Vibe Engine Features</p>
            <h2 className="mt-2 text-3.5xl sm:text-4.5xl font-black text-slate-900 tracking-tight font-display">Everything you need on one app</h2>
            <p className="mt-3 text-slate-600 text-base">Designed carefully for verified students to connect safely, make plans, and chat naturally.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "💘", t: "Swipe & Match", d: "Discover verified student profiles from your campus. Swipe right to like, left to skip. Mutual likes create matches." },
              { icon: "🎓", t: "Campus Plans", d: "Spontaneous hangout ideas. Host plans (e.g. coffee study sessions, treks) or join others to expand your circle." },
              { icon: "💬", t: "Real-time Chat", d: "Exchange messages, photos, and plan locations seamlessly. Clean chat interfaces styled with soft glass bubbles." },
            ].map((f) => (
              <article key={f.t} data-reveal className="landing-reveal glass-card hover-lift rounded-3xl p-6 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 grid place-items-center text-2xl shadow-sm">{f.icon}</div>
                <h3 className="mt-4 text-xl font-bold text-slate-900 font-display">{f.t}</h3>
                <p className="mt-2.5 text-slate-600 text-[15px] leading-relaxed">{f.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Campus Stories Section */}
      <section id="stories" className="py-20 bg-white/35">
        <div className="max-w-7xl mx-auto w-[90vw] rounded-[32px] glass-panel p-6 sm:p-10 hover-lift duration-300">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-extrabold tracking-[0.25em] uppercase text-rose-600 font-display">Match Stories</p>
              <h2 className="mt-2 text-4xl sm:text-5xl font-black leading-tight text-slate-900 font-display">"We are both naturally happy go-getters!"</h2>
              <p className="mt-4 text-slate-600 text-lg leading-relaxed">
                Chill Mate brings real student communities together. Read stories from people who matched over shared interests, met for coffee plans, and built lifelong bonds.
              </p>
              <Link to="/register" className="mt-7 inline-flex rounded-2xl bg-slate-900 px-6 py-3.5 text-white font-semibold hover:bg-black transition-all hover:scale-[1.01]">
                Read more stories
              </Link>
            </div>
            <div className="relative rounded-[24px] overflow-hidden">
              <img data-reveal src={IMAGES.story} alt="Happy college couple matching" className="landing-reveal w-full h-[400px] object-cover hover:scale-105 transition duration-700" loading="lazy" onError={handleImageError} />
              <div className="absolute bottom-4 left-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-xs text-white font-medium">
                Matched at Presidency University
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans & Chat Visual Section */}
      <section id="events" className="py-20">
        <div className="max-w-7xl mx-auto w-[90vw] grid lg:grid-cols-2 gap-6">
          <article className="rounded-[32px] border border-amber-200/50 bg-gradient-to-br from-amber-50/70 via-amber-100/30 to-amber-200/20 p-6 flex flex-col justify-between hover-lift duration-300">
            <div>
              <div className="relative overflow-hidden rounded-2xl">
                <img src={IMAGES.plans} alt="Spontaneous group study plan" className="w-full h-60 object-cover" loading="lazy" onError={handleImageError} />
              </div>
              <h3 className="mt-5 text-3xl font-black text-slate-900 font-display">Campus Plans</h3>
              <p className="mt-2.5 text-slate-600 leading-relaxed text-[15px]">Create plans, set max guest counts, and connect with peers across departments. Say goodbye to awkward icebreakers.</p>
            </div>
            <Link to="/register" className="mt-5 inline-flex items-center text-sm font-bold text-amber-700 hover:text-amber-800 transition">
              Explore ongoing plans <span className="ml-1">→</span>
            </Link>
          </article>
          <article className="rounded-[32px] border border-pink-200/50 bg-gradient-to-br from-pink-50/70 via-pink-100/30 to-indigo-100/20 p-6 flex flex-col justify-between hover-lift duration-300">
            <div>
              <div className="relative overflow-hidden rounded-2xl">
                <img src={IMAGES.chats} alt="Student group chat interface" className="w-full h-60 object-cover" loading="lazy" onError={handleImageError} />
              </div>
              <h3 className="mt-5 text-3xl font-black text-slate-900 font-display">Stories + Real Chats</h3>
              <p className="mt-2.5 text-slate-600 leading-relaxed text-[15px]">Move from swipe to conversation seamlessly. Message in real-time, get instant matches, and share invites safely.</p>
            </div>
            <Link to="/register" className="mt-5 inline-flex items-center text-sm font-bold text-pink-700 hover:text-pink-800 transition">
              Start swiping today <span className="ml-1">→</span>
            </Link>
          </article>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="py-20 bg-white/35">
        <div className="max-w-7xl mx-auto w-[90vw] grid lg:grid-cols-2 gap-10 items-center rounded-[32px] glass-panel p-6 sm:p-10 hover-lift duration-300">
          <div className="relative rounded-[24px] overflow-hidden">
            <img src={IMAGES.safety} alt="Safe college student dating" className="w-full h-[400px] object-cover" loading="lazy" onError={handleImageError} />
          </div>
          <div>
            <p className="text-xs font-extrabold tracking-[0.25em] uppercase text-rose-600 font-display">Safety & Feedback</p>
            <h2 className="mt-2 text-4xl sm:text-5xl font-black leading-tight text-slate-900 font-display">Safe. Secure. Community First.</h2>
            <p className="mt-4 text-slate-600 leading-relaxed text-[15px]">
              Every account is locked to an official college email address. Easily block or report suspicious activity. Early members get access to special privacy controls and community moderation channels.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link to="/feedback" className="rounded-2xl bg-slate-900 hover:bg-black text-white px-6 py-3.5 font-semibold text-sm transition-all hover:scale-[1.01]">
                Give Feedback
              </Link>
              <Link to="/register" className="rounded-2xl border border-pink-200 bg-white/70 backdrop-blur-sm px-6 py-3.5 font-semibold text-sm text-rose-700 hover:bg-white transition-all">
                Learn About Safety
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gradient-to-br from-rose-100/50 via-purple-100/40 to-indigo-100/50">
        <div className="max-w-7xl mx-auto w-[90vw]">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-extrabold tracking-[0.25em] uppercase text-rose-600 font-display">Simple Process</p>
            <h2 className="mt-2 text-3.5xl sm:text-4.5xl font-black text-[#1e1b4b] tracking-tight font-display">Simple flow. Real outcomes.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "👤", t: "Create Profile", d: "Sign up with your college email. Fill in your branch, year, interests, and upload profile pictures." },
              { icon: "💘", t: "Swipe & Connect", d: "Discover people nearby, swipe right to match, or check who already liked you." },
              { icon: "🎉", t: "Plan Hangouts", d: "Don't stop at chats. Join ongoing plans or host one to meet friends in real life." },
            ].map((item) => (
              <article key={item.t} data-reveal className="landing-reveal glass-card hover-lift rounded-3xl p-6 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 text-2xl grid place-items-center shadow-sm">{item.icon}</div>
                <h3 className="mt-5 text-xl font-bold text-[#1f1b3d] font-display">{item.t}</h3>
                <p className="mt-3 text-slate-600 text-[14px] leading-relaxed">{item.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials & Beta */}
      <section id="video" className="py-20 bg-[#faf8fb]">
        <div className="max-w-7xl mx-auto w-[90vw]">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-extrabold tracking-[0.25em] uppercase text-rose-600 font-display">Student Proof</p>
            <h2 className="mt-2 text-3.5xl sm:text-4.5xl font-black text-slate-900 tracking-tight font-display">What students say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { q: "I made real friends here. The plans feature is a game-changer.", by: "Aditi, 2nd year" },
              { q: "Campus plans helped me meet awesome people outside my branch.", by: "Rohan, 3rd year" },
              { q: "Finally a dating app that feels premium, clean, and actually useful.", by: "Nisha, 1st year" },
            ].map((item) => (
              <article key={item.by} data-reveal className="landing-reveal rounded-[28px] border border-purple-100/50 bg-[#fbf5fd] p-6 hover-lift transition-all duration-300">
                <div className="text-amber-500 tracking-wider text-base">★★★★★</div>
                <p className="mt-4 text-lg leading-snug text-slate-800 font-semibold font-display">"{item.q}"</p>
                <p className="mt-4 text-xs text-slate-500 font-bold uppercase tracking-wider">- {item.by}</p>
              </article>
            ))}
          </div>
          <div data-reveal className="landing-reveal mt-16 rounded-[32px] border border-pink-200/40 bg-gradient-to-br from-pink-100 via-rose-50/50 to-indigo-100 p-6 sm:p-10 shadow-sm relative">
            <p className="text-xs font-extrabold tracking-[0.25em] uppercase text-rose-600 font-display">Early Access Beta</p>
            <h3 className="mt-3 text-3.5xl sm:text-4.5xl font-black text-slate-900 tracking-tight font-display">Join the next beta wave</h3>
            <p className="mt-2 text-slate-600 text-base max-w-xl">Get private updates, feature previews, and launch invites direct to your university mailbox.</p>
            <form className="mt-8 grid sm:grid-cols-[1fr_auto] gap-3 max-w-2xl">
              <input type="email" placeholder="Enter your presidency email" required className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm px-4.5 py-4 text-base text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-200 transition-all" />
              <button type="submit" className="rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 text-white px-8 py-4 text-base font-bold shadow-lg shadow-pink-200 hover:scale-[1.01] transition-all">
                Join Beta
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer CTA & Mockup */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto w-[90vw] rounded-[32px] bg-gradient-to-br from-indigo-900 to-slate-900 p-6 sm:p-10 grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-black font-display">Get Chill Mate</h2>
            <p className="mt-3 text-slate-300 text-base max-w-md">Join your verified college community and start building real campus connections today.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm">
              <Link to="/login" className="rounded-2xl bg-white text-slate-900 py-3 text-center font-bold hover:bg-slate-100 transition-all hover:scale-[1.02]">Log in</Link>
              <Link to="/register" className="rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 text-white py-3 text-center font-bold transition-all hover:scale-[1.02] soft-glow-brand">Sign up</Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[24px]">
            <img src={IMAGES.app} alt="Chill Mate Mobile app mockup" className="w-full h-64 sm:h-80 object-cover opacity-90" loading="lazy" onError={handleImageError} />
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/50 py-10 bg-white/20">
        <div className="max-w-7xl mx-auto w-[90vw] flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          <div className="font-bold">© Chill Mate {new Date().getFullYear()}. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-pink-600 transition">Privacy Policy</a>
            <a href="#" className="hover:text-pink-600 transition">Terms of Service</a>
            <a href="#" className="hover:text-pink-600 transition">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
