import axios from 'axios';

const api = axios.create({
  baseURL: 'https://library-backend-production-b9cf.up.railway.app'
});

async function run() {
  try {
    const res = await api.get('/api/authors');
    const authors = res.data.data.authors || res.data.data;
    if (authors && authors.length > 0) {
       console.log("First author:", JSON.stringify(authors[4], null, 2));
    }
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

run();
