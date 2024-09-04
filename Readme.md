# MODO - Loxone Light Control

This project is a web application for controlling Loxone smart home lights. It consists of a React-based frontend and a Node.js backend server.

## Project Structure

```
MODO/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── assets/
│   │   ├── App.tsx         # Main React component
│   │   ├── index.css
│   │   ├── main.tsx        # Entry point for React app
│   │   └── vite-env.d.ts
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
└── server/                 # Backend Node.js server
    ├── index.js            # Server entry point
    └── package.json
```

## Prerequisites

- Node.js (v18 or later recommended)
- pnpm (v6 or later)

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/kumard3/modo-mini-serve
   cd MODO
   ```

2. Install dependencies:
   ```
   cd client && pnpm install
   cd ../server && pnpm install
   ```

## Running the Application

1. Start the backend server:
   ```
   cd server
   pnpm dev
   ```
   The server will run on `http://localhost:3001`.

2. In a new terminal, start the frontend application:
   ```
   cd client
   pnpm dev
   ```
   The React app will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Features

- Real-time light control via WebSocket connection
- Toggle light on/off
- View server logs in the UI
- Responsive design using Tailwind CSS

## Technologies Used

- Frontend:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
- Backend:
  - Node.js
  - Express
  - WebSocket (ws library)
  - LxCommunicator (for Loxone integration)

## Configuration

- The Loxone Miniserver details are configured in the `server/index.js` file.
- Adjust the WebSocket URL in `client/src/App.tsx` if needed.
