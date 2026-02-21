// ────────────────────────────────────────────────────────────
// Shared TypeScript interfaces — matches API contract
// ────────────────────────────────────────────────────────────

// ── Auth ──────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  profilePhoto?: string | null;
  role: 'USER' | 'ADMIN';
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ── Books ─────────────────────────────────────────────────
export interface Book {
  id: number;
  title: string;
  description: string | null;
  isbn: string;
  publishedYear: number | null;
  coverImage: string | null;
  rating: number;
  reviewCount: number;
  totalCopies: number;
  availableCopies: number;
  borrowCount: number;
  authorId: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  pages?: number;
  author?: Author;
  category?: Category;
  reviews?: Review[];
}

// ── Authors ───────────────────────────────────────────────
export interface Author {
  id: number;
  name: string;
  bio?: string | null;
  profilePhoto?: string | null;
  bookCount?: number;
  accumulatedScore?: number;
}

// ── Categories ────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
}

// ── Loans ─────────────────────────────────────────────────
export interface Loan {
  id: number;
  bookId: number;
  userId: number;
  status: 'BORROWED' | 'LATE' | 'RETURNED';
  displayStatus?: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string | null;
  durationDays?: number;
  book?: Book;
  borrower?: User;
}

// ── Reviews ───────────────────────────────────────────────
export interface Review {
  id: number;
  bookId: number;
  userId: number;
  star: number;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: Pick<User, 'id' | 'name' | 'profilePhoto'>;
  book?: Pick<Book, 'id' | 'title' | 'coverImage' | 'author'>;
}

export interface CreateReviewRequest {
  bookId: number;
  star: number;
  comment?: string;
}

// ── Cart ──────────────────────────────────────────────────
export interface CartItem {
  id: number;
  bookId: number;
  book?: Book;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  itemCount: number;
}

// ── Pagination ────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── API Filter params ─────────────────────────────────────
export interface BookFilters {
  q?: string;
  categoryId?: number;
  authorId?: number;
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface LoanFilters {
  status?: 'all' | 'active' | 'returned' | 'overdue';
  q?: string;
  page?: number;
  limit?: number;
}

// ── Admin ─────────────────────────────────────────────────
export interface BookInput {
  title: string;
  authorName: string;
  categoryId: number;
  isbn: string;
  publishedYear: number;
  totalCopies: number;
  description: string;
  coverImage: string;
}
