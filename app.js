// Lógica del Cliente - Sr. Waffle (Página Pública)
document.addEventListener('DOMContentLoaded', () => {
  // Check Demo Mode
  fetch('/api/demo/status').then(r=>r.json()).then(d=>{
    const banner = document.getElementById('demo-banner');
    if(banner) banner.style.display = d.isDemoMode ? 'block' : 'none';
  }).catch(e=>console.error(e));

  // --- INICIALIZACIÓN DE ESTADO ---
  let stock = [];
  let masas = [];
  let menu = [];
  let waffles = [];
  let loyaltyEnabled = false;

  // Carga stock y menú desde la API REST local
  const loadState = async () => {
    try {
      const stockRes = await fetch('/api/stock');
      const flatStock = await stockRes.json();
      stock = {
         bases: flatStock.filter(s => ['raw_material', 'packaging', 'cleaning', 'Base'].includes(s.category)),
         spreads: flatStock.filter(s => ['spread', 'Relleno'].includes(s.category)),
         toppings: flatStock.filter(s => ['topping', 'Topping'].includes(s.category)),
         syrups: flatStock.filter(s => ['syrup', 'Sirope'].includes(s.category)),
         drinks: flatStock.filter(s => ['drink', 'Bebida'].includes(s.category)),
         icecreams: flatStock.filter(s => ['icecream', 'Helado'].includes(s.category))
      };

      const menuRes = await fetch('/api/menu');
      menu = await menuRes.json();

      const masasRes = await fetch('/api/masas');
      masas = await masasRes.json();

      const wafflesRes = await fetch('/api/waffles');
      waffles = await wafflesRes.json();

      try {
        const settingsRes = await fetch('/api/loyalty/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          loyaltyEnabled = !!settingsData.loyaltyEnabled;
          const loyaltySection = document.getElementById('loyalty-client-section');
          if (loyaltySection) {
            loyaltySection.style.display = loyaltyEnabled ? 'block' : 'none';
          }
        }
      } catch (err) {
        console.warn('Error fetching loyalty settings:', err);
      }
    } catch (error) {
      console.error('Error al cargar datos de la API local:', error);
      // Fallback a data.js si no responde el servidor local
      if (window.SrWaffleData) {
        stock = window.SrWaffleData.INITIAL_STOCK;
        menu = window.SrWaffleData.INITIAL_MENU;
      }
    }
  };

  let companyInfo = {
    companyName: 'Sr. Waffle',
    companyAddress: 'Shopping Portal Patagonia, Bariloche, Río Negro (Kiosco PB)',
    companyHours: 'Lunes a Domingos: 10:00 hs a 22:00 hs',
    companyInstagram: '@srwaffle.patagonia',
    companyPhone: '5491123456789'
  };

  const loadCompanyInfo = async () => {
    try {
      const res = await fetch('/api/company/info');
      companyInfo = await res.json();
      
      const headerName = document.getElementById('header-company-name');
      const footerName = document.getElementById('footer-company-name');
      const footerAddress = document.getElementById('footer-company-address');
      const footerHours = document.getElementById('footer-company-hours');
      const footerInstagram = document.getElementById('footer-company-instagram');
      const waBtn = document.getElementById('client-send-wa-btn');
      
      if (headerName) {
        headerName.textContent = companyInfo.companyName;
        if (companyInfo.companyLogo) {
          let logoImg = document.getElementById('dynamic-header-logo');
          if (!logoImg) {
            logoImg = document.createElement('img');
            logoImg.id = 'dynamic-header-logo';
            logoImg.style.cssText = 'width:36px; height:36px; border-radius:50%; object-fit:cover; margin-right:10px;';
            headerName.parentNode.insertBefore(logoImg, headerName);
          }
          logoImg.src = companyInfo.companyLogo;
        }
      }
      if (footerName) footerName.textContent = companyInfo.companyName;
      if (footerAddress) footerAddress.textContent = companyInfo.companyAddress;
      if (footerHours) footerHours.textContent = companyInfo.companyHours;
      if (footerInstagram) footerInstagram.textContent = companyInfo.companyInstagram;
      if (waBtn) {
        waBtn.style.display = companyInfo.whatsappOrdersEnabled !== false ? 'flex' : 'none';
      }

      // Aplicar Hero Images
      const heroContainer = document.querySelector('.hero-image-container');
      if (heroContainer && companyInfo.heroImages && companyInfo.heroImages.length > 0) {
        // Limpiar imágenes previas
        const oldImages = heroContainer.querySelectorAll('.hero-image');
        oldImages.forEach(img => img.remove());
        
        companyInfo.heroImages.forEach((imgSrc, index) => {
          const img = document.createElement('img');
          img.src = imgSrc;
          img.className = 'hero-image';
          if (index > 0) img.style.opacity = '0'; // Ocultar las demás inicialmente
          if (index > 0) img.style.position = 'absolute';
          if (index > 0) img.style.top = '0';
          if (index > 0) img.style.left = '0';
          img.style.transition = 'opacity 1s ease-in-out';
          heroContainer.appendChild(img);
        });

        if (companyInfo.heroCarouselEnabled && companyInfo.heroImages.length > 1) {
          let currentHeroIdx = 0;
          setInterval(() => {
            const images = heroContainer.querySelectorAll('.hero-image');
            images[currentHeroIdx].style.opacity = '0';
            currentHeroIdx = (currentHeroIdx + 1) % images.length;
            images[currentHeroIdx].style.opacity = '1';
          }, companyInfo.heroCarouselInterval || 4000);
        }
      }

      // Aplicar Mapa
      const mapContainer = document.getElementById('client-footer-map-bg');
      const mapPin = document.getElementById('client-footer-map-pin');
      const mapTitle = document.getElementById('client-footer-map-title');
      const mapDesc = document.getElementById('client-footer-map-desc');
      if (mapContainer && companyInfo.mapBgImage) {
        mapContainer.style.backgroundImage = `url(${companyInfo.mapBgImage})`;
        mapContainer.style.backgroundSize = 'cover';
        mapContainer.style.backgroundPosition = 'center';
        
        // Ocultar texto por defecto si hay imagen
        if (mapTitle) mapTitle.style.display = 'none';
        if (mapDesc) mapDesc.style.display = 'none';

        if (mapPin) {
          mapPin.style.position = 'absolute';
          mapPin.style.left = companyInfo.mapPinX + '%';
          mapPin.style.top = companyInfo.mapPinY + '%';
          mapPin.style.transform = 'translate(-50%, -50%)';
        }
      }

    } catch (error) {
      console.error('Error al cargar datos de empresa:', error);
    }
  };

  // --- VARIABLES DE INTERFAZ CLIENTE ---
  let currentView = 'inicio';
  let clientCart = [];

  // Configuración del Waffle Personalizado del Cliente
  let clientWaffle = {
    base: 'base_tradicional',
    spread: 'none',
    toppings: [],
    whippedCream: false,
    syrups: [],
    icecreams: []
  };

  // --- ELEMENTOS DEL DOM ---
  const views = {
    inicio: document.getElementById('view-inicio'),
    menu: document.getElementById('view-menu'),
    builder: document.getElementById('view-builder')
  };

  const navLinks = document.querySelectorAll('.nav-link');
  const toast = document.getElementById('toast');

  // --- MÉTODOS DE UTILIDAD GENERAL ---
  const showToast = (message, isError = false) => {
    toast.textContent = message;
    toast.className = 'toast-notification';
    if (isError) toast.classList.add('error');
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 3000);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
  };

  const getStockItem = (id) => {
    for (const category in stock) {
      const item = stock[category].find(i => i.id === id);
      if (item) return item;
    }
    return null;
  };

  const getMasa = (id) => masas.find(m => m.id === id);

  const calculateWafflePrice = (waffleConfig) => {
    let price = 1500; // Base fija para waffles armados, igual que en POS
    if (waffleConfig.spread && waffleConfig.spread !== 'none') {
      price += getStockItem(waffleConfig.spread)?.price || 0;
    }
    if (waffleConfig.whippedCream) {
      price += getStockItem('top_crema_batida')?.price || 0;
    }
    waffleConfig.toppings.forEach(id => {
      price += getStockItem(id)?.price || 0;
    });
    waffleConfig.syrups.forEach(id => {
      price += getStockItem(id)?.price || 0;
    });
    if (waffleConfig.icecreams) {
      waffleConfig.icecreams.forEach(id => {
        price += getStockItem(id)?.price || 0;
      });
    }
    return price;
  };

  // --- SISTEMA DE NAVEGACIÓN ---
  const switchView = (viewName) => {
    currentView = viewName;
    
    // Actualizar barra de navegación
    navLinks.forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Activar sección DOM
    for (const key in views) {
      if (key === viewName) {
        views[key].classList.add('active');
      } else {
        views[key].classList.remove('active');
      }
    }

    // Inicializar o refrescar la vista específica
    if (viewName === 'menu') {
      loadState().then(() => renderClientMenu());
    }
    if (viewName === 'builder') {
      initClientBuilder();
    }
  };

  // Asignar listeners de navegación
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const view = link.getAttribute('data-view');
      switchView(view);
    });
  });

  // --- DIBUJAR EL WAFFLE DE BURBUJAS (VISUAL ENGINE) ---
  const renderWaffleVisual = (canvasContainerId, config) => {
    const wrapper = document.getElementById(canvasContainerId);
    if (!wrapper) return;

    const backElement = wrapper.querySelector('.waffle-back');
    const frontElement = wrapper.querySelector('.waffle-front');
    const toppingsContainer = wrapper.querySelector('.visual-toppings-container');
    const chocolateOverlay = wrapper.querySelector('.syrup-chocolate');
    const dulceOverlay = wrapper.querySelector('.syrup-dulce-leche');
    const caramelOverlay = wrapper.querySelector('.syrup-caramelo');
    const redOverlay = wrapper.querySelector('.syrup-rojo');
    const spreadOverlay = wrapper.querySelector('.spread-overlay');
    const whippedCreamOverlay = wrapper.querySelector('.visual-whipped-cream');

    const baseClass = `base-${config.base.replace('base_', '').replace('_', '-')}`;
    if (backElement) {
      backElement.className = 'waffle-back';
      backElement.classList.add(baseClass);
    }
    if (frontElement) {
      frontElement.className = 'waffle-front';
      frontElement.classList.add(baseClass);
    }

    if (spreadOverlay) {
      spreadOverlay.className = 'spread-overlay';
      if (config.spread) {
        const spreadItem = getStockItem(config.spread);
        if (spreadItem) {
          const name = spreadItem.name.toLowerCase();
          if (name.includes('nutella') || name.includes('choc')) {
            spreadOverlay.classList.add('active-nutella');
          } else {
            spreadOverlay.classList.add('active-dulce'); // default for any other spread
          }
        }
      }
    }

    if (chocolateOverlay) chocolateOverlay.classList.remove('active');
    if (dulceOverlay) dulceOverlay.classList.remove('active');
    if (caramelOverlay) caramelOverlay.classList.remove('active');
    if (redOverlay) redOverlay.classList.remove('active');

    config.syrups.forEach(syrupId => {
       const sItem = getStockItem(syrupId);
       if (sItem) {
         const name = sItem.name.toLowerCase();
         if (name.includes('choc') && chocolateOverlay) chocolateOverlay.classList.add('active');
         else if (name.includes('dulce') && dulceOverlay) dulceOverlay.classList.add('active');
         else if ((name.includes('rojo') || name.includes('red') || name.includes('frut')) && redOverlay) redOverlay.classList.add('active');
         else if (caramelOverlay) caramelOverlay.classList.add('active');
       }
    });

    if (whippedCreamOverlay) {
      if (config.whippedCream) whippedCreamOverlay.classList.add('active');
      else whippedCreamOverlay.classList.remove('active');
    }

    if (toppingsContainer) {
      toppingsContainer.innerHTML = '';
      
      config.toppings.forEach(toppingId => {
        const itemStock = getStockItem(toppingId);
        if (!itemStock) return;
        const name = itemStock.name.toLowerCase();

        for (let k = 0; k < 8; k++) {
          const toppingElement = document.createElement('div');
          toppingElement.className = `visual-topping-item vt-${toppingId}`;
          
          // Toppings spawn tightly over the 3 scoops to prevent floating in the air
          const x = 100 + Math.random() * 120 - 12; // 100 to 220
          const y = 60 + Math.random() * 110 - 12;  // 60 to 170

          const randomRotation = Math.floor(Math.random() * 360);
          
          toppingElement.style.left = `${x}px`;
          toppingElement.style.top = `${y}px`;
          toppingElement.style.setProperty('--rot', `${randomRotation}deg`);
          
          if (name.includes('rocklet') || name.includes('lentil') || name.includes('color')) {
            toppingElement.classList.add('topping-rocklet');
            const rockletColors = ['#e63946', '#fee440', '#00f5d4', '#ff007f', '#a020f0', '#0077b6'];
            toppingElement.style.setProperty('--rocklet-color', rockletColors[Math.floor(Math.random() * rockletColors.length)]);
          } else if (name.includes('oreo') || name.includes('gallet')) {
            toppingElement.classList.add('topping-oreo');
          } else if (name.includes('choc') || name.includes('ralladura')) {
            toppingElement.classList.add('topping-shaving');
          } else if (name.includes('frutil') || name.includes('mora') || name.includes('red') || name.includes('rojo')) {
            toppingElement.classList.add('topping-berry');
          } else {
            toppingElement.classList.add('topping-generic');
          }

          toppingsContainer.appendChild(toppingElement);
        }
      });
    }

    const icecreamsContainer = wrapper.querySelector('.visual-icecreams-container');
    if (icecreamsContainer) {
      icecreamsContainer.innerHTML = '';
      if (config.icecreams) {
        config.icecreams.forEach((iceId, index) => {
          if (!iceId) return;
          const sItem = getStockItem(iceId);
          if (!sItem) return;

          const name = sItem.name.toLowerCase();
          const scoop = document.createElement('div');
          scoop.className = `visual-icecream-scoop scoop-${index}`;
          
          if (name.includes('vainilla') || name.includes('crema') || name.includes('blanco')) {
            scoop.style.backgroundColor = '#f3e5ab';
            scoop.style.borderColor = '#d4c58a';
          } else if (name.includes('choc')) {
            scoop.style.backgroundColor = '#4e342e';
            scoop.style.borderColor = '#3e2723';
          } else if (name.includes('dulce') || name.includes('caramel')) {
            scoop.style.backgroundColor = '#d2691e';
            scoop.style.borderColor = '#b87333';
          } else if (name.includes('frutil') || name.includes('red') || name.includes('rojo') || name.includes('cereza') || name.includes('rosa')) {
            scoop.style.backgroundColor = '#f1b6c8';
            scoop.style.borderColor = '#e294aa';
          } else {
            // Generico / Default (Rosa por defecto o un color mixto)
            scoop.style.backgroundColor = '#e8d5f0'; // lila suave
            scoop.style.borderColor = '#cba3d8';
          }
          icecreamsContainer.appendChild(scoop);
        });
      }
    }
  };

  // --- CLIENT SIDE: LANDING / INICIO ---
  document.getElementById('cta-ver-menu').addEventListener('click', () => switchView('menu'));
  document.getElementById('cta-armar-waffle').addEventListener('click', () => switchView('builder'));

  // --- CLIENT SIDE: MOSTRAR MENÚ DIGITAL ---
  const renderClientMenu = () => {
    const menuGrid = document.getElementById('client-menu-grid');
    const drinksGrid = document.getElementById('client-drinks-grid');
    if (!menuGrid) return;

    menuGrid.innerHTML = '';
    if (drinksGrid) drinksGrid.innerHTML = '';

    const phone = companyInfo.phone || '';
    const canOrder = companyInfo.whatsappOrdersEnabled !== false && phone !== '';

    menu.forEach(item => {
      if (item.isVisible === false) return; // Skip hidden items

      const card = document.createElement('div');
      card.className = 'menu-card';
      
      let tagsHtml = '';
      let descHtml = `<p class="menu-card-desc">${item.description || ''}</p>`;
      let categoryForWa = '';
      
      if (item.type === 'direct') {
        const linkedStock = getStockItem(item.stockId);
        categoryForWa = 'Bebida / Adicional';
        // tagsHtml = `<span class="menu-tag" style="border-color: rgba(0, 245, 212, 0.3); color: var(--neon-cyan);">Bebida</span>`;
      } else {
        const baseObj = getStockItem(item.base);
        const toppingsText = (item.toppings || []).map(t => getStockItem(t)?.name || '').filter(t => t !== '').join(', ');
        const syrupsText = (item.syrups || []).map(s => getStockItem(s)?.name || '').filter(s => s !== '').join(', ');
        
        const tags = [];
        if (baseObj) tags.push(baseObj.name);
        if (syrupsText) tags.push(`Salsa: ${syrupsText}`);

        tagsHtml = tags.map(t => `<span class="menu-tag">${t}</span>`).join('') +
                   (item.toppings || []).map(t => `<span class="menu-tag" style="border-color: rgba(255, 0, 127, 0.2); color: var(--neon-pink);">${getStockItem(t)?.name}</span>`).join('');
        categoryForWa = 'Waffle de Carta';
      }

      const priceHtml = item.showPrice !== false ? `<span class="menu-card-price">${formatCurrency(item.price)}</span>` : '';
      
      // Botón de Agregar al Carrito individual
      let waButtonHtml = `
          <button class="menu-wa-btn" data-id="${item.id}" style="width:100%; margin-top:1rem; background: rgba(157, 78, 221, 0.1); color: var(--neon-purple); border: 1px solid var(--neon-purple); border-radius: 8px; padding: 8px; font-weight: 700; cursor: pointer; transition: 0.3s; display:flex; align-items:center; justify-content:center; gap:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Agregar al Carrito
          </button>
        `;

      card.innerHTML = `
        ${item.image ? `<img src="${item.image}" alt="${item.name}" class="menu-card-img">` : `<div class="menu-card-img" style="display:flex;align-items:center;justify-content:center;background:#1a1a1a;color:#555;">Sin Imagen</div>`}
        <div class="menu-card-body" style="display:flex; flex-direction:column; flex:1;">
          <div class="menu-card-title">
            <span>${item.name}</span>
            ${priceHtml}
          </div>
          ${descHtml}
          ${tagsHtml ? `<div class="menu-card-tags">${tagsHtml}</div>` : ''}
          <div style="margin-top:auto;">${waButtonHtml}</div>
        </div>
      `;

      if (item.type === 'direct' && drinksGrid) {
        drinksGrid.appendChild(card);
      } else {
        menuGrid.appendChild(card);
      }
    });

    // Añadir eventos a los botones de Agregar al Carrito
    document.querySelectorAll('.menu-wa-btn').forEach(btn => {
        // Efecto hover
        btn.addEventListener('mouseenter', () => {
          btn.style.background = 'var(--neon-purple)';
          btn.style.color = '#fff';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = 'rgba(157, 78, 221, 0.1)';
          btn.style.color = 'var(--neon-purple)';
        });

        // Click para agregar al carrito
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const item = menu.find(m => m.id === id);
          if (item) {
            const price = item.price || 0;
            const details = item.type === 'direct' ? 'Bebida/Adicional' : 'De Carta';
            
            let config = null;
            if (item.type === 'menu_waffle') {
              config = waffles.find(w => w.id === item.reference_id) || null;
            }

            addToClientCart({
              id: item.id + '_' + Date.now(),
              name: item.name,
              details: details,
              price: price,
              type: item.type === 'direct' ? 'drink' : 'menu_waffle',
              config: config
            });
          }
        });
      });
  };

  // --- CLIENT SIDE: ARMADOR INTERACTIVO (CUSTOM BUILDER) ---
  const initClientBuilder = async () => {
    // Escuchar cambios de stock antes de renderizar
    await loadState();

    clientWaffle = {
      base: 'base_tradicional',
      spread: 'none',
      toppings: [],
      whippedCream: false,
      syrups: [],
      icecreams: []
    };

    // Registrar eventos del buscador de puntos del Club Waffle
    const queryBtn = document.getElementById('loyalty-client-query-btn');
    const clientPhoneInput = document.getElementById('loyalty-client-phone');
    const clientResultDiv = document.getElementById('loyalty-client-result');
    const clientNameSpan = document.getElementById('loyalty-client-name');
    const clientPointsSpan = document.getElementById('loyalty-client-points');

    if (queryBtn && clientPhoneInput) {
      queryBtn.onclick = async (e) => {
        if (e) e.preventDefault();
        const phone = clientPhoneInput.value.trim();
        if (!phone) {
          showToast('Por favor, ingresá tu número de teléfono', true);
          return;
        }
        try {
          const res = await fetch(`/api/loyalty/customer/${phone}`);
          if (res.ok) {
            const customer = await res.json();
            if (clientNameSpan) clientNameSpan.textContent = customer.name;
            if (clientPointsSpan) clientPointsSpan.textContent = customer.points;
            if (clientResultDiv) clientResultDiv.style.display = 'block';
          } else if (res.status === 404) {
            showToast('No tenés puntos acumulados aún. ¡Registrate al comprar en caja!', true);
            if (clientResultDiv) clientResultDiv.style.display = 'none';
          } else {
            showToast('Error al consultar puntos', true);
          }
        } catch (err) {
          console.error(err);
          showToast('Error de conexión', true);
        }
      };
    }

    const basesSelect = document.getElementById('client-bases-select');
    if (basesSelect) {
      basesSelect.innerHTML = `<option value="">-- Seleccionar Masa --</option>` + 
        (masas || []).map(b => `<option value="${b.id}" ${b.stock <= 0 ? 'disabled style="color:gray;"' : ''}>${b.name} (${b.price_per_portion > 0 ? '+'+formatCurrency(b.price_per_portion) : 'Incluido'})${b.stock <= 0 ? ' [SIN STOCK]' : ''}</option>`).join('');
      
      basesSelect.onchange = () => {
        clientWaffle.base = basesSelect.value;
        updateClientBuilderUI();
      };
    }

    const spreadsSelect = document.getElementById('client-spreads-select');
    if (spreadsSelect) {
      spreadsSelect.innerHTML = `<option value="none">Sin Relleno</option>` + 
        (stock.spreads || []).map(b => `<option value="${b.id}" ${b.stock <= 0 ? 'disabled style="color:gray;"' : ''}>${b.name} (${b.price_per_portion > 0 ? '+'+formatCurrency(b.price_per_portion) : 'Gratis'})${b.stock <= 0 ? ' [SIN STOCK]' : ''}</option>`).join('');
      
      spreadsSelect.onchange = () => {
        clientWaffle.spread = spreadsSelect.value === 'none' ? '' : spreadsSelect.value;
        updateClientBuilderUI();
      };
    }

    const whippedCreamCheck = document.getElementById('client-whipped-cream-check');
    if (whippedCreamCheck) {
      whippedCreamCheck.checked = false;
      whippedCreamCheck.onchange = (e) => {
        clientWaffle.whippedCream = e.target.checked;
        updateClientBuilderUI();
      };
    }

    renderBuilderOptions('client-toppings-options', 'toppings', 'checkbox', (toppingId, checked) => {
      if (checked) {
        if (clientWaffle.toppings.length >= 4) {
          showToast('Máximo 4 toppings por waffle', true);
          return false;
        }
        clientWaffle.toppings.push(toppingId);
      } else {
        clientWaffle.toppings = clientWaffle.toppings.filter(id => id !== toppingId);
      }
      updateClientBuilderUI();
      return true;
    });

    renderBuilderOptions('client-syrups-options', 'syrups', 'checkbox', (syrupId, checked) => {
      if (checked) {
        if (clientWaffle.syrups.length >= 2) {
          showToast('Máximo 2 salsas por waffle', true);
          return false;
        }
        clientWaffle.syrups.push(syrupId);
      } else {
        clientWaffle.syrups = clientWaffle.syrups.filter(id => id !== syrupId);
      }
      updateClientBuilderUI();
      return true;
    });

    // Control del Selector de Helados y Sabores
    const icecreamCountSelect = document.getElementById('client-icecream-count');
    const flavorSelectorsContainer = document.getElementById('client-icecreams-flavor-selectors');

    const updateFlavorSelectors = () => {
      const count = parseInt(icecreamCountSelect.value) || 0;
      flavorSelectorsContainer.innerHTML = '';
      
      while (clientWaffle.icecreams.length < count) {
        const firstAvailable = stock.icecreams.find(i => i.stock > 0);
        clientWaffle.icecreams.push(firstAvailable ? firstAvailable.id : '');
      }
      while (clientWaffle.icecreams.length > count) {
        clientWaffle.icecreams.pop();
      }

      for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.gap = '4px';
        div.innerHTML = `
          <label style="font-size:0.75rem; color:var(--text-secondary);">Sabor de la Bocha ${i + 1}</label>
          <select class="client-icecream-flavor-select form-control" data-index="${i}" style="background:#181818; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:0.5rem; border-radius:6px; font-size:0.85rem; width:100%; font-family:var(--font-sans);">
            ${stock.icecreams.map(ice => {
              const isOutOfStock = ice.stock <= 0;
              return `<option value="${ice.id}" ${clientWaffle.icecreams[i] === ice.id ? 'selected' : ''} ${isOutOfStock ? 'disabled style="color:gray;"' : ''}>
                ${ice.name} (${formatCurrency(ice.price)})${isOutOfStock ? ' [SIN STOCK]' : ''}
              </option>`;
            }).join('')}
          </select>
        `;
        flavorSelectorsContainer.appendChild(div);
      }

      flavorSelectorsContainer.querySelectorAll('.client-icecream-flavor-select').forEach(select => {
        select.onchange = () => {
          const index = parseInt(select.getAttribute('data-index'));
          clientWaffle.icecreams[index] = select.value;
          updateClientBuilderUI();
        };
      });
    };

    if (icecreamCountSelect) {
      icecreamCountSelect.value = "0";
      icecreamCountSelect.onchange = () => {
        updateFlavorSelectors();
        updateClientBuilderUI();
      };
      updateFlavorSelectors();
    }

    // Botón de enviar WhatsApp con validación de stock asíncrona
    const waBtn = document.getElementById('client-send-wa-btn');
    if (waBtn) {
      waBtn.onclick = async () => {
        // Refrescar stock consultando la API antes de mandar el WhatsApp
        await loadState();
        
        let stockOk = true;
        let outOfStockName = '';
        
        const baseItem = getStockItem(clientWaffle.base);
        if (!baseItem || baseItem.stock <= 0) {
          stockOk = false;
          outOfStockName = baseItem ? baseItem.name : 'Masa';
        }

        if (clientWaffle.spread && clientWaffle.spread !== 'none') {
          const spreadItem = getStockItem(clientWaffle.spread);
          if (!spreadItem || spreadItem.stock <= 0) {
            stockOk = false;
            outOfStockName = spreadItem ? spreadItem.name : 'Relleno';
          }
        }
        
        clientWaffle.toppings.forEach(tId => {
          const top = getStockItem(tId);
          if (!top || top.stock <= 0) {
            stockOk = false;
            outOfStockName = top ? top.name : 'Topping';
          }
        });

        if (clientWaffle.whippedCream) {
          const creamItem = getStockItem('top_crema_batida');
          if (!creamItem || creamItem.stock <= 0) {
            stockOk = false;
            outOfStockName = creamItem ? creamItem.name : 'Crema Batida';
          }
        }

        clientWaffle.icecreams.forEach(iId => {
          const ice = getStockItem(iId);
          if (!ice || ice.stock <= 0) {
            stockOk = false;
            outOfStockName = ice ? ice.name : 'Helado';
          }
        });

        if (!stockOk) {
          showToast(`Lo sentimos, nos quedamos sin stock de: ${outOfStockName}. Elegí otra opción.`, true);
          initClientBuilder(); // Re-renderizar opciones con stock actualizado
          return;
        }

        const baseName = getStockItem(clientWaffle.base)?.name || '';
        const spreadName = clientWaffle.spread && clientWaffle.spread !== 'none' ? getStockItem(clientWaffle.spread)?.name : 'Sin relleno';
        const whippedCreamText = clientWaffle.whippedCream ? 'Con Crema Batida' : 'Sin crema batida';
        const toppingsName = clientWaffle.toppings.map(id => getStockItem(id)?.name).join(', ') || 'Sin toppings';
        const syrupsName = clientWaffle.syrups.map(id => getStockItem(id)?.name).join(', ') || 'Sin salsas';
        const icecreamsName = clientWaffle.icecreams.map(id => getStockItem(id)?.name).join(', ') || 'Sin helado';
        const totalPrice = calculateWafflePrice(clientWaffle);

        const waMessage = `¡Hola! 👋 Quisiera encargar un *Sr. Waffle Armado a Gusto* 🧇\n\n` + 
                          `*Masa Base:* ${baseName}\n` + 
                          `*Relleno:* ${spreadName}\n` + 
                          `*Helado:* ${icecreamsName}\n` +
                          `*Toppings:* ${toppingsName}\n` + 
                          `*Crema Batida:* ${whippedCreamText}\n` + 
                          `*Salsas:* ${syrupsName}\n\n` +
                          `*Total:* ${formatCurrency(totalPrice)}\n` +
                          `¿Me confirman para retirar por el local? ¡Gracias!`;

        const waUrl = `https://wa.me/${companyInfo.companyPhone}?text=${encodeURIComponent(waMessage)}`;
        window.open(waUrl, '_blank');
      };
    }

    const addCartBtn = document.getElementById('client-add-to-cart-btn');
    if (addCartBtn) {
      addCartBtn.onclick = async () => {
        await loadState();
        let stockOk = true;
        let outOfStockName = '';
        
        const baseItem = getMasa(clientWaffle.base);
        if (!baseItem || baseItem.stock <= 0) { stockOk = false; outOfStockName = baseItem ? baseItem.name : 'Masa'; }
        if (clientWaffle.spread && clientWaffle.spread !== 'none') {
          const spreadItem = getStockItem(clientWaffle.spread);
          if (!spreadItem || spreadItem.stock <= 0) { stockOk = false; outOfStockName = spreadItem ? spreadItem.name : 'Relleno'; }
        }
        clientWaffle.toppings.forEach(tId => {
          const top = getStockItem(tId);
          if (!top || top.stock <= 0) { stockOk = false; outOfStockName = top ? top.name : 'Topping'; }
        });
        if (clientWaffle.whippedCream) {
          const creamItem = getStockItem('top_crema_batida');
          if (!creamItem || creamItem.stock <= 0) { stockOk = false; outOfStockName = creamItem ? creamItem.name : 'Crema Batida'; }
        }
        clientWaffle.icecreams.forEach(iId => {
          const ice = getStockItem(iId);
          if (!ice || ice.stock <= 0) { stockOk = false; outOfStockName = ice ? ice.name : 'Helado'; }
        });

        if (!stockOk) {
          showToast(`Lo sentimos, nos quedamos sin stock de: ${outOfStockName}. Elegí otra opción.`, true);
          initClientBuilder();
          return;
        }

        const price = calculateWafflePrice(clientWaffle);
        const m = getMasa(clientWaffle.base);
        let details = `Masa: ${m ? m.name : 'N/A'}`;
        if (clientWaffle.spread && clientWaffle.spread !== 'none') details += ` + Relleno: ${getStockItem(clientWaffle.spread)?.name || 'N/A'}`;
        if (clientWaffle.icecreams.length) details += ` + Helado: ${clientWaffle.icecreams.map(id=>getStockItem(id)?.name).join(',')}`;
        if (clientWaffle.toppings.length) details += ` + Toppings: ${clientWaffle.toppings.map(id=>getStockItem(id)?.name).join(',')}`;
        if (clientWaffle.whippedCream) details += ` + Crema`;
        if (clientWaffle.syrups.length) details += ` + Salsas: ${clientWaffle.syrups.map(id=>getStockItem(id)?.name).join(',')}`;
        
        addToClientCart({
          id: `custom_${Date.now()}`,
          name: 'Waffle Armado',
          details,
          price,
          type: 'custom_waffle',
          config: JSON.parse(JSON.stringify(clientWaffle))
        });
        
        // Reset builder visual but keep them on page or show cart
        clientWaffle = {
          base: 'base_tradicional',
          spread: 'none',
          toppings: [],
          whippedCream: false,
          syrups: [],
          icecreams: []
        };
        initClientBuilder(); // re-init
      };
    }

    updateClientBuilderUI();
  };

  const updateClientBuilderUI = () => {
    renderWaffleVisual('client-waffle-canvas-wrapper', clientWaffle);
    const totalPrice = calculateWafflePrice(clientWaffle);
    const priceValueEl = document.getElementById('client-waffle-price-value');
    if (priceValueEl) {
      priceValueEl.textContent = formatCurrency(totalPrice);
    }
  };

  const renderBuilderOptions = (containerId, category, selectionType, callback) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    let items = stock[category] ? [...stock[category]] : [];

    if (category === 'spreads') {
      if (containerId === 'client-spreads-options') {
        items.unshift({
          id: 'none',
          name: 'Sin Relleno',
          price: 0,
          stock: 9999
        });
      }
    } else if (category === 'toppings') {
      if (containerId === 'client-toppings-options') {
        items = items.filter(item => item.id !== 'top_crema_batida');
      } else if (containerId === 'client-whipped-cream-options') {
        items = items.filter(item => item.id === 'top_crema_batida');
        items.unshift({
          id: 'none',
          name: 'Sin Crema',
          price: 0,
          stock: 9999
        });
      }
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'option-card';
      
      const isOutOfStock = item.stock <= 0;
      if (isOutOfStock) card.classList.add('out-of-stock');
      
      card.innerHTML = `
        <div class="option-name">${item.name}</div>
        <div class="option-price">${item.price > 0 ? '+ ' + formatCurrency(item.price) : 'Gratis'}</div>
        <div class="option-stock-warn">Sin Stock</div>
      `;

      if (!isOutOfStock) {
        card.addEventListener('click', () => {
          if (selectionType === 'radio') {
            container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            callback(item.id);
          } else {
            const isSelected = card.classList.contains('selected');
            if (!isSelected) {
              const success = callback(item.id, true);
              if (success !== false) card.classList.add('selected');
            } else {
              callback(item.id, false);
              card.classList.remove('selected');
            }
          }
        });
        
        let isSelected = false;
        if (selectionType === 'radio') {
          if (containerId === 'client-bases-options' && item.id === clientWaffle.base) isSelected = true;
          if (containerId === 'client-spreads-options' && item.id === clientWaffle.spread) isSelected = true;
          if (containerId === 'client-whipped-cream-options') {
            if (clientWaffle.whippedCream && item.id === 'top_crema_batida') isSelected = true;
            if (!clientWaffle.whippedCream && item.id === 'none') isSelected = true;
          }
        }
        if (isSelected) {
          card.classList.add('selected');
        }
      }

      container.appendChild(card);
    });
  };

  // --- ARRANQUE DE LA APP ---
  loadState().then(() => {
    loadCompanyInfo();
    switchView('inicio');
  });
  // --- TRACKING EN VIVO ---
  const trackerBtn = document.getElementById('tracker-btn');
  const trackerModal = document.getElementById('tracker-modal');
  const trackerClose = document.getElementById('tracker-modal-close');
  const trackerSearchBtn = document.getElementById('tracker-search-btn');
  const trackerInput = document.getElementById('tracker-input');
  const trackerResult = document.getElementById('tracker-result');
  const trackerMessage = document.getElementById('tracker-message');

  const stepPending = document.getElementById('step-pending');
  const stepPreparing = document.getElementById('step-preparing');
  const stepReady = document.getElementById('step-ready');
  const lineFill = document.getElementById('tracker-line-fill');

  if (trackerBtn && trackerModal) {
    trackerBtn.onclick = () => {
      trackerModal.style.display = 'flex';
      trackerInput.value = '';
      trackerResult.style.display = 'none';
    };
    trackerClose.onclick = () => trackerModal.style.display = 'none';
    trackerModal.onclick = (e) => {
      if (e.target === trackerModal) trackerModal.style.display = 'none';
    };

    trackerSearchBtn.onclick = async () => {
      const ticket = trackerInput.value.trim();
      if (ticket.length !== 4) {
        alert('Por favor, ingresá los 4 dígitos de tu ticket.');
        return;
      }
      
      trackerSearchBtn.innerText = 'Buscando...';
      try {
        const res = await fetch(`/api/tracking/${ticket}`);
        if (!res.ok) {
          trackerResult.style.display = 'block';
          trackerMessage.innerText = 'Ticket no encontrado o ya entregado.';
          trackerMessage.style.color = '#ff4d4d';
          lineFill.style.width = '0%';
          [stepPending, stepPreparing, stepReady].forEach(step => {
            step.querySelector('.step-circle').style.background = '#333';
            step.querySelector('.step-circle').style.borderColor = '#555';
          });
        } else {
          const data = await res.json();
          trackerResult.style.display = 'block';
          trackerMessage.style.color = 'white';
          
          // Reset
          [stepPending, stepPreparing, stepReady].forEach(step => {
            step.querySelector('.step-circle').style.background = '#333';
            step.querySelector('.step-circle').style.borderColor = '#555';
          });

          const setActive = (step) => {
            step.querySelector('.step-circle').style.background = 'var(--neon-cyan)';
            step.querySelector('.step-circle').style.borderColor = 'white';
            step.querySelector('.step-circle').style.boxShadow = '0 0 15px var(--neon-cyan-glow)';
          };

          if (data.kdsStatus === 'pending') {
            trackerMessage.innerText = '¡Pedido recibido! Pronto comenzaremos a prepararlo.';
            lineFill.style.width = '0%';
            setActive(stepPending);
          } else if (data.kdsStatus === 'preparing') {
            trackerMessage.innerText = '¡Tus waffles están en el horno! Huele delicioso...';
            lineFill.style.width = '40%';
            setActive(stepPending);
            setActive(stepPreparing);
          } else if (data.kdsStatus === 'ready') {
            trackerMessage.innerText = '¡Listos! Acercate al mostrador para retirarlos.';
            lineFill.style.width = '80%';
            setActive(stepPending);
            setActive(stepPreparing);
            setActive(stepReady);
          } else if (data.kdsStatus === 'delivered') {
            trackerMessage.innerText = '¡Pedido entregado! Gracias por elegir Sr. Waffle.';
            lineFill.style.width = '100%';
            setActive(stepPending);
            setActive(stepPreparing);
            setActive(stepReady);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        trackerSearchBtn.innerText = 'Buscar';
      }
    };
  }

  // --- RESEÑAS ---
  const reviewBtn = document.getElementById('review-btn');
  const reviewModal = document.getElementById('review-modal');
  const reviewClose = document.getElementById('review-modal-close');
  const reviewSubmitBtn = document.getElementById('review-submit-btn');
  const reviewTicketInput = document.getElementById('review-ticket-input');
  const reviewCommentInput = document.getElementById('review-comment-input');
  const reviewRatingBtns = document.querySelectorAll('.review-rating-btn');
  const reviewMessage = document.getElementById('review-message');
  
  let selectedRating = null;

  if (reviewBtn && reviewModal) {
    reviewBtn.onclick = () => {
      reviewModal.style.display = 'flex';
      reviewTicketInput.value = '';
      reviewCommentInput.value = '';
      selectedRating = null;
      reviewMessage.style.display = 'none';
      reviewRatingBtns.forEach(btn => btn.style.borderColor = 'transparent');
    };

    reviewClose.onclick = () => reviewModal.style.display = 'none';
    reviewModal.onclick = (e) => {
      if (e.target === reviewModal) reviewModal.style.display = 'none';
    };

    reviewRatingBtns.forEach(btn => {
      btn.onclick = () => {
        reviewRatingBtns.forEach(b => b.style.borderColor = 'transparent');
        btn.style.borderColor = '#FFD700';
        selectedRating = btn.getAttribute('data-rating');
      };
    });

    reviewSubmitBtn.onclick = async () => {
      const ticket = reviewTicketInput.value.trim();
      const comment = reviewCommentInput.value.trim();

      if (ticket.length !== 4) {
        alert('Por favor, ingresá los 4 dígitos de tu ticket.');
        return;
      }
      if (!selectedRating) {
        alert('Por favor, seleccioná una calificación (👍 o 👎).');
        return;
      }

      reviewSubmitBtn.innerText = 'Enviando...';
      reviewSubmitBtn.disabled = true;

      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sale_id: ticket, rating: selectedRating, comment })
        });
        const data = await res.json();
        
        if (!res.ok) {
          reviewMessage.innerText = data.error || 'Error al enviar la reseña.';
          reviewMessage.style.color = '#ff4d4d';
          reviewMessage.style.display = 'block';
        } else {
          reviewMessage.innerText = '¡Gracias por tu reseña! 💛';
          reviewMessage.style.color = '#00ff00';
          reviewMessage.style.display = 'block';
          setTimeout(() => {
            reviewModal.style.display = 'none';
          }, 2000);
        }
      } catch (err) {
        console.error(err);
        reviewMessage.innerText = 'Error de conexión.';
        reviewMessage.style.color = '#ff4d4d';
        reviewMessage.style.display = 'block';
      } finally {
        reviewSubmitBtn.innerText = 'Enviar Reseña';
        reviewSubmitBtn.disabled = false;
      }
    };
  }

  // --- MODO SORPRESA ---
  const surpriseBtn = document.getElementById('btn-surprise-me');
  if (surpriseBtn) {
    surpriseBtn.onclick = () => {
      // Evitar doble click
      surpriseBtn.disabled = true;
      surpriseBtn.innerText = 'Mezclando... 🎰';

      const bases = stock.bases || [];
      const toppings = stock.toppings || [];
      const syrups = stock.syrups || [];
      const icecreams = stock.icecreams || [];

      if (!bases.length) {
        surpriseBtn.disabled = false;
        surpriseBtn.innerText = '¡Sorpréndeme! 🎲';
        return;
      }

      let shuffles = 0;
      const maxShuffles = 15;
      const interval = setInterval(() => {
        // Seleccion aleatoria
        waffleState.base = bases[Math.floor(Math.random() * bases.length)].id;
        
        waffleState.toppings = [];
        if (toppings.length > 0) {
          const t1 = toppings[Math.floor(Math.random() * toppings.length)].id;
          waffleState.toppings.push(t1);
          if (toppings.length > 1 && Math.random() > 0.5) {
            let t2 = toppings[Math.floor(Math.random() * toppings.length)].id;
            if (t2 !== t1) waffleState.toppings.push(t2);
          }
        }

        waffleState.syrups = [];
        if (syrups.length > 0 && Math.random() > 0.3) {
          waffleState.syrups.push(syrups[Math.floor(Math.random() * syrups.length)].id);
        }

        waffleState.icecreams = [];
        if (icecreams.length > 0 && Math.random() > 0.4) {
          waffleState.icecreams.push(icecreams[Math.floor(Math.random() * icecreams.length)].id);
        }

        waffleState.whippedCream = Math.random() > 0.5;

        // Renderizado rapido
        renderClientWaffle();
        renderBuilderCategories();
        
        shuffles++;
        if (shuffles >= maxShuffles) {
          clearInterval(interval);
          surpriseBtn.disabled = false;
          surpriseBtn.innerText = '¡Sorpréndeme! 🎲';
          
          // Animar el lienzo como celebración
          const canvas = document.getElementById('client-waffle-canvas-wrapper');
          if (canvas) {
            canvas.style.transform = 'scale(1.05)';
            setTimeout(() => canvas.style.transform = 'scale(1)', 300);
          }
        }
      }, 100); // 100ms per shuffle
    };
  }

  // --- CONTROL DEL MODAL DE AYUDA CLIENTE ---
  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpClose = document.getElementById('help-modal-close');

  if (helpBtn && helpModal && helpClose) {
    helpBtn.onclick = () => helpModal.style.display = 'flex';
    helpClose.onclick = () => helpModal.style.display = 'none';
    helpModal.onclick = (e) => {
    };
  }

  // --- LÓGICA DEL CARRITO DE COMPRAS CLIENTE ---
  const floatingCartBtn = document.getElementById('floating-cart-btn');
  const cartModal = document.getElementById('client-cart-modal');
  const cartCloseBtn = document.getElementById('client-cart-close');
  const floatingCartCount = document.getElementById('floating-cart-count');
  
  if (floatingCartBtn && cartModal) {
    floatingCartBtn.onclick = () => {
      renderClientCart();
      cartModal.style.display = 'flex';
    };
    cartCloseBtn.onclick = () => cartModal.style.display = 'none';
    cartModal.onclick = (e) => {
      if (e.target === cartModal) cartModal.style.display = 'none';
    };
  }

  window.addToClientCart = (item) => {
    clientCart.push(item);
    showToast(`${item.name} agregado al carrito`);
    if (floatingCartCount) {
      floatingCartCount.textContent = clientCart.length;
      floatingCartBtn.style.transform = 'scale(1.2)';
      setTimeout(() => floatingCartBtn.style.transform = 'scale(1)', 200);
    }
  };

  const removeFromClientCart = (index) => {
    clientCart.splice(index, 1);
    if (floatingCartCount) {
      floatingCartCount.textContent = clientCart.length;
    }
    renderClientCart();
  };

  const renderClientCart = () => {
    const itemsContainer = document.getElementById('client-cart-items');
    const totalEl = document.getElementById('client-cart-total');
    const waBtn = document.getElementById('client-cart-wa-btn');
    const kioskBtn = document.getElementById('client-cart-kiosk-btn');
    
    if (!itemsContainer) return;
    itemsContainer.innerHTML = '';
    
    if (waBtn) {
      waBtn.style.display = companyInfo.whatsappOrdersEnabled !== false ? 'flex' : 'none';
    }

    if (clientCart.length === 0) {
      itemsContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); margin-top: 50px;">El carrito está vacío</div>';
      totalEl.textContent = '$0';
      if (waBtn) waBtn.disabled = true;
      kioskBtn.disabled = true;
      return;
    }

    if (waBtn) waBtn.disabled = false;
    kioskBtn.disabled = false;
    
    let total = 0;
    clientCart.forEach((item, index) => {
      total += item.price;
      const el = document.createElement('div');
      el.style.display = 'flex';
      el.style.justifyContent = 'space-between';
      el.style.alignItems = 'center';
      el.style.padding = '10px';
      el.style.background = 'rgba(255,255,255,0.05)';
      el.style.borderRadius = '8px';
      
      el.innerHTML = `
        <div style="flex: 1; padding-right: 10px;">
          <div style="color: #fff; font-weight: bold; font-size: 0.9rem;">${item.name}</div>
          <div style="color: var(--text-secondary); font-size: 0.75rem;">${item.details || ''}</div>
          <div style="color: var(--neon-cyan); font-size: 0.85rem; margin-top: 4px;">${formatCurrency(item.price)}</div>
        </div>
        <button class="remove-cart-item" data-index="${index}" style="background: none; border: none; color: var(--neon-red); cursor: pointer; padding: 5px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      `;
      itemsContainer.appendChild(el);
    });

    totalEl.textContent = formatCurrency(total);
    
    // Bind remove buttons
    itemsContainer.querySelectorAll('.remove-cart-item').forEach(btn => {
      btn.onclick = () => removeFromClientCart(parseInt(btn.getAttribute('data-index')));
    });

    // --- CHECKOUT WHATSAPP ---
    waBtn.onclick = () => {
      let msg = `¡Hola! 👋 Quisiera encargar:\n\n`;
      clientCart.forEach(item => {
        msg += `* ${item.name} - ${formatCurrency(item.price)}\n`;
        if (item.details && item.details !== 'De Carta' && item.details !== 'Bebida/Adicional') {
          msg += `   _${item.details}_\n`;
        }
      });
      msg += `\n*Total:* ${formatCurrency(total)}\n\n¿Me confirmás si tienen stock y la demora?`;
      
      const phone = companyInfo.phone || '';
      if (phone) {
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      } else {
        showToast('WhatsApp no configurado', true);
      }
    };

    // --- CHECKOUT KIOSCO ---
    kioskBtn.onclick = async () => {
      kioskBtn.innerText = 'Enviando...';
      kioskBtn.disabled = true;

      try {
        const res = await fetch('/api/kiosk-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart: clientCart })
        });
        const data = await res.json();
        
        if (res.ok) {
          cartModal.style.display = 'none';
          // Limpiar carrito
          clientCart = [];
          if (floatingCartCount) floatingCartCount.textContent = '0';
          
          // Mostrar modal de ticket
          const kioskCodeDisplay = document.getElementById('kiosk-ticket-code');
          const kioskTicketModal = document.getElementById('kiosk-ticket-modal');
          if (kioskCodeDisplay && kioskTicketModal) {
            kioskCodeDisplay.innerText = data.id;
            kioskTicketModal.style.display = 'flex';
            const closeBtn = document.getElementById('kiosk-modal-close');
            if (closeBtn) {
              closeBtn.onclick = () => window.location.reload();
            }
          }
        } else {
          showToast('Error al generar pedido', true);
        }
      } catch (e) {
        showToast('Error de conexión', true);
      } finally {
        kioskBtn.innerHTML = 'Confirmar Pedido (Pagar en Caja) 🛍️';
        kioskBtn.disabled = false;
      }
    };
  };

});
