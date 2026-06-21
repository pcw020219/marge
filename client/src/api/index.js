const BASE = `${import.meta.env.VITE_API_URL || ''}/api`;

async function req(url, opts = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  return res.json();
}

export const api = {
  getBooks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/books${qs ? `?${qs}` : ''}`);
  },
  getBook:    (id)       => req(`/books/${id}`),
  createBook: (data)     => req('/books', { method: 'POST',   body: JSON.stringify(data) }),
  updateBook: (id, data) => req(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBook: (id)       => req(`/books/${id}`, { method: 'DELETE' }),

  getQuotes: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/quotes${qs ? `?${qs}` : ''}`);
  },
  createQuote: (data)     => req('/quotes', { method: 'POST',   body: JSON.stringify(data) }),
  updateQuote: (id, data) => req(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuote: (id)       => req(`/quotes/${id}`, { method: 'DELETE' }),

  getStats: () => req('/stats'),

  getCollections:            ()                  => req('/collections'),
  createCollection:          (name)              => req('/collections', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteCollection:          (id)                => req(`/collections/${id}`, { method: 'DELETE' }),
  getBookCollections:        (bookId)            => req(`/collections/book/${bookId}`),
  addBookToCollection:       (colId, bookId)     => req(`/collections/${colId}/books`, { method: 'POST', body: JSON.stringify({ book_id: bookId }) }),
  removeBookFromCollection:  (colId, bookId)     => req(`/collections/${colId}/books/${bookId}`, { method: 'DELETE' }),
};
