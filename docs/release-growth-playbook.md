# GigaMusic: release and growth playbook

Status: proposed operating plan (2026-10-24). This is a checklist, not a claim that integrations, visualizers, analytics, or payments are deployed.

## Launch gates (finish before paid promotion)

1. Merge the launch-reliability PR only after CI, Vercel preview, direct-link, sitemap, deletion, and Samsung Android/Bluetooth testing pass.
2. Verify `/sitemap.xml` returns valid XML with song URLs; verify `/robots.txt` links to the sitemap. Submit the verified sitemap to Google Search Console.
3. Check that direct `/song/:id` links show correct title, artist, playable audio, working Next Track, and share preview. Improve initial HTML metadata / social OG tags before scaling links.
4. Audit every public song for artist credit, title, genre, album, artwork, rights, and duplicate/filename-like titles.
5. Confirm backups can be restored: perform an admin export, verify the archive opens, and separately confirm any scheduled off-site backup is actually configured.
6. Check mobile layout, audio load time, broken links, and contact/privacy/terms pages as relevant to email capture and payments.

## Publishing workflow (one song at a time)

- **Draft:** Upload audio and cover art; validate file type, title, artist, ownership/license, lyrics, and explicit-release approval. Future product feature: drafts should be non-public.
- **Review:** Check metadata and audio quality; confirm the final song URL and artwork are shareable.
- **Publish:** Make the song public only after approval; record the published URL and release date.
- **Promote:** Prepare one 16:9 full-song visualizer, three 9:16 vertical excerpts, one square cover, and social captions.
- **Distribute:** Approve platform-specific posts; queue links to the GigaMusic song page with UTM campaign tags.
- **Measure:** After 48 hours, 7 days, and 30 days, review song plays, engaged listening, link clicks, email signups, and conversion.
- **Protect:** Export metadata/audio and verify backups.

## Christian visualizer production spec

- **16:9 full length:** 1920x1080, duration matching the licensed recording; readable song title, artist, subtle motion, consistent logo and CTA at end.
- **9:16 shorts:** 1080x1920; three distinct 15-30-second excerpts (hook, meaningful lyric, emotional lift). Keep essential text within safe margins.
- **Theme directions:** dawn and renewal, living water, light through darkness, peaceful mountains, and cross silhouette. Prefer respectful Christian symbolism over visually noisy effects.
- **Motion:** slow parallax, subtle particles/light, restrained transitions synchronized to phrase changes; avoid flashing and excessive rapid motion.
- **Lyrics/Scripture:** only display verified lyrics and accurately attributed scripture; confirm Bible translation permissions before displaying extended quotations.
- **Accessibility:** legible captions, strong contrast, avoid text at bottom UI overlay, review on a phone.
- **QA:** watch the exported video from beginning to end, check sync and sound, spelling, crop, encoding, and rights before uploading.

## First campaign: "Jesus Turned It Around" — Kolf

**Prerequisite:** owner confirms recording, artwork, name/credits, and platform promotion rights.

- **Day 1:** finalize song metadata, share image, and canonical song URL.
- **Day 2:** export 16:9 full-song visualizer; create three vertical hooks with distinct captions.
- **Day 3:** post full visualizer to YouTube; add a direct GigaMusic song link in description and pinned comment.
- **Days 4-10:** stagger three short clips on authorized YouTube/Instagram/Facebook/TikTok accounts, each with an explicit listen CTA.
- **Day 7:** send one opt-in email highlighting the song and ask listeners which style they want next.
- **Day 14:** compare channels by engaged listens and subscriber conversions; repeat the best hook.

**Example campaign tracking:** `?utm_source=youtube&utm_medium=video&utm_campaign=jesus_turned_it_around`. Adapt source/medium to each post.

## Site roadmap (after launch reliability)

1. **Admin:** song search, draft/published/archive states, restore, safe delete, metadata validation, and bulk corrections.
2. **SEO:** server-delivered unique title/description/OG metadata, canonical URLs, MusicRecording structured data where accurate, XML sitemap, Search Console.
3. **Fan capture:** permission-based email signup, clear privacy notice, double opt-in when practical, unsubscribe support.
4. **Insights:** privacy-conscious events for song started, 30-second listen, completed, download click, signup, and campaign referral; avoid inflated metrics from automatic repeats.
5. **Automation:** approval-gated workflow triggered by release approval: generate assets -> draft posts -> owner approves -> publish via authorized APIs -> collect weekly report.
6. **Monetization:** retain free listening; later add optional tips, paid downloads, and supporters only after payment processing, rights, refund terms, and tax treatment are addressed.

## Approval boundaries

The owner must approve music/visual rights, artist credits, actual public releases, social-platform OAuth permissions, email-list usage, and payment onboarding. Do not post, charge, or claim rights without approval.

## Weekly scorecard

| Metric | Goal / interpretation |
| --- | --- |
| Playback completion rate | Track improvement after Android fix |
| 30-second engaged plays | More meaningful than raw starts |
| Direct-link playback success | Ensure promotional traffic can listen |
| Organic search clicks | Baseline via Search Console after indexing |
| Email opt-ins | Sustainable owned audience |
| Listens per referral source | Select best-performing channels |
| Revenue per 100 engaged listeners | Evaluate tips/downloads only when enabled |

**Release rule:** prioritize working playback and credible metadata over high-volume automated promotion.
