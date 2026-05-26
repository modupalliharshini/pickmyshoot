// Photographer Portal Application Logic

// Session Auth guard
document.addEventListener('DOMContentLoaded', () => {
  const user = AppState.getCurrentUser();
  if (!user || user.role !== 'photographer') {
    showToast('Unauthorized. Please sign in as a Photographer Partner.', 'error');
    setTimeout(() => {
      window.location.href = 'index.html?role=photographer';
    }, 1000);
    return;
  }

  // Pre-fill profile name in header if custom profile
  const userAvatar = document.getElementById('header-avatar');
  if (userAvatar && user.avatar) {
    userAvatar.src = user.avatar;
  }

  // Initialize first view
  switchTab('discover');
});

function logout() {
  AppState.logout();
  showToast('Logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// State helpers
function getLoggedInPhotographer() {
  const session = AppState.getCurrentUser();
  if (!session) return null;
  return AppState.state.photographers.find(p => p.id === session.id) || AppState.state.photographers[0];
}

// TAB NAVIGATION SWITCHER
let currentTab = 'discover';
function switchTab(tabId) {
  currentTab = tabId;
  
  // Update header links
  const links = document.querySelectorAll('.nav-links .nav-link');
  links.forEach(link => {
    if (link.getAttribute('data-tab') === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update mobile bottom nav items
  const mobileNavItems = document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item');
  mobileNavItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Switch visible views
  const panes = document.querySelectorAll('.tab-pane');
  panes.forEach(pane => {
    if (pane.id === `tab-${tabId}`) {
      pane.classList.remove('hidden');
    } else {
      pane.classList.add('hidden');
    }
  });

  // Init views
  if (tabId === 'discover') initDiscover();
  if (tabId === 'map') initMap();
  if (tabId === 'schedule') initSchedule();
  if (tabId === 'account') initAccount();
}

// ==================== TAB 1: DISCOVER / DASHBOARD ====================
function initDiscover() {
  const photographer = getLoggedInPhotographer();
  if (!photographer) return;

  // Set personalized welcome
  document.getElementById('welcome-message').textContent = `Welcome back, ${photographer.name.split(' ')[0]}`;

  // Read bookings state
  const pendingRequests = AppState.state.bookings.filter(b => b.photographerId === photographer.id && b.status === 'pending');
  const acceptedShoots = AppState.state.bookings.filter(b => b.photographerId === photographer.id && b.status === 'accepted');

  document.getElementById('pending-requests-count').textContent = pendingRequests.length;
  document.getElementById('weekly-shoots-count').textContent = acceptedShoots.length + 3; // adding schedule initial mock items count
  document.getElementById('dashboard-earnings-amount').textContent = `₹${photographer.earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Set new badge count
  const newBadge = document.getElementById('new-badge');
  const notifBadge = document.getElementById('notification-badge-count');
  if (pendingRequests.length > 0) {
    newBadge.textContent = `${pendingRequests.length} NEW`;
    newBadge.classList.remove('hidden');
    if (notifBadge) {
      notifBadge.textContent = pendingRequests.length;
      notifBadge.classList.remove('hidden');
    }
  } else {
    newBadge.classList.add('hidden');
    if (notifBadge) notifBadge.classList.add('hidden');
  }

  // Render Requests Cards
  renderRequestsList(pendingRequests);

  // Render Weekly mini schedule
  renderWeeklyScheduleList();
}

function renderRequestsList(requests) {
  const container = document.getElementById('booking-requests-list');
  container.innerHTML = '';

  if (requests.length === 0) {
    container.innerHTML = `
      <div class="card text-center" style="padding: 40px; color: var(--grey-text);">
        <i class="fa-regular fa-calendar-check" style="font-size: 40px; margin-bottom: 12px; opacity: 0.5;"></i>
        <h4>No pending request bookings</h4>
        <p style="font-size: 14px; margin-top: 4px;">New customer booking requests will appear here.</p>
      </div>
    `;
    return;
  }

  requests.forEach(req => {
    const card = document.createElement('div');
    card.className = 'request-card';
    card.innerHTML = `
      <div class="request-image-wrapper">
        <span class="badge badge-wedding request-badge">${req.badge}</span>
        <img src="${req.image}" alt="${req.title}" class="request-image">
      </div>
      <div class="request-details">
        <div>
          <div class="request-header">
            <h3 class="request-title">${req.title}</h3>
            <span class="request-price">₹${req.price.toLocaleString('en-IN')}</span>
          </div>
          <div class="request-meta-grid">
            <div class="request-meta-item">
              <i class="fa-regular fa-user"></i>
              <span>${req.customerName}</span>
            </div>
            <div class="request-meta-item">
              <i class="fa-regular fa-calendar"></i>
              <span>${req.date}</span>
            </div>
            <div class="request-meta-item">
              <i class="fa-regular fa-clock"></i>
              <span>${req.time} (${req.duration})</span>
            </div>
            <div class="request-meta-item">
              <i class="fa-solid fa-location-dot"></i>
              <span>${req.location}</span>
            </div>
          </div>
        </div>
        <div class="request-actions">
          <button class="btn btn-primary" onclick="acceptBooking('${req.id}')">Accept Request</button>
          <button class="btn btn-secondary" onclick="declineBooking('${req.id}')">Decline</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function acceptBooking(bookingId) {
  const photographer = getLoggedInPhotographer();
  AppState.updateState(state => {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'accepted';
      
      // Update earnings metrics
      const p = state.photographers.find(photog => photog.id === photographer.id);
      p.earnings += booking.price;
      p.balance += booking.price;
      p.activity.unshift({
        id: 'tx_' + Date.now(),
        desc: `Booking #${bookingId.split('_')[1] || 'New'} - Accepted`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        amount: booking.price,
        type: 'credit'
      });

      // Add to calendar list
      state.schedule.push({
        id: 'sch_auto_' + Date.now(),
        photographerId: photographer.id,
        title: booking.title,
        time: `${booking.time} - Accepted Slot`,
        day: booking.date.split(' ')[1].replace(',', ''),
        dayOfWeek: 'TBD',
        month: booking.date.split(' ')[0].toUpperCase(),
        type: booking.badge
      });
    }
  });

  showToast('Booking accepted! Job added to schedule.', 'success');
  initDiscover();
}

function declineBooking(bookingId) {
  AppState.updateState(state => {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'declined';
    }
  });

  showToast('Booking request declined.', 'info');
  initDiscover();
}

function renderWeeklyScheduleList() {
  const photographer = getLoggedInPhotographer();
  const scheduleList = document.getElementById('weekly-schedule-list');
  scheduleList.innerHTML = '';

  const list = AppState.state.schedule.filter(s => s.photographerId === photographer.id && !s.date);
  
  if (list.length === 0) {
    scheduleList.innerHTML = '<p class="muted text-center" style="font-size: 14px; padding: 20px;">No events scheduled</p>';
    return;
  }

  list.forEach(item => {
    const el = document.createElement('div');
    el.className = 'schedule-item';
    el.innerHTML = `
      <div class="schedule-date-box ${item.nextUp ? 'active' : ''}">
        <span class="month">${item.month}</span>
        <span class="day">${item.day}</span>
      </div>
      <div class="schedule-info">
        <h4>${item.title}</h4>
        <p>${item.time}</p>
        ${item.nextUp ? '<span class="badge badge-danger" style="margin-top: 4px; font-size: 8px;">NEXT UP</span>' : ''}
      </div>
    `;
    scheduleList.appendChild(el);
  });
}

// ==================== TAB 2: MAP / HEATMAP ====================
let activeMapCategory = 'all';
let mapSearchQuery = '';

function initMap() {
  renderMapPins();
  renderMapRequests();
}

function renderMapPins() {
  const overlay = document.getElementById('map-markers-overlay');
  overlay.innerHTML = '';

  // Only display open nearby bookings
  const openRequests = AppState.state.bookings.filter(b => b.status === 'open');

  openRequests.forEach(req => {
    // Skip if category filters exclude it
    if (activeMapCategory !== 'all' && !req.badge.includes(activeMapCategory)) return;
    if (mapSearchQuery && !req.title.toLowerCase().includes(mapSearchQuery.toLowerCase())) return;

    const pin = document.createElement('div');
    pin.className = 'map-marker';
    pin.style.left = `${req.coordinates.x}px`;
    pin.style.top = `${req.coordinates.y}px`;
    pin.style.pointerEvents = 'auto';
    pin.setAttribute('data-id', req.id);
    pin.onclick = (e) => {
      e.stopPropagation();
      highlightMapRequestCard(req.id);
    };

    const isPortrait = req.badge === 'Portrait';
    pin.innerHTML = `
      <div class="map-marker-pin ${isPortrait ? 'blue' : ''}">
        <i class="fa-solid ${isPortrait ? 'fa-user-astronaut' : 'fa-camera'}"></i>
      </div>
      <div class="map-marker-radar ${isPortrait ? 'blue' : ''}"></div>
    `;

    overlay.appendChild(pin);
  });
}

function renderMapRequests() {
  const container = document.getElementById('map-requests-list');
  container.innerHTML = '';

  const openRequests = AppState.state.bookings.filter(b => b.status === 'open');
  let filtered = openRequests;

  if (activeMapCategory !== 'all') {
    filtered = filtered.filter(r => r.badge.toLowerCase().includes(activeMapCategory.toLowerCase()));
  }
  if (mapSearchQuery) {
    filtered = filtered.filter(r => r.title.toLowerCase().includes(mapSearchQuery.toLowerCase()));
  }

  document.getElementById('open-requests-count').textContent = `${filtered.length} OPEN`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <p class="muted text-center" style="font-size: 14px; padding: 40px;">No requests match filter parameters.</p>
    `;
    return;
  }

  filtered.forEach(req => {
    const card = document.createElement('div');
    card.className = 'nearby-card';
    card.id = `nearby-card-${req.id}`;
    card.innerHTML = `
      <i class="fa-bookmark ${req.isSaved ? 'fa-solid active' : 'fa-regular'} nearby-bookmark" onclick="toggleSaveRequest(event, '${req.id}')"></i>
      <div class="nearby-card-header">
        <h4 class="nearby-card-title">${req.title}</h4>
        <span class="nearby-card-price">₹${req.price.toLocaleString('en-IN')}</span>
      </div>
      <div class="nearby-card-meta">
        <span><i class="fa-regular fa-clock"></i> ${req.time} (${req.duration})</span>
      </div>
      <div class="nearby-card-tags">
        <span class="nearby-card-tag">${req.badge}</span>
        <span class="nearby-card-tag" style="background-color: var(--primary-light); color: var(--primary-color); border-color: rgba(255,59,48,0.2); font-weight: 700;">
          <i class="fa-solid fa-location-arrow"></i> ${req.distance}
        </span>
        <span class="nearby-card-tag">${req.type}</span>
      </div>
      <div class="nearby-card-actions">
        <button class="btn btn-primary" onclick="acceptNearbyInstantly('${req.id}')">Accept Instantly</button>
        <button class="btn btn-outline" onclick="submitNearbyBid('${req.id}')">Submit Bid</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function highlightMapRequestCard(id) {
  // Deselect previous
  const prevSelected = document.querySelector('.nearby-card.selected');
  if (prevSelected) prevSelected.classList.remove('selected');

  const card = document.getElementById(`nearby-card-${id}`);
  if (card) {
    card.classList.add('selected');
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function toggleSaveRequest(e, id) {
  e.stopPropagation();
  AppState.updateState(state => {
    const req = state.bookings.find(b => b.id === id);
    if (req) {
      req.isSaved = !req.isSaved;
    }
  });
  showToast('Booking watchlisted!', 'success');
  initMap();
}

function acceptNearbyInstantly(id) {
  const photographer = getLoggedInPhotographer();
  AppState.updateState(state => {
    const req = state.bookings.find(b => b.id === id);
    if (req) {
      req.status = 'accepted';
      req.photographerId = photographer.id;

      // Update financials
      const p = state.photographers.find(photog => photog.id === photographer.id);
      p.earnings += req.price;
      p.balance += req.price;
      p.activity.unshift({
        id: 'tx_' + Date.now(),
        desc: `${req.title} - Accepted Instantly`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        amount: req.price,
        type: 'credit'
      });

      // Add to schedule
      state.schedule.push({
        id: 'sch_map_' + Date.now(),
        photographerId: photographer.id,
        title: req.title,
        time: `${req.time} - Marketplace Job`,
        day: '26', // mock schedule day
        dayOfWeek: 'THU',
        month: 'OCT',
        type: req.badge
      });
    }
  });

  showToast('Job Accepted! Client details will be emailed shortly.', 'success');
  initMap();
}

function submitNearbyBid(id) {
  const bid = prompt('Enter your bid pricing amount (₹):');
  if (!bid || isNaN(bid)) {
    if (bid !== null) showToast('Please enter a valid number.', 'error');
    return;
  }
  showToast(`Bid of ₹${parseInt(bid).toLocaleString('en-IN')} submitted successfully!`, 'success');
}

function filterMapRequests() {
  mapSearchQuery = document.getElementById('map-search-input').value;
  renderMapPins();
  renderMapRequests();
}

function setMapCategoryFilter(category) {
  activeMapCategory = category;
  
  // Toggle active styling
  const pills = document.querySelectorAll('#map-category-pills .category-pill');
  pills.forEach((pill, idx) => {
    const catName = ['all', 'Portrait', 'Event', 'Real Estate'][idx];
    if (catName === category) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  renderMapPins();
  renderMapRequests();
}

function recenterMap() {
  showToast('Map centered at your operating location.', 'info');
}

// ==================== TAB 3: SCHEDULE / CALENDAR ====================
let selectedDateStr = '2023-10-12';
let scheduleTypeFilters = { Portrait: true, Commercial: true, Wedding: true, Blocked: true, Location: true };

function initSchedule() {
  // Update timeline title
  const dateObj = new Date(selectedDateStr);
  const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  document.getElementById('schedule-timeline-title').textContent = formatted;

  renderTimelineSlots();
  renderTasksList();
}

function renderTimelineSlots() {
  const grid = document.getElementById('timeline-hourly-grid');
  grid.innerHTML = '';

  const photographer = getLoggedInPhotographer();
  const slots = AppState.state.schedule.filter(s => s.photographerId === photographer.id && s.date === selectedDateStr);

  const hours = [
    { hour: '08:00 AM', val: '08:00' },
    { hour: '09:00 AM', val: '09:00' },
    { hour: '10:00 AM', val: '10:00' },
    { hour: '11:00 AM', val: '11:00' },
    { hour: '12:00 PM', val: '12:00' },
    { hour: '01:00 PM', val: '01:00' },
    { hour: '02:00 PM', val: '02:00' },
    { hour: '03:00 PM', val: '03:00' },
    { hour: '04:00 PM', val: '04:00' }
  ];

  hours.forEach(slotHour => {
    const row = document.createElement('div');
    row.className = 'timeline-row';
    
    const hrCol = document.createElement('div');
    hrCol.className = 'timeline-hour';
    hrCol.textContent = slotHour.hour;
    row.appendChild(hrCol);

    const slotCol = document.createElement('div');
    slotCol.className = 'timeline-slot';

    // Find if there is an event starting in this slot or spanning this hour
    const matchingEvent = slots.find(s => {
      const startHr = s.time.split(' ')[0].substring(0, 2);
      const slotHr = slotHour.val.substring(0, 2);
      return startHr === slotHr;
    });

    if (matchingEvent) {
      // Check filters
      const filterKey = matchingEvent.type;
      if (scheduleTypeFilters[filterKey] === false) {
        row.appendChild(slotCol);
        grid.appendChild(row);
        return;
      }

      const eventEl = document.createElement('div');
      eventEl.className = `timeline-event event-${matchingEvent.type.toLowerCase()}`;
      
      let avatarHtml = '';
      if (matchingEvent.avatar) {
        avatarHtml = `<img src="${matchingEvent.avatar}" class="event-avatar" alt="Avatar">`;
      } else if (matchingEvent.type === 'Blocked') {
        avatarHtml = `<div class="schedule-date-box" style="width: 44px; height: 44px; justify-content: center; padding: 0; background: var(--grey-border); border: none;"><i class="fa-solid fa-lock" style="color: var(--grey-text);"></i></div>`;
      } else if (matchingEvent.type === 'Location') {
        avatarHtml = `<div class="schedule-date-box" style="width: 44px; height: 44px; justify-content: center; padding: 0; background: var(--info-light); border: none; color: var(--info-color);"><i class="fa-regular fa-compass"></i></div>`;
      }

      eventEl.innerHTML = `
        <div class="event-details-col">
          ${avatarHtml}
          <div class="event-text-info">
            <h4 style="display: flex; align-items: center; gap: 8px;">
              ${matchingEvent.title}
              ${matchingEvent.type === 'Portrait' && matchingEvent.clientName ? `<span class="badge badge-portrait" style="font-size: 8px; padding: 2px 6px;">PORTRAIT</span>` : ''}
            </h4>
            <p>
              ${matchingEvent.location ? `<span><i class="fa-solid fa-location-dot"></i> ${matchingEvent.location}</span>` : ''}
              <span><i class="fa-regular fa-clock"></i> ${matchingEvent.time}</span>
              ${matchingEvent.project ? `<span class="muted">${matchingEvent.project}</span>` : ''}
            </p>
          </div>
        </div>
        <div class="event-actions-col">
          ${matchingEvent.type === 'Portrait' ? `
            <button class="btn btn-secondary btn-icon" onclick="showToast('Starting chat with client...', 'success')"><i class="fa-regular fa-comment-dots" style="color: var(--primary-color);"></i></button>
            <button class="btn btn-secondary btn-icon" onclick="showToast('Showing client location route...', 'info')"><i class="fa-solid fa-location-arrow" style="color: var(--primary-color);"></i></button>
          ` : ''}
        </div>
      `;
      slotCol.appendChild(eventEl);
    }

    row.appendChild(slotCol);
    grid.appendChild(row);
  });
}

function selectCalendarDate(dayNum) {
  // Update styling
  const days = document.querySelectorAll('.calendar-day-num:not(.empty)');
  days.forEach(day => {
    if (parseInt(day.textContent) === dayNum) {
      day.classList.add('active');
    } else {
      day.classList.remove('active');
    }
  });

  // Update mobile calendar strip widget style
  const stripDays = document.querySelectorAll('.calendar-strip-day');
  stripDays.forEach(day => {
    const numEl = day.querySelector('.day-num');
    if (numEl && parseInt(numEl.textContent) === dayNum) {
      day.classList.add('active');
    } else {
      day.classList.remove('active');
    }
  });

  const formattedDay = dayNum < 10 ? '0' + dayNum : dayNum;
  selectedDateStr = `2023-10-${formattedDay}`;
  initSchedule();
}

function toggleScheduleFilter(type, isChecked) {
  scheduleTypeFilters[type] = isChecked;
  // If Portrait/Commercial also toggle location/blocked logic maps
  if (type === 'Portrait') scheduleTypeFilters['Blocked'] = isChecked;
  if (type === 'Commercial') scheduleTypeFilters['Location'] = isChecked;
  
  renderTimelineSlots();
}

function toggleTimelineMode(mode) {
  const btns = document.querySelectorAll('.timeline-tab-btn');
  btns[0].classList.toggle('active', mode === 'day');
  btns[1].classList.toggle('active', mode === 'week');
  showToast(`Toggled schedule to ${mode} mode view.`, 'info');
}

// Tasks checklists
function renderTasksList() {
  const container = document.getElementById('prep-tasks-container');
  container.innerHTML = '';

  const photographer = getLoggedInPhotographer();
  const tasks = AppState.state.tasks.filter(t => t.photographerId === photographer.id);

  if (tasks.length === 0) {
    container.innerHTML = '<p class="muted text-center" style="font-size: 13px; padding: 10px;">All clear! No tasks for today.</p>';
    return;
  }

  tasks.forEach(task => {
    const el = document.createElement('div');
    el.className = `task-item ${task.completed ? 'completed' : ''}`;
    el.innerHTML = `
      <div class="task-item-left">
        <div class="task-check-circle" onclick="toggleTaskCompletion('${task.id}')">
          <i class="fa-solid fa-check"></i>
        </div>
        <div class="task-item-text">
          <h4>${task.title}</h4>
          <p>${task.desc}</p>
        </div>
      </div>
      ${!task.completed ? `<span class="view-link" style="cursor:pointer;" onclick="toggleTaskCompletion('${task.id}')">Mark Complete</span>` : ''}
    `;
    container.appendChild(el);
  });
}

function toggleTaskCompletion(taskId) {
  AppState.updateState(state => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
    }
  });

  showToast('Task status updated.', 'success');
  renderTasksList();
}

// Block time modal actions
function openBlockTimeModal() {
  document.getElementById('block-time-modal').style.display = 'flex';
}
function closeBlockTimeModal() {
  document.getElementById('block-time-modal').style.display = 'none';
}
function handleBlockTimeSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('block-title').value;
  const date = document.getElementById('block-date').value;
  const start = document.getElementById('block-start').value;
  const end = document.getElementById('block-end').value;

  const photographer = getLoggedInPhotographer();

  AppState.updateState(state => {
    state.schedule.push({
      id: 'sch_block_' + Date.now(),
      photographerId: photographer.id,
      title: title,
      time: `${start} - ${end}`,
      date: date,
      type: 'Blocked'
    });
  });

  showToast('Calendar block scheduled!', 'success');
  closeBlockTimeModal();
  initSchedule();
}

// Manual Booking modal actions
function openNewBookingModal() {
  document.getElementById('new-booking-modal').style.display = 'flex';
}
function closeNewBookingModal() {
  document.getElementById('new-booking-modal').style.display = 'none';
}
function handleManualBookingSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('mb-title').value;
  const client = document.getElementById('mb-client').value;
  const category = document.getElementById('mb-category').value;
  const date = document.getElementById('mb-date').value;
  const start = document.getElementById('mb-time').value;
  const duration = document.getElementById('mb-duration').value;
  const location = document.getElementById('mb-location').value;

  const photographer = getLoggedInPhotographer();

  // Compute end time string
  const startHr = parseInt(start.split(':')[0]);
  const startMin = start.split(':')[1];
  let endHr = startHr + parseInt(duration);
  if (endHr >= 24) endHr = endHr - 24;
  const endHrStr = endHr < 10 ? '0' + endHr : endHr;
  const timeFormatted = `${start} - ${endHrStr}:${startMin}`;

  AppState.updateState(state => {
    state.schedule.push({
      id: 'sch_manual_' + Date.now(),
      photographerId: photographer.id,
      title: `${client} | ${title}`,
      clientName: client,
      time: timeFormatted,
      date: date,
      location: location || 'On-site Client Location',
      type: category,
      avatar: 'assets/julian_profile.png' // default template avatar
    });
  });

  showToast('Booking manually scheduled successfully!', 'success');
  closeNewBookingModal();
  initSchedule();
}


// ==================== TAB 4: ACCOUNT / PROFILE ====================
function initAccount() {
  const photographer = getLoggedInPhotographer();
  if (!photographer) return;

  // Render values
  document.getElementById('profile-avatar-display').src = photographer.avatar;
  document.getElementById('profile-name-display').textContent = photographer.name;
  document.getElementById('profile-title-display').textContent = photographer.title;
  document.getElementById('profile-bio-display').textContent = photographer.bio;
  document.getElementById('account-wallet-amount').textContent = `₹${photographer.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Skills tags
  const skillsRow = document.getElementById('profile-skills-tags');
  skillsRow.innerHTML = '';
  photographer.skills.forEach(skill => {
    const badge = document.createElement('span');
    badge.className = 'profile-skill-badge';
    badge.textContent = skill;
    skillsRow.appendChild(badge);
  });

  // Services list
  const servicesList = document.getElementById('profile-services-list');
  servicesList.innerHTML = '';
  photographer.services.forEach(serv => {
    const div = document.createElement('div');
    div.className = 'service-item';
    div.innerHTML = `
      <div class="service-item-left">
        <h4>${serv.name}</h4>
        <p>${serv.desc}</p>
      </div>
      <div class="service-item-price">${serv.rate}</div>
    `;
    servicesList.appendChild(div);
  });

  // Portfolio list
  document.getElementById('portfolio-count-text').textContent = `${photographer.portfolio.length} total assets featured`;
  const grid = document.getElementById('profile-portfolio-grid');
  grid.innerHTML = '';
  photographer.portfolio.forEach((imgSrc, idx) => {
    const item = document.createElement('div');
    item.className = 'portfolio-item';
    item.innerHTML = `
      <img src="${imgSrc}" alt="Portfolio asset">
      <div class="portfolio-item-overlay">
        <p>Featured Work #${idx + 1}</p>
      </div>
    `;
    grid.appendChild(item);
  });

  // Activity list ledger
  const activityList = document.getElementById('account-activity-list');
  activityList.innerHTML = '';
  if (photographer.activity.length === 0) {
    activityList.innerHTML = '<p class="muted text-center" style="font-size: 13px; padding: 10px;">No recent payout transactions.</p>';
  } else {
    photographer.activity.forEach(act => {
      const isDebit = act.type === 'debit';
      const el = document.createElement('div');
      el.className = 'activity-item';
      el.innerHTML = `
        <div class="activity-item-left">
          <h4>${act.desc}</h4>
          <p>${act.date}</p>
        </div>
        <div class="activity-amount ${isDebit ? 'negative' : 'positive'}">
          ${isDebit ? '-' : '+'}₹${act.amount.toLocaleString('en-IN')}
        </div>
      `;
      activityList.appendChild(el);
    });
  }
}

function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const base64Img = evt.target.result;
    
    // Save to state
    const photographer = getLoggedInPhotographer();
    AppState.updateState(state => {
      const p = state.photographers.find(photog => photog.id === photographer.id);
      if (p) {
        p.avatar = base64Img;
      }
      if (state.activeUser && state.activeUser.id === photographer.id) {
        state.activeUser.avatar = base64Img;
      }
    });

    document.getElementById('profile-avatar-display').src = base64Img;
    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar) headerAvatar.src = base64Img;
    showToast('Profile photo updated successfully!', 'success');
  };
  reader.readAsDataURL(file);
}

function handlePortfolioUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  const photographer = getLoggedInPhotographer();
  
  let loaded = 0;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(evt) {
      const base64Img = evt.target.result;
      
      AppState.updateState(state => {
        const p = state.photographers.find(photog => photog.id === photographer.id);
        if (p) {
          p.portfolio.unshift(base64Img);
        }
      });

      loaded++;
      if (loaded === files.length) {
        showToast('Portfolio photos uploaded successfully!', 'success');
        initAccount();
      }
    };
    reader.readAsDataURL(file);
  });
}

function editBio() {
  const photographer = getLoggedInPhotographer();
  const newBio = prompt('Edit professional bio:', photographer.bio);
  if (newBio === null) return;
  
  AppState.updateState(state => {
    const p = state.photographers.find(photog => photog.id === photographer.id);
    if (p) p.bio = newBio;
  });

  showToast('Bio updated successfully.', 'success');
  initAccount();
}

function triggerPayout() {
  const photographer = getLoggedInPhotographer();
  if (photographer.balance <= 0) {
    showToast('Available balance is zero. Payout not possible.', 'error');
    return;
  }

  const amt = photographer.balance;
  
  AppState.updateState(state => {
    const p = state.photographers.find(photog => photog.id === photographer.id);
    if (p) {
      p.balance = 0;
      p.activity.unshift({
        id: 'tx_payout_' + Date.now(),
        desc: 'Payout to bank account',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        amount: amt,
        type: 'debit'
      });
    }
  });

  showToast(`Payout of ₹${amt.toLocaleString('en-IN')} initiated successfully to bank account!`, 'success');
  initAccount();
}

// New Service modal actions
function openNewServiceModal() {
  document.getElementById('new-service-modal').style.display = 'flex';
}
function closeNewServiceModal() {
  document.getElementById('new-service-modal').style.display = 'none';
}
function handleNewServiceSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('serv-name').value;
  const rate = document.getElementById('serv-rate').value;
  const desc = document.getElementById('serv-desc').value;

  const photographer = getLoggedInPhotographer();

  AppState.updateState(state => {
    const p = state.photographers.find(photog => photog.id === photographer.id);
    if (p) {
      p.services.push({ name, rate, desc });
    }
  });

  showToast('Photography package service created!', 'success');
  closeNewServiceModal();
  initAccount();
}
