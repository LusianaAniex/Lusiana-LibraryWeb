import axios from 'axios';
const api = axios.create({ baseURL: 'https://library-backend-production-b9cf.up.railway.app' });
async function run() {
  const res = await api.get('/api/books', { params: { pageSize: 100 } });
  const payload = res.data.data;
  const books = Array.isArray(payload) ? payload : (payload.books || []);
  
  console.log("Total books returned:", books.length);
  const authorCounts = {};
  books.forEach(b => {
      if (b.author?.id || b.authorId) {
          const id = b.author?.id || b.authorId;
          authorCounts[id] = (authorCounts[id] || 0) + 1;
      }
  });
  console.log("Author counts from books:", authorCounts);
}
run();
