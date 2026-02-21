# Booky Web Application 📚

Welcome to **Booky**, a modern library management and book exploration web application! This guide will help you understand how to navigate and use the platform.

## 🚀 Getting Started

To explore Booky, simply open the application in your browser. The platform is designed to be intuitive for both casual readers and administrators.

### 📖 For Readers (Users)

As a regular user, you have access to a rich catalog of books and community features:

1. **Browse & Search**
   - **Home Page**: Discover highlighted books, browse by popular categories, see latest additions, and locate popular authors.
   - **Book Explorer (`/books`)**: Use the dedicated exploration page to search for specific titles and filter results by Category or Rating. The interface is fully responsive, offering a sidebar on desktop and a slide-out drawer on mobile.
   - **Search Bar**: The top navigation bar allows you to quickly search for books from anywhere in the app. **Search Functionality**: Type in the top navigation search bar and press enter. It should navigate to /books?q=[text] and filter the list accordingly.

2. **Book Details & Engagement**
   - **Book Pages**: Click on any book to see its full synopsis, availability (total and available copies), and author information.
   - **Reviews**: Read reviews from other users and leave your own 1-5 star rating and comment (requires login).

3. **Borrowing & Cart**
   - **Add to Cart**: If a book has available copies, add it to your cart.
   - **Checkout**: Once ready, proceed to your cart to confirm your borrowing request.
   - **My Loans (`/my-loans`)**: Track your active, overdue, and returned books directly from your profile.

4. **User Profile**
   - **Profile Management (`/profile`)**: Update your personal details and upload a custom profile avatar.

---

### 🛡️ For Administrators (Admins)

Administrators have access to a powerful backend dashboard to manage the library's ecosystem.

1. **Admin Dashboard (`/admin`)**
   - Access the dashboard via the dropdown menu on your profile avatar (if you have an `ADMIN` role).
   - View high-level statistics: Total Books, Total Loans, User count, and Revenue/Penalty metrics.

2. **Inventory Management**
   - **Books (`/admin/books`)**: Add new books, update stock, and manage existing titles.
   - **Authors (`/admin/authors`)**: Create and edit author profiles, including uploading their profile photos and writing their biographies so users can learn more about them.
   - **Categories (`/admin/categories`)**: Manage the genres and categorizations available in the system.

3. **User & Loan Management**
   - **Users (`/admin/users`)**: Monitor registered users and their roles.
   - **Loans (`/admin/loans`)**: Track all borrowing activity across the platform, mark books as returned, and monitor overdue items.

## 🛠️ Technical Overview

Booky is built with a modern, responsive stack:

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: Redux Toolkit (auth/ui state), React Query (server state & caching)
- **Routing**: React Router DOM

Enjoy exploring the world of books with Booky!
