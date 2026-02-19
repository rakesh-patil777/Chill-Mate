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
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=80",
  heroSide:
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  heroRight:
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80",
  story:
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80",
  plans:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  chats:
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
  safety:
    "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=1200&q=80",
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
      className="landing-page min-h-screen bg-[#f7f2f7] text-slate-900"
    >
      <style>{`
        html.lenis, html.lenis body { height: auto; }
        .lenis.lenis-smooth { scroll-behavior: auto !important; }
        .landing-reveal { opacity: 0; transform: translateY(24px); transition: opacity .55s ease, transform .55s ease; }
        .landing-reveal.in { opacity: 1; transform: translateY(0); }
        .landing-page {
          position: relative;
          --cx: 50%;
          --cy: 25%;
        }
        .landing-page::before {
          content: "";
          position: fixed;
          inset: -12%;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(520px 320px at var(--cx) var(--cy), rgba(255,255,255,.22), transparent 68%),
            radial-gradient(540px 380px at 85% 12%, rgba(236,72,153,.10), transparent 62%),
            radial-gradient(500px 340px at 15% 78%, rgba(124,58,237,.08), transparent 62%);
          transition: background .14s linear;
        }
        .landing-page > * { position: relative; z-index: 1; }
        .chill-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(8px);
          background: rgba(247,242,247,.88);
          border-bottom: 1px solid #eadced;
        }
        .hero-media {
          position: relative;
          min-height: 540px;
          --mx: 0;
          --my: 0;
          --px: 50%;
          --py: 50%;
          perspective: 1100px;
        }
        .hero-media::after {
          content: "";
          position: absolute;
          inset: -12px;
          background: radial-gradient(circle at var(--px) var(--py), rgba(255,255,255,.28), transparent 45%);
          opacity: 0;
          transition: opacity .22s ease;
          pointer-events: none;
          border-radius: 34px;
        }
        .hero-media:hover::after {
          opacity: 1;
        }
        .hero-layer {
          position: absolute;
          transition: transform .18s ease-out;
        }
        .hero-card {
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,.75);
          box-shadow: 0 18px 38px rgba(36, 13, 48, 0.22);
          width: 100%;
          height: 100%;
          transition: transform .18s ease-out, box-shadow .2s ease;
          transform:
            translate3d(calc(var(--mx) * 10px), calc(var(--my) * 10px), 0)
            rotateY(calc(var(--mx) * 4deg))
            rotateX(calc(var(--my) * -4deg));
          transform-style: preserve-3d;
        }
        .hero-media:hover .hero-card { box-shadow: 0 24px 52px rgba(36, 13, 48, 0.30); }
        .hero-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .hero-main { inset: 10px 22% 10px 0; }
        .hero-right-a { width: 31%; height: 72%; right: 8%; top: 6%; }
        .hero-right-b { width: 26%; height: 60%; right: -2%; bottom: 2%; }
        .landing-page section {
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .landing-page article,
        .landing-page .rounded-3xl,
        .landing-page .rounded-2xl {
          transition: transform .25s ease, box-shadow .25s ease, background-color .25s ease;
        }
        .landing-page article:hover,
        .landing-page .rounded-3xl:hover,
        .landing-page .rounded-2xl:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 38px rgba(58, 27, 77, 0.12);
        }
        .landing-page a,
        .landing-page button {
          transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
        }
        .landing-page a:hover,
        .landing-page button:hover {
          filter: saturate(1.06);
        }
        .landing-page .inline-flex.rounded-xl,
        .landing-page .rounded-2xl.bg-gradient-to-r {
          position: relative;
          overflow: hidden;
        }
        .landing-page .inline-flex.rounded-xl::after,
        .landing-page .rounded-2xl.bg-gradient-to-r::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-120%);
          background: linear-gradient(100deg, transparent 25%, rgba(255,255,255,.42) 50%, transparent 75%);
          animation: marqueeShine 4.8s linear infinite;
          pointer-events: none;
        }
        @keyframes marqueeShine {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(140%); }
        }
        .chill-nav::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 2px;
          background: linear-gradient(90deg, #ec4899, #8b5cf6, #ec4899);
          background-size: 220% 100%;
          animation: navMarquee 7s linear infinite;
          opacity: .65;
        }
        @keyframes navMarquee {
          0% { background-position: 0% 0%; }
          100% { background-position: 220% 0%; }
        }
      `}</style>

      <header className="chill-nav">
        <div className="max-w-7xl mx-auto w-[95vw] py-4 flex items-center justify-between gap-4">
          <Link to="/landing" className="text-4xl font-black tracking-tight text-pink-600" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Chill Mate
          </Link>
          <nav className="hidden lg:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            {["Date", "Friends", "Stories", "Events", "Safety", "Support"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="px-4 py-2 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-pink-50 hover:text-pink-700">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Log in</Link>
            <Link to="/register" className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-black">Sign up</Link>
          </div>
        </div>
      </header>

      <section id="date" className="hero min-h-[88vh] flex items-center py-10 sm:py-14 bg-gradient-to-br from-[#ffd9ef] via-[#f8dcf4] to-[#eadbff]">
        <div className="max-w-7xl mx-auto w-[95vw] grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          <div className="reveal" data-parallax-speed="0.05">
            <span className="inline-flex items-center rounded-full border border-pink-200 bg-white px-3 py-1 text-xs font-semibold text-pink-700">
              Campus social connection app
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl leading-[1.03] font-black tracking-tight">
              Chill Mate — Connect, Discover, Chill.
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-xl">
              Find friends, join plans, and make memories on campus.
            </p>
            <div className="mt-7 flex items-center gap-3">
              <Link to="/register" className="rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 text-white px-5 py-3 text-base font-semibold shadow">
                Get Early Access
              </Link>
              <a href="#video" className="rounded-xl border border-pink-200 bg-white/80 px-5 py-3 text-base font-semibold text-slate-700 hover:bg-white transition">
                Watch Video
              </a>
            </div>
            <div className="mt-5 inline-flex rounded-xl border border-pink-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700">
              Trusted by 1000+ students
            </div>
          </div>

          <div
            ref={heroMediaRef}
            className="hero-media reveal"
            onMouseMove={handleHeroPointerMove}
            onMouseLeave={resetHeroPointer}
          >
            <div className="hero-layer hero-main" data-parallax-speed="0.08">
              <div className="hero-card">
                <img src={IMAGES.heroMain} alt="Students hanging out on campus" loading="lazy" onError={handleImageError} />
              </div>
            </div>
            <div className="hero-layer hero-right-a" data-parallax-speed="0.12">
              <div className="hero-card">
                <img src={IMAGES.heroSide} alt="Campus social profile" loading="lazy" onError={handleImageError} />
              </div>
            </div>
            <div className="hero-layer hero-right-b" data-parallax-speed="0.16">
              <div className="hero-card">
                <img src={IMAGES.heroRight} alt="Student smiling outdoors" loading="lazy" onError={handleImageError} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="friends" className="py-16">
        <div className="max-w-7xl mx-auto w-[95vw]">
          <p className="text-xs font-extrabold tracking-[0.2em] uppercase text-pink-700">Features</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black">Everything you need on one app</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "💘", t: "Swipe Cards", d: "Discover profiles and match instantly." },
              { icon: "🎓", t: "Campus Plans", d: "Create or join events around campus." },
              { icon: "💬", t: "Real Chats", d: "Chat naturally after mutual interest." },
            ].map((f) => (
              <article key={f.t} data-reveal className="landing-reveal rounded-2xl border border-white/90 bg-white/70 p-5 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-pink-100 grid place-items-center text-xl">{f.icon}</div>
                <h3 className="mt-3 text-xl font-bold">{f.t}</h3>
                <p className="mt-2 text-slate-600">{f.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="stories" className="py-16 bg-white/55">
        <div className="max-w-7xl mx-auto w-[95vw] rounded-3xl border border-slate-200 bg-[#fffdfd] p-4 sm:p-7">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-extrabold tracking-[0.2em] uppercase text-pink-700">Stories</p>
              <h2 className="mt-2 text-4xl sm:text-5xl font-black leading-tight">We are both naturally positive, happy-go-getters.</h2>
              <p className="mt-4 text-lg text-slate-700">
                Real campus stories from people who matched, chatted, and turned it into meaningful connections.
              </p>
              <Link to="/register" className="mt-6 inline-flex rounded-xl bg-slate-900 px-6 py-3 text-white font-semibold hover:bg-black">
                Read more stories
              </Link>
            </div>
            <img data-reveal src={IMAGES.story} alt="Happy couple" className="landing-reveal w-full h-[440px] object-cover rounded-3xl" loading="lazy" onError={handleImageError} />
          </div>
        </div>
      </section>

      <section id="events" className="py-16">
        <div className="max-w-7xl mx-auto w-[95vw] grid lg:grid-cols-2 gap-4">
          <article className="rounded-3xl border border-amber-200 bg-amber-200/80 p-5">
            <img src={IMAGES.plans} alt="Friends meetup" className="w-full h-64 object-cover rounded-2xl" loading="lazy" onError={handleImageError} />
            <h3 className="mt-4 text-4xl font-black">Campus Plans</h3>
            <p className="mt-2 text-xl text-slate-700">Join events, build friend circles, and meet people beyond your department.</p>
            <Link to="/register" className="mt-4 inline-flex text-lg font-bold underline">Find your people</Link>
          </article>
          <article className="rounded-3xl border border-pink-200 bg-pink-100 p-5">
            <img src={IMAGES.chats} alt="Group chat and stories" className="w-full h-64 object-cover rounded-2xl" loading="lazy" onError={handleImageError} />
            <h3 className="mt-4 text-4xl font-black">Stories + Real Chats</h3>
            <p className="mt-2 text-xl text-slate-700">Move from swipe to conversation and create stories worth sharing.</p>
            <Link to="/register" className="mt-4 inline-flex text-lg font-bold underline">Start connecting</Link>
          </article>
        </div>
      </section>

      <section id="safety" className="py-16 bg-white/55">
        <div className="max-w-7xl mx-auto w-[95vw] grid lg:grid-cols-2 gap-8 items-center rounded-3xl border border-slate-200 bg-[#fffdfd] p-5 sm:p-8">
          <img src={IMAGES.safety} alt="Safe campus community" className="w-full h-[440px] object-cover rounded-3xl" loading="lazy" onError={handleImageError} />
          <div>
            <h2 className="text-5xl font-black leading-tight">Share your ideas</h2>
            <p className="mt-4 text-xl text-slate-700">Help shape Chill Mate with feature feedback, safety suggestions, and student-first improvements.</p>
            <p className="mt-4 text-xl text-slate-700">Early members get sneak peeks at upcoming features and private community discussions.</p>
            <Link to="/feedback" className="mt-6 inline-flex rounded-xl bg-slate-900 px-6 py-3 text-white font-semibold hover:bg-black">Sign up</Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f2e0f4]">
        <div className="max-w-7xl mx-auto w-[95vw]">
          <p className="text-xs font-extrabold tracking-[0.2em] uppercase text-pink-700">How It Works</p>
          <h2 className="mt-2 text-4xl sm:text-5xl font-black text-[#241b3f]">Simple flow. Real outcomes.</h2>
          <div className="mt-7 grid md:grid-cols-3 gap-4">
            {[
              { icon: "👤", t: "Create Your Profile", d: "Set your vibe, interests, and what you're looking for." },
              { icon: "💘", t: "Swipe & Match", d: "Discover people nearby and connect instantly." },
              { icon: "🎉", t: "Plan Hangouts & Chill", d: "Create events or join ongoing campus plans." },
            ].map((item) => (
              <article key={item.t} data-reveal className="landing-reveal rounded-3xl border border-purple-100 bg-white/85 p-6 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-pink-100 text-lg grid place-items-center">{item.icon}</div>
                <h3 className="mt-5 text-2xl font-black text-[#1f1b3d]">{item.t}</h3>
                <p className="mt-3 text-lg text-slate-600 leading-relaxed">{item.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="video" className="py-16 bg-[#faf8fb]">
        <div className="max-w-7xl mx-auto w-[95vw]">
          <p className="text-xs font-extrabold tracking-[0.2em] uppercase text-pink-700">Social Proof</p>
          <h2 className="mt-2 text-4xl sm:text-5xl font-black text-[#241b3f]">What students say</h2>
          <div className="mt-7 grid md:grid-cols-3 gap-4">
            {[
              { q: "I made real friends here.", by: "Aditi, 2nd year" },
              { q: "Campus plans helped me meet people outside my branch.", by: "Rohan, 3rd year" },
              { q: "Feels premium, clean, and actually useful.", by: "Nisha, 1st year" },
            ].map((item) => (
              <article key={item.by} data-reveal className="landing-reveal rounded-3xl border border-purple-100 bg-[#f6eef8] p-6">
                <div className="text-amber-500 tracking-[0.18em] text-lg">★★★★★</div>
                <p className="mt-4 text-2xl leading-tight text-[#201a3b] font-semibold">"{item.q}"</p>
                <p className="mt-5 text-lg text-slate-700">- {item.by}</p>
              </article>
            ))}
          </div>
          <div data-reveal className="landing-reveal mt-12 rounded-3xl border border-purple-100 bg-[#efdaf1] p-6 sm:p-10">
            <p className="text-xs font-extrabold tracking-[0.2em] uppercase text-pink-700">Early Access</p>
            <h3 className="mt-3 text-4xl sm:text-5xl font-black text-[#241b3f]">Join the next campus beta wave.</h3>
            <p className="mt-4 text-xl text-slate-600">Get product drops, feature previews, and early invites.</p>
            <form className="mt-7 grid sm:grid-cols-[1fr_auto] gap-3">
              <input type="email" placeholder="Enter your college email" required className="rounded-2xl border border-purple-100 bg-white px-4 py-4 text-lg text-slate-800 placeholder:text-slate-400 outline-none" />
              <button type="submit" className="rounded-2xl bg-gradient-to-r from-pink-600 to-violet-600 text-white px-8 py-4 text-lg font-bold shadow-lg shadow-pink-200">
                Join the Beta
              </button>
            </form>
          </div>
        </div>
      </section>

      <section id="support" className="py-16">
        <div className="max-w-7xl mx-auto w-[95vw] rounded-3xl border border-amber-200 bg-amber-200/90 p-5 sm:p-8 grid lg:grid-cols-[1fr_1fr] gap-6 items-center">
          <div>
            <h2 className="text-5xl font-black">Get the app</h2>
            <p className="mt-2 text-lg">Join now and unlock campus connections.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 max-w-sm">
              <Link to="/login" className="rounded-xl bg-slate-900 text-white py-3 text-center font-semibold hover:bg-black">Log in</Link>
              <Link to="/register" className="rounded-xl bg-pink-600 text-white py-3 text-center font-semibold hover:bg-pink-700">Sign up</Link>
            </div>
          </div>
          <img src={IMAGES.app} alt="Mobile app mockup" className="w-full h-72 sm:h-80 object-cover rounded-3xl" loading="lazy" onError={handleImageError} />
        </div>
      </section>

      <footer className="border-t border-white/60 py-8">
        <div className="max-w-7xl mx-auto w-[95vw] flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <div className="font-bold">© Chill Mate {new Date().getFullYear()}. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-pink-700">Privacy</a>
            <a href="#" className="hover:text-pink-700">Terms</a>
            <a href="#" className="hover:text-pink-700">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
