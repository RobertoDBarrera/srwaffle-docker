document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('ready-tickets-grid');
  const clockEl = document.getElementById('tv-clock');
  
  let displayedTickets = new Set();
  
  // Initialize AudioContext for the chime sound
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx;
  
  // AudioContext needs user interaction to start on some browsers,
  // but for a TV display, they might click anywhere once to enable audio.
  document.body.addEventListener('click', () => {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });

  const playChime = () => {
    if (!audioCtx) {
      try {
        audioCtx = new AudioContext();
      } catch (e) {
        return; // Audio not supported or blocked
      }
    }
    
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    
    // Ding - Dong frequencies
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc2.frequency.setValueAtTime(740, audioCtx.currentTime + 0.3); // F#5

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);
    
    osc2.start(audioCtx.currentTime + 0.3);
    osc2.stop(audioCtx.currentTime + 1.5);
  };

  const updateClock = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}`;
  };

  setInterval(updateClock, 1000);
  updateClock();

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/kitchen/tickets');
      if (!res.ok) return;
      const allTickets = await res.json();
      
      // Filter only ready tickets
      const readyTickets = allTickets.filter(t => (t.kdsStatus || t.status) === 'ready');
      const currentIds = new Set(readyTickets.map(t => t.id));
      
      let hasNew = false;
      
      // Check for new tickets
      for (let id of currentIds) {
        if (!displayedTickets.has(id)) {
          hasNew = true;
          break;
        }
      }
      
      if (hasNew) {
        playChime();
      }
      
      // Update DOM
      grid.innerHTML = '';
      if (readyTickets.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); font-size: 2rem; margin-top: 50px; opacity: 0.5;">No hay pedidos listos en este momento</div>`;
      } else {
        readyTickets.forEach(ticket => {
          const isNew = !displayedTickets.has(ticket.id);
          const div = document.createElement('div');
          div.className = `tv-ticket ${isNew ? 'new-ticket' : ''}`;
          
          // Get last 4 digits
          const displayId = (ticket.id.includes('_') ? ticket.id.split('_')[1] : ticket.id).slice(-4);
          
          div.innerHTML = `<div class="tv-ticket-number">${displayId}</div>`;
          grid.appendChild(div);
        });
      }
      
      displayedTickets = currentIds;
      
    } catch (e) {
      console.error("Error fetching tickets:", e);
    }
  };

  // Poll every 3 seconds
  setInterval(fetchTickets, 3000);
  fetchTickets();
});
