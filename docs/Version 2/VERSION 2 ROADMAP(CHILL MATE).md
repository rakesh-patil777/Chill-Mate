## VERSION 2 (CHILL MATE):



CHILL MATE V2 — MASTER THEORY BLUEPRINT

1️⃣ PRODUCT VISION REFINEMENT (V2)

🔥 Positioning Statement



Chill Mate is India’s first trust-first, college-only intelligent dating ecosystem.



Not:



Swipe casino



Hookup app



Generic dating app



But:



Verified



Intelligent



Reputation-based



Safe



2️⃣ CORE SYSTEMS OF VERSION 2



V2 will not add random features.

It strengthens 8 Core Systems:



Observability System



Database Upgrade



Smart Matching Engine v2



Trust Score System



Monetization Engine v2



Campus Analytics \& Expansion System



Background Job System



Security Hardening Layer



3️⃣ SYSTEM ARCHITECTURE V2 (High-Level)

4

Logical Separation (Even If Same Repo)

Client (Web / Mobile)

&nbsp;       ↓

API Gateway

&nbsp;       ↓

----------------------------------

Auth Service

User Service

Matching Service

Chat Service

Trust Engine

Premium Service

Analytics Service

----------------------------------

&nbsp;       ↓

PostgreSQL

Redis

Object Storage

Logging + Monitoring



This makes V3 scale-ready without rewrite.



4️⃣ DATABASE THEORY FOR V2

🔁 Migration: SQLite → PostgreSQL



Why?



Concurrency support



Indexing optimization



JSONB support



Scalable architecture



New Tables Required

Core Tables



users



profiles



interests



matches



swipes



messages



reports



subscriptions



trust\_scores



campus\_stats



analytics\_events



5️⃣ SMART MATCHING ENGINE V2 (THEORY)



V1:



Like + Mutual = Match



V2:



Match Score = Weighted Algorithm

🎯 Match Score Formula (Conceptual)

score =

(0.30 × Campus Match)

\+ (0.15 × Year Match)

\+ (0.20 × Interest Similarity)

\+ (0.10 × Activity Level)

\+ (0.15 × Trust Score)

\+ (0.10 × Mutual Connections)



Store:



matchScore: float



Sort by:



Highest matchScore



Then recency



This makes Chill Mate feel intelligent.



6️⃣ TRUST SCORE SYSTEM (BRAND DEFENDER)



Every user has:



trustScore: 0–100

Increases When:



Verified college email (+20)



Profile 80% complete (+10)



Active 7 consecutive days (+5)



No reports (+5/month)



Decreases When:



− Reported (-10 each confirmed)

− 5 ghosted chats (-5)

− Abusive message (-20)

− Fake profile detection (-40)



Effects of Trust Score

Score	Visibility

80+	High priority

60–79	Normal

40–59	Limited reach

<40	Hidden / flagged



This is your biggest differentiator.



7️⃣ MONETIZATION SYSTEM V2

Free Tier



50 swipes/day



Basic filters



1 Boost/month



Premium Tier



Unlimited swipes



See who liked you



Advanced filters (year, department)



Profile boost (5/month)



Priority in algorithm (+ small score weight)



No feature spam.



Aligned with value.



8️⃣ CAMPUS EXPANSION SYSTEM



Each campus gets:



Total users



Daily active users



Match rate



Report rate



Premium conversion rate



Admin dashboard per campus.



This supports:



Campus ambassador program



Targeted marketing



Controlled scaling



9️⃣ OBSERVABILITY STACK



Production-grade must include:



Logging



Structured logging (pino)



Centralized storage



Error Monitoring



Sentry



Uptime Monitoring



/health endpoint



Domain monitoring



🔟 BACKGROUND JOB SYSTEM



Use:



Redis



BullMQ



Jobs:



Daily match recalculation



Trust score updates



Inactivity reminders



Email notifications



Premium renewal checks



Separates heavy logic from API.



1️⃣1️⃣ SECURITY LAYER V2

Required Upgrades



Advanced rate limiting (per route)



CSRF protection



Device fingerprinting



Suspicious login detection



Account lock after 5 failed logins



Admin IP allowlist



Secure cookie configuration



Encrypted database backups



Daily snapshot backups



Audit logs for admin actions



If scale grows:



Cloudflare WAF



DDoS protection



1️⃣2️⃣ DATA INTELLIGENCE ENGINE



Track:



Swipe success rate



Match conversion %



Avg conversation length



Ghosting %



Time to first reply



Premium conversion



This feeds algorithm improvements.



1️⃣3️⃣ NON-FUNCTIONAL REQUIREMENTS (VERY IMPORTANT)

Performance



API response < 300ms



Match calculation < 200ms



Chat latency < 150ms



Availability



99.5% uptime minimum



Scalability



Support 50k users per campus



Security



Zero plaintext passwords



Encrypted PII



Role-based access control



1️⃣4️⃣ VERSION 2 RELEASE GOALS



V2 is successful if:



Match quality improves



Report rate decreases



Premium conversion increases



User retention increases



Campus expansion becomes systematic

