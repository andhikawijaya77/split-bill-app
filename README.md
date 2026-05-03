# 💰 Split Bill Auto Generator

A modern, mobile-first web app for splitting restaurant bills fairly among friends. No more calculator juggling or awkward math at the table!

## ✨ Features

### MVP (Current)
- ✅ **Session-based collaboration** - Create a session, share the code
- ✅ **Real-time sync** - Everyone sees updates instantly
- ✅ **Flexible item selection** - Use slider to select 10%-100% of any item
- ✅ **Auto-calculate** - Automatic tax & service fee calculation
- ✅ **Mobile-first UI** - Optimized for on-the-go use
- ✅ **PWA-ready** - Install as an app on your phone

### Coming Soon
- 📸 **OCR Receipt Scanning** - Take a photo, auto-extract items
- 💰 **Payment Tracking** - Track who paid and who owes
- 📤 **WhatsApp/Telegram Export** - Share summary with one tap
- 🌙 **Dark Mode** - Easy on the eyes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account (free tier works!)

### 1. Clone & Install

```bash
git clone <your-repo>
cd split-bill-app
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Start in **test mode** (we'll secure it later)
   - Choose a location close to your users
4. Get your web app credentials:
   - Go to Project Settings > General
   - Scroll down to "Your apps"
   - Click "Web" icon (</>) to add a web app
   - Copy the firebaseConfig object

### 3. Configure Environment

```bash
cp .env.local.template .env.local
```

Edit `.env.local` and fill in your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Testing on Mobile

### Option 1: Local Network (Same WiFi)

1. Find your computer's IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. On your phone, open: `http://YOUR_IP:3000`

### Option 2: Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables (same as `.env.local`)
5. Deploy!

Your app will be live at `https://your-app.vercel.app`

## 🏗️ Project Structure

```
split-bill-app/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page (create/join session)
│   └── session/[id]/      # Session view
├── components/            # React components
│   ├── receipt/          # Receipt-related components
│   └── session/          # Session-related components
├── lib/                  # Utilities & services
│   ├── firebase/        # Firebase config & functions
│   └── stores/          # Zustand state management
├── types/               # TypeScript type definitions
└── public/             # Static assets
```

## 🔒 Firebase Security Rules

Before going to production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Sessions - readable by anyone with the ID
    match /sessions/{sessionId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // People - readable, writable during join
    match /people/{personId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if false;
    }
    
    // Receipts - readable, writable by session participants
    match /receipts/{receiptId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Items - readable, writable by session participants
    match /items/{itemId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Selections - everyone can read/write (guest mode)
    match /selections/{selectionId} {
      allow read, write: if true;
    }
  }
}
```

## 📊 Data Model

### Collections

**sessions**
- `name`: string - Session name
- `createdAt`: timestamp
- `createdBy`: string - Creator's person ID
- `shareCode`: string - 6-character code

**people**
- `sessionId`: string
- `name`: string
- `color`: string - Hex color for UI
- `joinedAt`: timestamp

**receipts**
- `sessionId`: string
- `name`: string - Restaurant name
- `createdAt`: timestamp
- `taxRate`: number (optional) - e.g., 0.10 for 10%
- `serviceRate`: number (optional)
- `total`: number

**items**
- `receiptId`: string
- `name`: string
- `quantity`: number
- `unitPrice`: number - Pre-tax price
- `finalUnitPrice`: number - Post-tax price
- `totalPrice`: number
- `order`: number - Display order

**selections**
- `sessionId`: string
- `receiptId`: string
- `itemId`: string
- `personId`: string
- `percentage`: number - 0-quantity (e.g., 1.5 for 150% of one item)
- `amount`: number - Calculated cost
- `timestamp`: timestamp

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + React + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Firebase Firestore (real-time database)
- **Hosting**: Vercel (recommended)

## 🗺️ Roadmap

### Phase 1: Core MVP ✅
- [x] Session creation & joining
- [x] Manual receipt entry
- [x] Item selection with slider
- [x] Real-time sync
- [x] Mobile-responsive UI

### Phase 2: OCR Integration 🚧
- [ ] Receipt photo upload
- [ ] Google Vision API integration
- [ ] Parse items/prices/quantities
- [ ] Manual correction interface

### Phase 3: Polish ⏳
- [ ] Payment tracking
- [ ] WhatsApp/Telegram export
- [ ] PWA installation prompt
- [ ] Dark mode
- [ ] Multiple receipt support per session
- [ ] Edit/delete receipts
- [ ] Session history

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome!

## 📄 License

MIT License - feel free to use this for your own projects!

## 🙏 Credits

Built with ❤️ by Dhika for splitting bills with friends fairly.

---

**Questions?** Open an issue or reach out on Discord/Telegram!
