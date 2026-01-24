// Create this file: src/services/api.js
// This will handle all API calls to your Django backend

const API_BASE_URL = 'http://127.0.0.1:8000/api';

class RiverMonitoringAPI {
  
  // Helper method for making HTTP requests
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error for ${url}:`, error);
      throw error;
    }
  }

  // ===============================
  // RIVER ENDPOINTS
  // ===============================

  // Get all rivers
  async getRivers() {
    return this.makeRequest('/rivers/');
  }

  // Get specific river details
  async getRiverDetail(riverId) {
    return this.makeRequest(`/rivers/${riverId}/`);
  }

  // Get complete river data (for your existing dashboard)
  async getCompleteRiverData(riverId) {
    return this.makeRequest(`/rivers/${riverId}/complete/`);
  }

  // Get dashboard analytics
  async getDashboardAnalytics(riverId) {
    return this.makeRequest(`/rivers/${riverId}/analytics/`);
  }

  // ===============================
  // WORKFLOW MANAGEMENT - MOST IMPORTANT
  // ===============================

  // Update intervention status (THE KEY FUNCTION)
  async updateInterventionStatus(interventionId, phase, status) {
    return this.makeRequest(`/interventions/${interventionId}/status/`, {
      method: 'PUT',
      body: JSON.stringify({
        phase: phase,
        status: status
      })
    });
  }

  // Get intervention workflow status
  async getInterventionWorkflowStatus(interventionId) {
    return this.makeRequest(`/interventions/${interventionId}/workflow/`);
  }

  // ===============================
  // DELAY MANAGEMENT
  // ===============================

  // Get delayed interventions
  async getDelayedInterventions(riverId = null) {
    const url = riverId ? `/rivers/${riverId}/delayed/` : '/delayed/';
    return this.makeRequest(url);
  }

  // Resolve delayed intervention
  async resolveDelayedIntervention(delayId) {
    return this.makeRequest(`/delayed/${delayId}/resolve/`, {
      method: 'PUT'
    });
  }

  // ===============================
  // BULK OPERATIONS
  // ===============================

  // Bulk update multiple interventions
  async bulkUpdateInterventions(updates) {
    return this.makeRequest('/interventions/bulk-update/', {
      method: 'POST',
      body: JSON.stringify({ updates })
    });
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  // Check if API is available
  async healthCheck() {
    try {
      const response = await this.getRivers();
      return { status: 'ok', data: response };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // Format date for display
  formatDate(dateString) {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Format datetime for display
  formatDateTime(dateString) {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Create and export a single instance
const riverAPI = new RiverMonitoringAPI();
export default riverAPI;

// Export individual methods for easier importing
export const {
  getRivers,
  getRiverDetail,
  getCompleteRiverData,
  getDashboardAnalytics,
  updateInterventionStatus,
  getInterventionWorkflowStatus,
  getDelayedInterventions,
  resolveDelayedIntervention,
  bulkUpdateInterventions,
  healthCheck,
  formatDate,
  formatDateTime
} = riverAPI;