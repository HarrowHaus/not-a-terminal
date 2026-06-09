#!/usr/bin/env tsx
/**
 * build-sections.ts — Build the section index with pre-computed embeddings.
 *
 * Extracts standalone section components (hero, pricing, testimonials, features,
 * CTA, FAQ, footer, contact, team, stats). Each section gets its own entry
 * with description, phrasings, and embedding.
 *
 * In full mode, also scans crawled templates for section markers to extract
 * additional section variants.
 *
 * Usage:
 *   tsx scripts/build-sections.ts --test              # mock embeddings
 *   tsx scripts/build-sections.ts                     # real embeddings
 *   tsx scripts/build-sections.ts --scan crawled.json # extract from crawled templates
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { SectionIndexEntry, CrawledTemplate } from './types.js'

const EMBEDDING_DIM = 384

// ─── Section definitions ─────────────────────────────────────────────

interface SectionDefinition {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  code: string
}

const CORE_SECTIONS: SectionDefinition[] = [
  // ── Hero variants ──
  {
    id: 'hero-centered',
    name: 'Centered Hero',
    description: 'A centered hero section with large heading, subtext, and call-to-action button. Great for landing pages and product launches.',
    category: 'hero',
    tags: ['hero', 'centered', 'cta', 'heading'],
    code: `{/* section:hero */}
<section className="px-8 py-24 max-w-3xl mx-auto text-center">
  <h1 className="text-5xl font-bold text-gray-900 mb-4">Build something amazing</h1>
  <p className="text-xl text-gray-500 mb-8">The fastest way to bring your idea to life.</p>
  <button className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700">Get Started</button>
</section>
{/* end:hero */}`,
  },
  {
    id: 'hero-split',
    name: 'Split Hero',
    description: 'A two-column hero with text on the left and an image or visual on the right. Ideal for showcasing a product or app.',
    category: 'hero',
    tags: ['hero', 'split', 'two-column', 'image'],
    code: `{/* section:hero */}
<section className="px-8 py-20 max-w-6xl mx-auto grid grid-cols-2 gap-12 items-center">
  <div>
    <h1 className="text-5xl font-bold text-gray-900 mb-4">Ship faster, build better</h1>
    <p className="text-lg text-gray-500 mb-8">The developer platform that helps you go from idea to production in record time.</p>
    <div className="flex gap-4">
      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Start Free</button>
      <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">See Demo</button>
    </div>
  </div>
  <div className="bg-gray-100 rounded-2xl h-80 flex items-center justify-center text-gray-400">
    App Preview
  </div>
</section>
{/* end:hero */}`,
  },
  {
    id: 'hero-gradient',
    name: 'Gradient Hero',
    description: 'A hero section with a gradient background, white text, and a bold call to action. Eye-catching for SaaS and tech sites.',
    category: 'hero',
    tags: ['hero', 'gradient', 'bold', 'saas'],
    code: `{/* section:hero */}
<section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-32 text-center">
  <h1 className="text-5xl font-bold mb-4">The future of building</h1>
  <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">Create, deploy, and scale your applications with zero infrastructure headaches.</p>
  <button className="px-8 py-3 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-50">Get Started Free</button>
</section>
{/* end:hero */}`,
  },

  // ── Pricing ──
  {
    id: 'pricing-3-tier',
    name: 'Three-Tier Pricing',
    description: 'A three-tier pricing table with Free, Pro, and Enterprise plans. Includes feature lists and CTA buttons.',
    category: 'pricing',
    tags: ['pricing', 'plans', 'three-tier', 'comparison'],
    code: `{/* section:pricing */}
<section className="px-8 py-16 bg-gray-50">
  <h2 className="text-2xl font-bold text-center mb-12">Simple, transparent pricing</h2>
  <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="font-semibold mb-1">Free</h3>
      <p className="text-3xl font-bold mb-4">$0<span className="text-sm text-gray-400 font-normal">/mo</span></p>
      <ul className="text-sm text-gray-500 space-y-2 mb-6">
        <li>&#10003; 3 projects</li>
        <li>&#10003; Basic analytics</li>
        <li>&#10003; Community support</li>
      </ul>
      <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Get Started</button>
    </div>
    <div className="bg-white p-6 rounded-xl border-2 border-blue-600 relative">
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">Popular</span>
      <h3 className="font-semibold mb-1">Pro</h3>
      <p className="text-3xl font-bold mb-4">$29<span className="text-sm text-gray-400 font-normal">/mo</span></p>
      <ul className="text-sm text-gray-500 space-y-2 mb-6">
        <li>&#10003; Unlimited projects</li>
        <li>&#10003; Advanced analytics</li>
        <li>&#10003; Priority support</li>
      </ul>
      <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Start Free Trial</button>
    </div>
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="font-semibold mb-1">Enterprise</h3>
      <p className="text-3xl font-bold mb-4">Custom</p>
      <ul className="text-sm text-gray-500 space-y-2 mb-6">
        <li>&#10003; Everything in Pro</li>
        <li>&#10003; SSO &amp; SAML</li>
        <li>&#10003; Dedicated support</li>
      </ul>
      <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Contact Sales</button>
    </div>
  </div>
</section>
{/* end:pricing */}`,
  },
  {
    id: 'pricing-simple',
    name: 'Simple Pricing',
    description: 'A simple two-plan pricing layout with a monthly and yearly toggle option. Clean and minimal.',
    category: 'pricing',
    tags: ['pricing', 'simple', 'two-tier', 'minimal'],
    code: `{/* section:pricing */}
<section className="px-8 py-16">
  <h2 className="text-2xl font-bold text-center mb-4">Choose your plan</h2>
  <p className="text-gray-500 text-center mb-12">Start free, upgrade when you need more.</p>
  <div className="max-w-2xl mx-auto grid grid-cols-2 gap-6">
    <div className="bg-gray-50 p-8 rounded-xl">
      <h3 className="font-semibold text-lg mb-2">Starter</h3>
      <p className="text-4xl font-bold mb-6">Free</p>
      <p className="text-sm text-gray-500 mb-6">Everything you need to get started.</p>
      <button className="w-full py-2 border border-gray-300 rounded-lg font-medium hover:bg-white">Get Started</button>
    </div>
    <div className="bg-blue-600 text-white p-8 rounded-xl">
      <h3 className="font-semibold text-lg mb-2">Pro</h3>
      <p className="text-4xl font-bold mb-6">$19/mo</p>
      <p className="text-sm text-blue-100 mb-6">For teams that need more power.</p>
      <button className="w-full py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50">Upgrade Now</button>
    </div>
  </div>
</section>
{/* end:pricing */}`,
  },

  // ── Testimonials ──
  {
    id: 'testimonials-grid',
    name: 'Testimonial Grid',
    description: 'Customer testimonials in a grid layout with quotes and attribution. Builds social proof.',
    category: 'testimonials',
    tags: ['testimonials', 'quotes', 'social-proof', 'grid'],
    code: `{/* section:testimonials */}
<section className="px-8 py-16">
  <h2 className="text-2xl font-bold text-center mb-12">What our customers say</h2>
  <div className="max-w-4xl mx-auto grid grid-cols-2 gap-8">
    <blockquote className="bg-gray-50 p-6 rounded-xl">
      <p className="text-gray-600 mb-4 italic">&ldquo;This product completely transformed how we work. We shipped 3x faster within the first month.&rdquo;</p>
      <cite className="text-sm text-gray-400 not-italic">&mdash; Sarah Chen, CTO at TechCo</cite>
    </blockquote>
    <blockquote className="bg-gray-50 p-6 rounded-xl">
      <p className="text-gray-600 mb-4 italic">&ldquo;The best investment we made this year. Simple, powerful, and our team loves it.&rdquo;</p>
      <cite className="text-sm text-gray-400 not-italic">&mdash; James Wilson, Founder at StartupXYZ</cite>
    </blockquote>
    <blockquote className="bg-gray-50 p-6 rounded-xl">
      <p className="text-gray-600 mb-4 italic">&ldquo;Incredible developer experience. Everything just works, and the documentation is top-notch.&rdquo;</p>
      <cite className="text-sm text-gray-400 not-italic">&mdash; Maria Lopez, Lead Dev at DevHouse</cite>
    </blockquote>
    <blockquote className="bg-gray-50 p-6 rounded-xl">
      <p className="text-gray-600 mb-4 italic">&ldquo;We reduced our development time by 60%. Cannot recommend this enough.&rdquo;</p>
      <cite className="text-sm text-gray-400 not-italic">&mdash; Alex Rivera, VP Engineering at ScaleUp</cite>
    </blockquote>
  </div>
</section>
{/* end:testimonials */}`,
  },

  // ── Features ──
  {
    id: 'features-3-col',
    name: 'Feature Cards Grid',
    description: 'A three-column grid of feature cards with icons and descriptions. Perfect for highlighting product capabilities.',
    category: 'features',
    tags: ['features', 'grid', 'cards', 'icons'],
    code: `{/* section:features */}
<section className="px-8 py-16 bg-gray-50">
  <h2 className="text-2xl font-bold text-center mb-12">Everything you need</h2>
  <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8">
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-lg">&#9889;</div>
      <h3 className="font-semibold mb-2">Lightning Fast</h3>
      <p className="text-sm text-gray-500">Built for speed from the ground up. Sub-second response times.</p>
    </div>
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-lg">&#128274;</div>
      <h3 className="font-semibold mb-2">Secure</h3>
      <p className="text-sm text-gray-500">Enterprise-grade security with SOC 2 compliance.</p>
    </div>
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-lg">&#127912;</div>
      <h3 className="font-semibold mb-2">Beautiful</h3>
      <p className="text-sm text-gray-500">Pixel-perfect design out of the box.</p>
    </div>
  </div>
</section>
{/* end:features */}`,
  },

  // ── CTA ──
  {
    id: 'cta-banner',
    name: 'CTA Banner',
    description: 'A bold call-to-action banner with contrasting background color, heading, and action button.',
    category: 'cta',
    tags: ['cta', 'banner', 'call-to-action', 'conversion'],
    code: `{/* section:cta */}
<section className="bg-blue-600 text-white px-8 py-16 text-center">
  <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
  <p className="text-blue-100 mb-8 max-w-xl mx-auto">Join thousands of happy customers and start building today.</p>
  <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50">Start Free Trial</button>
</section>
{/* end:cta */}`,
  },

  // ── FAQ ──
  {
    id: 'faq-list',
    name: 'FAQ List',
    description: 'Frequently asked questions with answers in a clean list layout. Reduces support load.',
    category: 'faq',
    tags: ['faq', 'questions', 'answers', 'support'],
    code: `{/* section:faq */}
<section className="px-8 py-16 max-w-3xl mx-auto">
  <h2 className="text-2xl font-bold text-center mb-12">Frequently asked questions</h2>
  <div className="space-y-4">
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900">How does the free trial work?</h3>
      <p className="text-sm text-gray-500 mt-2">Start with a 14-day free trial. No credit card required.</p>
    </div>
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900">Can I change plans later?</h3>
      <p className="text-sm text-gray-500 mt-2">Yes, upgrade or downgrade anytime from your settings.</p>
    </div>
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900">Do you offer refunds?</h3>
      <p className="text-sm text-gray-500 mt-2">30-day money-back guarantee on all paid plans.</p>
    </div>
  </div>
</section>
{/* end:faq */}`,
  },

  // ── Footer ──
  {
    id: 'footer-simple',
    name: 'Simple Footer',
    description: 'A minimal footer with copyright and navigation links. Clean and unobtrusive.',
    category: 'footer',
    tags: ['footer', 'navigation', 'copyright', 'minimal'],
    code: `{/* section:footer */}
<footer className="border-t border-gray-100 px-8 py-8">
  <div className="max-w-5xl mx-auto flex justify-between items-center">
    <span className="text-sm text-gray-400">&copy; 2024 Company. All rights reserved.</span>
    <div className="flex gap-6 text-sm text-gray-400">
      <a href="#" className="hover:text-gray-600">Privacy</a>
      <a href="#" className="hover:text-gray-600">Terms</a>
      <a href="#" className="hover:text-gray-600">Contact</a>
    </div>
  </div>
</footer>
{/* end:footer */}`,
  },
  {
    id: 'footer-multi-col',
    name: 'Multi-Column Footer',
    description: 'A four-column footer with categorized links, company info, and social links. Professional and comprehensive.',
    category: 'footer',
    tags: ['footer', 'navigation', 'links', 'comprehensive'],
    code: `{/* section:footer */}
<footer className="bg-gray-900 text-gray-400 px-8 py-16">
  <div className="max-w-6xl mx-auto grid grid-cols-4 gap-8">
    <div>
      <h4 className="text-white font-semibold mb-4">Company</h4>
      <div className="space-y-2 text-sm">
        <a href="#" className="block hover:text-white">About</a>
        <a href="#" className="block hover:text-white">Blog</a>
        <a href="#" className="block hover:text-white">Careers</a>
      </div>
    </div>
    <div>
      <h4 className="text-white font-semibold mb-4">Product</h4>
      <div className="space-y-2 text-sm">
        <a href="#" className="block hover:text-white">Features</a>
        <a href="#" className="block hover:text-white">Pricing</a>
        <a href="#" className="block hover:text-white">Changelog</a>
      </div>
    </div>
    <div>
      <h4 className="text-white font-semibold mb-4">Support</h4>
      <div className="space-y-2 text-sm">
        <a href="#" className="block hover:text-white">Help Center</a>
        <a href="#" className="block hover:text-white">Contact</a>
        <a href="#" className="block hover:text-white">Status</a>
      </div>
    </div>
    <div>
      <h4 className="text-white font-semibold mb-4">Legal</h4>
      <div className="space-y-2 text-sm">
        <a href="#" className="block hover:text-white">Privacy</a>
        <a href="#" className="block hover:text-white">Terms</a>
        <a href="#" className="block hover:text-white">Cookies</a>
      </div>
    </div>
  </div>
  <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-800 text-sm text-center">
    &copy; 2024 Company. All rights reserved.
  </div>
</footer>
{/* end:footer */}`,
  },

  // ── Contact ──
  {
    id: 'contact-simple',
    name: 'Contact Section',
    description: 'A simple contact section with email link and optional message. Clean and direct.',
    category: 'contact',
    tags: ['contact', 'email', 'form', 'reach-out'],
    code: `{/* section:contact */}
<section className="px-8 py-16 max-w-2xl mx-auto text-center">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Get in touch</h2>
  <p className="text-gray-500 mb-6">Have a question or want to work together?</p>
  <a href="mailto:hello@example.com" className="text-blue-600 hover:text-blue-700 font-medium text-lg">hello@example.com &rarr;</a>
</section>
{/* end:contact */}`,
  },

  // ── Team ──
  {
    id: 'team-grid',
    name: 'Team Grid',
    description: 'A team members grid with avatars, names, and roles. Shows the people behind the product.',
    category: 'team',
    tags: ['team', 'people', 'about', 'members'],
    code: `{/* section:team */}
<section className="px-8 py-16">
  <h2 className="text-2xl font-bold text-center mb-12">Meet our team</h2>
  <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
    <div>
      <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
      <h3 className="font-semibold">Alex Rivera</h3>
      <p className="text-sm text-gray-500">CEO &amp; Founder</p>
    </div>
    <div>
      <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
      <h3 className="font-semibold">Sarah Chen</h3>
      <p className="text-sm text-gray-500">Head of Design</p>
    </div>
    <div>
      <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
      <h3 className="font-semibold">Mike Johnson</h3>
      <p className="text-sm text-gray-500">Lead Engineer</p>
    </div>
  </div>
</section>
{/* end:team */}`,
  },

  // ── Stats ──
  {
    id: 'stats-bar',
    name: 'Stats Bar',
    description: 'Key statistics and numbers in a horizontal bar. Impressive metrics at a glance.',
    category: 'stats',
    tags: ['stats', 'numbers', 'metrics', 'social-proof'],
    code: `{/* section:stats */}
<section className="bg-gray-900 text-white px-8 py-12">
  <div className="max-w-4xl mx-auto grid grid-cols-4 gap-8 text-center">
    <div>
      <p className="text-3xl font-bold">10K+</p>
      <p className="text-sm text-gray-400 mt-1">Happy Users</p>
    </div>
    <div>
      <p className="text-3xl font-bold">99.9%</p>
      <p className="text-sm text-gray-400 mt-1">Uptime</p>
    </div>
    <div>
      <p className="text-3xl font-bold">50+</p>
      <p className="text-sm text-gray-400 mt-1">Countries</p>
    </div>
    <div>
      <p className="text-3xl font-bold">24/7</p>
      <p className="text-sm text-gray-400 mt-1">Support</p>
    </div>
  </div>
</section>
{/* end:stats */}`,
  },

  // ── Newsletter ──
  {
    id: 'newsletter-signup',
    name: 'Newsletter Signup',
    description: 'Email newsletter subscription form with input field and subscribe button.',
    category: 'newsletter',
    tags: ['newsletter', 'email', 'subscribe', 'signup'],
    code: `{/* section:newsletter */}
<section className="bg-blue-50 px-8 py-12 text-center">
  <h3 className="text-xl font-bold text-gray-900 mb-2">Stay in the loop</h3>
  <p className="text-gray-500 mb-6 text-sm">Get updates and news delivered to your inbox.</p>
  <div className="flex gap-2 max-w-md mx-auto">
    <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm" />
    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Subscribe</button>
  </div>
</section>
{/* end:newsletter */}`,
  },
]

// ─── Section extraction from crawled templates ───────────────────────

function extractSectionsFromCrawled(templates: CrawledTemplate[]): SectionDefinition[] {
  const extracted: SectionDefinition[] = []
  const sectionPattern = /\{\/\*\s*section:(\w+)\s*\*\/\}([\s\S]*?)\{\/\*\s*end:\1\s*\*\/\}/g

  for (const template of templates) {
    let match: RegExpExecArray | null
    sectionPattern.lastIndex = 0

    while ((match = sectionPattern.exec(template.code)) !== null) {
      const sectionType = match[1]
      const sectionCode = match[0].trim()

      const id = `${template.id}-${sectionType}-${extracted.length}`
      extracted.push({
        id,
        name: `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} from ${template.name}`,
        description: `A ${sectionType} section extracted from the ${template.name} template.`,
        category: sectionType,
        tags: [sectionType, template.source],
        code: sectionCode,
      })
    }
  }

  return extracted
}

// ─── Embedding ───────────────────────────────────────────────────────

function mockEmbedding(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIM)
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  }
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    hash = ((hash << 5) - hash + i) | 0
    vec[i] = (hash & 0xffff) / 0xffff - 0.5
  }
  let norm = 0
  for (let i = 0; i < EMBEDDING_DIM; i++) norm += vec[i] * vec[i]
  norm = Math.sqrt(norm)
  for (let i = 0; i < EMBEDDING_DIM; i++) vec[i] /= norm
  return vec
}

async function computeEmbeddings(
  sections: SectionDefinition[],
  useMock: boolean,
): Promise<SectionIndexEntry[]> {
  let embedFn: (text: string) => Promise<number[]>

  if (useMock) {
    embedFn = async (text: string) => mockEmbedding(text)
  } else {
    const { pipeline, env } = await import('@huggingface/transformers')
    env.allowLocalModels = false
    console.log('🤖 Loading embedding model...')
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      dtype: 'q8' as never,
    })
    const extractor = pipe as unknown as (text: string, opts: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array }>
    embedFn = async (text: string) => {
      const result = await extractor(text, { pooling: 'mean', normalize: true })
      return Array.from(result.data)
    }
    console.log('✓ Model loaded')
  }

  const entries: SectionIndexEntry[] = []

  for (const section of sections) {
    process.stdout.write(`  ${section.id}... `)
    const embedding = await embedFn(section.description)

    entries.push({
      id: section.id,
      name: section.name,
      description: section.description,
      category: section.category,
      tags: section.tags,
      code: section.code,
      embedding,
    })

    console.log('✓')
  }

  return entries
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const isTest = args.includes('--test')
  const scanIdx = args.indexOf('--scan')
  const scanPath = scanIdx >= 0 ? args[scanIdx + 1] : null
  const outputIdx = args.indexOf('--output')
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : join('public', 'indexes', 'sections.json')

  mkdirSync(join('public', 'indexes'), { recursive: true })

  // Start with core sections
  let allSections = [...CORE_SECTIONS]
  console.log(`📦 Core sections: ${allSections.length}`)

  // Optionally scan crawled templates for additional sections
  if (scanPath && existsSync(scanPath)) {
    const crawled = JSON.parse(readFileSync(scanPath, 'utf-8')) as CrawledTemplate[]
    const extracted = extractSectionsFromCrawled(crawled)
    console.log(`🔍 Extracted ${extracted.length} sections from ${crawled.length} crawled templates`)
    allSections.push(...extracted)
  }

  console.log(`\n🔧 Building section index (${allSections.length} sections)`)
  console.log(`   Mode: ${isTest ? 'test (mock embeddings)' : 'real'}\n`)

  const entries = await computeEmbeddings(allSections, isTest)

  writeFileSync(outputPath, JSON.stringify(entries, null, 2))
  console.log(`\n✅ Built section index: ${entries.length} entries`)
  console.log(`📄 Written to ${outputPath}`)
  console.log(`📐 Embedding dim: ${entries[0]?.embedding.length ?? 0}`)

  // Stats by category
  const byCategory = new Map<string, number>()
  for (const e of entries) {
    byCategory.set(e.category, (byCategory.get(e.category) || 0) + 1)
  }
  console.log('\n📊 Sections by category:')
  for (const [cat, count] of byCategory) {
    console.log(`  ${cat}: ${count}`)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
