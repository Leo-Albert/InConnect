const API_BASE_URL = 'http://localhost:4021/api';

export const api = {
  topics: {
    getFeed: async (page = 1, pageSize = 10) => {
      const res = await fetch(`${API_BASE_URL}/topics?page=${page}&pageSize=${pageSize}`);
      if (!res.ok) throw new Error('Failed to fetch topics');
      return res.json();
    },
    search: async (query: string, page = 1, pageSize = 10) => {
      const res = await fetch(`${API_BASE_URL}/topics/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
      if (!res.ok) throw new Error('Failed to search topics');
      return res.json();
    },
    create: async (payload: { title: string; content: string; categoryId: number }) => {
      const res = await fetch(`${API_BASE_URL}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) // Needs real auth token eventually
      });
      if (!res.ok) throw new Error('Failed to create topic');
      return res.json();
    }
  }
};
