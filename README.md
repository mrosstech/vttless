# VTTless

A web-based Virtual Tabletop (VTT) application for playing tabletop RPGs like Dungeons & Dragons online with friends.

## Features

- **Campaign Management** - Create and manage RPG campaigns with friends
- **Interactive Game Board** - Real-time collaborative canvas with grid-based maps
- **Token System** - Drag-and-drop tokens for characters and NPCs
- **Real-time Multiplayer** - Live synchronization of all player actions
- **Asset Management** - Upload and manage map backgrounds and token images
- **Friend System** - Connect with friends and share campaigns
- **Role-based Permissions** - Game Master and Player roles

## Tech Stack

- **Frontend**: React.js with Chakra UI
- **Backend**: Node.js/Express
- **Database**: MongoDB
- **Real-time**: Socket.io
- **Authentication**: Passport.js with OAuth (Google, Facebook, GitHub)
- **File Storage**: AWS S3 integration

## Architecture

This is a monorepo with three main services:

- `client/` - React frontend application
- `backend/` - Express API server
- `eventserver/` - Socket.io server for real-time events

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- AWS S3 bucket (for file storage)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vttless
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables for each service (see individual service README files for details)

4. Start all services in development mode:
```bash
npm run dev
```

This will start:
- Frontend at `http://localhost:3000`
- Backend API at `http://localhost:5000`
- Event server at `http://localhost:3001`

### Individual Service Commands

- `npm run client` - Start frontend only
- `npm run backend` - Start backend API only
- `npm run eventserver` - Start event server only

## Usage

1. **Sign Up/Login** - Create an account or login with OAuth
2. **Add Friends** - Connect with other players
3. **Create Campaign** - Set up a new RPG campaign as Game Master
4. **Join Campaign** - Players join campaigns they're invited to
5. **Play** - Use the interactive canvas to move tokens and explore maps

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and not licensed for redistribution.