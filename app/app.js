document.addEventListener('DOMContentLoaded', () => {
  // Check Demo Mode
  fetch('/api/demo/status').then(r=>r.json()).then(d=>{
    const banner = document.getElementById('demo-banner');
    if(banner) banner.style.display = d.isDemoMode ? 'block' : 'none';
  }).catch(e=>console.error(e));

  // --- NAVEGACIÓN ---
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('data-target');
      
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      views.forEach(v => {
        v.classList.remove('active');
        if (v.id === targetId) v.classList.add('active');
      });
    });
  });

  // --- MENU ---
  const loadMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const menu = await res.json();
      
      const menuFilter = document.getElementById('menu-filter');
      const dynamicCategories = document.getElementById('dynamic-menu-categories');
      
      if (!menuFilter || !dynamicCategories) return;

      menuFilter.innerHTML = '<button class="filter-btn active" data-filter="all">Todos</button>';
      dynamicCategories.innerHTML = '';

      const typeNames = {
        'waffle': 'Waffles Especiales',
        'menu_waffle': 'Waffles Especiales',
        'direct': 'Bebidas y Adicionales',
        'drink': 'Bebidas'
      };

      // Group by type
      const groups = {};
      menu.forEach(item => {
        if (!item.is_visible) return;
        const type = item.type || 'otros';
        if (!groups[type]) groups[type] = [];
        groups[type].push(item);
      });

      Object.keys(groups).forEach(type => {
        const catName = typeNames[type] || (type.charAt(0).toUpperCase() + type.slice(1));
        
        // Add Filter Button
        menuFilter.insertAdjacentHTML('beforeend', `<button class="filter-btn" data-filter="${type}">${catName}</button>`);
        
        // Add Category Block
        let listHtml = '';
        groups[type].forEach(item => {
          listHtml += `
            <div class="menu-item">
              ${item.image ? `<img src="/${item.image}" alt="${item.name}">` : `<div style="width:90px;height:90px;background:#333;display:flex;align-items:center;justify-content:center;font-size:0.8rem;color:#777;">Sin Imagen</div>`}
              <div class="menu-item-info">
                <div class="menu-item-title">${item.name}</div>
                <div class="menu-item-price">$${item.price.toLocaleString()}</div>
              </div>
            </div>
          `;
        });

        dynamicCategories.insertAdjacentHTML('beforeend', `
          <div class="menu-category dynamic-cat" data-type="${type}">
            <h3>${catName}</h3>
            <div class="menu-list">${listHtml}</div>
          </div>
        `);
      });

      // Filter Logic
      const filterBtns = document.querySelectorAll('.filter-btn');
      const allCats = document.querySelectorAll('.dynamic-cat');

      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const filter = btn.getAttribute('data-filter');
          
          allCats.forEach(cat => {
            if (filter === 'all' || cat.getAttribute('data-type') === filter) {
              cat.style.display = 'block';
            } else {
              cat.style.display = 'none';
            }
          });
        });
      });

    } catch (e) {
      console.error('Error cargando menú', e);
    }
  };
  
  loadMenu();

  // --- RASTREADOR ---
  let trackingTimer = null;
  let currentTicketId = null;

  const ticketInput = document.getElementById('ticket-input');
  const trackBtn = document.getElementById('track-btn');
  const statusCard = document.getElementById('status-card');
  const statusIcon = document.getElementById('status-icon');
  const statusTitle = document.getElementById('status-title');
  const statusDesc = document.getElementById('status-desc');
  const reviewAction = document.getElementById('review-action');

  const checkStatus = async (id) => {
    try {
      const res = await fetch(`/api/tracking/${id}`);
      if (!res.ok) {
        showToast('Ticket no encontrado');
        if (trackingTimer) clearInterval(trackingTimer);
        statusCard.classList.add('hidden');
        return;
      }
      
      const sale = await res.json();
      currentTicketId = id;
      statusCard.classList.remove('hidden');

      const kdsStatus = sale.kdsStatus || 'pending';
      
      if (kdsStatus === 'pending') {
        statusIcon.innerHTML = '<i class="fas fa-clock"></i>';
        statusIcon.className = 'status-icon';
        statusTitle.textContent = 'En Cola';
        statusDesc.textContent = 'Tu pedido está esperando para ser preparado.';
        reviewAction.classList.add('hidden');
      } else if (kdsStatus === 'preparing') {
        statusIcon.innerHTML = '<i class="fas fa-fire"></i>';
        statusIcon.className = 'status-icon preparing';
        statusTitle.textContent = 'Preparando';
        statusDesc.textContent = '¡Nuestros pasteleros están trabajando en tu Waffle!';
        reviewAction.classList.add('hidden');
      } else if (kdsStatus === 'completed' || kdsStatus === 'ready') {
        statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        statusIcon.className = 'status-icon ready';
        statusTitle.textContent = '¡Listo!';
        statusDesc.textContent = 'Tu pedido ya está listo para ser retirado en caja.';
        reviewAction.classList.remove('hidden');
        
        if (trackingTimer) clearInterval(trackingTimer);
      }
      
    } catch (e) {
      console.error('Error tracking:', e);
    }
  };

  trackBtn.addEventListener('click', () => {
    const code = ticketInput.value.trim();
    if (code.length < 1) return;
    
    if (trackingTimer) clearInterval(trackingTimer);
    checkStatus(code);
    trackingTimer = setInterval(() => checkStatus(code), 5000); // Poll every 5s
  });

  // --- RESEÑAS ---
  const openReviewBtn = document.getElementById('open-review-btn');
  const cancelReviewBtn = document.getElementById('cancel-review-btn');
  const submitReviewBtn = document.getElementById('submit-review-btn');
  const reviewStars = document.querySelectorAll('.stars i');
  let currentRating = 5; // default 5 stars

  if (openReviewBtn) {
    openReviewBtn.addEventListener('click', () => {
      // Hide all views, show review view
      views.forEach(v => v.classList.remove('active'));
      document.getElementById('view-review').classList.add('active');
    });
  }

  if (cancelReviewBtn) {
    cancelReviewBtn.addEventListener('click', () => {
      // Go back to tracker
      views.forEach(v => v.classList.remove('active'));
      document.getElementById('view-tracker').classList.add('active');
    });
  }

  reviewStars.forEach(star => {
    star.addEventListener('click', () => {
      currentRating = parseInt(star.getAttribute('data-val'));
      reviewStars.forEach(s => {
        if (parseInt(s.getAttribute('data-val')) <= currentRating) {
          s.classList.add('active');
          s.classList.remove('fa-regular');
          s.classList.add('fa-solid');
        } else {
          s.classList.remove('active');
          s.classList.add('fa-regular');
          s.classList.remove('fa-solid');
        }
      });
    });
  });
  
  // Set initial stars
  reviewStars.forEach(s => {
    s.classList.add('active');
    s.classList.add('fa-solid');
  });

  if (submitReviewBtn) {
    submitReviewBtn.addEventListener('click', async () => {
      const comment = document.getElementById('review-comment').value.trim();
      
      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sale_id: currentTicketId,
            rating: currentRating,
            comment: comment
          })
        });
        
        if (res.ok) {
          showToast('¡Gracias por tu reseña!');
          setTimeout(() => {
            views.forEach(v => v.classList.remove('active'));
            document.getElementById('view-tracker').classList.add('active');
            
            // Limpiar datos
            ticketInput.value = '';
            statusCard.classList.add('hidden');
            reviewAction.classList.add('hidden');
            currentTicketId = null;
            if (trackingTimer) clearInterval(trackingTimer);
          }, 1500);
        } else {
          showToast('Error al enviar la reseña');
        }
      } catch (e) {
        showToast('Error de conexión');
      }
    });
  }

  // --- TOAST UTILITY ---
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
});
