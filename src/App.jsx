import { useEffect, useMemo, useRef, useState } from 'react';

const sampleProducts = [
  { id: 1, title: 'The Complete Business Planner', category: 'Business', price: 18000, oldPrice: 25000, tag: 'Bestseller', type: 'PDF + Sheets', art: 'planner', icon: '▤', tone: 'lavender', description: 'Plan smarter, set clear goals and track your progress.' },
  { id: 2, title: 'CV & Employment Toolkit', category: 'Employment', price: 12000, oldPrice: 16000, tag: 'Popular', type: 'Editable templates', art: 'career', icon: '✳', tone: 'mint', description: 'Stand out with polished CV, cover letter and interview tools.' },
  { id: 3, title: 'Personal Finance Tracker', category: 'Business', price: 15000, oldPrice: null, tag: 'New', type: 'Excel + PDF', art: 'finance', icon: '↗', tone: 'peach', description: 'Know where your money goes and build better habits.' },
  { id: 4, title: 'Study Success Bundle', category: 'Education', price: 10000, oldPrice: 14000, tag: 'Great value', type: 'Study templates', art: 'study', icon: '✎', tone: 'blue', description: 'A simple system for notes, revision and focused study.' },
  { id: 5, title: 'Social Media Content Kit', category: 'Business', price: 22000, oldPrice: null, tag: 'Creator pick', type: 'Canva templates', art: 'social', icon: '◈', tone: 'pink', description: 'Create consistent content with ready-to-customise layouts.' },
  { id: 6, title: 'Weekly Life & Habit Planner', category: 'Lifestyle', price: 8000, oldPrice: null, tag: 'Easy start', type: 'Printable PDF', art: 'life', icon: '✦', tone: 'sand', description: 'Make room for the routines and goals that matter.' }
];

const categories = ['All products', 'Education', 'Business', 'Employment', 'Lifestyle'];
const money = value => 'UGX ' + Number(value).toLocaleString('en-UG');

function mapDatabaseProduct(row, index) {
  const visual = sampleProducts[index % sampleProducts.length];
  return {
    ...visual,
    id: row.id,
    title: row.title,
    category: row.category,
    price: Number(row.price_ugx),
    oldPrice: row.compare_at_price_ugx == null ? null : Number(row.compare_at_price_ugx),
    type: row.product_type || 'Digital product',
    description: row.description || '',
    imageUrl: row.image_url,
    tag: 'Available'
  };
}

function App() {
  const [products, setProducts] = useState(sampleProducts);
  const [catalogueSource, setCatalogueSource] = useState('sample');
  const [activeCategory, setActiveCategory] = useState('All products');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [catalogueError, setCatalogueError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authBusy, setAuthBusy] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountOrders, setAccountOrders] = useState([]);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [authError, setAuthError] = useState('');
  const [heroRotation, setHeroRotation] = useState({ x: -7, y: -18 });
  const heroDrag = useRef(null);
  const handleHeroPointerDown = event => { heroDrag.current = { x: event.clientX, y: event.clientY, rotation: heroRotation }; event.currentTarget.setPointerCapture(event.pointerId); };
  const handleHeroPointerMove = event => { if (!heroDrag.current) return; const dx = event.clientX - heroDrag.current.x; const dy = event.clientY - heroDrag.current.y; setHeroRotation({ x: Math.max(-24, Math.min(18, heroDrag.current.rotation.x - dy * .22)), y: Math.max(-38, Math.min(38, heroDrag.current.rotation.y + dx * .28)) }); };
  const handleHeroPointerUp = () => { heroDrag.current = null; };

  useEffect(() => {
    fetch('/api/auth/me').then(response => response.ok ? response.json() : null)
      .then(data => { if (data?.user) setAuthUser(data.user); })
      .catch(() => {});
  }, []);

  async function submitAuth(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get('email') || '').trim(),
      password: String(form.get('password') || ''),
      displayName: String(form.get('displayName') || '').trim()
    };
    try {
      const response = await fetch(authMode === 'register' ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to sign in.');
      setAuthUser(data.user);
      setAuthOpen(false);
      setNotice(authMode === 'register' ? 'Your account has been created.' : 'Welcome back.');
      window.setTimeout(() => setNotice(''), 2600);
    } catch (error) {
      setAuthError(error.message || 'Please try again.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function openAccount() {
    setAccountOpen(true);
    setAccountBusy(true);
    setAccountError('');
    try {
      const response = await fetch('/api/account/orders', { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load your account.');
      setAccountOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (error) {
      setAccountError(error.message || 'Unable to load your account.');
    } finally {
      setAccountBusy(false);
    }
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAuthUser(null);
    setNotice('You have signed out.');
    window.setTimeout(() => setNotice(''), 2600);
  }

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const response = await fetch('/api/products', { headers: { Accept: 'application/json' } });
        if (!response.ok) {
          if (response.status !== 503 && active) {
            setCatalogueError('Live catalogue is temporarily unavailable. Showing sample products.');
          }
          return;
        }
        const data = await response.json();
        if (!active) return;
        setProducts(Array.isArray(data) ? data.map(mapDatabaseProduct) : []);
        setCatalogueSource('live');
      } catch {
        if (active) setCatalogueError('Connect the Cloudflare D1 catalogue to load live products. Showing sample products.');
      }
    }
    loadProducts();
    return () => { active = false; };
  }, []);

  const visibleProducts = useMemo(() => products.filter(product => {
    const matchesCategory = activeCategory === 'All products' || product.category === activeCategory;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || (product.title + ' ' + product.category + ' ' + product.description).toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  }), [products, activeCategory, search]);

  const cartTotal = cart.reduce((sum, product) => sum + Number(product.price || 0) * product.quantity, 0);

  async function createOrder() {
    if (catalogueSource !== 'live' || cart.length === 0) return;
    if (!authUser) {
      setCartOpen(false); setAuthMode('login'); setAuthError(''); setAuthOpen(true);
      setNotice('Sign in to continue with your order.');
      window.setTimeout(() => setNotice(''), 3000); return;
    }
    setCheckoutBusy(true); setCheckoutError('');
    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: cart.map(item => ({ productId: String(item.id), quantity: item.quantity })) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'We could not create your order.');
      setCreatedOrder(data.order); setCart([]);
      setAccountOrders(current => [{ id: data.order.id, status: data.order.status, totalUgx: data.order.totalUgx, createdAt: new Date().toISOString(), items: data.order.items.map((item, index) => ({ id: item.productId + '-' + index, title: item.title, quantity: item.quantity })) }, ...current]);
    } catch (error) { setCheckoutError(error.message || 'Please try again.'); }
    finally { setCheckoutBusy(false); }
  }

  const addToCart = product => {
    setCart(current => {
      const existing = current.find(item => String(item.id) === String(product.id));
      return existing
        ? current.map(item => String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }];
    });
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
          {authUser ? <button className="account-button" onClick={openAccount}>My account</button> : <button className="account-button" onClick={() => { setAuthMode('login'); setAuthError(''); setAuthOpen(true); }}>Sign in</button>}
          <button className="bag-button" onClick={() => setCartOpen(true)}>
            <span className="bag-icon">⌑</span><span>My bag</span><b>{cart.length}</b>
          </button>
        </div>
      </header>


      {cartOpen && <div className="auth-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setCartOpen(false); }}>
        <section className="account-panel cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
          <button className="auth-close" onClick={() => setCartOpen(false)} aria-label="Close bag">×</button>
          <div className="eyebrow"><span className="eyebrow-dot"></span> YOUR SELECTION</div>
          <h2 id="cart-title">Your bag <em>({cart.length})</em></h2>
          {createdOrder && <div className="checkout-success" role="status">
            <b>Order created successfully</b><span>Reference: {createdOrder.id.slice(0, 8).toUpperCase()}</span>
            <strong>{money(createdOrder.totalUgx)}</strong>
            <small>Status: pending. Payment is not available yet, and no money has been taken.</small>
            <button className="button button-primary" onClick={() => { setCartOpen(false); setCreatedOrder(null); if (authUser) openAccount(); }}>View my orders</button>
          </div>}
          {cart.length === 0 ? <div className="account-empty"><span>◇</span><b>Your bag is empty</b><small>Explore the collection and add something useful.</small></div> :
            <div className="cart-items">{cart.map(product => <article className="cart-item" key={product.id}>
              <div><b>{product.title}</b><small>{product.category} · {product.type}</small><strong>{money(product.price * product.quantity)}</strong></div>
              <div className="cart-item-controls"><div className="quantity-control"><button onClick={() => setCart(items => items.map(item => String(item.id) === String(product.id) ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))} aria-label="Decrease quantity">−</button><span>{product.quantity}</span><button onClick={() => setCart(items => items.map(item => String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item))} aria-label="Increase quantity">＋</button></div><button className="cart-remove" onClick={() => setCart(items => items.filter(item => String(item.id) !== String(product.id)))} aria-label={"Remove " + product.title}>Remove</button></div>
            </article>)}</div>}
          <div className="cart-total"><span>Subtotal</span><strong>{money(cartTotal)}</strong></div>
          {checkoutError && <p className="auth-error" role="alert">{checkoutError}</p>}
          {!createdOrder && <p className="cart-notice">{catalogueSource === 'live' ? 'Create a pending order from published products. Payment and digital delivery are not enabled yet.' : 'Checkout is available once the live product catalogue is connected. Sample products cannot be purchased.'} No payment will be taken.</p>}
          <div className="account-actions"><button className="account-signout" onClick={() => { setCart([]); setCreatedOrder(null); }}>Clear bag</button>{catalogueSource === 'live' ? <button className="button button-primary" disabled={checkoutBusy || cart.length === 0 || !!createdOrder} onClick={createOrder}>{checkoutBusy ? 'Creating order…' : !authUser ? 'Sign in to checkout' : 'Create pending order'}</button> : <button className="button button-primary" onClick={() => { setCartOpen(false); document.getElementById('products')?.scrollIntoView({behavior:'smooth'}); }}>Continue exploring</button>}</div>
        </section>
      </div>}
      {accountOpen && authUser && <div className="auth-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setAccountOpen(false); }}>
        <section className="account-panel" role="dialog" aria-modal="true" aria-labelledby="account-title">
          <button className="auth-close" onClick={() => setAccountOpen(false)} aria-label="Close">×</button>
          <div className="eyebrow"><span className="eyebrow-dot"></span> YOUR SMARTPESA ACCOUNT</div>
          <h2 id="account-title">Hello, {authUser.displayName.split(' ')[0]}.</h2>
          <p className="account-email">{authUser.email}</p>
          <div className="account-summary"><span>ACCOUNT</span><span>ORDER HISTORY</span><strong>{authUser.role === 'admin' ? 'Administrator' : 'Customer'}</strong><strong>{accountOrders.length} orders</strong></div>
          <h3 className="account-section-title">Your orders</h3>
          {accountBusy ? <p className="account-empty">Loading your order history…</p> : accountError ? <p className="auth-error" role="alert">{accountError}</p> : accountOrders.length === 0 ? <div className="account-empty"><span>◇</span><b>No orders yet</b><small>Your purchases will appear here after checkout is available.</small></div> : <div className="account-order-list">{accountOrders.map(order => <article className="account-order" key={order.id}><div><b>Order {order.id.slice(0, 8).toUpperCase()}</b><small>{new Date(order.createdAt).toLocaleDateString('en-UG')}</small>{order.items.map(item => <small key={item.id}>{item.quantity} × {item.title}</small>)}</div><div><strong>{money(order.totalUgx)}</strong><span className={'order-status status-' + order.status}>{order.status}</span></div></article>)}</div>}
          <div className="account-actions"><button className="account-signout" onClick={signOut}>Sign out</button><button className="button button-primary" onClick={() => setAccountOpen(false)}>Continue shopping</button></div>
        </section>
      </div>}
      {authOpen && <div className="auth-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setAuthOpen(false); }}>
        <section className="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <button className="auth-close" onClick={() => setAuthOpen(false)} aria-label="Close">×</button>
          <div className="eyebrow"><span className="eyebrow-dot"></span> SMARTPESA MARKET ACCOUNT</div>
          <h2 id="auth-title">{authMode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
          <p>Keep your digital purchases and account details together.</p>
          <form onSubmit={submitAuth}>
            {authMode === 'register' && <label>Your name<input name="displayName" autoComplete="name" required minLength="2" maxLength="80" /></label>}
            <label>Email address<input name="email" type="email" autoComplete="email" required maxLength="254" /></label>
            <label>Password<input name="password" type="password" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} required minLength="10" maxLength="128" /></label>
            {authMode === 'register' && <small>Use at least 10 characters. Keep your password private.</small>}
            {authError && <div className="auth-error" role="alert">{authError}</div>}
            <button className="button button-primary auth-submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'register' ? 'Create account' : 'Sign in'} <span>→</span></button>
          </form>
          <button className="auth-switch" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>{authMode === 'login' ? 'New to SmartPesa Market? Create an account' : 'Already have an account? Sign in'}</button>
        </section>
      </div>}
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
          <div className="hero-art hero-stage" aria-label="Interactive three-dimensional digital product showcase">
            <div className="stage-light"></div><div className="stage-ring ring-one"></div><div className="stage-ring ring-two"></div>
            <div className="hero-device-wrap">
              <div className="hero-device" style={{ transform: `rotateX(${heroRotation.x}deg) rotateY(${heroRotation.y}deg)` }} onPointerDown={handleHeroPointerDown} onPointerMove={handleHeroPointerMove} onPointerUp={handleHeroPointerUp} onPointerCancel={handleHeroPointerUp} onLostPointerCapture={handleHeroPointerUp}>
                <div className="device-screen-shell">
                  <div className="device-screen">
                    <div className="screen-topline"><span className="screen-brand">SP<span> / MARKET</span></span><span className="screen-menu">COLLECTION&nbsp;&nbsp; ✦ &nbsp;&nbsp; 2026</span></div>
                    <div className="screen-copy"><small>TOOLS FOR YOUR NEXT MOVE</small><b>Make your<br/><i>ideas happen.</i></b><span>Discover the digital edge.</span></div>
                    <div className="screen-product">
                      <div className="screen-book-back"></div><div className="screen-book"><span>SMARTPESA / 01</span><b>THE<br/><i>GROWTH</i><br/>EDIT.</b><small>PLAN · BUILD · GROW</small></div>
                      <div className="screen-disc"></div>
                    </div>
                    <div className="screen-footer"><span>CURATED DIGITAL GOODS</span><span>SCROLL TO EXPLORE ↓</span></div>
                  </div>
                </div>
                <div className="device-hinge"></div>
                <div className="device-base"><div className="device-keyboard"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><div className="device-trackpad"></div></div>
              </div>
            </div>
            <div className="stage-float float-one"><span>✦</span><b>Digital, reimagined.</b><small>Tools that move you forward</small></div>
            <div className="stage-float float-two"><span className="float-price">UGX</span><b>Smart value</b><small>Made for everyday progress</small></div>
            <div className="stage-caption"><span className="caption-dot"></span> DRAG TO EXPLORE <span className="caption-line"></span> 3D PRODUCT STUDIO</div>
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
          {catalogueError && <p className="catalogue-status" role="status">{catalogueError}</p>}
          {catalogueSource === 'live' && products.length === 0 && <p className="catalogue-status">The live catalogue is ready. Products will appear here when published.</p>}
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
          {visibleProducts.length === 0 && !(catalogueSource === 'live' && products.length === 0) && <div className="empty-state"><span>⌕</span><h3>No matches just yet</h3><p>Try another search or choose a different category.</p><button onClick={() => {setSearch('');setActiveCategory('All products');}}>Clear filters</button></div>}
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
          <div className="about-copy"><div className="eyebrow"><span className="eyebrow-dot"></span> A MARKETPLACE WITH A PURPOSE</div><h2>Make everyday<br />feel a little <em>smarter.</em></h2><p>SmartPesa Market brings useful digital products together in one place — from business and employment tools to learning resources and everyday planners. Less searching. More doing.</p><a className="text-link" href="#products">Find something useful <span>→</span></a></div>
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
