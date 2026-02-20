import axios from 'axios';

const api = axios.create({
  baseURL: 'https://library-backend-production-b9cf.up.railway.app',
});

async function run() {
  try {
    const res = await api.post('/api/auth/register', {
      name: 'testuser', email: 'test' + Date.now() + '@test.com', password: 'password123'
    });
    const token = res.data.data.token;
    
    // get books to find a valid bookId
    const booksRes = await api.get('/api/books');
    const bookId = booksRes.data.data.books[0].id;

    // add to cart
    await api.post('/api/cart/items', { bookId }, { headers: { Authorization: `Bearer ${token}` } });
    
    // get cart to find itemId
    const cartRes = await api.get('/api/cart', { headers: { Authorization: `Bearer ${token}` } });
    const cartItemId = cartRes.data.data.items[0].id;
    
    // checkout with duration
    const checkout1 = await api.post('/api/loans/from-cart', {
      itemIds: [cartItemId],
      borrowDate: '2026-02-21',
      duration: 10
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    console.log('With duration:', checkout1.data);
  } catch (err) {
    console.error('Error with duration:', err.response?.data || err.message);
  }

  try {
    const res = await api.post('/api/auth/register', {
      name: 'testuser2', email: 'test2' + Date.now() + '@test.com', password: 'password123'
    });
    const token = res.data.data.token;
    
    const booksRes = await api.get('/api/books');
    const bookId = booksRes.data.data.books[0].id;

    await api.post('/api/cart/items', { bookId }, { headers: { Authorization: `Bearer ${token}` } });
    
    const cartRes = await api.get('/api/cart', { headers: { Authorization: `Bearer ${token}` } });
    const cartItemId = cartRes.data.data.items[0].id;
    
    const checkout2 = await api.post('/api/loans/from-cart', {
      itemIds: [cartItemId],
      borrowDate: '2026-02-21',
      durationDays: 10
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    console.log('With durationDays:', checkout2.data);
  } catch (err) {
    console.error('Error with durationDays:', err.response?.data || err.message);
  }
}

run();
