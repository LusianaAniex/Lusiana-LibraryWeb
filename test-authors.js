import axios from 'axios';

const api = axios.create({
  baseURL: 'https://library-backend-production-b9cf.up.railway.app'
});

async function run() {
  try {
    const res = await api.get('/api/authors');
    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

run();
