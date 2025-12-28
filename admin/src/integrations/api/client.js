const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    // Default headers
    const headers = {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // ⚠️ CRITICAL: Only set JSON Content-Type if NOT sending FormData.
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 (Unauthorized) specifically
      if (response.status === 401) {
        console.warn('[API] 401 Unauthorized - Session expired or invalid.');
        
        if (token) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            if (!window.location.pathname.includes('/auth')) {
                window.location.href = '/auth';
            }
        }
        throw new Error('Session expired. Please login again.');
      }

      if (response.status === 204) {
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('[API] Request failed:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // 🔐 AUTHENTICATION & PROFILE
  // ---------------------------------------------------------------------------
  
  async login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  }
  
  async register(email, password, name) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
  }
  
  async getCurrentUser() { return this.request('/auth/me'); }
  
  async logout() { 
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth'; 
  }

  async updateProfile(data) {
    return this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
  }

  async changePassword(data) {
    return this.request('/auth/profile/password', { method: 'PUT', body: JSON.stringify(data) });
  }

  async requestPasswordReset(email) {
    return this.request('/auth/forgot-password', { 
      method: 'POST', 
      body: JSON.stringify({ email }) 
    });
  }

  async resetPassword(email, otp, newPassword) {
    return this.request('/auth/reset-password', { 
      method: 'POST', 
      body: JSON.stringify({ email, otp, newPassword }) 
    });
  }

  // ---------------------------------------------------------------------------
  // 👤 USERS MANAGEMENT (ADMIN) - ✅ NEW ADDED
  // ---------------------------------------------------------------------------

  async getAllUsers() {
    return this.request('/users'); 
  }

  async createUser(userData) {
    return this.request('/users', { method: 'POST', body: JSON.stringify(userData) });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }
  
  // ---------------------------------------------------------------------------
  // 📅 EVENTS MANAGEMENT
  // ---------------------------------------------------------------------------
  
  async getEvents(filter) {
    const query = filter ? `?filter=${filter}` : '';
    return this.request(`/events${query}`);
  }

  async getEventById(id) {
    return this.request(`/events/${id}`);
  }

  async createEvent(eventData) {
    // Check if data is FormData (for image upload) or JSON
    const body = eventData instanceof FormData ? eventData : JSON.stringify(eventData);
    return this.request('/events', { method: 'POST', body });
  }

  async updateEvent(id, eventData) {
    const body = eventData instanceof FormData ? eventData : JSON.stringify(eventData);
    return this.request(`/events/${id}`, { method: 'PUT', body });
  }

  async deleteEvent(id) {
    return this.request(`/events/${id}`, { method: 'DELETE' });
  }

  // ---------------------------------------------------------------------------
  // 👥 VOLUNTEERS & ADMIN
  // ---------------------------------------------------------------------------
  
  async getAdminOverview() { return this.request('/admin/overview'); }
  
  async getVolunteers() { return this.request('/volunteers'); }
  
  async getVolunteerMe() { return this.request('/volunteers/me'); } 

  async createVolunteer(data) { return this.request('/volunteers', { method: 'POST', body: JSON.stringify(data) }); }
  async updateVolunteer(id, data) { return this.request(`/volunteers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteVolunteer(id) { return this.request(`/volunteers/${id}`, { method: 'DELETE' }); }

  // ---------------------------------------------------------------------------
  // 🎤 SPEAKERS
  // ---------------------------------------------------------------------------
  
  async getSpeakers() {
    return this.request('/speakers');
  }
  
  async createSpeaker(speakerData) {
    const body = speakerData instanceof FormData ? speakerData : JSON.stringify(speakerData);
    return this.request('/speakers', { method: 'POST', body });
  }
  
  async updateSpeaker(id, speakerData) {
    const body = speakerData instanceof FormData ? speakerData : JSON.stringify(speakerData);
    return this.request(`/speakers/${id}`, { method: 'PUT', body });
  }
  
  async deleteSpeaker(id) {
    return this.request(`/speakers/${id}`, { method: 'DELETE' });
  }

  // ---------------------------------------------------------------------------
  // 🎟️ REGISTRATIONS
  // ---------------------------------------------------------------------------
  
  // 1. Admin: Get ALL registrations with pagination/search
  async getAllRegistrations(page = 1, search = '', limit = 10, eventId = null) { 
    const params = new URLSearchParams();
    
    params.append('page', page);
    params.append('limit', limit);
    
    if (search) {
        params.append('search', search);
    }
    
    if (eventId && eventId !== 'all') {
        params.append('eventId', eventId);
    }

    return this.request(`/registrations?${params.toString()}`); 
  }

  // 2. Admin: Get Recent Registrations
  async getRecentRegistrations() {
    return this.request('/registrations/recent');
  }

  // 3. Volunteer/Admin - Get registrations for a SPECIFIC event
  async getEventRegistrations(eventId) {
    return this.request(`/registrations/event/${eventId}`);
  }

  // 4. Update Attendance
  async toggleRegistrationAttendance(id, isAttended) {
      return this.request(`/registrations/${id}/attendance`, { 
        method: 'PUT', 
        body: JSON.stringify({ isAttended }) 
      });
  }

  async deleteRegistration(id) {
    return this.request(`/registrations/${id}`, { method: 'DELETE' });
  }

  async checkInRegistration(tokenId) {
    return this.request(`/registrations/checkin/${tokenId}`, { method: 'PUT' });
  }
  
  // ---------------------------------------------------------------------------
  // 📩 MESSAGES
  // ---------------------------------------------------------------------------
  
  async sendContactMessage(data) {
    return this.request('/messages', { method: 'POST', body: JSON.stringify(data) });
  }
  
  async getContactMessages() {
    return this.request('/messages'); 
  }
  
  async deleteContactMessage(id) {
    return this.request(`/messages/${id}`, { method: 'DELETE' });
  }

  // ---------------------------------------------------------------------------
  // 🌍 EXTERNAL EVENTS (Workshops, Hackathons, etc.)
  // ---------------------------------------------------------------------------

  async getExternalEvents(type = null, status = null) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/external-events${query}`);
  }

  async getExternalEvent(id) {
    return this.request(`/external-events/${id}`);
  }

  // ✅ UPDATED: Supports FormData (for Image Uploads)
  async createExternalEvent(data) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request('/external-events', { method: 'POST', body });
  }

  // ✅ UPDATED: Supports FormData
  async updateExternalEvent(id, data) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request(`/external-events/${id}`, { method: 'PUT', body });
  }

  async deleteExternalEvent(id) {
    return this.request(`/external-events/${id}`, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();