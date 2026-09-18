export type FeatureRow = {
  label: string;
  shiftforge: string;
  competitor: string;
};

export type Comparison = {
  slug: string;
  name: string;
  category: string;
  intro: string;
  pricing: string;
  freeOption: string;
  speed: string;
  accuracy: string;
  ease: string;
  bestFor: string;
  shiftforgeEdge: string;
  competitorEdge: string;
  sourceUrl: string;
  sourceLabel: string;
  features: FeatureRow[];
  faqs: { question: string; answer: string }[];
};

const commonShiftforge =
  'Best when you want to tune a car interactively in 3D first, then turn the same spec into an AI concept render.';

export const comparisons: Comparison[] = [
  {
    slug: 'mods-nation',
    name: 'MODS Nation',
    category: '3D tuning ecosystem',
    intro:
      'MODS Nation combines a 3D Mods Lab with a marketplace, community, editorial content, local shops and paid photoreal AI renders. ShiftForge is intentionally narrower: a fast 3D concept studio with optional AI rendering and saved builds.',
    pricing:
      'MODS Nation advertises free 3D building; photoreal renders use a paid MODS allowance. ShiftForge 3D is free; AI generation uses the user-paid Puter model gateway.',
    freeOption: 'Both offer free interactive 3D building.',
    speed: 'Both are realtime for 3D; AI render time varies by model.',
    accuracy:
      'Both are visualization tools. MODS Nation has the stronger real aftermarket catalog; ShiftForge is concept-level, not a fitment database.',
    ease: 'ShiftForge prioritizes a smaller control set and no-login 3D experimentation.',
    bestFor: commonShiftforge,
    shiftforgeEdge:
      'Lighter workflow, immediate no-login 3D exploration, and transparent model-backed AI generation without a ShiftForge subscription.',
    competitorEdge:
      'Much broader ecosystem: real parts, community, shops, editorial content and a more mature catalog.',
    sourceUrl: 'https://www.modsnation.com/',
    sourceLabel: 'MODS Nation official site and product pages, checked September 17, 2026',
    features: [
      { label: 'Realtime 3D configurator', shiftforge: 'Yes', competitor: 'Yes' },
      { label: 'Photoreal AI render', shiftforge: 'Yes, optional', competitor: 'Yes, paid allowance' },
      { label: 'Aftermarket catalog', shiftforge: 'Sample concept catalog', competitor: 'Real marketplace catalog' },
      { label: 'No-login 3D use', shiftforge: 'Yes', competitor: 'Authorization required for lab flow' },
      { label: 'Cloud build history', shiftforge: 'Optional Puter account', competitor: 'Account-based' },
      { label: 'Community / shops ecosystem', shiftforge: 'Lightweight showcase', competitor: 'Extensive' },
    ],
    faqs: [
      {
        question: 'Is ShiftForge a good MODS Nation alternative?',
        answer:
          'Yes if the main job is quickly exploring a concept in 3D and producing an AI visualization. MODS Nation is the better fit when its marketplace, local-shop and community ecosystem are central to your workflow.',
      },
      {
        question: 'Does ShiftForge replace MODS Nation fitment data?',
        answer:
          'No. ShiftForge is a concept visualizer and does not claim manufacturer-grade or parts-catalog fitment accuracy.',
      },
    ],
  },
  {
    slug: '3dtuning',
    name: '3DTuning',
    category: '3D car configurator',
    intro:
      '3DTuning is a long-running browser and mobile car configurator with hundreds of vehicle models and a large tuning catalog. ShiftForge focuses on a smaller original vehicle set plus AI concept rendering from the same build.',
    pricing: '3DTuning describes the configurator as free. ShiftForge realtime 3D is also free.',
    freeOption: 'Both have useful free 3D workflows.',
    speed: 'Both update the 3D build immediately; ShiftForge adds an optional slower AI render step.',
    accuracy:
      '3DTuning has far broader vehicle coverage. ShiftForge is a concept tool and should not be used for fitment validation.',
    ease: 'Both are approachable; ShiftForge exposes fewer controls on one responsive workspace.',
    bestFor: commonShiftforge,
    shiftforgeEdge: 'Integrated AI concept rendering and a tighter single-workspace flow.',
    competitorEdge: 'Much larger model catalog: 600+ cars and extensive individual tuning options.',
    sourceUrl: 'https://www.3dtuning.com/en-US',
    sourceLabel: '3DTuning official site and About pages, checked September 17, 2026',
    features: [
      { label: 'Realtime 3D configurator', shiftforge: 'Yes', competitor: 'Yes' },
      { label: 'Vehicle catalog', shiftforge: '3 original presets', competitor: '600+ cars advertised' },
      { label: 'AI photoreal render', shiftforge: 'Yes', competitor: 'Not a core advertised feature' },
      { label: 'Saved garage', shiftforge: 'Local + optional cloud', competitor: 'Yes with account' },
      { label: 'Mobile friendly', shiftforge: 'Yes', competitor: 'Yes, plus apps' },
      { label: 'Fitment guarantee', shiftforge: 'No', competitor: 'No engineering guarantee' },
    ],
    faqs: [
      {
        question: 'Is ShiftForge a good 3DTuning alternative?',
        answer:
          'ShiftForge is a strong alternative for a smaller, faster concept workflow with AI rendering. 3DTuning remains stronger if sheer vehicle and parts variety matters most.',
      },
      {
        question: '3DTuning vs ShiftForge: which has more cars?',
        answer:
          '3DTuning by a wide margin. Its official site advertises more than 600 cars, while ShiftForge intentionally launches with a small original set.',
      },
    ],
  },
  {
    slug: 'stuner',
    name: 'STuner',
    category: 'Detailed browser tuner',
    intro:
      'STuner is a free browser-based tuner known for deep body, wheel, suspension, engine, interior and camera controls. ShiftForge trades some of that depth for a cleaner mobile-first flow and optional AI rendering.',
    pricing: 'STuner is free. ShiftForge realtime 3D is free; AI generation is user-paid through Puter.',
    freeOption: 'Both provide substantial free configuration tools.',
    speed: 'Both are realtime for 3D changes.',
    accuracy: 'Both are visual concept tools rather than certified fitment or engineering software.',
    ease: 'ShiftForge is simpler; STuner exposes more detailed tuning controls.',
    bestFor: commonShiftforge,
    shiftforgeEdge: 'Cleaner guided workflow and built-in AI concept render step.',
    competitorEdge: 'Deeper granular tuning controls, especially mechanical and interior-oriented options.',
    sourceUrl: 'https://3dtuning.stuner.net/',
    sourceLabel: 'STuner official site, checked September 17, 2026',
    features: [
      { label: 'Realtime 3D configurator', shiftforge: 'Yes', competitor: 'Yes' },
      { label: 'Deep suspension controls', shiftforge: 'Stance slider', competitor: 'More granular' },
      { label: 'Engine / interior tuning', shiftforge: 'No', competitor: 'Yes' },
      { label: 'AI photoreal render', shiftforge: 'Yes', competitor: 'No core AI workflow' },
      { label: 'Mobile-first UI', shiftforge: 'Yes', competitor: 'Desktop-oriented' },
      { label: 'Free core tool', shiftforge: 'Yes', competitor: 'Yes' },
    ],
    faqs: [
      {
        question: 'Is ShiftForge a good STuner alternative?',
        answer:
          'Yes for a faster visual concept workflow with AI rendering. STuner is better suited to users who want its deeper granular tuning controls.',
      },
      {
        question: 'Is STuner more detailed than ShiftForge?',
        answer:
          'Yes. STuner exposes more granular categories, while ShiftForge deliberately keeps the live 3D control surface compact.',
      },
    ],
  },
  {
    slug: 'carmodsnap',
    name: 'CarModSnap',
    category: 'AI car modification visualizer',
    intro:
      'CarModSnap centers on AI modification previews and also offers a growing realtime 3D car-modder catalog. ShiftForge starts with interactive 3D as the primary loop and treats AI as the optional finishing step.',
    pricing:
      'CarModSnap lists paid AI plans starting at $9.90/month for 100 credits. ShiftForge charges no subscription; AI model charges, if any, are handled by the user-paid Puter gateway.',
    freeOption: 'CarModSnap offers free basic visualization; ShiftForge realtime 3D is free.',
    speed: 'ShiftForge 3D is immediate; AI generation on either service takes model processing time.',
    accuracy: 'Both are visualization aids, not fitment or safety certification.',
    ease: 'ShiftForge keeps the build controls and AI render in one workspace.',
    bestFor: commonShiftforge,
    shiftforgeEdge: 'No ShiftForge subscription for the live 3D tool and a single configure-to-render workflow.',
    competitorEdge: 'More established AI modification templates and an expanding vehicle catalog.',
    sourceUrl: 'https://www.carmodsnap.com/pricing',
    sourceLabel: 'CarModSnap official site and pricing page, checked September 17, 2026',
    features: [
      { label: 'Realtime 3D configurator', shiftforge: 'Yes', competitor: 'Yes, selected catalog' },
      { label: 'AI modification preview', shiftforge: 'Yes', competitor: 'Yes' },
      { label: 'Subscription required for core 3D', shiftforge: 'No', competitor: 'No for basic tools' },
      { label: 'Paid AI plans', shiftforge: 'Provider-based user pay', competitor: 'From $9.90/mo listed' },
      { label: 'Saved projects', shiftforge: 'Yes', competitor: 'Yes' },
      { label: 'Fitment guarantee', shiftforge: 'No', competitor: 'No' },
    ],
    faqs: [
      {
        question: 'Is ShiftForge a good CarModSnap alternative?',
        answer:
          'Yes if you want to begin with a manipulable 3D car instead of starting from an AI template or photo. CarModSnap is strong when its AI modification workflow is the main requirement.',
      },
      {
        question: 'Does ShiftForge require a monthly AI subscription?',
        answer:
          'No. ShiftForge itself has no AI subscription; generation is routed through Puter, where any model cost is handled under the user-paid model flow.',
      },
    ],
  },
  {
    slug: 'tunedrides',
    name: 'TunedRides',
    category: 'Photo-based AI car visualizer',
    intro:
      'TunedRides is optimized for uploading a photo of your actual car and generating photoreal modified versions. ShiftForge is optimized for designing the spec interactively in 3D before generating an AI concept image.',
    pricing:
      'TunedRides advertises free trial renders plus paid Pro and credit options. ShiftForge 3D is free, with AI cost handled by the chosen Puter model.',
    freeOption: 'Both let users start without a traditional paid subscription.',
    speed: 'ShiftForge gives instant 3D feedback; photo AI on either product requires generation time.',
    accuracy:
      'TunedRides can preserve more of a user-provided car photo context. ShiftForge starts from its own 3D presets.',
    ease: 'TunedRides is simpler for one-shot photo changes; ShiftForge is stronger for iterative visual exploration.',
    bestFor: commonShiftforge,
    shiftforgeEdge: 'Interactive 3D iteration before committing to an AI render.',
    competitorEdge: 'Purpose-built photo upload workflow for modifying the user’s actual car image.',
    sourceUrl: 'https://tunedrides.com/',
    sourceLabel: 'TunedRides official site and pricing, checked September 17, 2026',
    features: [
      { label: 'Realtime 3D configurator', shiftforge: 'Yes', competitor: 'No' },
      { label: 'Use your own car photo', shiftforge: 'AI reference uses 3D view', competitor: 'Core workflow' },
      { label: 'AI photoreal render', shiftforge: 'Yes', competitor: 'Yes' },
      { label: 'Free starting option', shiftforge: 'Free 3D', competitor: 'Free trial renders' },
      { label: 'Saved builds', shiftforge: 'Yes', competitor: 'Account history' },
      { label: 'Iterative live tuning', shiftforge: 'Yes', competitor: 'Prompt/render oriented' },
    ],
    faqs: [
      {
        question: 'Is ShiftForge a good TunedRides alternative?',
        answer:
          'Yes if you want to experiment interactively before generating an image. TunedRides is the better fit when transforming a real photo of your own car is the only job.',
      },
      {
        question: 'Can ShiftForge modify a real car photo?',
        answer:
          'The current core experience renders the configured 3D concept as an AI reference. It does not claim the same dedicated owner-photo workflow as TunedRides.',
      },
    ],
  },
  {
    slug: 'modmycar',
    name: 'ModMyCar',
    category: 'Photo-based AI mod planner',
    intro:
      'ModMyCar turns one to five vehicle photos into multi-angle AI modification concepts and supports wheel, stance, paint, body and scene changes. ShiftForge emphasizes a live 3D build before the AI render.',
    pricing:
      'ModMyCar lists credit-based pricing with roughly 20 credits per build and no subscription requirement. ShiftForge realtime 3D is free; AI cost is handled through Puter.',
    freeOption: 'ModMyCar advertises welcome credits; ShiftForge offers unlimited local 3D configuration.',
    speed: 'ShiftForge 3D is instant; both AI workflows require generation time.',
    accuracy:
      'ModMyCar starts from supplied vehicle photos. ShiftForge is concept-level from original 3D presets.',
    ease: 'ShiftForge is better for continuous interactive tuning; ModMyCar is streamlined for photo-to-result batches.',
    bestFor: commonShiftforge,
    shiftforgeEdge: 'Live 3D exploration and camera control before AI generation.',
    competitorEdge: 'Multi-photo workflow, multi-angle output and dedicated real-car photo modification.',
    sourceUrl: 'https://www.modmycar.app/',
    sourceLabel: 'ModMyCar official site, checked September 17, 2026',
    features: [
      { label: 'Realtime 3D configurator', shiftforge: 'Yes', competitor: 'No' },
      { label: 'Multiple source photos', shiftforge: 'No', competitor: '1–5 photos advertised' },
      { label: 'Multi-angle AI result', shiftforge: 'Single generated concept', competitor: 'Four photos advertised' },
      { label: 'AI photoreal render', shiftforge: 'Yes', competitor: 'Yes' },
      { label: 'Subscription required', shiftforge: 'No', competitor: 'No' },
      { label: 'Interactive wheel / stance tuning', shiftforge: 'Yes, realtime', competitor: 'Selection-driven' },
    ],
    faqs: [
      {
        question: 'Is ShiftForge a good ModMyCar alternative?',
        answer:
          'Yes when interactive 3D experimentation matters. ModMyCar is stronger when you want a multi-photo, multi-angle AI result based on your actual vehicle.',
      },
      {
        question: 'Which is better for testing lots of wheel and stance combinations?',
        answer:
          'ShiftForge is designed for rapid realtime iteration. ModMyCar is designed around submitting a photo-based build and receiving rendered outputs.',
      },
    ],
  },
];

export function getComparison(slug: string) {
  return comparisons.find((item) => item.slug === slug);
}
