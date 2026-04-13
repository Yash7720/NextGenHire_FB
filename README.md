# NextGenHire - Final Project

NextGenHire is a MERN stack application designed for recruitment and job management. It features a robust backend, a dynamic frontend, and real-time dashboard updates.

## 🚀 Features
- **Secure Authentication**: Admin and User login systems.
- **Project Submission**: Candidates can submit projects which are stored securely.
- **Admin Dashboard**: Real-time monitoring of candidates, jobs, and applications.
- **Real-time Updates**: Powered by Socket.io for immediate data synchronization.

## 🛠️ Tech Stack
- **Frontend**: React.js, Vite, Axios
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Real-time**: Socket.io
- **File Storage**: GridFS / Manual Streaming

## 📥 Installation

### Backend Setup
1. Navigate to the `backend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and configure your `MONGO_URI` and `JWT_SECRET`.
4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 License
This project is licensed under the ISC License.
