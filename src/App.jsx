import { useMemo, useState } from 'react';

const products = [
  { id: 1, title: 'The Complete Business Planner', category: 'Business', price: 18000, oldPrice: 25000, tag: 'Bestseller', type: 'PDF + Sheets', art: 'planner', icon: '▤', tone: 'lavender', description: 'Plan smarter, set clear goals and track your progress.' },
  { id: 2, title: 'CV & Career Toolkit', category: 'Career', price: 12000, oldPrice: 16000, tag: 'Popular', type: 'Editable templates', art: 'career', icon: '✳', tone: 'mint', description: 'Stand out with polished CV, cover letter and interview tools.' },
  { id: 3, title: 'Personal Finance Tracker', category: 'Finance', price: 15000, oldPrice: null, tag: 'New', type: 'Excel + PDF', art: 'finance', icon: '↗', tone: 'peach', description: 'Know where your money goes and build better habits.' },
  { id: 4, title: 'Study Success Bundle', category: 'Education', price: 10000, oldPrice: 14000, tag: 'Great value', type: 'Study templates', art: 'study', icon: '✎', tone: 'blue', description: 'A simple system for notes, revision and focused study.' },
  { id: 5, title: 'Social Media Content Kit', category: 'Business', price: 22000, oldPrice: null, tag: 'Creator pick', type: 'Canva templates', art: 'social', icon: '◈', tone: 'pink', description: 'Create consistent content with ready-to-customise layouts.' },
  { id: 6, title: 'Weekly Life & Habit Planner', category: 'Lifestyle', price: 8000, oldPrice: null, tag: 'Easy start', type: 'Printable PDF', art: 'life', icon: '✦', tone: 'sand', description: 'Make room for the routines and goals that matter.' }
];

const categories = ['All products', 'Business', 'Career', 'Finance', 'Education', 'Lifestyle'];
const money = value => 'UGX ' + value.toLocaleString('en-UG');

function App() {
  const [activeCategory, setActiveCategory] = useState('All products');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const visibleProducts = useMemo(() => products.filter(product => {
    const matchesCategory = activeCategory === 'All products' || product.category === activeCategory;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || (product.title + ' ' + product.category + ' ' + product.description).toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  }), [activeCategory, search]);

  const addToCart = product => {
    setCart(current => [...current, product]);
    setNotice(product.title + ' added to your bag');
    window.setTimeout(() => setNotice(''), 2600);
  };

  return (
    <div className="site-shell">
      <div className="announcement"><span className="announcement-spark">✦</span> Useful digital tools. Better everyday decisions. <a href="#products">Explore the collection <span>↗</span></a></div>
      <header className="header">
        <a className="brand" href="#" aria-label="SmartPesa Market home">
          <span className="brand-mark"><span></span><span></span><span></span></span>
          <span className="brand-name">smartpesa<span>market</span></span>
        </a>
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? '✕' : '☰'}</button>
        <nav className={menuOpen ? 'nav nav-open' : 'nav'}>
          <a href="#products" onClick={() => setMenuOpen(false)}>Explore</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About us</a>
        </nav>
        <div className="header-actions">
          <a className="seller-link" href="mailto:smartpesamarket.ug@gmail.com?subject=Selling%20on%20SmartPesa%20Market">Become a seller</a>
          <button className="bag-button" onClick={() => setNotice(cart.length ? 'Your bag has ' + cart.length + (cart.length === 1 ? ' item' : ' items') + ' · Checkout is coming soon.' : 'Your bag is empty for now. Explore the collection.')}>
            <span className="bag-icon">⌑</span><span>My bag</span><b>{cart.length}</b>
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-glow glow-one"></div><div className="hero-glow glow-two"></div>
          <div className="hero-copy">
            <div className="eyebrow light"><span className="eyebrow-dot"></span> THE SMARTER WAY TO GET THINGS DONE</div>
            <h1>Good ideas.<br /><em>Made useful.</em></h1>
            <p className="hero-description">Discover practical digital products that help you learn, work, grow your business and make more of every day.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#products">Explore marketplace <span>↗</span></a>
              <a className="text-link light-link" href="#how-it-works">How it works <span>→</span></a>
            </div>
            <div className="hero-proof"><div className="proof-avatars"><span>✦</span><span>✳</span><span>◈</span></div><span>Small tools. Meaningful progress.</span></div>
          </div>
          <div className="hero-art" aria-label="A collection of digital productivity products">
            <div className="orbit orbit-a"></div><div className="orbit orbit-b"></div>
            <div className="float-card mini-card card-top"><span className="mini-icon">✧</span><span><b>Make it happen</b><small>Your next great idea</small></span></div>
            <div className="showcase-card">
              <div className="showcase-top"><span>YOUR NEXT CHAPTER</span><span className="showcase-dots">•••</span></div>
              <div className="showcase-title">Plan with<br /><i>purpose.</i></div>
              <div className="showcase-lines"><span></span><span></span><span></span></div>
              <div className="showcase-bottom"><span>SMART PLANNER / 01</span><span className="showcase-stamp">S</span></div>
            </div>
            <div className="float-card mini-card card-bottom"><span className="growth-icon">↗</span><span><b>Progress, not pressure.</b><small>One step at a time</small></span></div>
            <div className="hero-orb"><span>✦</span></div>
          </div>
          <div className="hero-bottom"><span>DESIGNED FOR YOUR EVERYDAY</span><span className="hero-bottom-line"></span><span>LEARN · CREATE · GROW</span></div>
        </section>

        <section className="benefit-strip" aria-label="Marketplace benefits">
          <div><span className="benefit-icon">◇</span><span><b>Instant-ready resources</b><small>Digital tools, made practical</small></span></div>
          <div><span className="benefit-icon">◎</span><span><b>Made to be useful</b><small>Less overwhelm, more progress</small></span></div>
          <div><span className="benefit-icon">↗</span><span><b>Value that goes further</b><small>Helpful ideas at clear prices</small></span></div>
        </section>

        <section className="products-section section-wrap" id="products">
          <div className="section-heading">
            <div><div className="eyebrow"><span className="eyebrow-dot"></span> THE COLLECTION</div><h2>Find your next <em>good thing.</em></h2><p>Thoughtful digital resources for the things you're working towards.</p></div>
            <a className="text-link desktop-link" href="#products">Browse all products <span>→</span></a>
          </div>
          <div className="catalogue-tools">
            <div className="category-list" role="group" aria-label="Filter products by category">
              {categories.map(category => <button key={category} className={activeCategory === category ? 'category-chip active' : 'category-chip'} onClick={() => setActiveCategory(category)}>{category}</button>)}
            </div>
            <label className="search-box"><span>⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search the collection..." aria-label="Search products" /><kbd>⌘ K</kbd></label>
          </div>
          <div className="product-grid">
            {visibleProducts.map(product => <article className="product-card" key={product.id}>
              <div className={'product-art art-' + product.tone}>
                <span className="product-tag">{product.tag}</span>
                <div className={'art-object object-' + product.art}>
                  {product.art === 'planner' && <><div className="paper-sheet"><span className="paper-kicker">THE EVERYDAY EDIT</span><b>Make<br />space for<br /><i>great things.</i></b><span className="paper-rule"></span><small>PLAN · FOCUS · GROW</small></div><div className="paper-shadow"></div></>}
                  {product.art === 'career' && <><div className="career-sheet"><span>YOUR NEXT MOVE</span><b>Make your<br /><i>mark.</i></b><div className="career-lines"></div></div><div className="career-badge">CV<br />KIT</div></>}
                  {product.art === 'finance' && <><div className="finance-sheet"><span>MONTHLY OVERVIEW</span><b>Money<br />in focus.</b><div className="chart-bars"><i></i><i></i><i></i><i></i><i></i><i></i></div><small>TRACK YOUR GROWTH ↗</small></div><div className="coin">UGX</div></>}
                  {product.art === 'study' && <><div className="study-sheet"><span>STUDY MODE</span><b>One page<br />at a time.</b><div className="study-checks">✓ Focus<br />✓ Review<br />✓ Repeat</div></div><div className="study-star">✳</div></>}
                  {product.art === 'social' && <><div className="social-tile tile-one">CREATE<br /><i>with intent.</i></div><div className="social-tile tile-two">GOOD<br />IDEAS ✦</div><div className="social-tile tile-three">01 / 24</div></>}
                  {product.art === 'life' && <><div className="life-sheet"><span>A LITTLE RESET</span><b>Make today<br /><i>count.</i></b><div className="life-sun">☼</div><small>YOUR WEEKLY PLANNER</small></div></>}
                </div>
                <span className="art-index">0{product.id} / DIGITAL</span>
              </div>
              <div className="product-info"><div className="product-meta"><span>{product.category}</span><span>{product.type}</span></div><h3>{product.title}</h3><p>{product.description}</p>
                <div className="product-buy"><div><strong>{money(product.price)}</strong>{product.oldPrice && <del>{money(product.oldPrice)}</del>}</div><button className="add-button" onClick={() => addToCart(product)} aria-label={'Add ' + product.title + ' to bag'}>＋</button></div>
              </div>
            </article>)}
          </div>
          {visibleProducts.length === 0 && <div className="empty-state"><span>⌕</span><h3>No matches just yet</h3><p>Try another search or choose a different category.</p><button onClick={() => {setSearch('');setActiveCategory('All products');}}>Clear filters</button></div>}
          <div className="catalogue-note"><span>✦</span> A growing collection of useful things. More discoveries coming soon.</div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="section-wrap how-inner">
            <div className="how-intro"><div className="eyebrow light"><span className="eyebrow-dot"></span> SIMPLE BY DESIGN</div><h2>Good things,<br /><em>without the fuss.</em></h2><p>Finding a useful resource should feel easy. We're making the journey from discovery to download simple and clear.</p></div>
            <div className="steps">
              <div className="step"><span className="step-number">01</span><span className="step-icon">⌕</span><h3>Discover</h3><p>Explore practical resources picked to help you move forward.</p></div>
              <div className="step"><span className="step-number">02</span><span className="step-icon">◇</span><h3>Choose</h3><p>Find the right fit with clear descriptions and upfront pricing.</p></div>
              <div className="step"><span className="step-number">03</span><span className="step-icon">↗</span><h3>Make progress</h3><p>Put your new resource to work and keep building momentum.</p></div>
            </div>
          </div>
        </section>

        <section className="about-section section-wrap" id="about">
          <div className="about-mark"><span className="brand-mark large"><span></span><span></span><span></span></span><span>SMARTER, ONE STEP AT A TIME.</span></div>
          <div className="about-copy"><div className="eyebrow"><span className="eyebrow-dot"></span> A MARKETPLACE WITH A PURPOSE</div><h2>Make everyday<br />feel a little <em>smarter.</em></h2><p>SmartPesa Market brings useful digital products together in one place — from business and career tools to learning resources and everyday planners. Less searching. More doing.</p><a className="text-link" href="#products">Find something useful <span>→</span></a></div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main"><a className="brand footer-brand" href="#"><span className="brand-mark"><span></span><span></span><span></span></span><span className="brand-name">smartpesa<span>market</span></span></a><p>Useful digital tools for your next step.</p><a href="mailto:smartpesamarket.ug@gmail.com">smartpesamarket.ug@gmail.com</a></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} SmartPesa Market. All rights reserved.</span><span>MADE FOR EVERYDAY PROGRESS <b>✦</b></span></div>
      </footer>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </div>
  );
}

export default App;