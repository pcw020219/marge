const BASE = `${import.meta.env.VITE_API_URL || ''}/api`;

function getToken() {
  return localStorage.getItem('auth_token');
}

async function req(url, opts = {}) {
  const token = getToken();
  const res = await fetch(BASE + url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res.json();
}

export const api = {
  // Auth
  sendCode:   (email)       => req('/auth/send',   { method: 'POST', body: JSON.stringify({ email }) }),
  verifyCode: (email, code) => req('/auth/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),

  // Books
  getBooks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/books${qs ? `?${qs}` : ''}`);
  },
  getBook:    (id)       => req(`/books/${id}`),
  createBook: (data)     => req('/books', { method: 'POST',   body: JSON.stringify(data) }),
  updateBook: (id, data) => req(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBook: (id)       => req(`/books/${id}`, { method: 'DELETE' }),

  // Quotes
  getQuotes: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/quotes${qs ? `?${qs}` : ''}`);
  },
  createQuote: (data)     => req('/quotes', { method: 'POST',   body: JSON.stringify(data) }),
  updateQuote: (id, data) => req(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuote: (id)       => req(`/quotes/${id}`, { method: 'DELETE' }),

  // Stats
  getStats: () => req('/stats'),

  // Collections
  getCollections:           ()              => req('/collections'),
  createCollection:         (name)         => req('/collections', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteCollection:         (id)           => req(`/collections/${id}`, { method: 'DELETE' }),
  getBookCollections:       (bookId)       => req(`/collections/book/${bookId}`),
  addBookToCollection:      (colId, bookId) => req(`/collections/${colId}/books`, { method: 'POST', body: JSON.stringify({ book_id: bookId }) }),
  removeBookFromCollection: (colId, bookId) => req(`/collections/${colId}/books/${bookId}`, { method: 'DELETE' }),
};
