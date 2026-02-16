import type { Post, PostType } from '@/types';
import { calculateEngagementScore } from '@/lib/utils/engagement';
import { seedEmployees } from '@/lib/data/seed-employees';

/**
 * Mulberry32 seeded PRNG - deterministic, using a different seed from employees.
 */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(1337);

const postTemplates: string[] = [
  'Excited to share that our team just shipped a major feature update! The collaboration across departments has been incredible. #ProductLaunch #Teamwork',
  'Had a great conversation with a customer today about how our platform is transforming their workflow. Nothing beats hearing real impact stories.',
  'Just wrapped up an amazing quarter. Our team crushed every metric we set out to hit. Proud of what we accomplished together.',
  'Thrilled to announce that I will be speaking at the upcoming industry conference next month. Looking forward to sharing our learnings!',
  'Great article on the future of B2B SaaS. The insights about product-led growth really resonated with our approach.',
  'Reflecting on my first year at the company and I could not be more grateful for the opportunities and the incredible people I work with every day.',
  'We are hiring! Looking for talented individuals who want to make a real impact. Check out our open roles and join our growing team.',
  'Just published a new blog post about our engineering practices and how we scaled our infrastructure 10x this year.',
  'Attended an inspiring workshop on leadership today. Key takeaway: great leaders create more leaders, not more followers.',
  'Congratulations to our sales team for closing the biggest deal in company history! This is what happens when preparation meets opportunity.',
  'The market is shifting and companies that adapt quickly will thrive. Here is my take on the trends shaping our industry.',
  'Proud to share that our company was just named one of the best places to work! This recognition belongs to every team member.',
  'Loved the energy at our all-hands meeting today. The roadmap for next quarter is going to be a game-changer.',
  'Five lessons I learned from mentoring junior engineers this year. Thread below.',
  'Our latest customer case study is live! See how we helped a Fortune 500 company reduce costs by 40%.',
  'Innovation does not happen in silos. The best ideas come from diverse teams working together toward a shared vision.',
  'Just completed my certification in data analytics. Never stop learning!',
  'Exciting partnership announcement coming soon. Stay tuned for something big!',
  'Had the privilege of hosting a webinar on digital transformation today. Over 500 attendees! Thank you for the incredible engagement.',
  'The power of a strong company culture cannot be overstated. It is what drives retention, innovation, and ultimately, results.',
  'Sharing my framework for building high-performing teams. It starts with trust and psychological safety.',
  'Wrapped up a fantastic brainstorming session with the product team. We are onto something truly special.',
  'Why I believe content marketing is the most underrated growth channel for B2B companies. A thread.',
  'Big milestone today: we crossed 10,000 active users on our platform! Thank you to every customer who believed in us.',
  'Lessons from failing fast: how our team turned a product miss into our biggest learning opportunity.',
  'The best investment you can make is in your people. Training, development, and growth opportunities pay dividends.',
  'Reflecting on the importance of work-life balance. Burnout is real. Take care of yourselves, everyone.',
  'Our design team just unveiled the new brand refresh and it looks absolutely stunning. Cannot wait for the world to see it.',
  'Data-driven decision making is not just a buzzword. Here is how we used analytics to increase retention by 25%.',
  'Grateful for the incredible feedback from our beta users. Your input is shaping the future of our product.',
];

const postTypes: PostType[] = ['original', 'reshare', 'article', 'poll'];
const postTypeWeights = [0.55, 0.25, 0.15, 0.05]; // cumulative: 0.55, 0.8, 0.95, 1.0

function pickPostType(): PostType {
  const r = rand();
  if (r < postTypeWeights[0]) return postTypes[0];
  if (r < postTypeWeights[0] + postTypeWeights[1]) return postTypes[1];
  if (r < postTypeWeights[0] + postTypeWeights[1] + postTypeWeights[2]) return postTypes[2];
  return postTypes[3];
}

/**
 * Power-law-ish distribution for engagement.
 * Most posts get low engagement, a few get very high.
 */
function generateLikes(): number {
  const r = rand();
  if (r < 0.6) return Math.floor(rand() * 45) + 5;       // 5-50
  if (r < 0.85) return Math.floor(rand() * 50) + 50;      // 50-100
  if (r < 0.95) return Math.floor(rand() * 200) + 100;    // 100-300
  return Math.floor(rand() * 400) + 300;                   // 300-700
}

// Assign posting frequency weights per employee (some post a lot, some rarely)
const employeePostWeights = seedEmployees.map(() => {
  const r = rand();
  if (r < 0.15) return 5;    // power posters
  if (r < 0.4) return 3;     // frequent
  if (r < 0.7) return 1.5;   // moderate
  return 0.5;                 // rare
});

// Normalize weights to create a cumulative distribution
const totalWeight = employeePostWeights.reduce((a, b) => a + b, 0);
const cumulativeWeights: number[] = [];
let cumSum = 0;
for (const w of employeePostWeights) {
  cumSum += w / totalWeight;
  cumulativeWeights.push(cumSum);
}

function pickEmployee(): string {
  const r = rand();
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (r < cumulativeWeights[i]) {
      return seedEmployees[i].id;
    }
  }
  return seedEmployees[seedEmployees.length - 1].id;
}

/**
 * Generate a date within the last 90 days, weighted toward recent dates.
 * Uses a squared distribution so ~50% of posts fall in the last 30 days.
 */
function generateDate(): string {
  const now = new Date();
  // Square the random to bias toward recent dates (lower daysAgo values)
  const r = rand();
  const daysAgo = Math.floor(r * r * 90);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  // Add some hour/minute variation
  date.setUTCHours(
    Math.floor(rand() * 14) + 7, // 7am - 9pm
    Math.floor(rand() * 60),
    Math.floor(rand() * 60),
    0
  );
  return date.toISOString();
}

const POST_COUNT = 250;

export const seedPosts: Post[] = Array.from({ length: POST_COUNT }, (_, i) => {
  const likes = generateLikes();
  const comments = Math.floor(likes * (rand() * 0.3 + 0.05));
  const shares = Math.floor(likes * (rand() * 0.15 + 0.02));
  const engagementScore = calculateEngagementScore(likes, comments, shares);
  const authorId = pickEmployee();
  const mentionsCompany = rand() < 0.3;
  const template = postTemplates[Math.floor(rand() * postTemplates.length)];

  return {
    id: `post-${String(i + 1).padStart(4, '0')}`,
    authorId,
    type: pickPostType(),
    textContent: template,
    publishedAt: generateDate(),
    url: `https://linkedin.com/feed/update/urn:li:activity:${7000000000000000 + i + 1}`,
    engagement: {
      likes,
      comments,
      shares,
      engagementScore,
    },
    mentionsCompany,
  };
}).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

// ── External viral posts (non-employee, non-company page) ──
// These represent posts by industry influencers/customers that mention the company.
const externalAuthors = [
  { id: 'ext-001', name: 'Sarah Drasner', avatar: 'https://i.pravatar.cc/300?u=sarah-drasner', title: 'VP of Engineering, Netflix' },
  { id: 'ext-002', name: 'Lenny Rachitsky', avatar: 'https://i.pravatar.cc/300?u=lenny-rachitsky', title: 'Author, Lenny\'s Newsletter' },
  { id: 'ext-003', name: 'Sahil Bloom', avatar: 'https://i.pravatar.cc/300?u=sahil-bloom', title: 'Creator & Entrepreneur' },
  { id: 'ext-004', name: 'Julia Evans', avatar: 'https://i.pravatar.cc/300?u=julia-evans', title: 'Software Engineer & Blogger' },
  { id: 'ext-005', name: 'Alex Hormozi', avatar: 'https://i.pravatar.cc/300?u=alex-hormozi', title: 'CEO, Acquisition.com' },
];

const externalPostTemplates = [
  'Just tried the new platform from this team and I am genuinely blown away. This is what innovation looks like in B2B SaaS. The UX is years ahead of the competition.',
  'Incredible case study on how this company scaled from 0 to 10K users in 6 months. The growth playbook they shared is pure gold. Saving this for my team.',
  'Had a deep dive call with their engineering team today. The technical architecture behind their product is seriously impressive. Video walkthrough below.',
  'This is the most underrated tool in the market right now. I have been using it for 3 months and it has completely transformed how my team operates.',
  'The culture at this company is something special. Just watched their team showcase and the energy is contagious. This is how you build a winning team.',
];

export const seedExternalPosts = externalAuthors.map((author, i) => {
  const likes = 250 + Math.floor(rand() * 600);
  const comments = Math.floor(likes * (rand() * 0.3 + 0.1));
  const shares = Math.floor(likes * (rand() * 0.2 + 0.05));
  const now = new Date();
  const daysAgo = Math.floor(rand() * 60);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  date.setUTCHours(Math.floor(rand() * 14) + 7, Math.floor(rand() * 60), 0, 0);

  return {
    id: `ext-post-${String(i + 1).padStart(3, '0')}`,
    authorId: null as string | null,
    type: 'original' as PostType,
    textContent: externalPostTemplates[i],
    publishedAt: date.toISOString(),
    url: `https://linkedin.com/feed/update/urn:li:activity:${8000000000000000 + i + 1}`,
    engagement: {
      likes,
      comments,
      shares,
      engagementScore: likes + comments * 2 + shares * 3,
    },
    mentionsCompany: true,
    isExternal: true,
    externalAuthorName: author.name,
    externalAuthorUrl: `https://linkedin.com/in/${author.id}`,
    externalAuthorAvatarUrl: author.avatar,
    externalAuthorHeadline: author.title,
  };
});
