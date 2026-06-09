import type { Template } from './types'

export type { Template, TemplateField } from './types'

export const templates: Template[] = [
  {
    id: 'landing-page',
    name: 'Starter Landing',
    description: 'Clean landing page with hero, features section, and call to action.',
    category: 'Landing Page',
    tags: ['hero', 'features', 'cta', 'responsive'],
    fields: [
      { key: 'businessName', label: 'Name', type: 'text', default: 'Starter' },
      { key: 'tagline', label: 'Tagline', type: 'text', default: 'Build something amazing' },
      { key: 'primaryColor', label: 'Color', type: 'color', default: 'blue' },
      { key: 'features', label: 'Features', type: 'toggle', default: true },
    ],
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <span className="text-xl font-bold text-blue-600">Starter</span>
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-blue-600">Features</a>
          <a href="#" className="hover:text-blue-600">About</a>
          <a href="#" className="hover:text-blue-600">Contact</a>
        </div>
      </nav>
      <section className="px-8 py-24 max-w-3xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Build something amazing</h1>
        <p className="text-xl text-gray-500 mb-8">The fastest way to bring your idea to life. Simple, powerful, and free to start.</p>
        <button className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700">Get Started</button>
      </section>
      {/* section:features */}
      <section className="px-8 py-16 bg-gray-50">
        <h2 className="text-2xl font-bold text-center mb-12">Why choose us</h2>
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-lg">&#9889;</div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-gray-500">Optimized for speed.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-lg">&#128274;</div>
            <h3 className="font-semibold mb-2">Secure by Default</h3>
            <p className="text-sm text-gray-500">Enterprise-grade security.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-lg">&#127912;</div>
            <h3 className="font-semibold mb-2">Beautiful Design</h3>
            <p className="text-sm text-gray-500">Pixel-perfect from the start.</p>
          </div>
        </div>
      </section>
      {/* end:features */}
      <footer className="px-8 py-8 text-center text-sm text-gray-400 border-t border-gray-100">
        &copy; 2024 Starter. All rights reserved.
      </footer>
    </div>
  )
}`,
  },
  {
    id: 'dashboard',
    name: 'Admin Panel',
    description: 'Dashboard layout with sidebar navigation, stat cards, and data table.',
    category: 'Dashboard',
    tags: ['sidebar', 'stats', 'table', 'admin'],
    fields: [
      { key: 'businessName', label: 'Name', type: 'text', default: 'DataVault' },
      { key: 'tagline', label: 'Greeting', type: 'text', default: 'Welcome back' },
      { key: 'primaryColor', label: 'Color', type: 'color', default: 'indigo' },
      { key: 'sidebar', label: 'Sidebar', type: 'toggle', default: true },
    ],
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* section:sidebar */}
      <aside className="w-56 bg-indigo-900 text-white p-6 flex flex-col">
        <h1 className="text-lg font-bold mb-8">DataVault</h1>
        <nav className="flex flex-col gap-2 text-sm">
          <a href="#" className="bg-indigo-800 px-3 py-2 rounded">Dashboard</a>
          <a href="#" className="px-3 py-2 rounded hover:bg-indigo-800 text-indigo-200">Analytics</a>
          <a href="#" className="px-3 py-2 rounded hover:bg-indigo-800 text-indigo-200">Users</a>
          <a href="#" className="px-3 py-2 rounded hover:bg-indigo-800 text-indigo-200">Settings</a>
        </nav>
      </aside>
      {/* end:sidebar */}
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-gray-500 mb-8">Here is what is happening today.</p>
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-indigo-600">12,847</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Revenue</p>
            <p className="text-3xl font-bold text-indigo-600">$48,290</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Active Now</p>
            <p className="text-3xl font-bold text-indigo-600">342</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-6 py-4">Sarah Chen</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span></td>
                <td className="px-6 py-4 text-gray-500">Admin</td>
              </tr>
              <tr>
                <td className="px-6 py-4">James Wilson</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span></td>
                <td className="px-6 py-4 text-gray-500">Editor</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Maria Garcia</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Away</span></td>
                <td className="px-6 py-4 text-gray-500">Viewer</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}`,
  },
  {
    id: 'blog',
    name: 'Clean Blog',
    description: 'Blog homepage with featured article, post grid, and newsletter signup.',
    category: 'Blog',
    tags: ['articles', 'featured', 'newsletter', 'grid'],
    fields: [
      { key: 'businessName', label: 'Name', type: 'text', default: 'The Daily Read' },
      { key: 'tagline', label: 'Tagline', type: 'text', default: 'Stories worth telling' },
      { key: 'primaryColor', label: 'Color', type: 'color', default: 'purple' },
      { key: 'newsletter', label: 'Newsletter', type: 'toggle', default: true },
    ],
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-8 py-6">
        <h1 className="text-2xl font-bold text-purple-600">The Daily Read</h1>
        <p className="text-sm text-gray-400 mt-1">Stories worth telling</p>
      </header>
      <main className="max-w-5xl mx-auto px-8 py-12">
        <article className="mb-12 pb-12 border-b border-gray-100">
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Featured</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-3">The Art of Simplicity in Modern Design</h2>
          <p className="text-gray-500 mb-4 leading-relaxed">Exploring why less continues to be more in a world that keeps adding complexity to everything it touches.</p>
          <div className="flex gap-4 text-sm text-gray-400">
            <span>Mar 15, 2024</span>
            <span>&middot;</span>
            <span>5 min read</span>
          </div>
        </article>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="h-40 bg-purple-50 rounded-lg mb-4"></div>
            <h3 className="font-semibold text-gray-900 mb-2">Building for the Long Term</h3>
            <p className="text-sm text-gray-500">What sustainable engineering looks like in practice.</p>
            <span className="text-xs text-gray-400 mt-2 block">Mar 12, 2024</span>
          </div>
          <div>
            <div className="h-40 bg-purple-50 rounded-lg mb-4"></div>
            <h3 className="font-semibold text-gray-900 mb-2">Colors That Speak</h3>
            <p className="text-sm text-gray-500">How color psychology shapes user experience.</p>
            <span className="text-xs text-gray-400 mt-2 block">Mar 10, 2024</span>
          </div>
        </div>
      </main>
      {/* section:newsletter */}
      <section className="bg-purple-50 px-8 py-12 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Stay in the loop</h3>
        <p className="text-gray-500 mb-6 text-sm">Get the best stories delivered to your inbox.</p>
        <div className="flex gap-2 max-w-md mx-auto">
          <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm" />
          <button className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Subscribe</button>
        </div>
      </section>
      {/* end:newsletter */}
    </div>
  )
}`,
  },
  {
    id: 'portfolio',
    name: 'Creative Folio',
    description: 'Minimal portfolio with project grid and contact section for designers and developers.',
    category: 'Portfolio',
    tags: ['projects', 'minimal', 'grid', 'creative'],
    fields: [
      { key: 'businessName', label: 'Name', type: 'text', default: 'Jane Cooper' },
      { key: 'tagline', label: 'Tagline', type: 'text', default: 'Designer & developer crafting digital experiences' },
      { key: 'primaryColor', label: 'Color', type: 'color', default: 'teal' },
      { key: 'contact', label: 'Contact', type: 'toggle', default: true },
    ],
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="px-8 py-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Jane Cooper</h1>
        <nav className="flex gap-6 text-sm text-gray-500">
          <a href="#" className="text-teal-600 font-medium">Work</a>
          <a href="#" className="hover:text-teal-600">About</a>
          <a href="#" className="hover:text-teal-600">Contact</a>
        </nav>
      </header>
      <section className="px-8 py-12 max-w-2xl">
        <p className="text-4xl font-bold text-gray-900 leading-tight mb-4">Designer & developer crafting digital experiences</p>
        <p className="text-gray-500">Currently available for freelance projects.</p>
      </section>
      <section className="px-8 py-8">
        <div className="grid grid-cols-2 gap-6 max-w-5xl">
          <div>
            <div className="h-64 bg-teal-50 rounded-lg"></div>
            <div className="mt-3">
              <h3 className="font-semibold text-gray-900">Brand Identity &mdash; Lumina</h3>
              <p className="text-sm text-gray-400">Visual Design</p>
            </div>
          </div>
          <div>
            <div className="h-64 bg-gray-100 rounded-lg"></div>
            <div className="mt-3">
              <h3 className="font-semibold text-gray-900">Dashboard &mdash; Metric</h3>
              <p className="text-sm text-gray-400">UI/UX Design</p>
            </div>
          </div>
          <div>
            <div className="h-64 bg-gray-100 rounded-lg"></div>
            <div className="mt-3">
              <h3 className="font-semibold text-gray-900">Mobile App &mdash; Relay</h3>
              <p className="text-sm text-gray-400">Product Design</p>
            </div>
          </div>
          <div>
            <div className="h-64 bg-teal-50 rounded-lg"></div>
            <div className="mt-3">
              <h3 className="font-semibold text-gray-900">Website &mdash; Canopy</h3>
              <p className="text-sm text-gray-400">Development</p>
            </div>
          </div>
        </div>
      </section>
      {/* section:contact */}
      <section className="px-8 py-12 mt-8 border-t border-gray-100">
        <p className="text-2xl font-bold text-gray-900 mb-2">Let&apos;s work together</p>
        <a href="mailto:hello@example.com" className="text-teal-600 hover:text-teal-700 font-medium">hello@example.com &rarr;</a>
      </section>
      {/* end:contact */}
    </div>
  )
}`,
  },
  {
    id: 'saas',
    name: 'LaunchPad',
    description: 'SaaS product page with hero, feature highlights, and tiered pricing cards.',
    category: 'SaaS',
    tags: ['hero', 'pricing', 'features', 'saas'],
    fields: [
      { key: 'businessName', label: 'Name', type: 'text', default: 'LaunchPad' },
      { key: 'tagline', label: 'Tagline', type: 'text', default: 'Ship faster, iterate more' },
      { key: 'primaryColor', label: 'Color', type: 'color', default: 'violet' },
      { key: 'pricing', label: 'Pricing', type: 'toggle', default: true },
    ],
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <span className="text-xl font-bold text-violet-600">LaunchPad</span>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm text-gray-600 hover:text-violet-600">Features</a>
          <a href="#" className="text-sm text-gray-600 hover:text-violet-600">Pricing</a>
          <button className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700">Start Free</button>
        </div>
      </nav>
      <section className="px-8 py-24 max-w-3xl mx-auto text-center">
        <span className="text-sm font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full">Now in Beta</span>
        <h1 className="text-5xl font-bold text-gray-900 mt-6 mb-4">Ship faster, iterate more</h1>
        <p className="text-xl text-gray-500 mb-8">The development platform that gets out of your way. From idea to production in minutes.</p>
        <div className="flex gap-4 justify-center">
          <button className="px-8 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700">Get Started Free</button>
          <button className="px-8 py-3 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50">See Demo</button>
        </div>
      </section>
      {/* section:pricing */}
      <section className="px-8 py-16 bg-gray-50">
        <h2 className="text-2xl font-bold text-center mb-12">Simple pricing</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-semibold mb-1">Free</h3>
            <p className="text-3xl font-bold mb-4">$0<span className="text-sm text-gray-400 font-normal">/mo</span></p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>&#10003; 3 projects</li>
              <li>&#10003; Basic analytics</li>
              <li>&#10003; Community support</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-violet-600 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs px-3 py-1 rounded-full">Popular</span>
            <h3 className="font-semibold mb-1">Pro</h3>
            <p className="text-3xl font-bold mb-4">$29<span className="text-sm text-gray-400 font-normal">/mo</span></p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>&#10003; Unlimited projects</li>
              <li>&#10003; Advanced analytics</li>
              <li>&#10003; Priority support</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-semibold mb-1">Enterprise</h3>
            <p className="text-3xl font-bold mb-4">Custom</p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>&#10003; Everything in Pro</li>
              <li>&#10003; SSO &amp; SAML</li>
              <li>&#10003; Dedicated support</li>
            </ul>
          </div>
        </div>
      </section>
      {/* end:pricing */}
      <footer className="px-8 py-8 text-center text-sm text-gray-400 border-t border-gray-100">&copy; 2024 LaunchPad</footer>
    </div>
  )
}`,
  },
  {
    id: 'ecommerce',
    name: 'Simple Store',
    description: 'Ecommerce storefront with product grid, promo banner, and shopping cart.',
    category: 'Ecommerce',
    tags: ['products', 'store', 'cart', 'grid'],
    fields: [
      { key: 'businessName', label: 'Store', type: 'text', default: 'Urban Goods' },
      { key: 'tagline', label: 'Tagline', type: 'text', default: 'Quality everyday essentials' },
      { key: 'primaryColor', label: 'Color', type: 'color', default: 'emerald' },
      { key: 'banner', label: 'Promo Banner', type: 'toggle', default: true },
    ],
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <span className="text-xl font-bold text-gray-900">Urban Goods</span>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm text-gray-600">Shop</a>
          <a href="#" className="text-sm text-gray-600">About</a>
          <span className="text-sm bg-emerald-600 text-white px-3 py-1 rounded-full">Cart (0)</span>
        </div>
      </nav>
      {/* section:banner */}
      <div className="bg-emerald-600 text-white text-center py-2 text-sm">Free shipping on orders over $50</div>
      {/* end:banner */}
      <section className="px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quality everyday essentials</h1>
        <p className="text-gray-500 mb-8">Curated goods for modern living.</p>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="h-48 bg-gray-100 rounded-lg mb-3"></div>
            <h3 className="font-medium text-gray-900 text-sm">Ceramic Mug Set</h3>
            <p className="text-emerald-600 font-semibold">$32.00</p>
          </div>
          <div>
            <div className="h-48 bg-gray-100 rounded-lg mb-3"></div>
            <h3 className="font-medium text-gray-900 text-sm">Linen Throw</h3>
            <p className="text-emerald-600 font-semibold">$68.00</p>
          </div>
          <div>
            <div className="h-48 bg-gray-100 rounded-lg mb-3"></div>
            <h3 className="font-medium text-gray-900 text-sm">Wooden Tray</h3>
            <p className="text-emerald-600 font-semibold">$45.00</p>
          </div>
          <div>
            <div className="h-48 bg-gray-100 rounded-lg mb-3"></div>
            <h3 className="font-medium text-gray-900 text-sm">Candle Trio</h3>
            <p className="text-emerald-600 font-semibold">$28.00</p>
          </div>
          <div>
            <div className="h-48 bg-gray-100 rounded-lg mb-3"></div>
            <h3 className="font-medium text-gray-900 text-sm">Cotton Napkins</h3>
            <p className="text-emerald-600 font-semibold">$24.00</p>
          </div>
          <div>
            <div className="h-48 bg-gray-100 rounded-lg mb-3"></div>
            <h3 className="font-medium text-gray-900 text-sm">Plant Pot</h3>
            <p className="text-emerald-600 font-semibold">$38.00</p>
          </div>
          <div>
            <div className="h-48 bg-gray-100 rounded-lg mb-3"></div>
            <h3 className="font-medium text-gray-900 text-sm">Wall Print</h3>
            <p className="text-emerald-600 font-semibold">$52.00</p>
          </div>
          <div>
            <div className="h-48 bg-gray-100 rounded-lg mb-3"></div>
            <h3 className="font-medium text-gray-900 text-sm">Woven Basket</h3>
            <p className="text-emerald-600 font-semibold">$41.00</p>
          </div>
        </div>
      </section>
      <footer className="px-8 py-8 text-center text-sm text-gray-400 border-t border-gray-100">&copy; 2024 Urban Goods</footer>
    </div>
  )
}`,
  },
  {
    id: 'restaurant',
    name: 'Table & Vine',
    description: 'Restaurant website with hero, menu section, and hours display.',
    category: 'Restaurant',
    tags: ['menu', 'hours', 'reservation', 'dining'],
    fields: [
      { key: 'businessName', label: 'Name', type: 'text', default: 'Table & Vine' },
      { key: 'tagline', label: 'Tagline', type: 'text', default: 'Farm to table dining' },
      { key: 'primaryColor', label: 'Color', type: 'color', default: 'amber' },
      { key: 'hours', label: 'Hours', type: 'toggle', default: true },
    ],
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-4">
        <span className="text-xl font-bold text-gray-900">Table &amp; Vine</span>
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-amber-600">Menu</a>
          <a href="#" className="hover:text-amber-600">About</a>
          <a href="#" className="hover:text-amber-600">Reserve</a>
        </div>
      </nav>
      <section className="px-8 py-20 bg-amber-50 text-center">
        <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-4">Est. 2019</p>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Farm to table dining</h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">Seasonal ingredients, local farms, dishes made with care. Every meal tells a story.</p>
        <button className="px-8 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700">Reserve a Table</button>
      </section>
      <section className="px-8 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">Our Menu</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div className="flex justify-between items-baseline border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-medium text-gray-900">Roasted Beet Salad</h3>
              <p className="text-sm text-gray-400">goat cheese, walnuts, honey vinaigrette</p>
            </div>
            <span className="text-amber-600 font-semibold ml-4">$14</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-medium text-gray-900">Pan-Seared Salmon</h3>
              <p className="text-sm text-gray-400">asparagus, lemon butter, fingerlings</p>
            </div>
            <span className="text-amber-600 font-semibold ml-4">$28</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-medium text-gray-900">Grilled Ribeye</h3>
              <p className="text-sm text-gray-400">chimichurri, roasted vegetables</p>
            </div>
            <span className="text-amber-600 font-semibold ml-4">$36</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-medium text-gray-900">Mushroom Risotto</h3>
              <p className="text-sm text-gray-400">truffle oil, parmesan, fresh herbs</p>
            </div>
            <span className="text-amber-600 font-semibold ml-4">$22</span>
          </div>
        </div>
      </section>
      {/* section:hours */}
      <section className="bg-gray-900 text-white px-8 py-12 text-center">
        <h3 className="text-xl font-bold mb-4">Hours</h3>
        <p className="text-gray-400">Tuesday &ndash; Thursday: 5pm &ndash; 10pm</p>
        <p className="text-gray-400">Friday &ndash; Saturday: 5pm &ndash; 11pm</p>
        <p className="text-gray-400">Sunday Brunch: 10am &ndash; 2pm</p>
        <p className="text-gray-400 mt-2">Monday: Closed</p>
      </section>
      {/* end:hours */}
    </div>
  )
}`,
  },
  {
    id: 'docs',
    name: 'DocuBase',
    description: 'Documentation site with sidebar navigation, code blocks, and content area.',
    category: 'Docs',
    tags: ['sidebar', 'code', 'navigation', 'docs'],
    fields: [
      { key: 'businessName', label: 'Project', type: 'text', default: 'DocuBase' },
      { key: 'tagline', label: 'Tagline', type: 'text', default: 'Documentation made simple' },
      { key: 'primaryColor', label: 'Color', type: 'color', default: 'sky' },
      { key: 'sidebar', label: 'Sidebar', type: 'toggle', default: true },
    ],
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* section:sidebar */}
      <aside className="w-56 border-r border-gray-100 p-6 shrink-0">
        <h1 className="text-lg font-bold text-sky-600 mb-6">DocuBase</h1>
        <nav className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Getting Started</span>
          <a href="#" className="px-3 py-1.5 bg-sky-50 text-sky-700 rounded font-medium">Introduction</a>
          <a href="#" className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded">Installation</a>
          <a href="#" className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded">Quick Start</a>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-2">Guides</span>
          <a href="#" className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded">Configuration</a>
          <a href="#" className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded">Deployment</a>
          <a href="#" className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded">API Reference</a>
        </nav>
      </aside>
      {/* end:sidebar */}
      <main className="flex-1 p-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Documentation made simple</h1>
        <p className="text-gray-500 mb-8 text-lg">Everything you need to get started with DocuBase.</p>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Introduction</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">DocuBase is a modern documentation platform designed for developers. Write in Markdown, deploy anywhere, and keep your docs in sync with your codebase.</p>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm mb-6">
            <span className="text-sky-400">$</span> npm install docubase
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Quick Start</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">Get up and running in under a minute. Initialize your project, write your first page, and preview it locally.</p>
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm text-sky-800">
            <strong>Tip:</strong> Use the <code className="bg-sky-100 px-1 rounded">--template</code> flag to start with a pre-built layout.
          </div>
        </div>
      </main>
    </div>
  )
}`,
  },
  {
    id: 'freelancer',
    name: 'Solo',
    description: 'Freelancer portfolio with services grid, testimonials, and availability status.',
    category: 'Freelancer',
    tags: ['services', 'testimonials', 'portfolio', 'hire'],
    fields: [
      { key: 'businessName', label: 'Name', type: 'text', default: 'Alex Rivera' },
      { key: 'tagline', label: 'Tagline', type: 'text', default: 'Full-stack developer for hire' },
      { key: 'primaryColor', label: 'Color', type: 'color', default: 'rose' },
      { key: 'testimonials', label: 'Testimonials', type: 'toggle', default: true },
    ],
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
        <span className="text-xl font-bold text-gray-900">Alex Rivera</span>
        <a href="mailto:hello@example.com" className="text-sm text-rose-600 hover:text-rose-700 font-medium">Hire Me &rarr;</a>
      </header>
      <section className="px-8 py-20 max-w-2xl">
        <span className="text-sm text-rose-600 font-semibold uppercase tracking-wide">Available for work</span>
        <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-4">Full-stack developer for hire</h1>
        <p className="text-lg text-gray-500 leading-relaxed">I build web applications that are fast, accessible, and delightful to use. Ten years of experience shipping products people love.</p>
      </section>
      <section className="px-8 py-12 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900 mb-8">Services</h2>
        <div className="grid grid-cols-3 gap-6 max-w-4xl">
          <div className="bg-white p-6 rounded-xl">
            <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mb-3 text-sm font-bold">01</div>
            <h3 className="font-semibold text-gray-900 mb-2">Web Development</h3>
            <p className="text-sm text-gray-500">Custom web apps built with modern frameworks.</p>
          </div>
          <div className="bg-white p-6 rounded-xl">
            <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mb-3 text-sm font-bold">02</div>
            <h3 className="font-semibold text-gray-900 mb-2">UI/UX Design</h3>
            <p className="text-sm text-gray-500">Intuitive interfaces grounded in research.</p>
          </div>
          <div className="bg-white p-6 rounded-xl">
            <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mb-3 text-sm font-bold">03</div>
            <h3 className="font-semibold text-gray-900 mb-2">Consulting</h3>
            <p className="text-sm text-gray-500">Technical strategy and architecture guidance.</p>
          </div>
        </div>
      </section>
      {/* section:testimonials */}
      <section className="px-8 py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-8">What clients say</h2>
        <div className="grid grid-cols-2 gap-6 max-w-4xl">
          <blockquote className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-600 text-sm mb-4 italic">&ldquo;Alex delivered beyond our expectations. The app is fast, reliable, and our users love it.&rdquo;</p>
            <cite className="text-sm text-gray-400 not-italic">&mdash; Sarah, CEO at TechCo</cite>
          </blockquote>
          <blockquote className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-600 text-sm mb-4 italic">&ldquo;Incredibly professional and easy to work with. Would hire again without hesitation.&rdquo;</p>
            <cite className="text-sm text-gray-400 not-italic">&mdash; Mike, Founder at StartupXYZ</cite>
          </blockquote>
        </div>
      </section>
      {/* end:testimonials */}
      <footer className="px-8 py-8 text-center text-sm text-gray-400 border-t border-gray-100">&copy; 2024 Alex Rivera</footer>
    </div>
  )
}`,
  },
  {
    id: 'event',
    name: 'Summit',
    description: 'Event landing page with speaker grid, schedule, and registration CTA.',
    category: 'Event',
    tags: ['speakers', 'schedule', 'registration', 'conference'],
    fields: [
      { key: 'businessName', label: 'Event', type: 'text', default: 'Design Summit 2024' },
      { key: 'tagline', label: 'Tagline', type: 'text', default: 'Where creators connect' },
      { key: 'primaryColor', label: 'Color', type: 'color', default: 'fuchsia' },
      { key: 'speakers', label: 'Speakers', type: 'toggle', default: true },
    ],
    code: `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <span className="text-xl font-bold text-fuchsia-600">Design Summit 2024</span>
        <button className="px-5 py-2 bg-fuchsia-600 text-white text-sm rounded-lg hover:bg-fuchsia-700">Get Tickets</button>
      </nav>
      <section className="bg-fuchsia-600 text-white px-8 py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider mb-4 text-fuchsia-200">June 15&ndash;17, 2024 &middot; San Francisco</p>
        <h1 className="text-5xl font-bold mb-4">Where creators connect</h1>
        <p className="text-xl text-fuchsia-100 max-w-xl mx-auto mb-8">Three days of talks, workshops, and conversations about the future of design and technology.</p>
        <button className="px-8 py-3 bg-white text-fuchsia-600 rounded-lg font-semibold hover:bg-fuchsia-50">Register Now &mdash; $299</button>
      </section>
      {/* section:speakers */}
      <section className="px-8 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">Speakers</h2>
        <div className="grid grid-cols-4 gap-8 text-center">
          <div>
            <div className="w-20 h-20 bg-fuchsia-100 rounded-full mx-auto mb-3"></div>
            <h3 className="font-semibold text-sm">Sarah Chen</h3>
            <p className="text-xs text-gray-400">Design Director, Meta</p>
          </div>
          <div>
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-3"></div>
            <h3 className="font-semibold text-sm">James Park</h3>
            <p className="text-xs text-gray-400">CTO, Linear</p>
          </div>
          <div>
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-3"></div>
            <h3 className="font-semibold text-sm">Maria Santos</h3>
            <p className="text-xs text-gray-400">VP Design, Stripe</p>
          </div>
          <div>
            <div className="w-20 h-20 bg-fuchsia-100 rounded-full mx-auto mb-3"></div>
            <h3 className="font-semibold text-sm">David Kim</h3>
            <p className="text-xs text-gray-400">Founder, Figma</p>
          </div>
        </div>
      </section>
      {/* end:speakers */}
      <section className="bg-gray-50 px-8 py-12 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Don&apos;t miss out</h3>
        <p className="text-gray-500 mb-6">Early bird pricing ends March 31.</p>
        <button className="px-8 py-3 bg-fuchsia-600 text-white rounded-lg font-medium hover:bg-fuchsia-700">Reserve Your Spot</button>
      </section>
    </div>
  )
}`,
  },
]
