// Original sample content for a fresh database. Names, shops and events are fictional.

export const COMMENTS = [
  'That offset is perfect. What spacers are you running up front?',
  'Color plus those wheels is a crazy combo.',
  'How is the ride on those coilovers day to day?',
  'Clean. I would go half an inch wider in the rear.',
  'Does it rub at full lock?',
  'Saving this for my own build, thanks for posting the specs.',
  'The drop looks right without being slammed. Nice.',
  'Stock ride height with this fitment would look great too.',
  'Bronze wheels were made for this paint.',
  'What tire pressures do you run on track?',
  'The aero kit finishes it. Keep the wing!',
  'Honestly the cleanest one on the board this week.',
];

export type SeedArticle = {
  kind: 'journal' | 'magazine';
  series?: string;
  episode?: number;
  author: number;
  title: string;
  excerpt: string;
  body: string;
  cover: string;
  daysAgo: number;
};

export const ARTICLES: SeedArticle[] = [
  {
    kind: 'journal', series: 'The Auction E46', episode: 1, author: 1, cover: '#2a3342', daysAgo: 21,
    title: 'Buying a Front-End Hit M3 Sight Unseen',
    excerpt: 'Salvage listings lie by omission. Here is how I read the photos, what I guessed wrong, and what the tow driver said when he saw it.',
    body: `The listing said "front end" and showed four photos, all taken from the passenger side. That is the first lesson of salvage auctions: the photos you do not get are the ones that matter.\n\nI budgeted for a bumper, both headlights, a radiator and a hood. What arrived also needed a core support and a driver-side frame horn that had been politely folded like a letter.\n\nThe good news: the S54 turned over, the subframe was straight, and the interior smelled like an old BMW instead of a flood. Total in, including auction fees and the tow, was still under what a clean driver costs.\n\nNext episode: measuring the frame against factory points with a tape, a plumb bob and a lot of patience.`,
  },
  {
    kind: 'journal', series: 'The Auction E46', episode: 2, author: 1, cover: '#2a3342', daysAgo: 12,
    title: 'Frame Points, Plumb Bobs and a Borrowed Porta-Power',
    excerpt: 'No frame machine, no problem — mostly. Measuring diagonals on a garage floor and pulling a horn back into spec.',
    body: `Factory body dimension sheets exist for almost every car if you look hard enough. I printed mine, marked every reference hole on the floor with a plumb bob, and chalked the diagonals.\n\nThe driver horn was 11 mm short. A borrowed porta-power, a chain around a floor anchor and a lot of heat-free persuasion got it to within 2 mm.\n\nI would not do this on a car with crumple damage past the horn. On this one, it was the difference between a parts car and a project.\n\nNext time: headlights, the radiator stack and the first drive around the block.`,
  },
  {
    kind: 'journal', series: 'Supra on a Budget', episode: 1, author: 4, cover: '#3a2a1f', daysAgo: 18,
    title: 'The Cheapest MK4 in the State',
    excerpt: 'An automatic, non-turbo, sun-faded Supra with a smell I will not describe. It was perfect.',
    body: `Everyone wants a six-speed twin turbo. Nobody wants the naturally aspirated automatic with a cracked dash, and that is exactly why I could afford one.\n\nThe plan is not to build a 1,000 hp monster. The plan is to make it drive the way it looks: sorted suspension, sticky tires, wheels with the right offset, and a manual swap when the budget allows.\n\nFirst weekend: pulling every carpet, drying it out, and finding out what that smell actually was.`,
  },
  {
    kind: 'journal', series: 'Supra on a Budget', episode: 2, author: 4, cover: '#3a2a1f', daysAgo: 6,
    title: 'Mocking Up Wheels Before Spending a Dollar',
    excerpt: 'I built the car in 3D first, found out 18x9.5 +22 pokes, and saved myself a return shipment.',
    body: `The MK4 wants a flush wheel. It also has a front fender that ends sooner than you think.\n\nI built three setups in the Lab: 18x9 +38, 18x9.5 +22 and 18x10 +25. The second one looked the best in every screenshot — and the fitment readout said it poked 6 mm past the fender with stock camber.\n\nWith a degree and a half of negative camber it tucked back in. That told me I needed camber plates before wheels, which changed the order of the whole build.\n\nNext: camber plates, and a real-world check with a straightedge.`,
  },
  {
    kind: 'journal', series: 'Raptor Overland', episode: 1, author: 7, cover: '#233a2a', daysAgo: 9,
    title: 'Why I Went Smaller on Wheels',
    excerpt: 'Seventeens, more sidewall, fewer flats. Trading looks for trail days.',
    body: `The shop wanted to sell me twenties. I left with seventeens and a 315/70 all-terrain, and I have not had a sidewall puncture since.\n\nMore sidewall means you can air down properly without pinching the tire against the rim. It also rides better on washboard roads, which is most of what overland travel actually is.\n\nNext up: a real skid plate and a fridge that does not eat the battery overnight.`,
  },
  {
    kind: 'magazine', author: 2, cover: '#3a1f24', daysAgo: 3,
    title: 'Offset, Explained Without the Headache',
    excerpt: 'ET, backspacing and poke are the same idea from three angles. Here is the one-minute version.',
    body: `Offset (ET) is the distance from the wheel's centerline to the face that bolts against the hub, in millimeters. Higher offset pulls the wheel into the car; lower offset pushes it out.\n\nWhat you actually care about is where the outer lip and the inner barrel end up. Change width and offset together and you can keep one fixed while moving the other: going a half inch wider and dropping offset by 6 mm moves the outer lip out about 12 mm and leaves the inner barrel roughly where it was.\n\nThat is exactly what the fitment readout in the Lab calculates. Treat it as a planning tool, then measure your own car before ordering.`,
  },
  {
    kind: 'magazine', author: 5, cover: '#1f2a3a', daysAgo: 5,
    title: 'Coilovers vs. Springs: What You Get for the Money',
    excerpt: 'Lowering springs are cheap and honest. Coilovers are adjustable and, sometimes, worse. A short guide.',
    body: `Lowering springs on factory dampers are the most underrated mod in the hobby. They are cheap, they ride well, and they give you a predictable 20 to 30 mm drop.\n\nCoilovers win when you want to corner-balance, adjust damping for the track, or pick your exact ride height. They lose when the damper is cheap and the valving was clearly an afterthought.\n\nRule of thumb: if you will never touch the adjusters, buy springs and spend the rest on tires.`,
  },
  {
    kind: 'magazine', author: 6, cover: '#2e1f3a', daysAgo: 8,
    title: 'Five Tires We Would Actually Buy This Year',
    excerpt: 'Two for the street, two for the track, one for the dirt. No sponsorships, just treadwear and lap times.',
    body: `For the street, a modern max-performance summer tire is so good it is hard to justify anything stickier. For the track, a 200-treadwear tire will get you most of the way to an R-compound at half the cost.\n\nOff road, sidewall strength matters more than tread pattern. Buy the tire that survives the rocks you actually drive over.\n\nAnd whatever you pick, match the tire width to the rim. A 245 on a 10-inch wheel looks aggressive and drives worse.`,
  },
  {
    kind: 'magazine', author: 8, cover: '#3a331f', daysAgo: 11,
    title: 'The Case for Keeping Your Car Loud (Visually)',
    excerpt: 'Wild paint is back. Why builders are skipping grey and going for colors with names.',
    body: `Grey has been the default for a decade. The builds climbing the ratings board this season are orange, teal and a very specific shade of purple.\n\nPart of it is social: a bright car stands out in a feed. Part of it is wraps getting cheaper and easier to reverse.\n\nIf you are on the fence, try it in the Lab first. A color that looks loud in a swatch often looks right on the whole car.`,
  },
  {
    kind: 'magazine', author: 9, cover: '#1f3a36', daysAgo: 14,
    title: 'How Weekly Ratings Work (and How to Win One)',
    excerpt: 'Three divisions, one week, one vote per build per person. Some honest tips from past winners.',
    body: `Every week the board resets. You can vote once per build per division, and you can change nothing after Monday midnight UTC, when the week closes and the standings freeze.\n\nWinners tend to share three habits: a clean thumbnail, a fitment that is aggressive but believable, and a title that tells you what the car is.\n\nPublishing early in the week helps. So does replying to comments.`,
  },
];

export const EVENTS = [
  { title: 'Hill Country Cars & Coffee', category: 'Cars & Coffee', inDays: 3, venue: 'Domain Northside Lot', city: 'Austin', state: 'TX', lat: 30.4021, lng: -97.7253, host: 'ATX Morning Motors', description: 'Monthly Saturday meet. Coffee truck on site, all makes welcome, no burnouts.' },
  { title: 'Front Range Autocross #6', category: 'Autocross', inDays: 6, venue: 'Bandimere Lot C', city: 'Morrison', state: 'CO', lat: 39.6497, lng: -105.2041, host: 'Front Range Solo', description: 'Novice-friendly autocross with instructors in the right seat. Helmet required; loaners available.' },
  { title: 'Gulf Coast JDM Night', category: 'Meet', inDays: 9, venue: 'Westshore Plaza Upper Deck', city: 'Tampa', state: 'FL', lat: 27.9442, lng: -82.5229, host: 'Bay JDM Collective', description: 'Evening meet for Japanese cars. Parking by chassis code, show-and-shine judging at 9 PM.' },
  { title: 'PNW Track Day — Open Passing', category: 'Track Day', inDays: 14, venue: 'Ridge Motorsports Park', city: 'Shelton', state: 'WA', lat: 47.2548, lng: -123.1942, host: 'Northwest Lapping Club', description: 'Advanced and intermediate groups. Tech inspection required.' },
  { title: 'Midwest Euro Fest', category: 'Show', inDays: 19, venue: 'Ohio Expo Center', city: 'Columbus', state: 'OH', lat: 40.0003, lng: -82.9914, host: 'Euro Society Midwest', description: 'German and European car show with a swap meet and vendor row.' },
  { title: 'Desert Drift Practice', category: 'Drift', inDays: 22, venue: 'Wild Horse Pass Pad', city: 'Chandler', state: 'AZ', lat: 33.2690, lng: -111.9711, host: 'Sonoran Slide', description: 'Open drift practice on the skid pad. Tandem sessions after 4 PM.' },
  { title: 'Motor City Muscle Cruise', category: 'Cruise', inDays: 27, venue: 'Woodward Ave start', city: 'Ferndale', state: 'MI', lat: 42.4606, lng: -83.1347, host: 'Woodward Cruisers', description: 'Slow cruise up Woodward followed by a parking lot meet.' },
  { title: 'Carolina Overland Rally', category: 'Off-Road', inDays: 33, venue: 'Uwharrie Trailhead', city: 'Troy', state: 'NC', lat: 35.3585, lng: -79.9937, host: 'Piedmont Overland', description: 'Beginner-friendly trail run and camp. Recovery gear required.' },
  { title: 'SoCal Wheel Fitment Clinic', category: 'Workshop', inDays: 12, venue: 'Miramar Industrial Park', city: 'San Diego', state: 'CA', lat: 32.8870, lng: -117.1450, host: 'Fitment Garage SD', description: 'Hands-on clinic: measuring offset, poke and inner clearance on your own car.' },
  { title: 'Wasatch Canyon Drive', category: 'Cruise', inDays: 40, venue: 'Big Cottonwood Canyon mouth', city: 'Salt Lake City', state: 'UT', lat: 40.6195, lng: -111.7880, host: 'Wasatch Drivers', description: 'Scenic group drive with a lunch stop at the top.' },
];

export const SHOPS = [
  { name: 'Apex Alignment & Fitment', services: 'Alignment, Wheels, Suspension', city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431, rating: 4.8, reviews: 212, phone: '(512) 555-0142', description: 'Performance alignments, corner balancing and wheel fitment checks.' },
  { name: 'Mile High Motorsport', services: 'Tuning, Track Prep', city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903, rating: 4.7, reviews: 168, phone: '(303) 555-0187', description: 'Track prep, safety equipment and dyno tuning.' },
  { name: 'Bayside Wraps', services: 'Wraps, PPF, Tint', city: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572, rating: 4.9, reviews: 344, phone: '(813) 555-0110', description: 'Color change wraps, paint protection film and ceramic tint.' },
  { name: 'Rose City Euro', services: 'BMW, Audi, VW Service', city: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784, rating: 4.6, reviews: 129, phone: '(503) 555-0163', description: 'Independent European specialist with a lift bay for enthusiasts.' },
  { name: 'Buckeye Tire & Wheel', services: 'Tires, Wheels, Mounting', city: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988, rating: 4.5, reviews: 402, phone: '(614) 555-0199', description: 'Road-force balancing, TPMS and stretched-tire mounting.' },
  { name: 'Coastline Coilovers', services: 'Suspension, Air Ride', city: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611, rating: 4.8, reviews: 187, phone: '(619) 555-0128', description: 'Coilover and air suspension installs, fender rolling.' },
  { name: 'Queen City Performance', services: 'Tuning, Exhaust', city: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431, rating: 4.7, reviews: 233, phone: '(704) 555-0171', description: 'Custom exhaust fabrication and E85 tuning.' },
  { name: 'Valley Off-Road Outfitters', services: 'Lifts, Armor, Tires', city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740, rating: 4.6, reviews: 158, phone: '(602) 555-0135', description: 'Lift kits, skid plates and overland builds.' },
  { name: 'Eight Mile Fabrication', services: 'Fabrication, Roll Cages', city: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458, rating: 4.9, reviews: 97, phone: '(313) 555-0154', description: 'Roll cages, custom brackets and aero mounts.' },
  { name: 'Sound Detail Studio', services: 'Detailing, Ceramic Coating', city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321, rating: 4.8, reviews: 276, phone: '(206) 555-0103', description: 'Paint correction and multi-year ceramic coatings.' },
  { name: 'Peachtree JDM Imports', services: 'Imports, Parts, Service', city: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880, rating: 4.4, reviews: 141, phone: '(404) 555-0122', description: 'Right-hand-drive imports, parts sourcing and compliance.' },
  { name: 'Salt Flats Speed Shop', services: 'Engine Builds, Dyno', city: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.8910, rating: 4.7, reviews: 118, phone: '(801) 555-0146', description: 'Engine builds and an in-house chassis dyno.' },
];

export const AUCTIONS = [
  { year: 2022, make: 'Dodge', model: 'Charger Scat Pack', damage: 'Front End', miles: 6100, state: 'FL', estimate: 26800, endsInHours: 20, verdict: 'WORTH A LOOK', paint: '#1f46b5', modelSlug: null },
  { year: 2015, make: 'Chevrolet', model: 'Corvette Stingray', damage: 'Front End', miles: 50200, state: 'FL', estimate: 12600, endsInHours: 30, verdict: 'WORTH A LOOK', paint: '#c8141c', modelSlug: null },
  { year: 2021, make: 'BMW', model: 'M3 Competition', damage: 'Rear End', miles: 18400, state: 'CA', estimate: 31900, endsInHours: 46, verdict: 'PROJECT', paint: '#135b3c', modelSlug: 'bmw-m3-g80' },
  { year: 2020, make: 'Toyota', model: 'GR Supra 3.0', damage: 'Side', miles: 22750, state: 'TX', estimate: 24500, endsInHours: 70, verdict: 'WORTH A LOOK', paint: '#c8141c', modelSlug: 'toyota-gr-supra-a90' },
  { year: 2023, make: 'Honda', model: 'Civic Type R', damage: 'Hail', miles: 9100, state: 'CO', estimate: 29800, endsInHours: 95, verdict: 'STEAL', paint: '#eeeeea', modelSlug: 'honda-civic-type-r-fl5' },
  { year: 2017, make: 'Nissan', model: 'GT-R Premium', damage: 'Flood', miles: 34100, state: 'LA', estimate: 38200, endsInHours: 120, verdict: 'RISKY', paint: '#8b8d8e', modelSlug: 'nissan-gt-r-r35' },
  { year: 2019, make: 'Mazda', model: 'MX-5 Club', damage: 'Front End', miles: 27600, state: 'GA', estimate: 9800, endsInHours: 26, verdict: 'STEAL', paint: '#c8141c', modelSlug: 'mazda-mx5-nd' },
  { year: 2022, make: 'Ford', model: 'F-150 Raptor', damage: 'Rollover', miles: 15300, state: 'AZ', estimate: 34900, endsInHours: 150, verdict: 'RISKY', paint: '#1f46b5', modelSlug: 'ford-f150-raptor' },
  { year: 2023, make: 'Toyota', model: 'GR Corolla Circuit', damage: 'Minor Dents', miles: 4200, state: 'NV', estimate: 31500, endsInHours: 54, verdict: 'WORTH A LOOK', paint: '#eeeeea', modelSlug: 'toyota-gr-corolla' },
  { year: 2016, make: 'Subaru', model: 'WRX STI', damage: 'Front End', miles: 61800, state: 'WA', estimate: 11900, endsInHours: 82, verdict: 'PROJECT', paint: '#1f46b5', modelSlug: null },
];

export const OWNER_STORIES = [
  { model: 'bmw-m3-e92', year: 2011, title: 'Silverstone Daily', usage: 'Daily', woman: false, mods: 'Apex SM-10RS 18x9.5, KW V3, rod bearings done', description: 'Bought at 90k miles. Bearings first, wheels second, everything else after.' },
  { model: 'toyota-gr86-zn8', year: 2023, title: 'Blue Autocross Toy', usage: 'Track', woman: true, mods: 'Enkei RPF1 17x9 +45, RE-71RS 245/40, BC coilovers', description: 'Two seasons of autocross. Currently second in class and slowly catching up.' },
  { model: 'honda-civic-type-r-fl5', year: 2024, title: 'Championship White', usage: 'Weekend', woman: false, mods: 'Titan 7 T-D6 19x9.5, lip, stock suspension', description: 'Kept it close to stock. The chassis does not need much.' },
  { model: 'subaru-wrx-vb', year: 2022, title: 'Gravel Commuter', usage: 'Daily', woman: true, mods: 'Fifteen52 Tarmac 18x8.5, all-season tires, mud flaps', description: 'Commutes all week, rally school once a month.' },
  { model: 'mazda-mx5-nd', year: 2019, title: 'Soul Red Canyon Car', usage: 'Weekend', woman: false, mods: 'Volk CE28N 17x8, Öhlins R&T, hardtop', description: 'The best car I have owned under 3,000 lb.' },
  { model: 'ford-mustang-gt-s650', year: 2024, title: 'Yellow Fastback', usage: 'Show', woman: true, mods: 'Vossen HF-2 20x9.5, H&R springs, tint', description: 'Loud color, quiet exhaust — for now.' },
  { model: 'nissan-gt-r-r35', year: 2015, title: 'Godzilla on a Diet', usage: 'Track', woman: false, mods: 'Volk TE37 20x10.5, carbon diffuser, E85 tune', description: 'Lost 60 lb in wheels and exhaust. Gained a lot of grins.' },
  { model: 'vw-golf-gti-mk8', year: 2023, title: 'Tornado Red GTI', usage: 'Daily', woman: true, mods: 'Rotiform LAS-R 18x8.5, Eibach Pro-Kit, Maxton lip', description: 'OEM+ build. It still fits in the grocery store parking lot.' },
  { model: 'toyota-4runner-n280', year: 2019, title: 'Trail Hauler', usage: 'Daily', woman: false, mods: 'Method MR305 17x8.5, KO3 265/70, Fox 2.5 lift', description: 'Camping every other weekend. Roof tent is next.' },
  { model: 'porsche-911-992', year: 2021, title: 'Chalk 992', usage: 'Weekend', woman: false, mods: 'HRE P101 20/21, PS4S, factory aero', description: 'Forged wheels, nothing else. It did not need anything else.' },
  { model: 'toyota-gr-corolla', year: 2023, title: 'Hatch With a Grudge', usage: 'Track', woman: true, mods: 'Enkei NT03+M 18x9.5, RT660 255/40, APR canards', description: 'Built for time attack, driven to the track, driven home.' },
  { model: 'chevrolet-camaro-ss', year: 2018, title: 'Black SS', usage: 'Weekend', woman: false, mods: 'Ferrada CM2 20x10, BC coilovers, ducktail', description: 'Stanced but still does highway pulls.' },
  { model: 'toyota-supra-mk4', year: 1997, title: 'NA-T Project', usage: 'Project', woman: false, mods: 'SSR Professor SP1 18x9.5, single turbo in progress', description: 'Year three. The engine is on a stand, the wheels are on the car.' },
  { model: 'audi-rs3-8y', year: 2023, title: 'Nardo Five-Pot', usage: 'Daily', woman: true, mods: 'BBS CH-R 19x9, KW V3, Seibon diffuser', description: 'The five-cylinder soundtrack is the whole point.' },
];
