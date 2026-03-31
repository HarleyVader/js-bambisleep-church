# Express Socket.IO Chat Application

This project is a real-time chat application built with Express.js, Socket.IO, and MongoDB. It allows users to send and receive messages in real-time.

## Features

- Real-time messaging using Socket.IO
- MongoDB for message storage
- Simple REST API for sending and retrieving messages
- Basic logging utility

## Project Structure

```
express-socketio-chat
├── src
│   ├── app.js                # Initializes the Express application and sets up middleware
│   ├── server.js             # Entry point for the server
│   ├── config
│   │   └── db.js            # Database connection logic for MongoDB
│   ├── controllers
│   │   └── chatController.js # Handles chat-related operations
│   ├── models
│   │   └── Message.js        # Defines the Message model using Mongoose
│   ├── routes
│   │   └── chat.js           # Sets up chat-related API routes
│   ├── sockets
│   │   └── chatSocket.js     # Manages Socket.IO events for chat
│   └── utils
│       └── logger.js         # Provides logging utility functions
├── package.json              # npm configuration file
├── .env.example              # Template for environment variables
└── README.md                 # Project documentation
```

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/BambiSleepChurch/bambisleep-church.git
   cd bambisleep-church/express-socketio-chat
   ```

2. Install the dependencies:

   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` template and configure your MongoDB connection string.

## Usage

To start the server, run:

```
npm start
```

The server will be running on `http://localhost:3000`.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.