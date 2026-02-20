import axios from 'axios';

const api = axios.create({
  baseURL: 'https://library-backend-production-b9cf.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

async function run() {
  try {
    const email = 'test' + Date.now() + '@test.com';
    const password = 'password123';

    // 1. Register
    await api.post('/api/auth/register', {
      name: 'testuser',
      email,
      password,
    });

    // 2. Login
    const loginRes = await api.post('/api/auth/login', { email, password });
    const token = loginRes.data.data
      ? loginRes.data.data.token
      : loginRes.data.token;

    // 3. Get books
    const booksRes = await api.get('/api/books');
    const books = booksRes.data.data.books || booksRes.data.data;
    const book = books.find((b) => b.availableCopies > 0);

    if (!book) return;
    const bookId = book.id;

    const testPayload = async (payload, label) => {
      try {
        await api.post(
          '/api/cart/items',
          { bookId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const cartRes = await api.get('/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cartItemId = cartRes.data.data.items[0].id;

        const reqPayload = { itemIds: [cartItemId], ...payload };
        const checkout = await api.post('/api/loans/from-cart', reqPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const loan =
          checkout.data.data[0] ||
          checkout.data.data.loans?.[0] ||
          checkout.data.data;
        console.log(`With ${label}:`, loan?.dueAt);

        await api.patch(
          `/api/loans/${loan.id || loan.loans?.[0]?.id}/return`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        console.error(`Failed with ${label}`);
      }
    };

    await testPayload({ borrowDuration: 10 }, 'borrowDuration (no borrowDate)');
    await testPayload(
      { borrowDate: '2026-02-21', borrowDuration: 10 },
      'borrowDate + borrowDuration'
    );
    await testPayload(
      { borrowDate: '2026-02-21', days: 10 },
      'borrowDate + days'
    );
    await testPayload(
      { borrowDate: '2026-02-21', period: 10 },
      'borrowDate + period'
    );
  } catch (err) {
    console.error('Main error:', err.message);
  }
}

run();
