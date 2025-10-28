/**
 * API Client for AAD Framework Backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Questions
  async getQuestions(filters?: {
    course?: string;
    question_type?: string;
    min_es?: number;
    max_es?: number;
    bloom_level?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    const query = params.toString();
    return this.request(`/api/questions${query ? `?${query}` : ''}`);
  }

  async getQuestion(id: string) {
    return this.request(`/api/questions/${id}`);
  }

  async createQuestion(data: any) {
    return this.request('/api/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuestion(id: string, data: any) {
    return this.request(`/api/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuestion(id: string) {
    return this.request(`/api/questions/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getStatistics() {
    return this.request('/api/analysis/statistics');
  }

  async getCorrelation() {
    return this.request('/api/analysis/correlation');
  }

  // ES Calculation
  async calculateES(data: {
    bloomLevel: number;
    contextDependency: number;
    novelty: number;
    aiAccuracy?: number;
  }) {
    return this.request('/api/es/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // AI Testing
  async testQuestion(questionId: string, models: string[]) {
    return this.request('/api/test/single', {
      method: 'POST',
      body: JSON.stringify({ questionId, models }),
    });
  }
}

export const apiClient = new APIClient();
