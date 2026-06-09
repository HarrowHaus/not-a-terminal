import type { SectionEntry } from '../engine/search/types'

export const sections: SectionEntry[] = [
  {
    id: 'section-pricing',
    name: 'Pricing Table',
    description: 'Three-tier pricing table with Free, Pro, and Enterprise plans',
    category: 'pricing',
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
    id: 'section-testimonials',
    name: 'Testimonials',
    description: 'Customer testimonials with quotes and attribution',
    category: 'testimonials',
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
  </div>
</section>
{/* end:testimonials */}`,
  },
  {
    id: 'section-faq',
    name: 'FAQ',
    description: 'Frequently asked questions with answers in an accordion style',
    category: 'faq',
    code: `{/* section:faq */}
<section className="px-8 py-16 max-w-3xl mx-auto">
  <h2 className="text-2xl font-bold text-center mb-12">Frequently asked questions</h2>
  <div className="space-y-4">
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900">How does the free trial work?</h3>
      <p className="text-sm text-gray-500 mt-2">Start with a 14-day free trial. No credit card required. Cancel anytime.</p>
    </div>
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900">Can I change plans later?</h3>
      <p className="text-sm text-gray-500 mt-2">Yes, you can upgrade or downgrade your plan at any time from your account settings.</p>
    </div>
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900">Do you offer refunds?</h3>
      <p className="text-sm text-gray-500 mt-2">We offer a 30-day money-back guarantee on all paid plans.</p>
    </div>
  </div>
</section>
{/* end:faq */}`,
  },
  {
    id: 'section-newsletter',
    name: 'Newsletter Signup',
    description: 'Email newsletter subscription form with input and button',
    category: 'newsletter',
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
  {
    id: 'section-contact',
    name: 'Contact Section',
    description: 'Contact information section with email and message',
    category: 'contact',
    code: `{/* section:contact */}
<section className="px-8 py-16 max-w-2xl mx-auto text-center">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Get in touch</h2>
  <p className="text-gray-500 mb-6">Have a question or want to work together?</p>
  <a href="mailto:hello@example.com" className="text-blue-600 hover:text-blue-700 font-medium text-lg">hello@example.com &rarr;</a>
</section>
{/* end:contact */}`,
  },
  {
    id: 'section-team',
    name: 'Team Grid',
    description: 'Team members grid with photos, names, and roles',
    category: 'team',
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
  {
    id: 'section-stats',
    name: 'Stats Bar',
    description: 'Key statistics and numbers displayed in a row',
    category: 'stats',
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
  {
    id: 'section-cta',
    name: 'CTA Banner',
    description: 'Call to action banner with heading and button',
    category: 'cta',
    code: `{/* section:cta */}
<section className="bg-blue-600 text-white px-8 py-16 text-center">
  <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
  <p className="text-blue-100 mb-8 max-w-xl mx-auto">Join thousands of happy customers and start building today.</p>
  <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50">Start Free Trial</button>
</section>
{/* end:cta */}`,
  },
  {
    id: 'section-features',
    name: 'Feature Cards',
    description: 'Grid of feature cards with icons and descriptions',
    category: 'features',
    code: `{/* section:features */}
<section className="px-8 py-16 bg-gray-50">
  <h2 className="text-2xl font-bold text-center mb-12">Everything you need</h2>
  <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8">
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-lg">&#9889;</div>
      <h3 className="font-semibold mb-2">Lightning Fast</h3>
      <p className="text-sm text-gray-500">Built for speed from the ground up.</p>
    </div>
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-lg">&#128274;</div>
      <h3 className="font-semibold mb-2">Secure</h3>
      <p className="text-sm text-gray-500">Enterprise-grade security by default.</p>
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
  {
    id: 'section-footer',
    name: 'Footer',
    description: 'Website footer with navigation links and copyright',
    category: 'footer',
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
]
