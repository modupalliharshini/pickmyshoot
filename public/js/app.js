// Shared Application State and LocalStorage Manager

const APP_STATE_KEY = 'lenshero_app_state';

// Default initial state matching the design mockups
const DEFAULT_STATE = {
  activeUser: null, // Will hold the logged in user object
  photographers: [
    {
      id: 'julian_vane',
      name: 'Julian Vane',
      title: 'Editorial & Commercial Photographer',
      location: 'Brooklyn, NY',
      email: 'hello@julianvane.studio',
      website: 'julianvane.studio',
      bio: 'Specializing in high-contrast editorial photography with a focus on urban narratives. Over 10 years of experience working with luxury brands and international publications. I bring a cinematic lens to everyday moments.',
      avatar: 'assets/julian_profile.png',
      rating: 4.9,
      reviewsCount: 124,
      hourlyRate: 450,
      skills: ['Portrait', 'Street Fashion', 'Architecture'],
      services: [
        { name: 'Editorial Portrait', rate: '$450/hr', desc: '2-hour session, 15 retouched images' },
        { name: 'Commercial Campaign', rate: '$2,200', desc: 'Full day, lighting crew included' }
      ],
      portfolio: [
        'assets/portfolio_1.png',
        'assets/portfolio_2.png',
        'assets/portfolio_3.png',
        'assets/portfolio_4.png'
      ],
      earnings: 2450.00,
      balance: 4850.00,
      activity: [
        { id: 'tx_1', desc: 'Booking #8842', date: 'Oct 12, 2023', amount: 450, type: 'credit' },
        { id: 'tx_2', desc: 'Payout to Bank', date: 'Oct 08, 2023', amount: 1200, type: 'debit' },
        { id: 'tx_3', desc: 'Booking #8821', date: 'Oct 04, 2023', amount: 850, type: 'credit' }
      ]
    },
    {
      id: 'elena_rodriguez',
      name: 'Elena Rodriguez',
      title: 'Wedding & Portrait Specialist',
      location: 'Queens, NY',
      email: 'elena@elena.photo',
      website: 'elenarodriguez.photo',
      bio: 'Capturing candid raw emotions and cinematic highlights. Specializes in luxury weddings and fine art portraits.',
      avatar: 'assets/portfolio_4.png',
      rating: 4.8,
      reviewsCount: 96,
      hourlyRate: 300,
      skills: ['Wedding', 'Portrait', 'Maternity'],
      services: [
        { name: 'Wedding Story', rate: '$300/hr', desc: 'Min 4 hours, all high-res digital copies' }
      ],
      portfolio: [
        'assets/portfolio_4.png',
        'assets/harrington_wedding.png'
      ],
      earnings: 1800.00,
      balance: 3200.00,
      activity: []
    }
  ],
  bookings: [
    // Photographer booking requests (Screenshot 1)
    {
      id: 'booking_1',
      title: 'The Harrington Wedding',
      photographerId: 'julian_vane',
      price: 1200,
      customerName: 'Sarah & John H.',
      date: 'Oct 24, 2023',
      time: '02:00 PM',
      duration: '6h',
      location: 'Belmond Manor, NY',
      badge: 'Wedding',
      image: 'assets/harrington_wedding.png',
      status: 'pending' // 'pending', 'accepted', 'declined'
    },
    {
      id: 'booking_2',
      title: 'Studio Editorial Series',
      photographerId: 'julian_vane',
      price: 450,
      customerName: 'Elena Vance',
      date: 'Oct 26, 2023',
      time: '10:00 AM',
      duration: '3h',
      location: 'Brooklyn Studios',
      badge: 'Editorial',
      image: 'assets/studio_editorial.png',
      status: 'pending'
    },
    // Nearby open marketplace requests (Screenshot 2)
    {
      id: 'nearby_1',
      title: 'Urban Fashion Editorial',
      photographerId: null, // Open to bidding
      price: 450,
      type: 'Estimated',
      time: 'Tomorrow, 4:00 PM',
      duration: '2h',
      distance: '400m away',
      badge: 'Street Photography',
      status: 'open',
      coordinates: { x: 380, y: 350 }, // SVG map coordinate
      isSaved: false
    },
    {
      id: 'nearby_2',
      title: "Couple's Rooftop Engagement",
      photographerId: null,
      price: 300,
      type: 'Fixed Price',
      time: 'Oct 24',
      duration: '1.5h',
      distance: '1.2km away',
      badge: 'Portrait',
      status: 'open',
      coordinates: { x: 220, y: 630 },
      isSaved: false
    },
    {
      id: 'nearby_3',
      title: 'Modern Loft Listing',
      photographerId: null,
      price: 600,
      type: 'Fixed Price',
      time: 'Oct 26',
      duration: '3h',
      distance: '2.8km away',
      badge: 'Real Estate',
      status: 'open',
      coordinates: { x: 500, y: 220 },
      isSaved: false
    }
  ],
  schedule: [
    {
      id: 'sch_1',
      photographerId: 'julian_vane',
      title: 'Portrait Session - Central Park',
      time: '09:00 AM - 11:00 AM',
      day: '23',
      dayOfWeek: 'MON',
      month: 'OCT',
      type: 'Portrait'
    },
    {
      id: 'sch_2',
      photographerId: 'julian_vane',
      title: "Food Photography - Lucca's",
      time: '02:00 PM - 05:00 PM',
      day: '24',
      dayOfWeek: 'TUE',
      month: 'OCT',
      type: 'Commercial'
    },
    {
      id: 'sch_3',
      photographerId: 'julian_vane',
      title: 'Real Estate Shoot - SoHo',
      time: '11:30 AM - 01:30 PM',
      day: '25',
      dayOfWeek: 'WED',
      month: 'OCT',
      type: 'Commercial',
      nextUp: true
    },
    // Detailed October 12 Hourly Schedule Items (Screenshot 3)
    {
      id: 'sch_hourly_1',
      photographerId: 'julian_vane',
      title: 'Studio Maintenance & Lens Calibration',
      time: '09:00 AM - 10:30 AM',
      date: '2023-10-12',
      type: 'Blocked'
    },
    {
      id: 'sch_hourly_2',
      photographerId: 'julian_vane',
      title: 'Elena Rodriguez | Editorial Headshot',
      clientName: 'Elena Rodriguez',
      time: '11:00 AM - 01:00 PM',
      duration: '2h',
      date: '2023-10-12',
      location: 'Skyloft Studios, Studio B',
      avatar: 'assets/portfolio_4.png',
      type: 'Portrait'
    },
    {
      id: 'sch_hourly_3',
      photographerId: 'julian_vane',
      title: 'Location Scouting: Urban Waterfront',
      time: '02:30 PM - 04:00 PM',
      date: '2023-10-12',
      project: 'Project: Fall Campaign 2024',
      type: 'Location'
    }
  ],
  tasks: [
    {
      id: 'task_1',
      photographerId: 'julian_vane',
      title: 'Battery Charge & SD Clear',
      desc: "Required for tomorrow's 6AM sunrise wedding shoot at Silver Lake.",
      completed: false
    },
    {
      id: 'task_2',
      photographerId: 'julian_vane',
      title: 'Confirm final gear list & lighting setup',
      desc: "Friday's session with James D. - Commercial Shoot.",
      completed: false
    }
  ]
};

// State loader & persistence
class AppStateManager {
  constructor() {
    this.state = this.loadState();
  }

  loadState() {
    const data = localStorage.getItem(APP_STATE_KEY);
    if (!data) {
      this.saveState(DEFAULT_STATE);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    return JSON.parse(data);
  }

  saveState(stateToSave) {
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(stateToSave || this.state));
  }

  updateState(updater) {
    updater(this.state);
    this.saveState();
  }

  // Authentication Helpers
  register(name, email, password, role, extra = {}) {
    const existing = this.state.photographers.find(p => p.email === email) || 
                     (this.state.activeUser && this.state.activeUser.email === email);
    if (existing) {
      return { success: false, message: 'Email already registered.' };
    }

    const newUser = {
      id: 'user_' + Date.now(),
      name,
      email,
      role, // 'customer' or 'photographer'
      ...extra
    };

    if (role === 'photographer') {
      const newPhotographer = {
        id: newUser.id,
        name: newUser.name,
        title: extra.title || 'Professional Photographer',
        location: extra.location || 'New York, NY',
        email: newUser.email,
        website: extra.website || '',
        bio: extra.bio || 'Professional photography partner.',
        avatar: 'assets/julian_profile.png',
        rating: 5.0,
        reviewsCount: 0,
        hourlyRate: parseInt(extra.hourlyRate) || 150,
        skills: extra.skills || ['Portrait'],
        services: [{ name: 'Portrait Session', rate: `$${extra.hourlyRate || 150}/hr`, desc: 'Custom photoshoot' }],
        portfolio: [],
        earnings: 0.00,
        balance: 0.00,
        activity: []
      };
      this.state.photographers.push(newPhotographer);
    }

    this.state.activeUser = newUser;
    this.saveState();
    return { success: true, user: newUser };
  }

  login(email, password, role) {
    // If photographer role, check photographer profile list
    if (role === 'photographer') {
      const photographer = this.state.photographers.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (photographer || email === 'julian@pickmyshoot.com' || email === 'marcus@pickmyshoot.com') {
        const user = photographer || this.state.photographers[0]; // fallback to Julian Vane
        this.state.activeUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'photographer'
        };
        this.saveState();
        return { success: true, user: this.state.activeUser };
      }
    } else {
      // Customer login
      this.state.activeUser = {
        id: 'cust_default',
        name: 'Marcus Lopez',
        email: email || 'marcus@gmail.com',
        role: 'customer'
      };
      this.saveState();
      return { success: true, user: this.state.activeUser };
    }

    return { success: false, message: 'Invalid credentials or account role.' };
  }

  logout() {
    this.state.activeUser = null;
    this.saveState();
  }

  getCurrentUser() {
    return this.state.activeUser;
  }
}

// Instantiate global state manager
window.AppState = new AppStateManager();

// Toaster Notification Helper
window.showToast = function(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';

  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
};
