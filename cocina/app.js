document.addEventListener('DOMContentLoaded', () => {
  // Check Demo Mode
  fetch('/api/demo/status').then(r=>r.json()).then(d=>{
    const banner = document.getElementById('demo-banner');
    if(banner) banner.style.display = d.isDemoMode ? 'block' : 'none';
  }).catch(e=>console.error(e));

  let employees = [];
  let currentUser = null;
  let tickets = [];
  let soundEnabled = false;
  let lastTicketCount = 0;
  let pollingInterval = null;
  let kdsAlertTime = 10;

  // DOM Elements - Login
  const loginOverlay = document.getElementById('kds-login-overlay');
  const empSelect = document.getElementById('kds-employee-select');
  const pinDots = [
    document.getElementById('dot-0'),
    document.getElementById('dot-1'),
    document.getElementById('dot-2'),
    document.getElementById('dot-3')
  ];
  let currentPin = '';

  // DOM Elements - Layout
  const currentUserBadge = document.getElementById('kds-current-user');
  const logoutBtn = document.getElementById('logout-btn');
  const toggleSoundBtn = document.getElementById('toggle-sound-btn');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const notificationSound = document.getElementById('notification-sound');
  const toast = document.getElementById('toast');

  // DOM Elements - Kanban
  const containers = {
    pending: document.getElementById('container-pending'),
    preparing: document.getElementById('container-preparing'),
    ready: document.getElementById('container-ready')
  };
  const counts = {
    pending: document.getElementById('count-pending'),
    preparing: document.getElementById('count-preparing'),
    ready: document.getElementById('count-ready')
  };

  // --- INITIALIZATION ---
  const init = async () => {
    await fetchEmployees();
    checkSession();
    
    // Cargar logo de empresa
    try {
      const compRes = await fetch('/api/company/info');
      if (compRes.ok) {
        const compData = await compRes.json();
        const headerTitle = document.querySelector('.kds-brand h1');
        if (headerTitle && compData.companyLogo) {
          let logoImg = document.getElementById('dynamic-kds-logo');
          if (!logoImg) {
            logoImg = document.createElement('img');
            logoImg.id = 'dynamic-kds-logo';
            logoImg.style.cssText = 'width:36px; height:36px; border-radius:50%; object-fit:cover; margin-right:10px; vertical-align: middle;';
            headerTitle.parentNode.insertBefore(logoImg, headerTitle);
            headerTitle.style.display = 'inline-block';
            headerTitle.style.verticalAlign = 'middle';
          }
          logoImg.src = compData.companyLogo;
        }
        if (compData.kdsAlertTime !== undefined) {
          kdsAlertTime = compData.kdsAlertTime;
        }
      }
    } catch (e) {
      console.error('Error al cargar logo', e);
    }
  };

  // --- TOAST NOTIFICATION ---
  const showToast = (msg, isError = false) => {
    toast.textContent = msg;
    if (isError) toast.classList.add('error');
    else toast.classList.remove('error');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  };

  // --- LOGIN LOGIC ---
  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        employees = await res.json();
        empSelect.innerHTML = '<option value="">Selecciona tu usuario...</option>';
        const kitchenStaff = employees.filter(e => e.active && e.role === 'kitchen');
        kitchenStaff.forEach(e => {
          empSelect.innerHTML += `<option value="${e.id}">${e.name}</option>`;
        });
        if (kitchenStaff.length === 0) {
           empSelect.innerHTML = '<option value="">No hay cocineros activos. Creá uno en el Admin.</option>';
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToast('Error al conectar con el servidor', true);
    }
  };

  const checkSession = () => {
    const savedUser = sessionStorage.getItem('kdsUser');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      startSession();
    } else {
      loginOverlay.style.display = 'flex';
    }
  };

  const startSession = () => {
    loginOverlay.style.display = 'none';
    currentUserBadge.textContent = currentUser.name;
    startPolling();
  };

  const logout = () => {
    sessionStorage.removeItem('kdsUser');
    currentUser = null;
    currentPin = '';
    updatePinDots();
    empSelect.value = '';
    stopPolling();
    loginOverlay.style.display = 'flex';
  };

  const updatePinDots = () => {
    pinDots.forEach((dot, idx) => {
      if (idx < currentPin.length) dot.classList.add('filled');
      else dot.classList.remove('filled');
    });
  };

  const handlePinInput = (num) => {
    if (currentPin.length < 4) {
      currentPin += num;
      updatePinDots();
      if (currentPin.length === 4) {
        verifyLogin();
      }
    }
  };

  const verifyLogin = () => {
    const empId = empSelect.value;
    if (!empId) {
      showToast('Selecciona un usuario primero', true);
      currentPin = '';
      updatePinDots();
      return;
    }

    const emp = employees.find(e => e.id === empId);
    if (emp && emp.pin === currentPin) {
      currentUser = { id: emp.id, name: emp.name };
      sessionStorage.setItem('kdsUser', JSON.stringify(currentUser));
      startSession();
    } else {
      showToast('PIN incorrecto', true);
      currentPin = '';
      updatePinDots();
      // Vibrate effect
      pinDots.forEach(dot => {
        dot.style.transform = 'translateX(-5px)';
        setTimeout(() => dot.style.transform = 'translateX(5px)', 50);
        setTimeout(() => dot.style.transform = 'translateX(0)', 100);
      });
    }
  };

  // Bind keyboard
  document.querySelectorAll('.pin-btn[data-num]').forEach(btn => {
    btn.addEventListener('click', () => handlePinInput(btn.dataset.num));
  });

  document.querySelector('.pin-clear').addEventListener('click', () => {
    currentPin = currentPin.slice(0, -1);
    updatePinDots();
  });

  document.querySelector('.pin-clear-all').addEventListener('click', () => {
    currentPin = '';
    updatePinDots();
  });

  logoutBtn.addEventListener('click', logout);

  // --- CONTROL DEL MODAL DE AYUDA KDS ---
  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpClose = document.getElementById('help-modal-close');

  if (helpBtn && helpModal && helpClose) {
    helpBtn.addEventListener('click', () => {
      helpModal.style.display = 'flex';
    });
    helpClose.addEventListener('click', () => {
      helpModal.style.display = 'none';
    });
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        helpModal.style.display = 'none';
      }
    });
  }

  // --- WEB AUDIO API (BEEP SYNTH) ---
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log('Web Audio API no soportada', e);
    }
  };

  // --- KDS LOGIC ---
  const toggleSound = () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundIconOn.style.display = 'block';
      soundIconOff.style.display = 'none';
      playBeep();
      showToast('Sonido activado');
    } else {
      soundIconOn.style.display = 'none';
      soundIconOff.style.display = 'block';
      showToast('Sonido desactivado');
    }
  };

  toggleSoundBtn.addEventListener('click', toggleSound);

  const startPolling = () => {
    fetchTickets();
    pollingInterval = setInterval(fetchTickets, 5000);
  };

  const stopPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/kitchen/tickets');
      if (res.ok) {
        const newTickets = await res.json();
        const pendingCount = newTickets.filter(t => t.kdsStatus === 'pending').length;
        
        // Play sound if there are more pending tickets than before
        if (soundEnabled && pendingCount > lastTicketCount) {
          playBeep();
        }
        lastTicketCount = pendingCount;
        
        tickets = newTickets;
        renderTickets();
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const renderTickets = () => {
    // Clear containers
    Object.values(containers).forEach(c => c.innerHTML = '');
    
    const countData = { pending: 0, preparing: 0, ready: 0 };

    tickets.forEach(ticket => {
      const status = ticket.kdsStatus;
      if (!containers[status]) return; // Skip if status not in columns (e.g. delivered)
      
      countData[status]++;
      
      const orderDate = new Date(ticket.createdAt || ticket.created_at || ticket.date || Date.now());
      const now = new Date();
      const diffMins = Math.floor((now - orderDate) / 60000);
      const isUrgent = diffMins >= kdsAlertTime && status !== 'ready';

      const ticketEl = document.createElement('div');
      ticketEl.className = `kds-ticket ${isUrgent ? 'urgent' : ''}`;
      const timeStr = `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}`;

      let itemsHtml = '';
      ticket.items.forEach(item => {
        let detailsHtml = '';
        if (item.details) {
          // If details is an array, join it. If string, replace newlines with br.
          let dText = Array.isArray(item.details) ? item.details.join(', ') : item.details.replace(/\n/g, '<br>');
          detailsHtml = `<span class="ticket-item-details">• ${dText}</span>`;
        }
        itemsHtml += `
          <div class="ticket-item">
            <span class="ticket-item-name">${item.quantity || item.qty || 1}x ${item.name}</span>
            ${detailsHtml}
          </div>
        `;
      });

      let actionsHtml = '';
      if (status === 'pending') {
        actionsHtml = `<button class="btn-action btn-prepare" onclick="changeTicketStatus('${ticket.id}', 'preparing')">Preparar</button>`;
      } else if (status === 'preparing') {
        actionsHtml = `<button class="btn-action btn-ready" onclick="changeTicketStatus('${ticket.id}', 'ready')">Listo</button>`;
      } else if (status === 'ready') {
        actionsHtml = `<button class="btn-action btn-deliver" onclick="changeTicketStatus('${ticket.id}', 'delivered')">Entregado</button>`;
      }

      ticketEl.innerHTML = `
        <div class="ticket-header">
          <span class="ticket-id">#${(ticket.id.includes('_') ? ticket.id.split('_')[1] : ticket.id).slice(-4)}</span>
          <span class="ticket-time ${isUrgent ? 'urgent' : ''}">${timeStr} ${isUrgent ? '(+' + diffMins + 'm)' : ''}</span>
        </div>
        <div class="ticket-items">
          ${itemsHtml}
        </div>
        <div class="ticket-footer">
          ${actionsHtml}
        </div>
      `;

      containers[status].appendChild(ticketEl);
    });

    counts.pending.textContent = countData.pending;
    counts.preparing.textContent = countData.preparing;
    counts.ready.textContent = countData.ready;
  };

  window.changeTicketStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/kitchen/tickets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // Optimistic UI update
        const ticket = tickets.find(t => t.id === id);
        if (ticket) ticket.kdsStatus = status;
        renderTickets();
      } else {
        showToast('Error al actualizar ticket', true);
      }
    } catch (error) {
      console.error(error);
      showToast('Error de red', true);
    }
  };

  init();
});
