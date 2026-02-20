# 📘 API Documentation

## Authentication
- **POST /api/auth/register** — Register new user  
- **POST /api/auth/login** — Login and get token  

---

## Books
- **GET /api/books** — List books (user) with filters: category, rating, search + pagination  
- **POST /api/books** — Create book (admin)  
- **GET /api/books/recommend** — Recommended books (by rating) with pagination  
- **GET /api/books/{id}** — Preview book detail (admin/list: author, category, cover, rating, reviewCount, totalCopies, reviews)  
- **PUT /api/books/{id}** — Update book (admin)  
- **DELETE /api/books/{id}** — Delete book (admin, blocked if active loans)  

---

## Authors
- **GET /api/authors** — List authors (optional `q` = search by name)  
- **POST /api/authors** — Create author (admin)  
- **GET /api/authors/popular** — Popular authors by accumulated rating (rating × reviewCount per book)  
- **GET /api/authors/{id}/books** — Books by author (with pagination)  
- **PUT /api/authors/{id}** — Update author (admin)  
- **DELETE /api/authors/{id}** — Delete author (admin, blocked if author still has books)  

---

## Categories
- **GET /api/categories** — List categories  
- **POST /api/categories** — Create category (admin)  
- **PUT /api/categories/{id}** — Update category (admin)  
- **DELETE /api/categories/{id}** — Delete category (admin, blocked if category has books)  

---

## Loans
- **POST /api/loans** — Borrow a book (user)  
- **PATCH /api/loans/{id}/return** — Return a book (admin or borrower)  
- **POST /api/loans/from-cart** — Confirm & Borrow (checkout from cart: itemIds, borrowDate, duration 3/5/10 days)  
- **GET /api/loans/my** — Borrowed list (user) with filters: All/Active/Returned/Overdue + pagination  

---

## Admin (Admin-only endpoints & dashboard)
- **GET /api/admin/books** — Book list (filter & pagination)  
- **POST /api/admin/loans** — Create a loan (admin)  
- **GET /api/admin/loans** — Borrowed list (filters: All/Active/Returned/Overdue, search, pagination)  
- **PATCH /api/admin/loans/{id}** — Update a loan (change dueAt or status)  
- **GET /api/admin/loans/overdue** — List overdue loans (not returned and past dueAt)  
- **GET /api/admin/overview** — Admin overview (totals, active/overdue loans, top borrowed books)  
- **GET /api/admin/users** — User list (search, pagination)  

---

## Me (User profile & personal data)
- **GET /api/me** — Get my profile + loan statistics  
- **PATCH /api/me** — Update my profile (name, phone, profile photo)  
- **GET /api/me/loans** — List my loans (active & history)  
- **GET /api/me/reviews** — My reviews (rating, comment, book, timestamp)  

---

## Reviews
- **POST /api/reviews** — Create or update my review for a book  
- **GET /api/reviews/book/{bookId}** — List reviews for a book  
- **DELETE /api/reviews/{id}** — Delete my review  

---

## Cart
- **GET /api/cart** — My cart (list of books)  
- **DELETE /api/cart** — Clear my cart  
- **GET /api/cart/checkout** — Checkout payload (User Information + Book List)  
- **POST /api/cart/items** — Add book to cart  
- **DELETE /api/cart/items/{itemId}** — Remove item from cart  

---

## Schemas

### Book
```json
{
  "id": integer,
  "title": string,
  "description": string (nullable),
  "isbn": string,
  "publishedYear": integer (nullable),
  "coverImage": string (nullable),
  "rating": number,
  "reviewCount": integer,
  "totalCopies": integer,
  "availableCopies": integer,
  "borrowCount": integer,
  "authorId": integer,
  "categoryId": integer,
  "createdAt": string($date-time),
  "updatedAt": string($date-time)
}
