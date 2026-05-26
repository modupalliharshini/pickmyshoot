// Customer Portal Application Logic

// Session Auth guard
document.addEventListener('DOMContentLoaded', () => {
  const user = AppState.getCurrentUser();
  if (!user || user.role !== 'customer') {
    showToast('Unauthorized. Please sign in as a Customer.', 'error');
    setTimeout(() => {
      window.location.href = 'index.html?role=customer';
    }, 1000);
    return;
  }

  // Pre-fill header names
  document.getElementById('header-user-name').textContent = user.name;

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


// ==================== TAB 1: DISCOVER ====================
let discoverFilterSpecialty = 'all';
let discoverSearchQuery = '';
let discoverLocQuery = '';

function initDiscover() {
  renderPhotographersList();
}

function renderPhotographersList() {
  const container = document.getElementById('photographers-list-container');
  container.innerHTML = '';

  let list = AppState.state.photographers;

  // Apply filters
  if (discoverFilterSpecialty !== 'all') {
    list = list.filter(p => p.skills.some(s => s.toLowerCase().includes(discoverFilterSpecialty.toLowerCase())));
  }
  if (discoverSearchQuery) {
    list = list.filter(p => p.name.toLowerCase().includes(discoverSearchQuery.toLowerCase()) || 
                            p.skills.some(s => s.toLowerCase().includes(discoverSearchQuery.toLowerCase())));
  }
  if (discoverLocQuery) {
    list = list.filter(p => p.location.toLowerCase().includes(discoverLocQuery.toLowerCase()));
  }

  document.getElementById('partners-count-text').textContent = `${list.length} photography partner${list.length === 1 ? '' : 's'} available`;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="card text-center" style="padding: 40px; color: var(--grey-text);">
        <i class="fa-solid fa-users-slash" style="font-size: 40px; margin-bottom: 12px; opacity: 0.5;"></i>
        <h4>No photographer partners found</h4>
        <p style="font-size: 14px; margin-top: 4px;">Try modifying your search tags or location filters.</p>
      </div>
    `;
    return;
  }

  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'photographer-list-card';
    
    // Build skills badges html
    let skillsHtml = '';
    p.skills.forEach(s => {
      skillsHtml += `<span class="nearby-card-tag">${s}</span>`;
    });

    // Build portfolio thumbnails preview html
    let portfolioThumbs = '';
    const previews = p.portfolio.slice(0, 3);
    previews.forEach(img => {
      portfolioThumbs += `<img src="${img}" style="width: 50px; height: 50px; border-radius: 4px; object-fit: cover; border: 1px solid var(--grey-border);">`;
    });

    card.innerHTML = `
      <div class="photographer-card-img-col">
        <img src="${p.avatar}" alt="${p.name}">
      </div>
      <div class="photographer-card-details-col">
        <div>
          <div class="photographer-card-header">
            <div class="photographer-card-name">
              <h3>${p.name}</h3>
              <p><i class="fa-solid fa-location-dot"></i> ${p.location}</p>
            </div>
            <div class="photographer-card-rating">
              <i class="fa-solid fa-star"></i>
              <span>${p.rating} (${p.reviewsCount} reviews)</span>
            </div>
          </div>
          <p class="photographer-card-bio">${p.bio}</p>
          <div class="photographer-card-tags">
            ${skillsHtml}
          </div>
        </div>
        <div class="photographer-card-footer">
          <div class="photographer-card-price">
            ₹${p.hourlyRate.toLocaleString('en-IN')} <span>/ hour</span>
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="display: flex; gap: 4px; margin-right: 12px;">
              ${portfolioThumbs}
            </div>
            <button class="btn btn-primary" onclick="openBookModal('${p.id}')">Book Shoot</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function filterPhotographers() {
  discoverSearchQuery = document.getElementById('discover-search-input').value;
  discoverLocQuery = document.getElementById('discover-loc-input').value;
  renderPhotographersList();
}

function setSpecialtyFilter(specialty) {
  if (discoverFilterSpecialty === specialty) {
    discoverFilterSpecialty = 'all'; // toggle off
  } else {
    discoverFilterSpecialty = specialty;
  }
  
  // Highlight clicked categories
  const cards = document.querySelectorAll('.category-card');
  const specialtyIndexes = { 'Wedding': 0, 'Portrait': 1, 'Street Fashion': 2 };
  
  cards.forEach((card, idx) => {
    if (discoverFilterSpecialty !== 'all' && specialtyIndexes[discoverFilterSpecialty] === idx) {
      card.style.borderColor = 'var(--primary-color)';
      card.style.boxShadow = '0 0 0 1px var(--primary-color)';
    } else {
      card.style.borderColor = 'var(--grey-border)';
      card.style.boxShadow = 'none';
    }
  });

  renderPhotographersList();
}

// ==================== TAB 2: MAP / FIND NEARBY ====================
function initMap() {
  renderCustomerMapPins();
  renderCustomerMapList();
}

function renderCustomerMapPins() {
  const overlay = document.getElementById('customer-map-markers-overlay');
  overlay.innerHTML = '';

  // Julian Vane coordinate
  const julianPin = document.createElement('div');
  julianPin.className = 'map-marker';
  julianPin.style.left = '320px';
  julianPin.style.top = '360px';
  julianPin.style.pointerEvents = 'auto';
  julianPin.onclick = () => highlightCustomerMapCard('julian_vane');
  julianPin.innerHTML = `
    <div class="map-marker-pin">
      <i class="fa-solid fa-camera"></i>
    </div>
    <div class="map-marker-radar"></div>
  `;
  overlay.appendChild(julianPin);

  // Elena Rodriguez coordinate
  const elenaPin = document.createElement('div');
  elenaPin.className = 'map-marker';
  elenaPin.style.left = '510px';
  elenaPin.style.top = '530px';
  elenaPin.style.pointerEvents = 'auto';
  elenaPin.onclick = () => highlightCustomerMapCard('elena_rodriguez');
  elenaPin.innerHTML = `
    <div class="map-marker-pin blue">
      <i class="fa-solid fa-camera"></i>
    </div>
    <div class="map-marker-radar blue"></div>
  `;
  overlay.appendChild(elenaPin);
}

function renderCustomerMapList() {
  const container = document.getElementById('customer-map-photographers-list');
  container.innerHTML = '';

  const list = AppState.state.photographers;

  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'nearby-card';
    card.id = `cust-map-card-${p.id}`;
    
    // Distance tags mockup
    const distanceMock = p.id === 'julian_vane' ? '400m away' : '1.8km away';

    card.innerHTML = `
      <div class="nearby-card-header" style="align-items: center; gap: 12px; display: flex; justify-content: flex-start;">
        <img src="${p.avatar}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">
        <div>
          <h4 class="nearby-card-title">${p.name}</h4>
          <p class="muted" style="font-size: 11px;">${p.title}</p>
        </div>
        <span class="nearby-card-price" style="margin-left: auto;">₹${p.hourlyRate.toLocaleString('en-IN')}/hr</span>
      </div>
      <p style="font-size: 13px; color: #48484a; margin-bottom: 12px; line-height: 1.4;">${p.bio.substring(0, 80)}...</p>
      <div class="nearby-card-tags">
        <span class="nearby-card-tag"><i class="fa-solid fa-star" style="color: var(--warning-color);"></i> ${p.rating}</span>
        <span class="nearby-card-tag"><i class="fa-solid fa-location-arrow"></i> ${distanceMock}</span>
      </div>
      <div class="nearby-card-actions">
        <button class="btn btn-primary" onclick="openBookModal('${p.id}')">Select and Book</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function highlightCustomerMapCard(photographerId) {
  // Deselect previous
  const prevSelected = document.querySelector('.nearby-card.selected');
  if (prevSelected) prevSelected.classList.remove('selected');

  const card = document.getElementById(`cust-map-card-${photographerId}`);
  if (card) {
    card.classList.add('selected');
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ==================== TAB 3: CUSTOMER SCHEDULE / BOOKINGS ====================
function initSchedule() {
  const user = AppState.getCurrentUser();
  const container = document.getElementById('customer-bookings-list-container');
  container.innerHTML = '';

  // Get active user's bookings (we filter where status is not 'open')
  // We mock customer's bookings by checking photographer match or if created during the session
  const customerBookings = AppState.state.bookings.filter(b => b.status !== 'open');

  if (customerBookings.length === 0) {
    container.innerHTML = `
      <div class="card text-center" style="padding: 60px; color: var(--grey-text);">
        <i class="fa-regular fa-folder-open" style="font-size: 48px; opacity: 0.5; margin-bottom: 16px;"></i>
        <h3>No shoots booked yet</h3>
        <p style="margin-top: 6px; font-size: 14px;">Browse and book professional photographers from the Discover tab.</p>
        <button class="btn btn-primary" onclick="switchTab('discover')" style="margin-top: 20px;">Browse Photographers</button>
      </div>
    `;
    return;
  }

  customerBookings.forEach(booking => {
    const card = document.createElement('div');
    card.className = 'request-card';
    
    // Status color
    let statusClass = 'badge-wedding';
    let statusText = 'Pending Approval';
    if (booking.status === 'accepted') {
      statusClass = 'badge-portrait';
      statusText = 'Scheduled / Confirmed';
    } else if (booking.status === 'declined') {
      statusClass = 'badge-danger';
      statusText = 'Declined';
    }

    const photoName = booking.photographerId === 'elena_rodriguez' ? 'Elena Rodriguez' : 'Julian Vane';

    card.innerHTML = `
      <div class="request-image-wrapper">
        <span class="badge ${statusClass} request-badge" style="text-transform: uppercase;">${statusText}</span>
        <img src="${booking.image || 'assets/harrington_wedding.png'}" alt="${booking.title}" class="request-image">
      </div>
      <div class="request-details">
        <div>
          <div class="request-header">
            <h3 class="request-title">${booking.title}</h3>
            <span class="request-price">₹${booking.price.toLocaleString('en-IN')}</span>
          </div>
          <div class="request-meta-grid">
            <div class="request-meta-item">
              <i class="fa-regular fa-user"></i>
              <span>Photographer: ${photoName}</span>
            </div>
            <div class="request-meta-item">
              <i class="fa-regular fa-calendar"></i>
              <span>${booking.date}</span>
            </div>
            <div class="request-meta-item">
              <i class="fa-regular fa-clock"></i>
              <span>${booking.time} (${booking.duration})</span>
            </div>
            <div class="request-meta-item">
              <i class="fa-solid fa-location-dot"></i>
              <span>${booking.location}</span>
            </div>
          </div>
        </div>
        <div class="request-actions">
          ${booking.status === 'pending' ? `
            <button class="btn btn-secondary" onclick="cancelBooking('${booking.id}')" style="max-width: 200px;">Cancel Booking Request</button>
          ` : `
            <button class="btn btn-outline" style="max-width: 150px;" onclick="showToast('Starting chat with photographer...', 'success')"><i class="fa-regular fa-comments"></i> Message</button>
          `}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking request?')) return;

  AppState.updateState(state => {
    const idx = state.bookings.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
      state.bookings.splice(idx, 1);
    }
  });

  showToast('Booking request canceled.', 'info');
  initSchedule();
}


// ==================== TAB 4: CUSTOMER ACCOUNT ====================
function initAccount() {
  const user = AppState.getCurrentUser();
  document.getElementById('customer-name-display').textContent = user.name;
  document.getElementById('customer-email-display').textContent = user.email;

  // Calculate statistics
  const bookings = AppState.state.bookings.filter(b => b.status === 'accepted');
  const totalAmount = bookings.reduce((sum, b) => sum + b.price, 0);

  document.getElementById('spend-total-shoots').textContent = bookings.length + 1; // including mockup baseline
  document.getElementById('spend-total-amount').textContent = `₹${(totalAmount + 1650).toLocaleString('en-IN')}`; // adding initial mockup spend baseline
}


// ==================== BOOKING MODAL POPUP ====================
let currentBookingPhotographer = null;

function openBookModal(photographerId) {
  currentBookingPhotographer = AppState.state.photographers.find(p => p.id === photographerId);
  if (!currentBookingPhotographer) return;

  document.getElementById('bm-photographer-id').value = photographerId;
  document.getElementById('bm-photo-avatar').src = currentBookingPhotographer.avatar;
  document.getElementById('bm-photo-name').textContent = currentBookingPhotographer.name;
  document.getElementById('bm-photo-rate').textContent = `₹${currentBookingPhotographer.hourlyRate.toLocaleString('en-IN')} / hour`;
  document.getElementById('bm-header-title').textContent = `Book ${currentBookingPhotographer.name}`;
  
  // Set default form values
  const dateInput = document.getElementById('bm-shoot-date');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.value = tomorrow.toISOString().split('T')[0];

  updateEstimatedPrice();

  document.getElementById('book-photographer-modal').style.display = 'flex';
}

function closeBookModal() {
  document.getElementById('book-photographer-modal').style.display = 'none';
}

function updateEstimatedPrice() {
  if (!currentBookingPhotographer) return;

  const duration = parseInt(document.getElementById('bm-shoot-duration').value) || 1;
  const rate = currentBookingPhotographer.hourlyRate;
  const total = rate * duration;

  document.getElementById('summary-hourly-rate').textContent = `₹${rate.toLocaleString('en-IN')}.00`;
  document.getElementById('summary-duration').textContent = `${duration} Hour${duration > 1 ? 's' : ''}`;
  document.getElementById('summary-total-price').textContent = `₹${total.toLocaleString('en-IN')}.00`;
}

function handleBookSubmit(e) {
  e.preventDefault();
  
  const photographerId = document.getElementById('bm-photographer-id').value;
  const title = document.getElementById('bm-shoot-title').value;
  const category = document.getElementById('bm-shoot-category').value;
  const dateVal = document.getElementById('bm-shoot-date').value;
  const duration = parseInt(document.getElementById('bm-shoot-duration').value) || 1;
  const time = document.getElementById('bm-shoot-time').value;
  const location = document.getElementById('bm-shoot-location').value;

  const rate = currentBookingPhotographer.hourlyRate;
  const price = rate * duration;

  // Format Date (e.g. 2023-10-24 -> Oct 24, 2023)
  const dateObj = new Date(dateVal);
  const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Map category to template images
  let image = 'assets/harrington_wedding.png';
  if (category === 'Portrait') image = 'assets/portfolio_4.png';
  if (category === 'Street Fashion') image = 'assets/portfolio_1.png';
  if (category === 'Real Estate') image = 'assets/portfolio_2.png';

  AppState.updateState(state => {
    state.bookings.unshift({
      id: 'booking_auto_' + Date.now(),
      title: title,
      photographerId: photographerId,
      price: price,
      customerName: state.activeUser.name,
      date: dateFormatted,
      time: time,
      duration: `${duration}h`,
      location: location,
      badge: category,
      image: image,
      status: 'pending'
    });
  });

  showToast(`Booking request submitted to ${currentBookingPhotographer.name}!`, 'success');
  closeBookModal();
  switchTab('schedule');
}
