# 💰 Money Manager

A personal finance management application built with React, TypeScript, and Firebase. Track your income, expenses, and transfers across multiple accounts with budgeting and reporting features.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12-orange?logo=firebase)
![Vite](https://img.shields.io/badge/Vite-7-purple?logo=vite)

## ✨ Features

- **📊 Dashboard** - Overview of your financial health with balance summaries and charts
- **💳 Accounts** - Manage multiple accounts (bank, cash, e-wallet) with real-time balance tracking
- **💸 Transactions** - Record income, expenses, and transfers between accounts
- **📁 Categories** - Organize transactions with customizable categories
- **🎯 Budgets** - Set spending limits with daily/weekly/monthly periods and rollover options
- **📈 Reports** - Visualize your spending patterns with interactive charts
- **🔄 Recurring Transactions** - Automate regular income/expenses
- **🔐 Authentication** - Secure user authentication with Firebase Auth
- **☁️ Cloud Sync** - Real-time data sync with Firebase Firestore

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [Firebase](https://firebase.google.com/) account

### Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable the following services:
   - **Authentication**: Go to _Build > Authentication_ and enable your preferred sign-in method (e.g., Email/Password, Google)
   - **Firestore Database**: Go to _Build > Firestore Database_ and create a database in production mode
4. Get your Firebase configuration:
   - Go to _Project Settings_ (gear icon) > _General_
   - Scroll down to "Your apps" and click the web icon (`</>`) to add a web app
   - Register your app and copy the configuration values

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mbudit/money-manager.git
   cd money-manager
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   Fill in your Firebase credentials in `.env`:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Firestore Security Rules

For a secure setup, configure your Firestore security rules. Go to _Firestore Database > Rules_ and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🛠️ Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the development server         |
| `npm run build`   | Build for production                 |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint to check code quality     |

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Budgets/         # Budget-related components
│   ├── Categories/      # Category management
│   ├── Dashboard/       # Dashboard widgets
│   ├── Layout/          # App layout and navigation
│   ├── Reports/         # Charts and visualizations
│   ├── Transactions/    # Transaction forms and lists
│   └── UI/              # Generic UI components
├── context/             # React Context providers
│   ├── AuthContext.tsx  # Authentication state
│   └── MoneyContext.tsx # Financial data state
├── lib/                 # Utilities and configuration
│   └── firebase.ts      # Firebase initialization
├── pages/               # Page components
│   ├── Accounts.tsx
│   ├── Budgets.tsx
│   ├── Categories.tsx
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Reports.tsx
│   └── Transactions.tsx
├── types/               # TypeScript type definitions
│   └── index.ts
├── App.tsx              # Main app component with routing
└── main.tsx             # App entry point
```

## ☁️ Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add the environment variables in Vercel's project settings:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Deploy!

The included `vercel.json` handles SPA routing automatically.

### Other Platforms

For platforms like Netlify, Firebase Hosting, or others:

1. Run `npm run build` to create the `dist/` folder
2. Deploy the contents of `dist/`
3. Configure your platform to redirect all routes to `index.html` for SPA routing

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
