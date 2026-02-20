import axios from 'axios';

const api = axios.create({
  baseURL: 'https://library-backend-production-b9cf.up.railway.app'
});

async function run() {
  try {
    const res = await api.get('/api/authors/popular');
    console.log("Popular:", JSON.stringify(res.data.data[0] || res.data.data.authors?.[0], null, 2));
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

run();
