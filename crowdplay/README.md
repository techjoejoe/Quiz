# CrowdPlay - Live Quiz Game Platform

A real-time multiplayer quiz game platform similar to Kahoot, built with Firebase and React.

## Features

### MVP Features Implemented
- **Host Authentication**: Email/password login for hosts
- **Room Management**: Create rooms with custom questions and settings
- **Live Gaming**: Real-time quiz gameplay with automatic scoring
- **Player Experience**: Mobile-optimized interface for players
- **Question Types**: Multiple choice, True/False, Numeric, and Poll questions
- **Live Leaderboard**: Real-time score updates and rankings
- **QR Code Joining**: Players can scan QR codes to join games
- **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Functions, Storage)
- **Real-time**: Firestore listeners
- **Deployment**: Firebase Hosting

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install all dependencies
npm run install:all
```

### 2. Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com

2. Enable the following services:
   - Authentication (Email/Password provider)
   - Firestore Database
   - Cloud Functions
   - Cloud Storage
   - Hosting

3. Initialize Firebase in the project:
```bash
firebase login
firebase use --add
# Select your project and give it an alias
```

### 3. Environment Configuration

1. Copy the environment template:
```bash
cp client/.env.example client/.env
```

2. Add your Firebase configuration to `client/.env`:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

You can find these values in Firebase Console > Project Settings > General > Your apps > Web app

### 4. Development

Start the emulators and development server:

```bash
# Terminal 1: Start Firebase emulators
npm run emulators

# Terminal 2: Start React dev server
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Emulator UI: http://localhost:4000

### 5. Creating Your First Host User

Since the first user gets admin privileges, you'll need to create an initial host account:

1. Start the emulators
2. Navigate to http://localhost:3000/host/login
3. Use the Firebase Emulator UI (http://localhost:4000/auth) to create a test user
4. Or deploy the functions and use the Firebase Console to create the first user

### 6. Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
# Deploy everything
firebase deploy

# Or deploy specific services
npm run deploy:rules     # Firestore rules only
npm run deploy:functions # Cloud Functions only  
npm run deploy:hosting   # Frontend only
```

## Usage

### For Hosts

1. **Login**: Go to `/host/login` and sign in with your host account
2. **Create Game**: 
   - Click "Create New Game"
   - Add a title and questions
   - Configure settings (max players, time limits, points)
3. **Start Game**:
   - Share the 6-digit room code or QR code with players
   - Wait for players to join
   - Click "Start Game" when ready
4. **Control Game**:
   - Click "Reveal Results" after each question
   - Click "Next Question" to advance
   - Monitor the live leaderboard
   - End game when finished

### For Players

1. **Join Game**:
   - Go to the home page
   - Enter the 6-digit room code
   - Or scan the QR code
   - Enter your display name
2. **Play**:
   - Wait in the lobby for the game to start
   - Answer questions before time runs out
   - View your score and ranking after each question
   - See final results at the end

## Project Structure

```
crowdplay/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── lib/          # Firebase config
│   │   ├── pages/        # Route pages
│   │   └── types.ts      # TypeScript types
│   └── package.json
├── functions/             # Cloud Functions
│   ├── src/
│   │   ├── auth/         # Authentication functions
│   │   ├── room/         # Room management functions
│   │   ├── types.ts      # Shared types
│   │   └── utils.ts      # Utility functions
│   └── package.json
├── firebase.json         # Firebase configuration
├── firestore.rules       # Security rules
└── storage.rules         # Storage rules
```

## Security

- Firestore rules enforce proper access control
- Players can only modify their own data
- Hosts can only manage their own rooms
- Answers are write-once (no changing after submission)
- Room codes are randomly generated and unique

## Scaling Considerations

The MVP is designed to handle:
- Up to 150 concurrent players per room
- Up to 20 active rooms simultaneously
- P95 response time under 400ms

For larger scale:
- Implement sharded counters for player counts
- Use Cloud Tasks for async processing
- Consider regional deployment for global usage

## Future Enhancements

Planned features for future versions:
- Image-based questions
- Team mode
- Async play mode
- Advanced analytics and reporting
- Badge/achievement system
- Custom themes and branding
- Export results to CSV/Excel
- Integration with learning management systems

## Troubleshooting

### Common Issues

1. **"Room not found" error**: Ensure the room code is correct and the game hasn't ended
2. **Can't create host account**: Make sure Authentication is enabled in Firebase
3. **Functions not deploying**: Check Node.js version (must be 18+)
4. **Emulators not starting**: Ensure ports 5000, 5001, 8080, 9099, 9199 are available

### Debug Mode

To see detailed logs:
```bash
# For functions
firebase functions:log

# For emulators
firebase emulators:start --debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - feel free to use this project for educational or commercial purposes.

## Support

For issues or questions, please open an issue on GitHub or contact the maintainers.
