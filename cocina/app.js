// Sr. Waffle KDS App - Kitchen Display System Control
let soundEnabled = true;
let knownOrderIds = new Set();
let isFirstLoad = true;

const POLL_INTERVAL = 5000; // 5 segundos

// Elementos del DOM
const listPending = document.getElementById('list-pending');
const listPreparing = document.getElementById('list-preparing');
const listReady = document.getElementById('list-ready');

const countPending = document.getElementById('count-pending');
const countPreparing = document.getElementById('count-preparing');
const countReady = document.getElementById('count-ready');

const badgePending = document.getElementById('badge-pending');
const badgePreparing = document.getElementById('badge-preparing');
const badgeReady = document.getElementById('badge-ready');

const soundToggle = document.getElementById('sound-toggle');
const kdsToast = document.getElementById('kds-toast');
const kdsToastDesc = document.getElementById('kds-toast-desc');

// Cargar estado inicial del sonido
if (localStorage.getItem('kds_sound_enabled') !== null) {
  soundEnabled = localStorage.getItem('kds_sound_enabled') === 'true';
  updateSoundUI();
}

function updateSoundUI() {
  const soundIcon = soundToggle.querySelector('.sound-icon');
  const soundLabel = soundToggle.querySelector('.sound-toggle-label');
  if (soundEnabled) {
    soundIcon.textContent = '🔊';
    soundLabel.textContent = 'Notificaciones de Sonido: Activo';
    soundToggle.style.borderColor = 'var(--neon-cyan)';
    soundToggle.style.boxShadow = '0 0 8px var(--neon-cyan-glow)';
  } else {
    soundIcon.textContent = '🔇';
    soundLabel.textContent = 'Notificaciones de Sonido: Silenciado';
    soundToggle.style.borderColor = 'rgba(255, 255, 255, 0.05)';
    soundToggle.style.boxShadow = 'none';
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('kds_sound_enabled', soundEnabled);
  updateSoundUI();
  
  // Reproducir un pitido de confirmación al activar
  if (soundEnabled) {
    playChime();
  }
}

// Reproducir sonido usando la API Web Audio (chime agradable)
function playChime() {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playNote = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    const now = audioCtx.currentTime;
    // Chime futurista: nota C5 seguido de E5
    playNote(523.25, now, 0.25); // C5
    playNote(659.25, now + 0.12, 0.4); // E5
  } catch (e) {
    console.error('Error al reproducir el chime del KDS:', e);
  }
}

function showNewOrderToast(orderId) {
  kdsToastDesc.textContent = `Pedido #${orderId} ingresó a la cola de preparación.`;
  kdsToast.classList.add('active');
  setTimeout(() => {
    kdsToast.classList.remove('active');
  }, 4000);
}

// Calcular minutos transcurridos
function getMinutesElapsed(dateString) {
  const diffMs = new Date() - new Date(dateString);
  const diffMins = Math.floor(diffMs / 60000);
  return diffMins < 0 ? 0 : diffMins;
}

// Actualizar el estado de la venta en el backend
async function updateOrderStatus(saleId, newStatus) {
  try {
    const res = await fetch(`/api/sales/${saleId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Error al actualizar el estado');
    
    // Recargar inmediatamente para reflejar el cambio
    fetchOrders();
  } catch (err) {
    console.error(err);
    alert('Error de red al actualizar el estado del pedido: ' + err.message);
  }
}

// Crear tarjeta de pedido HTML
function createOrderCard(sale) {
  const card = document.createElement('div');
  card.className = 'order-card';
  card.dataset.id = sale.id;

  const mins = getMinutesElapsed(sale.date);
  const timeClass = mins >= 10 ? 'order-time critical' : 'order-time';
  const timeText = mins >= 10 ? `⚠️ Hace ${mins} min` : `⏳ Hace ${mins} min`;

  // Encabezado
  const header = document.createElement('div');
  header.className = 'order-card-header';
  
  const orderIdSpan = document.createElement('span');
  orderIdSpan.className = 'order-id';
  orderIdSpan.textContent = `#${sale.id.replace('sale_', '')}`;
  
  const orderTimeSpan = document.createElement('span');
  orderTimeSpan.className = timeClass;
  orderTimeSpan.textContent = timeText;
  
  header.appendChild(orderIdSpan);
  header.appendChild(orderTimeSpan);
  card.appendChild(header);

  // Detalle de Items
  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'order-items';
  
  sale.items.forEach(item => {
    const detail = document.createElement('div');
    detail.className = 'order-item-detail';
    
    const name = document.createElement('div');
    name.className = 'order-item-name';
    name.textContent = item.name;
    
    const desc = document.createElement('div');
    desc.className = 'order-item-desc';
    desc.textContent = item.details || '';
    
    detail.appendChild(name);
    detail.appendChild(desc);
    itemsContainer.appendChild(detail);
  });
  card.appendChild(itemsContainer);

  // Footer (Método de Pago + Botón de acción)
  const footer = document.createElement('div');
  footer.className = 'order-card-footer';
  
  const payment = document.createElement('span');
  payment.className = 'order-payment';
  payment.textContent = sale.paymentMethod || 'Efectivo';
  
  let btnText = 'Preparar 🍳';
  let nextStatus = 'preparing';
  
  if (sale.status === 'preparing') {
    btnText = 'Listo 🛎️';
    nextStatus = 'ready';
  } else if (sale.status === 'ready') {
    btnText = 'Entregar 📦';
    nextStatus = 'completed';
  }
  
  const actionBtn = document.createElement('button');
  actionBtn.className = 'order-action-btn';
  actionBtn.textContent = btnText;
  actionBtn.onclick = () => updateOrderStatus(sale.id, nextStatus);
  
  footer.appendChild(payment);
  footer.appendChild(actionBtn);
  card.appendChild(footer);

  return card;
}

// Obtener pedidos y renderizar
async function fetchOrders() {
  try {
    const res = await fetch('/api/sales');
    if (!res.ok) throw new Error('API unreachable');
    const sales = await res.json();
    
    // Filtrar pedidos que no estén completados ni reembolsados
    const activeSales = sales.filter(s => s.status === 'pending' || s.status === 'preparing' || s.status === 'ready');
    
    // Limpiar listas
    listPending.innerHTML = '';
    listPreparing.innerHTML = '';
    listReady.innerHTML = '';
    
    let counts = { pending: 0, preparing: 0, ready: 0 };
    let newOrderDetected = false;
    let newestId = '';
    
    // Ordenar de más viejos a más nuevos (para priorizar atención)
    activeSales.reverse().forEach(sale => {
      // Registrar si es un pedido nuevo
      if (!knownOrderIds.has(sale.id)) {
        knownOrderIds.add(sale.id);
        if (sale.status === 'pending') {
          newOrderDetected = true;
          newestId = sale.id;
        }
      }
      
      const card = createOrderCard(sale);
      
      if (sale.status === 'pending') {
        listPending.appendChild(card);
        counts.pending++;
      } else if (sale.status === 'preparing') {
        listPreparing.appendChild(card);
        counts.preparing++;
      } else if (sale.status === 'ready') {
        listReady.appendChild(card);
        counts.ready++;
      }
    });
    
    // Actualizar contadores y badges
    countPending.textContent = counts.pending;
    badgePending.textContent = counts.pending;
    
    countPreparing.textContent = counts.preparing;
    badgePreparing.textContent = counts.preparing;
    
    countReady.textContent = counts.ready;
    badgeReady.textContent = counts.ready;
    
    // Si no es la primera carga y se detectó un pedido nuevo en estado 'pending', alertar
    if (!isFirstLoad && newOrderDetected) {
      playChime();
      showNewOrderToast(newestId.replace('sale_', ''));
    }
    
    isFirstLoad = false;
  } catch (err) {
    console.error('Error al obtener ventas del KDS:', err);
  }
}

// Cargar datos inicialmente
fetchOrders();

// Polling periódico
setInterval(fetchOrders, POLL_INTERVAL);
