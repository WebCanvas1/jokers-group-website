import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, Check, Facebook, Mail, Menu, X } from 'lucide-react';
import { getSiteContent, saveSiteContent, supabase, uploadSiteImage } from '@/lib/supabase';

type Category = 'All' | 'Business Signage' | 'Vehicle Graphics' | 'Custom Signs' | 'Apparel & DTF' | 'Stickers & Decals' | 'Promotional Products';
type Project = { id: string; title: string; category: Exclude<Category, 'All'>; description: string; image_url: string; alt_text: string };

const img = {
  heroVehicle: 'https://images.pexels.com/photos/10126661/pexels-photo-10126661.jpeg?auto=compress&cs=tinysrgb&w=1200',
  signage: '/assets/images/business-signage/796457769_1116062870758802_7313287979849705688_n.webp',
  customSignage: '/assets/images/custom-signage/798771542_1080243507725978_5409773553402886776_n.jpg',
  clothing: '/assets/images/dtf-printing/802435088_1086130193832265_5442513043940234576_n.webp',
  vehicle: '/assets/images/vehicle-signage/796816659_1074411154969081_554795435981936148_n.webp',
  merchandise: '/assets/images/promotional-products/807726999_936838652822875_5232601882814961399_n.jpg',
  stickers: '/assets/images/portfolio/stickers-decals/808942677_1400117878155121_1436059314457531402_n.jpg',
  siteSignage: '/assets/images/site-signage/798271621_1102524532467621_6554877839608608313_n.webp',
  workwear: '/assets/images/dtf-printing/802435088_1086130193832265_5442513043940234576_n.webp',
  geelong: '/assets/images/business-signage/796457769_1116062870758802_7313287979849705688_n.webp',
};

const services = [
  { title: 'Signage & Print', key: 'signage', copy: 'Professional signage and print designed to get your business noticed.', image: img.signage },
  { title: 'Uniforms & Clothing', key: 'clothing', copy: 'Branded clothing that keeps your team looking sharp and consistent.', image: img.clothing },
  { title: 'Vehicle Graphics', key: 'vehicle', copy: 'Turn your cars, utes and vans into moving advertisements.', image: img.vehicle },
  { title: 'Promotional Products', key: 'merchandise', copy: 'Custom branded merchandise designed to keep your business front and centre.', image: img.merchandise },
  { title: 'Stickers & Decals', key: 'stickers', copy: 'Custom stickers and decals for branding, packaging, promotions and more.', image: img.stickers },
];

const starterProjects: Project[] = [
  { id: 'supplied-1', title: 'Food Trailer Graphics', category: 'Business Signage', description: 'The Snacky Shack trailer brought to life with bold commercial graphics.', image_url: img.signage, alt_text: 'The Snacky Shack food trailer with custom commercial graphics' },
  { id: 'supplied-2', title: 'WilWaste Vehicle Branding', category: 'Vehicle Graphics', description: 'Commercial vehicle signage for WilWaste.', image_url: img.vehicle, alt_text: 'White WilWaste utility vehicle with professional branded signage' },
  { id: 'supplied-3', title: 'DTF Printing & Apparel', category: 'Apparel & DTF', description: 'Full-colour apparel printing for workwear, clubs and merchandise.', image_url: img.clothing, alt_text: 'Custom DTF printed apparel and merchandise' },
  { id: 'supplied-4', title: 'Parkview Site Signage', category: 'Business Signage', description: 'Large-format development signage for Parkview Buildings.', image_url: img.siteSignage, alt_text: 'Parkview Buildings development sign installed on site' },
  { id: 'supplied-5', title: 'Custom Neon Signs', category: 'Custom Signs', description: 'Custom neon lights, names and logos for businesses and events.', image_url: img.customSignage, alt_text: 'Custom neon light signage examples' },
  { id: 'supplied-6', title: 'Custom Stickers & Decals', category: 'Stickers & Decals', description: 'Custom printed stickers and decals for businesses, brands, clubs and organisations.', image_url: img.stickers, alt_text: 'Bellhaven Canine and Equine custom printed stickers and decals' },
  { id: 'supplied-7', title: "Joker's Group Branded Merchandise", category: 'Promotional Products', description: 'Branded merchandise across apparel, drinkware, bags, stationery and more.', image_url: img.merchandise, alt_text: "Joker's Group branded polo, cap, drink bottle, tote bag, mug and promotional products" },
];

const filters: Category[] = ['All', 'Business Signage', 'Vehicle Graphics', 'Custom Signs', 'Apparel & DTF', 'Stickers & Decals', 'Promotional Products'];

const defaultContent: Record<string,string> = {
  hero_kicker:'Jokers Group • Geelong', hero_title:'Make your brand', hero_accent:'impossible to ignore.',
  hero_copy:'{content.hero_copy}',
  hero_location:'Proudly serving Geelong & surrounding areas', hero_image:img.heroVehicle,
  services_kicker:'What we do', services_title:'Everything your brand needs. One creative team.',
  work_kicker:'Made in Geelong. Made to stand out.', work_title:'Our Work',
  work_copy:'From vehicles and shopfronts to apparel, decals and custom signage — see how we help Geelong businesses bring their brands to life.',
  why_kicker:'Why us', why_title:'Why Jokers?',
  geelong_kicker:'Proudly Geelong', geelong_title:'Local knowledge. Big brand energy.',
  geelong_copy:'{content.geelong_copy}', geelong_image:img.geelong,
  cta_title:"Got an idea? Let's make it stand out.", cta_copy:"{content.cta_copy}",
  quote_kicker:'Start here', quote_title:"Let's create something that gets noticed.",
  email:'Rhett.jokersgroup@gmail.com', facebook:'https://www.facebook.com/Jokersgroup/',
  service_area:'Proudly servicing Geelong & surrounding areas',
  footer_tagline:'More than just signage.', logo_image:'/assets/images/logos/793580465_2303158203850882_7149715947328454130_n.jpg',
  ...Object.fromEntries(services.flatMap((x,i)=>[[`service_${i+1}_title`,x.title],[`service_${i+1}_copy`,x.copy],[`service_${i+1}_image`,x.image]])),
};
const whyPoints = [
  { num: '01', title: 'One Team', copy: 'Multiple branding solutions under one roof.' },
  { num: '02', title: 'Local', copy: 'Proudly serving Geelong and surrounding areas.' },
  { num: '03', title: 'Creative', copy: 'Ideas designed to help your business stand out.' },
  { num: '04', title: 'Personal', copy: 'Talk directly with a local team about your project.' },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [category, setCategory] = useState<Category>('All');
  const [projects, setProjects] = useState<Project[]>([]);
  const [lightbox, setLightbox] = useState<Project | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [content, setContent] = useState<Record<string,string>>(defaultContent);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('portfolio_projects').select('id,title,category,description,image_url,alt_text').order('created_at', { ascending: false });
      setProjects((data as Project[] | null) ?? []);
    };
    load();
    getSiteContent().then((saved) => setContent((current) => ({...current,...saved}))).catch(() => {});
  }, []);

  const visibleProjects = useMemo(() => (category === 'All' ? projects : projects.filter((p) => p.category === category)), [category, projects]);

  const submitQuote = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    const f = new FormData(e.currentTarget);
    const v = Object.fromEntries(f.entries());
    if (!v.name || !v.contact || !v.service || !v.description) { setFormError('Please complete the required fields.'); return; }
    const { error } = await supabase.from('quote_enquiries').insert({
      name: v.name,
      organisation: v.organisation ?? '',
      phone: v.contact_type === 'Phone' ? v.contact : '',
      email: v.contact_type === 'Email' ? v.contact : v.contact,
      service: v.service,
      description: v.description,
      quantity: v.quantity ?? '',
      timeframe: v.contact_method ?? '',
    });
    if (error) { setFormError('Something went wrong. Please email Rhett.jokersgroup@gmail.com.'); return; }
    setSubmitted(true); e.currentTarget.reset();
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} scrolled={scrolled} setAdminOpen={setAdminOpen} content={content} />
      <main>
        <Hero content={content} />
        <Services content={content} />
        <Work projects={visibleProjects} category={category} setCategory={setCategory} setLightbox={setLightbox} />
        <Why content={content} />
        <Geelong content={content} />
        <CTA content={content} />
        <QuoteForm submitQuote={submitQuote} submitted={submitted} formError={formError} content={content} />
      </main>
      <Footer setAdminOpen={setAdminOpen} content={content} />
      {lightbox && <Lightbox project={lightbox} close={() => setLightbox(null)} />}
      {adminOpen && <AdminPanel close={() => setAdminOpen(false)} content={content} setContent={setContent} starterProjects={starterProjects} />}
    </div>
  );
}

function Header({ menuOpen, setMenuOpen, scrolled, setAdminOpen, content }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void; scrolled: boolean; setAdminOpen: (v: boolean) => void; content: Record<string,string> }) {
  const links: [string, string][] = [['Home', 'top'], ['Services', 'services'], ['Our Work', 'work'], ['Contact', 'contact']];
  return (
    <header className={`fixed top-0 z-40 w-full transition-all duration-300 ${scrolled ? 'bg-black/85 backdrop-blur-lg border-b border-slate-200' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-8">
        <a href="#top" className="flex items-center">
          <img src={content.logo_image} alt="Joker's Group Geelong" className="h-11 w-auto object-contain" />
        </a>
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map(([label, id]) => (
            <a key={id} href={`#${id}`} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:text-white">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href="#quote" className="btn btn-primary hidden md:inline-flex">Get a Quote</a>
          <button aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)} className="grid h-10 w-10 place-items-center text-white/80 lg:hidden">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-slate-200 bg-black/95 px-5 py-6 lg:hidden">
          {links.map(([label, id]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)} className="block py-3.5 text-sm font-semibold uppercase tracking-wider text-white/80">{label}</a>
          ))}
          <a href="#quote" onClick={() => setMenuOpen(false)} className="btn btn-primary mt-4 w-full">Get a Free Quote</a>
        </div>
      )}
    </header>
  );
}

function Hero({ content }: { content: Record<string,string> }) {
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden bg-[#050505]">
      <div className="mx-auto grid min-h-[100svh] max-w-[1400px] grid-cols-1 items-center px-5 pt-20 pb-12 md:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:pt-0 lg:pb-0">
        <div className="order-2 lg:order-1">
          <p className="kicker mb-6">{content.hero_kicker}</p>
          <h1 className="display text-[2.75rem] font-bold uppercase text-white sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5rem] xl:text-[5.5rem]">
            {content.hero_title}<br />
            <span className="gradient-text">{content.hero_accent}</span>
          </h1>
          <p className="mt-7 max-w-[520px] text-base leading-7 text-white/70 md:text-[17px]">
            Signage, uniforms, vehicle graphics, merchandise, stickers and print — all under one roof.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#quote" className="btn btn-primary">Get a Free Quote <ArrowRight size={15} /></a>
            <a href="#work" className="btn btn-outline">View Our Work</a>
          </div>
          <p className="mt-8 text-xs font-medium uppercase tracking-[0.16em] text-white/50">{content.hero_location}</p>
        </div>
        <div className="relative order-1 h-[220px] overflow-hidden sm:h-[300px] lg:order-2 lg:h-[72vh] lg:min-h-[520px]">
          <img src={content.hero_image} alt="Vinyl vehicle wrap being applied in a workshop" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/30" />
        </div>
      </div>
    </section>
  );
}

function Services({ content }: { content: Record<string,string> }) {
  return (
    <section id="services" className="bg-[#0A0A0A] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-12 max-w-2xl md:mb-16">
          <p className="kicker mb-4">{content.services_kicker}</p>
          <h2 className="display text-[2.25rem] font-bold uppercase text-white sm:text-[3rem] lg:text-[3.75rem]">{content.services_title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {services.map((s, i) => ({...s,title:content[`service_${i+1}_title`]||s.title,copy:content[`service_${i+1}_copy`]||s.copy,image:content[`service_${i+1}_image`]||s.image})).map((s, i) => (
            <article key={s.key} className={`svc-card group ${i < 2 ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={s.image} alt={`${s.title} by Joker's Group`} loading="lazy" className="card-img h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-transparent to-transparent" />
              </div>
              <div className="p-5">
                <h3 className="display text-2xl font-bold uppercase text-white">{s.title}</h3>
                <p className="mt-2 max-w-[320px] text-sm leading-6 text-white/70">{s.copy}</p>
                <a href="#quote" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:text-[#B9FF00]">
                  Explore <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Work({ projects, category, setCategory, setLightbox }: { projects: Project[]; category: Category; setCategory: (c: Category) => void; setLightbox: (p: Project) => void }) {
  return (
    <section id="work" className="bg-[#050505] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-10 md:mb-14">
          <p className="kicker mb-4">Made in Geelong. Made to stand out.</p>
          <h2 className="display text-[2.25rem] font-bold uppercase text-white sm:text-[3rem] lg:text-[3.75rem]">Our Work</h2>
          <p className="mt-4 max-w-[560px] text-sm leading-6 text-white/70">From vehicles and shopfronts to apparel, decals and custom signage — see how we help Geelong businesses bring their brands to life.</p>
        </div>
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button key={f} onClick={() => setCategory(f)} className={`whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition ${category === f ? 'bg-[#B9FF00] text-black' : 'border border-white/10 text-white/60 hover:text-white'}`}>{f}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {projects.map((p, i) => (
            <button key={p.id} onClick={() => setLightbox(p)} className={`work-card group text-left ${i === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2' : ''}`}>
              <div className="relative h-full min-h-[180px] overflow-hidden md:min-h-[220px]">
                <img src={p.image_url} alt={p.alt_text} loading="lazy" className="card-img h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">
                  <span className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B9FF00]">{p.category}</span>
                  <span className="display text-xl font-bold uppercase text-white md:text-2xl">{p.title}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80 opacity-0 transition group-hover:opacity-100">View Project <ArrowUpRight size={13} /></span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Why({ content }: { content: Record<string,string> }) {
  return (
    <section className="bg-[#0A0A0A] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-12 md:mb-16">
          <p className="kicker mb-4">{content.why_kicker}</p>
          <h2 className="display text-[2.25rem] font-bold uppercase text-white sm:text-[3rem] lg:text-[3.75rem]">{content.why_title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {whyPoints.map((p) => (
            <div key={p.num} className="bg-[#0B0B0B] p-6 md:p-8">
              <span className="font-mono text-xs text-white/40">{p.num}</span>
              <h3 className="display mt-4 text-3xl font-bold uppercase text-white">{p.title}</h3>
              <p className="mt-2 max-w-[280px] text-sm leading-6 text-white/70">{p.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Geelong({ content }: { content: Record<string,string> }) {
  return (
    <section className="relative h-[50vh] min-h-[340px] overflow-hidden md:h-[60vh]">
      <img src={content.geelong_image} alt="Geelong streetscape at night with illuminated signage" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-center px-5 md:px-8">
        <p className="kicker mb-4">{content.geelong_kicker}</p>
        <h2 className="display max-w-2xl text-[2.25rem] font-bold uppercase text-white sm:text-[3rem] lg:text-[4rem]">{content.geelong_title}</h2>
        <p className="mt-5 max-w-[500px] text-sm leading-7 text-white/80">Helping businesses across Geelong and surrounding areas get noticed.</p>
      </div>
    </section>
  );
}

function CTA({ content }: { content: Record<string,string> }) {
  return (
    <section className="relative overflow-hidden bg-[#050505] px-5 py-24 md:px-8 md:py-36">
      <div className="relative mx-auto max-w-[1400px]">
        <h2 className="display text-[2.5rem] font-bold uppercase text-white sm:text-[3.5rem] lg:text-[5rem]">{content.cta_title}</h2>
        <p className="mt-6 max-w-[500px] text-base leading-7 text-white/70">Tell us what you're looking for and we'll help bring it to life.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#quote" className="btn btn-primary">Get a Free Quote <ArrowRight size={15} /></a>
          <a href="#contact" className="btn btn-outline">Contact Us</a>
        </div>
      </div>
    </section>
  );
}

function QuoteForm({ submitQuote, submitted, formError, content }: { submitQuote: (e: FormEvent<HTMLFormElement>) => void; submitted: boolean; formError: string; content: Record<string,string> }) {
  return (
    <section id="quote" className="bg-[#0A0A0A] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.45fr_0.55fr] lg:gap-20">
        <div>
          <p className="kicker mb-4">{content.quote_kicker}</p>
          <h2 className="display text-[2.25rem] font-bold uppercase text-white sm:text-[3rem] lg:text-[3.5rem]">{content.quote_title}</h2>
          <div className="mt-10 space-y-5 text-sm">
            <a href={`mailto:${content.email}`} className="flex items-center gap-3 text-white/80 hover:text-white"><Mail size={16} className="text-[#B9FF00]" /> {content.email}</a>
            <a href={content.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-white/80 hover:text-white"><Facebook size={16} className="text-[#B9FF00]" /> Facebook</a>
            <p className="flex items-center gap-3 text-white/80"><span className="text-[#B9FF00]">&#9679;</span> {content.service_area}</p>
          </div>
        </div>
        <form onSubmit={submitQuote} className="grid gap-4 sm:grid-cols-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">Name *
            <input required name="name" type="text" className="field mt-2" />
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">Business / Organisation
            <input name="organisation" type="text" className="field mt-2" />
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">Phone or Email *
            <input required name="contact" type="text" className="field mt-2" placeholder="Your phone or email" />
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">Preferred Contact
            <select name="contact_type" className="field mt-2">
              <option value="Phone">Phone</option>
              <option value="Email">Email</option>
              <option value="Either">Either</option>
            </select>
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70 sm:col-span-2">What do you need? *
            <select required name="service" className="field mt-2">
              <option value="">Select a service</option>
              <option>Signage & Print</option>
              <option>Uniforms & Clothing</option>
              <option>Vehicle Graphics</option>
              <option>Promotional Products</option>
              <option>Stickers & Decals</option>
              <option>Multiple Services</option>
              <option>Other</option>
            </select>
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70 sm:col-span-2">Project Details *
            <textarea required name="description" rows={4} className="field mt-2 resize-y" placeholder="Tell us about your project..." />
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">Approximate Quantity
            <input name="quantity" type="text" className="field mt-2" placeholder="Optional" />
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">Upload Artwork
            <input name="artwork" type="file" accept=".png,.jpg,.jpeg,.pdf" className="field mt-2 cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white" />
          </label>
          {formError && <p className="text-sm text-red-400 sm:col-span-2">{formError}</p>}
          {submitted ? (
            <div className="flex items-center gap-3 rounded-lg border border-[#B9FF00]/20 bg-[#B9FF00]/5 p-4 text-sm font-medium text-white sm:col-span-2">
              <Check size={18} className="text-[#B9FF00]" /> Thanks — your enquiry is on its way. We'll be in touch.
            </div>
          ) : (
            <button type="submit" className="btn btn-primary mt-2 sm:col-span-2">Get a Free Quote <ArrowRight size={15} /></button>
          )}
        </form>
      </div>
    </section>
  );
}

function Footer({ setAdminOpen, content }: { setAdminOpen: (v: boolean) => void; content: Record<string,string> }) {
  return (
    <footer id="contact" className="bg-[#050505] px-5 pb-8 pt-16 md:px-8 md:pt-20">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-12 h-px w-full bg-gradient-to-r from-[#B9FF00] via-[#16D8ED] to-[#087DFF] opacity-30" />
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <img src={content.logo_image} alt="Joker's Group Geelong" className="h-10 w-auto object-contain" />
            <p className="mt-5 max-w-xs text-sm text-white/60">{content.footer_tagline}</p>
          </div>
          <div>
            <p className="kicker mb-5">Explore</p>
            <div className="space-y-3 text-sm text-white/70">
              <a href="#services" className="block hover:text-white">Services</a>
              <a href="#work" className="block hover:text-white">Our Work</a>
              <a href="#quote" className="block hover:text-white">Get a Quote</a>
            </div>
          </div>
          <div>
            <p className="kicker mb-5">Contact</p>
            <a href={`mailto:${content.email}`} className="block break-all text-sm text-white/70 hover:text-white">Rhett.jokersgroup@gmail.com</a>
            <a href={content.facebook} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 text-sm text-white/70 hover:text-white"><Facebook size={15} /> Facebook</a>
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50 md:flex-row">
          <span>&copy; Joker's Group Geelong. All Rights Reserved.</span>
          <button onClick={() => setAdminOpen(true)} className="text-left hover:text-white/80 md:text-right">Owner Login</button>
        </div>
      </div>
    </footer>
  );
}

function Lightbox({ project, close }: { project: Project; close: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/95 p-4 backdrop-blur-sm" onClick={close}>
      <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl bg-[#0B0B0B]" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} aria-label="Close" className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg bg-black/70 text-white/90 hover:text-white"><X size={18} /></button>
        <img src={project.image_url} alt={project.alt_text} className="max-h-[60vh] w-full object-cover" />
        <div className="p-6">
          <p className="kicker text-[#B9FF00]">{project.category}</p>
          <h3 className="display mt-2 text-3xl font-bold uppercase text-white">{project.title}</h3>
          <p className="mt-2 text-sm text-white/70">{project.description}</p>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ close, content, setContent, starterProjects }: { close: () => void; content: Record<string,string>; setContent: (v: Record<string,string>) => void; starterProjects: Project[] }) {
  const [mode, setMode] = useState<'login' | 'dashboard'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [enquiries, setEnquiries] = useState<{ id: string; name: string; email: string; phone: string; service: string; description: string; created_at: string }[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<'enquiries' | 'portfolio' | 'content'>('enquiries');
  const [draft, setDraft] = useState<Record<string,string>>(content);
  const imageKeys = new Set(['logo_image','hero_image','geelong_image','service_1_image','service_2_image','service_3_image','service_4_image','service_5_image']);
  const saveContent = async () => { try { await saveSiteContent(draft); setContent(draft); setMessage('Website content saved.'); } catch { setMessage('Could not save website content.'); } };
  const uploadFor = async (key:string,file?:File) => { if(!file)return; try { setMessage('Uploading image...'); const url=await uploadSiteImage(file); setDraft((d)=>({...d,[key]:url})); setMessage('Image uploaded. Click Save Website Changes.'); } catch { setMessage('Image upload failed.'); } };

  const login = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage('Login details not recognised.'); return; }
    const { data } = await supabase.rpc('claim_first_admin');
    if (!data) { setMessage('This account does not have owner access.'); await supabase.auth.signOut(); return; }
    setMode('dashboard');
    const eq = await supabase.from('quote_enquiries').select('id,name,email,phone,service,description,created_at').order('created_at', { ascending: false });
    if (eq.data) setEnquiries(eq.data);
    const pj = await supabase.from('portfolio_projects').select('id,title,category,description,image_url,alt_text').order('created_at', { ascending: false });
    if (pj.data) {
      let loaded = pj.data as Project[];
      if (!loaded.length) {
        setMessage('Setting up the existing Our Work projects...');
        for (const p of starterProjects) {
          await supabase.from('portfolio_projects').insert({ title:p.title, category:p.category, description:p.description, image_url:p.image_url, alt_text:p.alt_text });
        }
        const seeded = await supabase.from('portfolio_projects').select('id,title,category,description,image_url,alt_text').order('created_at', { ascending: false });
        loaded = (seeded.data as Project[]) || [];
      }
      setProjects(loaded);
    }
  };

  const addProject = async (e: FormEvent) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget as HTMLFormElement);
    const v = Object.fromEntries(f.entries());
    const imageFile = f.get('image_file');
    if (!v.title || !(imageFile instanceof File) || !imageFile.size) { setMessage('Title and project image are required.'); return; }
    setMessage('Uploading project image...');
    let imageUrl = '';
    try { imageUrl = await uploadSiteImage(imageFile); } catch { setMessage('Could not upload project image.'); return; }
    const { error } = await supabase.from('portfolio_projects').insert({ title: v.title, category: v.category, description: v.description ?? '', image_url: imageUrl, alt_text: v.alt_text ?? '' });
    if (error) { setMessage('Could not add project.'); return; }
    setMessage('Project added.');
    const pj = await supabase.from('portfolio_projects').select('id,title,category,description,image_url,alt_text').order('created_at', { ascending: false });
    if (pj.data) setProjects(pj.data as Project[]);
    (e.currentTarget as HTMLFormElement).reset();
  };

  const saveProjectEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    const f = new FormData(e.currentTarget as HTMLFormElement);
    let imageUrl = editingProject.image_url;
    const imageFile = f.get('image_file');
    if (imageFile instanceof File && imageFile.size) {
      try { setMessage('Uploading replacement image...'); imageUrl = await uploadSiteImage(imageFile); }
      catch { setMessage('Could not upload replacement image.'); return; }
    }
    const updated = { ...editingProject, title: String(f.get('title') || ''), category: String(f.get('category') || ''), description: String(f.get('description') || ''), alt_text: String(f.get('alt_text') || ''), image_url: imageUrl };
    const { error } = await supabase.from('portfolio_projects').update(updated);
    if (error) { setMessage('Could not update project.'); return; }
    setProjects((items) => items.map((p) => p.id === updated.id ? updated : p));
    setEditingProject(null);
    setMessage('Project updated.');
  };

  const deleteProject = async (id: string) => {
    await supabase.from('portfolio_projects').delete().eq('id', id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  const signOut = async () => { await supabase.auth.signOut(); close(); };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#eef2f6] p-4 md:p-8">
      <div className="admin-light mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl md:p-10">
        <style>{`
          .admin-light .kicker { color:#64748b !important; }
          .admin-light .display { color:#0f172a !important; }
          .admin-light .field { background:#fff !important; color:#0f172a !important; border:1px solid #cbd5e1 !important; }
          .admin-light .field::placeholder { color:#94a3b8 !important; }
          .admin-light label { color:#475569 !important; }
          .admin-light p { color:#475569; }
          .admin-light strong, .admin-light a { color:#0f172a !important; }
          .admin-light .text-white, .admin-light .text-white\/70, .admin-light .text-white\/60, .admin-light .text-white\/50, .admin-light .text-white\/40, .admin-light .text-white\/80 { color:#475569 !important; }
          .admin-light .text-red-400, .admin-light .text-red-400\/70 { color:#dc2626 !important; }
          .admin-light .btn-outline { color:#334155 !important; border-color:#cbd5e1 !important; background:#fff !important; }
          .admin-light .btn-outline:hover { background:#f8fafc !important; }
        `}</style>
        <div className="flex items-start justify-between">
          <div>
            <p className="kicker">Joker's Group / Owner Area</p>
            <h2 className="display mt-3 text-3xl font-bold uppercase text-white">{mode === 'login' ? 'Owner Login' : 'Dashboard'}</h2>
          </div>
          <button onClick={close} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"><X size={18} /></button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={login} className="mt-8 grid max-w-sm gap-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email address" className="field" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="Password" className="field" />
            <button className="btn btn-primary w-fit">Sign In <ArrowRight size={15} /></button>
            {message && <p className="text-sm text-red-400">{message}</p>}
            <p className="text-xs leading-5 text-white/50">Access is protected by secure account sign-in. The first approved account claims owner access.</p>
          </form>
        ) : (
          <div className="mt-8">
            <div className="mb-6 flex gap-1 border-b border-slate-200 pb-1">
              {(['enquiries', 'portfolio', 'content'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition ${tab === t ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>{t}</button>
              ))}
            </div>

            {tab === 'enquiries' && (
              <div className="space-y-3">
                {enquiries.length ? enquiries.map((enq) => (
                  <div key={enq.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <strong className="text-sm text-white">{enq.name}</strong>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">{enq.service}</span>
                    </div>
                    <a href={`mailto:${enq.email}`} className="mt-1.5 block text-xs text-white/70">{enq.email}</a>
                    <p className="mt-0.5 text-xs text-white/60">{enq.phone}</p>
                    <p className="mt-2 text-xs text-white/70">{enq.description}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-white/40">{new Date(enq.created_at).toLocaleDateString()}</p>
                  </div>
                )) : <p className="text-sm text-white/50">No enquiries yet.</p>}
              </div>
            )}

            {tab === 'portfolio' && (
              <div>
                <form onSubmit={addProject} className="mb-6 grid gap-3 rounded-lg border border-slate-200 p-4">
                  <p className="kicker">Add Project</p>
                  <input name="title" placeholder="Project title *" className="field" />
                  <select name="category" className="field">
                    <option>Business Signage</option><option>Vehicle Graphics</option><option>Custom Signs</option><option>Apparel & DTF</option><option>Stickers & Decals</option><option>Promotional Products</option>
                  </select>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Project image *
                    <input name="image_file" type="file" accept="image/*" required className="field mt-2 cursor-pointer" />
                  </label>
                  <input name="alt_text" placeholder="Alt text (accessibility)" className="field" />
                  <textarea name="description" placeholder="Short description" rows={2} className="field resize-y" />
                  <button className="btn btn-primary w-fit">Add Project</button>
                </form>
                <div className="space-y-2">
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image_url} alt={p.alt_text} className="h-12 w-12 rounded object-cover" />
                        <div>
                          <p className="text-sm font-medium text-white">{p.title}</p>
                          <p className="text-[10px] uppercase tracking-wider text-white/50">{p.category}</p>
                        </div>
                      </div>
                      <div className="flex gap-3"><button type="button" onClick={() => setEditingProject(p)} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Edit</button><button type="button" onClick={() => deleteProject(p.id)} className="text-xs text-red-400/70 hover:text-red-400">Delete</button></div>
                    </div>
                  ))}
                  {!projects.length && <p className="text-sm text-white/50">No projects yet.</p>}
                </div>
                {editingProject && <form onSubmit={saveProjectEdit} className="mt-6 grid gap-3 rounded-lg border border-slate-300 bg-slate-50 p-4">
                  <div className="flex items-center justify-between"><p className="kicker">Edit Our Work Project</p><button type="button" onClick={()=>setEditingProject(null)} className="text-xs font-semibold text-slate-500">Cancel</button></div>
                  <input name="title" defaultValue={editingProject.title} className="field" placeholder="Project title" />
                  <select name="category" defaultValue={editingProject.category} className="field"><option>Business Signage</option><option>Vehicle Graphics</option><option>Custom Signs</option><option>Apparel & DTF</option><option>Stickers & Decals</option><option>Promotional Products</option></select>
                  <div className="grid gap-2"><img src={editingProject.image_url} alt={editingProject.alt_text} className="h-36 w-full rounded-lg object-cover" /><label className="text-[10px] font-semibold uppercase tracking-wider">Replace image (optional)<input name="image_file" type="file" accept="image/*" className="field mt-2 cursor-pointer" /></label></div>
                  <input name="alt_text" defaultValue={editingProject.alt_text} className="field" placeholder="Alt text" />
                  <textarea name="description" defaultValue={editingProject.description} rows={3} className="field resize-y" placeholder="Short description" />
                  <button className="btn btn-primary w-fit">Save Project Changes</button>
                </form>}
              </div>
            )}

            {tab === 'content' && (
              <div className="space-y-5">
                <p className="text-sm text-white/70">Edit the main website text, contact details and images below. Uploaded images are stored in Cloudflare R2.</p>
                {[
                  ['Brand & contact',['logo_image','email','facebook','service_area','footer_tagline']],
                  ['Hero',['hero_kicker','hero_title','hero_accent','hero_copy','hero_location','hero_image']],
                  ['Services heading',['services_kicker','services_title']],
                  ['Service 1',['service_1_title','service_1_copy','service_1_image']],
                  ['Service 2',['service_2_title','service_2_copy','service_2_image']],
                  ['Service 3',['service_3_title','service_3_copy','service_3_image']],
                  ['Service 4',['service_4_title','service_4_copy','service_4_image']],
                  ['Service 5',['service_5_title','service_5_copy','service_5_image']],
                  ['Why Jokers',['why_kicker','why_title']],
                  ['Geelong section',['geelong_kicker','geelong_title','geelong_copy','geelong_image']],
                  ['Call to action',['cta_title','cta_copy']],
                  ['Quote section',['quote_kicker','quote_title']]
                ].map(([section,keys]) => <div key={section as string} className="rounded-lg border border-slate-200 p-4">
                  <p className="kicker mb-4">{section}</p>
                  <div className="grid gap-3">
                    {(keys as string[]).map((key) => <label key={key} className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{key.replaceAll('_',' ')}
                      {imageKeys.has(key) ? <div className="mt-2 grid gap-2"><input type="file" accept="image/*" onChange={(e)=>uploadFor(key,e.target.files?.[0])} className="field cursor-pointer" />{draft[key]&&<img src={draft[key]} alt="" className="h-24 w-full rounded object-cover" />}</div> : (key.includes('copy') ? <textarea rows={3} value={draft[key]||''} onChange={(e)=>setDraft({...draft,[key]:e.target.value})} className="field mt-2 resize-y" /> : <input value={draft[key]||''} onChange={(e)=>setDraft({...draft,[key]:e.target.value})} className="field mt-2" />)}
                    </label>)}
                  </div>
                </div>)}
                <button type="button" onClick={saveContent} className="btn btn-primary">Save Website Changes</button>
              </div>
            )}

            {message && <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">{message}</p>}
            <button onClick={signOut} className="btn btn-outline mt-6">Sign Out</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
