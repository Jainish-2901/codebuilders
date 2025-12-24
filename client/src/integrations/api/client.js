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
    // Browser automatically sets Content-Type: multipart/form-data with boundary for FormData.
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
        
        // Only clear and redirect if we aren't already on the auth page
        if (token) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            if (!window.location.pathname.includes('/auth')) {
                window.location.href = '/auth';
            }
        }
        throw new Error('Session expired. Please login again.');
      }

      // Handle empty responses (like 204 No Content) to prevent JSON parse errors
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

  // Update Profile Name
  async updateProfile(data) {
    return this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
  }

  // Change Password
  async changePassword(data) {
    return this.request('/auth/profile/password', { method: 'PUT', body: JSON.stringify(data) });
  }

  // Forgot Password - Request OTP
  async requestPasswordReset(email) {
    return this.request('/auth/forgot-password', { 
      method: 'POST', 
      body: JSON.stringify({ email }) 
    });
  }

  // Forgot Password - Verify OTP & Reset
  async resetPassword(email, otp, newPassword) {
    return this.request('/auth/reset-password', { 
      method: 'POST', 
      body: JSON.stringify({ email, otp, newPassword }) 
    });
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

  // ✅ FormData logic is handled automatically in request() above
  async createEvent(eventData) {
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
    // Check if it's FormData (for images) or JSON
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
  
  async getAllRegistrations(eventId) { 
    const query = eventId && eventId !== 'all' ? `?eventId=${eventId}` : '';
    return this.request(`/registrations${query}`); 
  }

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
  // 🖼️ MEMORIES / GALLERY (Uses Cloudinary)
  // ---------------------------------------------------------------------------
  
  async getEventMemories(eventId) {
    return this.request(`/events/${eventId}/memories`);
  }

  async uploadEventMemories(eventId, formData) {
    // formData MUST be an instance of FormData containing 'images' field
    return this.request(`/events/${eventId}/memories`, {
      method: 'POST',
      body: formData
    });
  }

  async deleteEventMemory(eventId, imageId) {
    return this.request(`/events/${eventId}/memories/${imageId}`, {
      method: 'DELETE'
    });
  }
}

export const apiClient = new ApiClient();