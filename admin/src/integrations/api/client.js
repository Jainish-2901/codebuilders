const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Default headers
    const headers = {
      ...options.headers,
    };

    // ⚠️ CRITICAL: Only set JSON Content-Type if NOT sending FormData.
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
      credentials: 'include', // ✅ Essential for sending HttpOnly cookies
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 (Unauthorized) specifically
      if (response.status === 401) {
        console.warn('[API] 401 Unauthorized - Session expired or invalid.');

        // Clear user session data (but keep theme/settings)
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');

        if (!window.location.pathname.includes('/auth')) {
          window.location.href = '/auth';
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

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      window.location.href = '/auth';
    }
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
  // 👤 USERS MANAGEMENT (ADMIN)
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

  async getAdminOverview() {
    return this.request('/admin/overview');
  }

  async getVolunteers() {
    return this.request('/volunteers');
  }

  async getVolunteerMe() {
    return this.request('/volunteers/me');
  }

  async createVolunteer(data) {
    return this.request('/volunteers', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateVolunteer(id, data) {
    return this.request(`/volunteers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteVolunteer(id) {
    return this.request(`/volunteers/${id}`, { method: 'DELETE' });
  }

  // ---------------------------------------------------------------------------
  // 🎤 Team Member
  // ---------------------------------------------------------------------------

  async getTeamMembers() {
    return this.request('/team-members');
  }

  async createTeamMember(teamMemberData) {
    const body = teamMemberData instanceof FormData ? teamMemberData : JSON.stringify(teamMemberData);
    return this.request('/team-members', { method: 'POST', body });
  }

  async updateTeamMember(id, teamMemberData) {
    const body = teamMemberData instanceof FormData ? teamMemberData : JSON.stringify(teamMemberData);
    return this.request(`/team-members/${id}`, { method: 'PUT', body });
  }

  async deleteTeamMember(id) {
    return this.request(`/team-members/${id}`, { method: 'DELETE' });
  }

  // ---------------------------------------------------------------------------
  // 🎟️ REGISTRATIONS
  // ---------------------------------------------------------------------------

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

  async getRecentRegistrations() {
    return this.request('/registrations/recent');
  }

  async getEventRegistrations(eventId) {
    return this.request(`/registrations/event/${eventId}`);
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
  // 📩 MESSAGES (CONTACT)
  // ---------------------------------------------------------------------------

  async sendContactMessage(data) {
    // Assuming this maps to POST /api/contact
    return this.request('/contact', { method: 'POST', body: JSON.stringify(data) });
  }

  async getContactMessages() {
    return this.request('/contact');
  }

  async deleteContactMessage(id) {
    return this.request(`/contact/${id}`, { method: 'DELETE' });
  }

  // ✅ NEW: Mark Message as Read
  async markMessageAsRead(id) {
    return this.request(`/contact/${id}/read`, { method: 'PUT' });
  }

  // ---------------------------------------------------------------------------
  // 🌍 EXTERNAL EVENTS
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

  async createExternalEvent(data) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request('/external-events', { method: 'POST', body });
  }

  async updateExternalEvent(id, data) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request(`/external-events/${id}`, { method: 'PUT', body });
  }

  async deleteExternalEvent(id) {
    return this.request(`/external-events/${id}`, { method: 'DELETE' });
  }
  // ---------------------------------------------------------------------------
  // 📜 CERTIFICATES
  // ---------------------------------------------------------------------------

  async sendCertificates(eventId) {
    return this.request(`/certificates/send/${eventId}`, { method: 'POST' });
  }
}

export const apiClient = new ApiClient();