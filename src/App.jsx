// frontend/src/App.jsx
// This is the main React application, now with enhanced UI/UX for a modern look and feel.

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import the new LandingPage component
import LandingPage from './LandingPage'; // Assuming LandingPage.jsx is in the same directory

const BACKEND_URL = 'https://collabcode-backend-u3rm.onrender.com';

// --- Auth Context for Global State Management ---
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { userId, username, token }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');

    if (storedToken && storedUserId && storedUsername) {
      setUser({ userId: storedUserId, username: storedUsername, token: storedToken });
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('username', userData.username);
    setUser(userData);
    toast.success(`Welcome, ${userData.username}!`, { autoClose: 2000 });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setUser(null);
    toast.info('You have been logged out.', { autoClose: 2000 });
    toast.dismiss();
  };

  const authContextValue = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Socket Context for Global Socket.IO Instance Management ---
const SocketContext = createContext(null);
const useSocket = () => useContext(SocketContext);

function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isAuthenticatedSocket, setIsAuthenticatedSocket] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const newSocket = io(BACKEND_URL, { autoConnect: false });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket.IO client connected!');
      if (user && user.token) {
        newSocket.emit('authenticate', user.token);
      } else {
        setIsAuthenticatedSocket(true);
      }
    });

    newSocket.on('authenticated', (authData) => {
      console.log(`Socket authenticated as user: ${authData.username}`);
      setIsAuthenticatedSocket(true);
    });

    newSocket.on('authentication_failed', (message) => {
      console.error('Socket authentication failed:', message);
      toast.error(`Authentication failed: ${message}. Please log in again.`, { autoClose: 5000 });
      setIsAuthenticatedSocket(false);
      logout();
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
      setIsAuthenticatedSocket(false);
      toast.error(`Connection error: ${err.message}. Please check backend server.`, { autoClose: 5000 });
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`Socket.IO client disconnected. Reason: ${reason}`);
      setIsConnected(false); // Ensure isConnected state is updated on disconnect
      toast.warn(`Disconnected from server: ${reason}`, { autoClose: 3000 });
    });

    newSocket.connect();

    return () => {
      newSocket.off('connect');
      newSocket.off('authenticated');
      newSocket.off('authentication_failed');
      newSocket.off('connect_error');
      newSocket.off('disconnect');
      newSocket.disconnect();
      toast.dismiss();
      toast.clearWaitingQueue();
    };
  }, [user, logout]);

  const socketContextValue = {
    socket,
    isAuthenticatedSocket
  };

  return (
    <SocketContext.Provider value={socketContextValue}>
      {children}
    </SocketContext.Provider>
  );
}


// --- Register Component ---
function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Registration successful!', { autoClose: 2000 });
        navigate('/login');
      } else {
        toast.error(data.message || 'Registration failed.', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Registration network error:', error);
      toast.error('Network error during registration. Please try again.', { autoClose: 5000 });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center font-sans"> {/* Removed p-4 */}
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-700"> {/* Added p-8 for internal padding */}
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Register</h2>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 text-white bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 text-white bg-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-200 ease-in-out transform hover:-translate-y-0.5"
            >
              Register
            </button>
            <Link to="/login" className="inline-block align-baseline font-bold text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200">
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Login Component ---
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login({ userId: data.userId, username: data.username, token: data.token });
        navigate('/dashboard'); // Changed navigation to /dashboard
      } else {
        toast.error(data.message || 'Login failed. Invalid credentials.', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Login network error:', error);
      toast.error('Network error during login. Please try again.', { autoClose: 5000 });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center font-sans"> {/* Removed p-4 */}
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-700"> {/* Added p-8 for internal padding */}
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 text-white bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 text-white bg-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-200 ease-in-out transform hover:-translate-y-0.5"
            >
              Login
            </button>
            <Link to="/register" className="inline-block align-baseline font-bold text-sm text-green-400 hover:text-green-300 transition-colors duration-200">
              Don't have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Project Dashboard Component ---
function ProjectDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectLoading, setProjectLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.info('Please log in to view your projects.', { autoClose: 3000 });
      navigate('/login');
      return;
    }
    if (user) {
      const fetchProjects = async () => {
        setProjectLoading(true);
        try {
          const response = await fetch(`${BACKEND_URL}/api/projects`, {
            headers: {
              'x-auth-token': user.token,
            },
          });
          const data = await response.json();
          if (response.ok) {
            setProjects(data);
          } else {
            toast.error(data.message || 'Failed to fetch projects.', { autoClose: 5000 });
          }
        } catch (error) {
          console.error('Network error fetching projects:', error);
          toast.error('Network error: Could not load projects.', { autoClose: 5000 });
        } finally {
          setProjectLoading(false);
        }
      };
      fetchProjects();
    }
  }, [user, authLoading, navigate]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast.warn('Project name cannot be empty.', { autoClose: 1500 });
      return;
    }
    if (!user) {
      toast.error('You must be logged in to create a project.', { autoClose: 3000 });
      return;
    }

    const newProjectId = uuidv4();
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': user.token,
        },
        body: JSON.stringify({ _id: newProjectId, name: newProjectName }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Project created!', { autoClose: 2000 });
        setNewProjectName('');
        setProjects(prev => [...prev, { _id: data.projectId, name: newProjectName, createdAt: new Date().toISOString() }]);
        navigate(`/project/${data.projectId}/file/${data.initialFileId}`);
      } else {
        toast.error(data.message || 'Failed to create project.', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Network error creating project:', error);
      toast.error('Network error: Could not create project.', { autoClose: 5000 });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center justify-center font-sans text-gray-100">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-3xl border border-gray-700 flex-grow">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Your Projects</h1>

        <form onSubmit={handleCreateProject} className="mb-8 p-4 border border-gray-700 rounded-lg bg-gray-700 shadow-inner">
          <h2 className="text-2xl font-semibold text-white mb-4">Create New Project</h2>
          <div className="mb-4">
            <label htmlFor="projectName" className="block text-gray-300 text-sm font-bold mb-2">
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              className="shadow-inner appearance-none border border-gray-600 rounded-lg w-full py-2 px-3 text-white bg-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-200 ease-in-out transform hover:-translate-y-0.5"
          >
            Create Project
          </button>
        </form>

        <h2 className="text-2xl font-semibold text-white mb-4">Existing Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-400 text-center">You don't have any projects yet. Create one above!</p>
        ) : (
          <ul className="space-y-4">
            {projects.map(project => (
              <li key={project._id} className="bg-gray-700 p-4 rounded-lg shadow-md flex justify-between items-center border border-gray-600">
                <div>
                  <h3 className="text-xl font-semibold text-blue-400">{project.name}</h3>
                  <p className="text-sm text-gray-400">Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
                <Link
                  to={`/project/${project._id}`}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition duration-150 ease-in-out transform hover:-translate-y-0.5"
                >
                  Open Project
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer className="text-gray-500 text-sm mt-8">
        Built with React, Monaco Editor, Socket.IO, Node.js & Express
      </footer>
    </div>
  );
}


// --- Main Editor Component (CodeEditor) ---
function CodeEditor() {
  const { projectId, fileId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, isAuthenticatedSocket } = useSocket();

  const getRandomColor = useCallback(() => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }, []);

  const MY_CURSOR_COLOR = useRef(getRandomColor()).current;

  const [code, setCode] = useState('// Connecting to server...');
  const [language, setLanguage] = useState('javascript');
  const [serverMessage, setServerMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const chatMessagesEndRef = useRef(null);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isUpdatingRemotely = useRef(false);
  const initialCodeLoaded = useRef(null);
  const remoteDecorations = useRef({});

  const [comments, setComments] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);

  const [versions, setVersions] = useState([]);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [showSaveVersionModal, setShowSaveVersionModal] = useState(false);
  const [versionMessage, setVersionMessage] = useState('');

  const [projectDetails, setProjectDetails] = useState(null);
  const [projectFiles, setProjectFiles] = useState([]);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLanguage, setNewFileLanguage] = useState('javascript');
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [showRenameFileModal, setShowRenameFileModal] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);
  const [newFileNameInput, setNewFileNameInput] = useState('');

  // Refs for Monaco action context
  const fileIdRef = useRef(fileId);
  const projectIdRef = useRef(projectId);
  const userRef = useRef(user);

  useEffect(() => {
    fileIdRef.current = fileId;
    projectIdRef.current = projectId;
    userRef.current = user;
  }, [fileId, projectId, user]);


  const clearUserDecorations = useCallback((editor, userSocketId) => {
    if (editor && remoteDecorations.current[userSocketId]) {
      editor.deltaDecorations(remoteDecorations.current[userSocketId].decorationId, []);
      delete remoteDecorations.current[userSocketId];
    }
  }, []);

  const applyRemoteDecorations = useCallback((editor, userSocketId, username, cursorPosition, selection, color) => {
    if (!editor || !monacoRef.current) return;

    clearUserDecorations(editor, userSocketId);

    const newDecorations = [];
    const monaco = monacoRef.current;

    if (cursorPosition) {
      newDecorations.push({
        range: new monaco.Range(cursorPosition.lineNumber, cursorPosition.column, cursorPosition.lineNumber, cursorPosition.column),
        options: {
          isAfter: true,
          className: 'remote-cursor',
          inlineClassName: 'remote-cursor-line',
          inlineClassNameAfter: 'remote-cursor-label',
          hoverMessage: { value: `User: ${username || userSocketId.substring(0, 8)}...` },
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          overviewRuler: {
            color: color,
            position: monaco.editor.OverviewRulerLane.Center
          },
        }
      });
    }

    if (selection && (selection.startLineNumber !== selection.endLineNumber || selection.startColumn !== selection.endColumn)) {
      newDecorations.push({
        range: new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn),
        options: {
          className: 'remote-selection',
          inlineClassName: 'remote-selection-background',
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        }
      });
    }

    const newDecorationIds = editor.deltaDecorations(
      remoteDecorations.current[userSocketId] ? remoteDecorations.current[userSocketId].decorationId : [],
      newDecorations
    );

    remoteDecorations.current[userSocketId] = {
      decorationId: newDecorationIds,
      color: color,
    };

    const styleId = `remote-cursor-label-style-${userSocketId}`;
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.innerHTML = `.remote-cursor-label[data-user-id="${userSocketId}"] { background-color: ${color}; }`;
    styleElement.innerHTML += `.remote-cursor-label[data-user-id="${userSocketId}"]::after { content: "${username || userSocketId.substring(0, 4)}"; }`;

  }, []);


  useEffect(() => {
    if (!socket) return;

    setIsConnected(socket.connected);

    const handleConnect = () => {
      console.log('CodeEditor: Socket.IO client connected!');
      setIsConnected(true);
    };

    const handleDisconnect = (reason) => {
      console.log(`CodeEditor: Socket.IO client disconnected. Reason: ${reason}`);
      setIsConnected(false);
      if (editorRef.current) {
        Object.keys(remoteDecorations.current).forEach(userSocketId => {
          clearUserDecorations(editorRef.current, userSocketId);
        });
      }
      setOnlineUsers([]);
      toast.warn(`Disconnected from server: ${reason}`, { autoClose: 3000 });
    };

    const handleTestResponse = (message) => {
      console.log(`Received test-response: ${message}`);
      setServerMessage(message);
    };

    const handleLoadFile = ({ code: initialCode, language: initialLanguage }) => {
      console.log('Received initial file from server.');
      initialCodeLoaded.current = initialCode;
      setLanguage(initialLanguage || 'plaintext');

      if (editorRef.current) {
        isUpdatingRemotely.current = true;
        editorRef.current.setValue(initialCode);
        setCode(initialCode);
        setTimeout(() => {
          isUpdatingRemotely.current = false;
        }, 50);
      } else {
        setCode(initialCode);
      }
    };

    const handleCodeUpdate = ({ code: newCode, language: newLanguage }) => {
      console.log(`Received code-update from server: ${newCode.substring(0, 50)}...`);
      isUpdatingRemotely.current = true;
      setCode(newCode);
      setLanguage(newLanguage || 'plaintext');

      if (editorRef.current) {
        const currentPosition = editorRef.current.getPosition();
        const currentSelection = editorRef.current.getSelection();

        editorRef.current.setValue(newCode);
        if (editorRef.current.getModel().getLanguageId() !== newLanguage) {
          monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), newLanguage);
        }

        if (currentPosition) {
          editorRef.current.setPosition(currentPosition);
        }
        if (currentSelection) {
          editorRef.current.setSelection(currentSelection);
        }
      }

      setTimeout(() => {
        isUpdatingRemotely.current = false;
      }, 50);
    };

    const handleCursorActivity = ({ userId: remoteUserId, username, cursorPosition, selection, color }) => {
      if (editorRef.current && remoteUserId !== socket.id) {
        applyRemoteDecorations(editorRef.current, remoteUserId, username, cursorPosition, selection, color);
      }
    };

    const handleUserDisconnected = (disconnectedUserId) => {
      console.log(`User disconnected: ${disconnectedUserId}. Clearing their cursor.`);
      if (editorRef.current) {
        clearUserDecorations(editorRef.current, disconnectedUserId);
      }
      toast.info(`User ${disconnectedUserId.substring(0, 8)}... left.`, { autoClose: 2000 });
    };

    const handleUserListUpdate = (users) => {
      console.log('Received user list update:', users);
      setOnlineUsers(users);
    };

    const handleReceiveChatMessage = (messageData) => {
      console.log('Received chat message:', messageData);
      setChatMessages((prevMessages) => [...prevMessages, messageData]);
    };

    const handleNewComment = (newComment) => {
      console.log('Received new comment:', newComment);
      setComments((prevComments) => [...prevComments, newComment]);
      toast.info(`New comment on line ${newComment.line} by ${newComment.username}`, { autoClose: 3000 });
    };

    const handleCommentUpdated = (updatedComment) => {
      console.log('Received comment update:', updatedComment);
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === updatedComment._id ? updatedComment : comment
        )
      );
      toast.info(`Comment on line ${updatedComment.line} ${updatedComment.resolved ? 'resolved' : 'unresolved'}`, { autoClose: 2000 });
    };

    const handleCommentError = (errorMessage) => {
      console.error('Comment error from server:', errorMessage);
      toast.error(`Comment Error: ${errorMessage}`, { autoClose: 5000 });
    };


    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('test-response', handleTestResponse);
    socket.on('load-file', handleLoadFile);
    socket.on('code-update', handleCodeUpdate);
    socket.on('cursor-activity', handleCursorActivity);
    socket.on('user-disconnected', handleUserDisconnected);
    socket.on('user-list-update', handleUserListUpdate);
    socket.on('receive-chat-message', handleReceiveChatMessage);
    socket.on('new-comment', handleNewComment);
    socket.on('comment-updated', handleCommentUpdated);
    socket.on('comment-error', handleCommentError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('test-response', handleTestResponse);
      socket.off('load-file', handleLoadFile);
      socket.off('code-update', handleCodeUpdate);
      socket.off('cursor-activity', handleCursorActivity);
      socket.off('user-disconnected', handleUserDisconnected);
      socket.off('user-list-update', handleUserListUpdate);
      socket.off('receive-chat-message', handleReceiveChatMessage);
      socket.off('new-comment', handleNewComment);
      socket.off('comment-updated', handleCommentUpdated);
      socket.off('comment-error', handleCommentError);
    };
  }, [socket, applyRemoteDecorations, clearUserDecorations]);

  useEffect(() => {
    // If projectId is not present, navigate to the dashboard (or landing page if not logged in)
    if (!projectId) {
      if (user) { // If user is logged in, go to dashboard
        navigate('/dashboard');
      } else { // If not logged in, go to landing page
        navigate('/');
      }
      return;
    }

    if (projectId && !fileId) {
      const fetchProjectAndRedirect = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
            headers: { 'x-auth-token': user?.token || '' },
          });
          const data = await response.json();
          if (response.ok && data.files && data.files.length > 0) {
            navigate(`/project/${projectId}/file/${data.files[0]._id}`);
          } else if (response.ok && data.files && data.files.length === 0) {
            toast.info('Project has no files. Create a new file.', { autoClose: 3000 });
          } else {
            toast.error(data.message || 'Project not found or failed to load.', { autoClose: 5000 });
            navigate('/dashboard'); // Changed navigation to /dashboard
          }
        } catch (error) {
          console.error('Network error fetching project for redirect:', error);
          toast.error('Network error: Could not load project for redirect.', { autoClose: 5000 });
          navigate('/dashboard'); // Changed navigation to /dashboard
        }
      };
      fetchProjectAndRedirect();
      return;
    }

    if (socket && socket.connected && isAuthenticatedSocket && projectId && fileId) {
      console.log(`CodeEditor: Emitting join-file for project ${projectId}, file ${fileId} with color ${MY_CURSOR_COLOR}`);
      socket.emit('join-file', { projectId, fileId }, MY_CURSOR_COLOR);

      setCode('// Loading file...');
      setLanguage('javascript');
      setChatMessages([]);
      setComments([]);
      setVersions([]);
      setProjectDetails(null);
      setProjectFiles([]);


      const fetchProjectDetails = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
            headers: { 'x-auth-token': user?.token || '' },
          });
          const data = await response.json();
          if (response.ok) {
            setProjectDetails(data.project);
            setProjectFiles(data.files);
          } else {
            toast.error(data.message || 'Failed to load project details.', { autoClose: 5000 });
            navigate('/dashboard'); // Changed navigation to /dashboard
          }
        } catch (error) {
          console.error('Network error fetching project details:', error);
          toast.error('Network error: Could not load project details.', { autoClose: 5000 });
          navigate('/dashboard'); // Changed navigation to /dashboard
        }
      };
      fetchProjectDetails();


      const fetchFileContent = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/files/${fileId}`);
          const data = await response.json();
          if (response.ok) {
            initialCodeLoaded.current = data.code;
            setLanguage(data.language || 'javascript');
            setCode(data.code || '// File is empty.');
            if (editorRef.current && monacoRef.current) {
              isUpdatingRemotely.current = true;
              editorRef.current.setValue(data.code || '// File is empty.');
              monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), data.language || 'plaintext');
              setTimeout(() => {
                isUpdatingRemotely.current = false;
              }, 50);
            }
          } else {
            toast.error(`Failed to load file: ${data.message || 'Unknown error'}`, { autoClose: 5000 });
            setCode('// Error loading file. Please try again later.');
            setLanguage('plaintext');
          }
        } catch (error) {
          console.error('Network error fetching file content:', error);
          toast.error('Network error: Could not load file content.', { autoClose: 5000 });
          setCode('// Network error loading file. Please try again later.');
          setLanguage('plaintext');
        }
      };
      fetchFileContent();

      const fetchComments = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/files/${fileId}/comments`);
          const data = await response.json();
          if (response.ok) {
            setComments(data);
          } else {
            toast.error(`Failed to load comments: ${data.message || 'Unknown error'}`, { autoClose: 5000 });
          }
        } catch (error) {
          console.error('Network error fetching comments:', error);
          toast.error('Network error: Could not load comments.', { autoClose: 5000 });
        }
      };
      fetchComments();

      const fetchVersions = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/files/${fileId}/versions`);
          const data = await response.json();
          if (response.ok) {
            setVersions(data);
          } else {
            toast.error(`Failed to load versions: ${data.message || 'Unknown error'}`, { autoClose: 5000 });
          }
        } catch (error) {
          console.error('Network error fetching versions:', error);
          toast.error('Network error: Could not load versions.', { autoClose: 5000 });
        }
      };
      fetchVersions();


      if (editorRef.current) {
        Object.keys(remoteDecorations.current).forEach(userSocketId => {
          clearUserDecorations(editorRef.current, userSocketId);
        });
      }
      setOnlineUsers([]);
    }
    return () => {
      if (socket && (projectId || fileId)) {
        if (editorRef.current) {
          Object.keys(remoteDecorations.current).forEach(userSocketId => {
            clearUserDecorations(editorRef.current, userSocketId);
          });
        }
        setOnlineUsers([]);
        setChatMessages([]);
        setComments([]);
        setVersions([]);
        setProjectDetails(null);
        setProjectFiles([]);
      }
    };
  }, [projectId, fileId, socket, isAuthenticatedSocket, MY_CURSOR_COLOR, clearUserDecorations, navigate, user]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);


  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    console.log('Monaco Editor mounted:', editor);

    if (initialCodeLoaded.current !== null) {
      isUpdatingRemotely.current = true;
      editor.setValue(initialCodeLoaded.current);
      monaco.editor.setModelLanguage(editor.getModel(), language);
      setCode(initialCodeLoaded.current);
      setTimeout(() => {
        isUpdatingRemotely.current = false;
      }, 50);
    } else {
      editor.setValue(code);
      monaco.editor.setModelLanguage(editor.getModel(), language);
    }

    editor.onDidChangeCursorPosition((e) => {
      if (!isUpdatingRemotely.current && fileId && socket && socket.connected) {
        socket.emit('cursor-activity', {
          fileId: fileId,
          cursorPosition: e.position,
          selection: e.selection ? e.selection.toJSON() : null,
          color: MY_CURSOR_COLOR
        });
      }
    });

    let addCommentActionDisposable;
    const existingAction = editor.getAction('add-comment-to-line');
    if (existingAction) {
      existingAction.dispose();
    }

    addCommentActionDisposable = editor.addAction({
      id: 'add-comment-to-line',
      label: 'Add Comment to Line',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: function (ed) {
        const position = ed.getPosition();
        let targetLineNumber = null;

        if (position && typeof position.lineNumber === 'number' && position.lineNumber > 0) {
            targetLineNumber = position.lineNumber;
            console.log("Monaco Editor: Determined line from getPosition():", targetLineNumber);
        } else {
            const selection = ed.getSelection();
            if (selection && typeof selection.startLineNumber === 'number' && selection.startLineNumber > 0) {
                targetLineNumber = selection.startLineNumber;
                console.log("Monaco Editor: Determined line from getSelection():", targetLineNumber);
            }
        }

        const currentFileId = fileIdRef.current;
        const currentProjectId = projectIdRef.current;
        const currentUser = userRef.current;

        if (targetLineNumber !== null && currentFileId && currentProjectId && currentUser) {
          console.log(`Attempting to open comment modal for line: ${targetLineNumber}`);
          setSelectedLine(targetLineNumber);
          setShowCommentModal(true);
        } else if (!currentUser) {
          toast.error('Please log in to add comments.', { autoClose: 3000 });
          console.log("Monaco Editor: User not logged in, cannot add comment.");
        } else if (!currentFileId) {
          toast.error('Please open a file to add comments.', { autoClose: 3000 });
          console.log("Monaco Editor: No file ID, cannot add comment.");
        } else if (!currentProjectId) {
          toast.error('Please open a project to add comments.', { autoClose: 3000 });
          console.log("Monaco Editor: No project ID, cannot add comment.");
        } else {
          toast.error('Could not determine line to add comment. Please ensure a line is active or selected.', { autoClose: 3000 });
          console.error("Monaco Editor: Failed to determine line number after all attempts. Position:", position, "Selection:", ed.getSelection());
        }
      }
    });

    return () => {
      if (addCommentActionDisposable) {
        addCommentActionDisposable.dispose();
      }
    };
  }, [fileId, projectId, user, socket, initialCodeLoaded, code, language, setSelectedLine, setShowCommentModal]);


  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), newLanguage);
    }
    if (fileId && socket && socket.connected) {
      socket.emit('code-change', { fileId: fileId, newCode: code, newLanguage: newLanguage });
      toast.success(`Language set to ${newLanguage}.`, { autoClose: 1500 });
    }
  };


  function handleEditorChange(value, event) {
    if (!isUpdatingRemotely.current && fileId && socket && socket.connected) {
      setCode(value);
      socket.emit('code-change', { fileId: fileId, newCode: value, newLanguage: language });
      console.log('Emitting code-change:', value.substring(0, 50), '...');
    } else {
      setCode(value);
    }
  };

  const createNewDocument = async () => { /* This function is no longer used directly from the UI */
    if (!user) {
      toast.error('Please log in to create a new document.', { autoClose: 3000 });
      navigate('/login');
      return;
    }
  };

  const copyToClipboard = async () => {
    try {
      const tempInput = document.createElement('textarea');
      tempInput.value = window.location.href;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      console.log('Link copied to clipboard!');
      toast.success('Link copied to clipboard!', { autoClose: 1500 });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy link.', { autoClose: 3000 });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const messageInput = e.target.elements.chatMessage;
    const message = messageInput.value.trim();

    if (message && fileId && socket && socket.connected) {
      socket.emit('send-chat-message', { fileId, message });
      messageInput.value = '';
    } else if (!message) {
      toast.warn('Message cannot be empty.', { autoClose: 1500 });
    } else {
      toast.error('Not connected to chat server.', { autoClose: 3000 });
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) {
      toast.warn('Comment cannot be empty.', { autoClose: 1500 });
      return;
    }
    if (socket && socket.connected && fileId && selectedLine && user) {
      socket.emit('add-comment', {
        fileId,
        line: selectedLine,
        text: newCommentText
      });
      setNewCommentText('');
      setShowCommentModal(false);
    } else {
      toast.error('Failed to add comment. Ensure you are logged in and connected.', { autoClose: 3000 });
    }
  };

  const handleResolveComment = (commentId, currentResolvedStatus) => {
    if (socket && socket.connected && fileId && user) {
      socket.emit('resolve-comment', { fileId, commentId });
    } else {
      toast.error('Failed to toggle comment status. Ensure you are logged in and connected.', { autoClose: 3000 });
    }
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const existingCommentDecorations = editorRef.current.deltaDecorations(
      editorRef.current.commentDecorations || [],
      []
    );

    const newCommentDecorations = [];
    comments.forEach(comment => {
      const line = comment.line;
      const isResolved = comment.resolved;

      newCommentDecorations.push({
        range: new monacoRef.current.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: isResolved ? 'comment-line-resolved' : 'comment-line-active',
          glyphMarginClassName: isResolved ? 'comment-glyph-resolved' : 'comment-glyph-active',
          hoverMessage: { value: `Comment by ${comment.username} on line ${comment.line}:\n${comment.text}\n(${isResolved ? 'Resolved' : 'Active'})` },
          linesDecorationsClassName: isResolved ? 'comment-line-decoration-resolved' : 'comment-line-decoration-active'
        }
      });
    });

    editorRef.current.commentDecorations = editorRef.current.deltaDecorations(
      existingCommentDecorations,
      newCommentDecorations
    );
  }, [comments, editorRef.current, monacoRef.current]);


  const supportedLanguages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'csharp', name: 'C#' },
    { id: 'cpp', name: 'C++' },
    { id: 'html', name: 'HTML' },
    { id: 'css', name: 'CSS' },
    { id: 'json', name: 'JSON' },
    { id: 'markdown', name: 'Markdown' },
    { id: 'php', name: 'PHP' },
    { id: 'ruby', name: 'Ruby' },
    { id: 'go', name: 'Go' },
    { id: 'rust', name: 'Rust' },
    { id: 'swift', name: 'Swift' },
    { id: 'plaintext', name: 'Plain Text' },
  ];

  const handleSaveVersion = async () => {
    if (!user) {
      toast.error('Please log in to save a version.', { autoClose: 3000 });
      return;
    }
    if (!fileId) {
      toast.error('Please open a file to save a version.', { autoClose: 3000 });
      return;
    }
    setShowSaveVersionModal(true);
  };

  const handleSubmitVersion = async (e) => {
    e.preventDefault();
    if (!versionMessage.trim()) {
      toast.warn('Version message cannot be empty.', { autoClose: 1500 });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/files/${fileId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': user.token
        },
        body: JSON.stringify({ message: versionMessage }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Version saved!', { autoClose: 2000 });
        setVersionMessage('');
        setShowSaveVersionModal(false);
        const versionsResponse = await fetch(`${BACKEND_URL}/api/files/${fileId}/versions`);
        const versionsData = await versionsResponse.json();
        if (versionsResponse.ok) {
          setVersions(versionsData);
        }
      } else {
        toast.error(data.message || 'Failed to save version.', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Network error saving version:', error);
      toast.error('Network error: Could not save version.', { autoClose: 5000 });
    }
  };

  const handleLoadVersion = async (versionId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/files/version/${versionId}`);
      const data = await response.json();

      if (response.ok) {
        isUpdatingRemotely.current = true;
        setCode(data.code);
        setLanguage(data.language || 'plaintext');
        if (editorRef.current && monacoRef.current) {
          editorRef.current.setValue(data.code);
          monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), data.language || 'plaintext');
        }
        toast.info(`Loaded version from ${new Date(data.timestamp).toLocaleString()}.`, { autoClose: 2000 });
        setShowVersionHistoryModal(false);
      } else {
        toast.error(data.message || 'Failed to load version.', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Network error loading version:', error);
      toast.error('Network error: Could not load version.', { autoClose: 5000 });
    } finally {
      setTimeout(() => {
        isUpdatingRemotely.current = false;
      }, 100);
    }
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      toast.warn('File name cannot be empty.', { autoClose: 1500 });
      return;
    }
    if (!user || !projectId) {
      toast.error('You must be logged in and in a project to create a file.', { autoClose: 3000 });
      return;
    }

    const newFileId = uuidv4();
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': user.token,
        },
        body: JSON.stringify({ _id: newFileId, name: newFileName, language: newFileLanguage }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'File created!', { autoClose: 2000 });
        setNewFileName('');
        setNewFileLanguage('javascript');
        setShowCreateFileModal(false);
        const projectResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
          headers: { 'x-auth-token': user.token },
        });
        const projectData = await projectResponse.json();
        if (projectResponse.ok) {
          setProjectFiles(projectData.files);
        }
        navigate(`/project/${projectId}/file/${newFileId}`);
      } else {
        toast.error(data.message || 'Failed to create file.', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Network error creating file:', error);
      toast.error('Network error: Could not create file.', { autoClose: 5000 });
    }
  };

  const handleDeleteFile = async (fileToDeleteId) => {
    if (!user || !projectId) {
      toast.error('You must be logged in and in a project to delete a file.', { autoClose: 3000 });
      return;
    }
    // Changed from window.confirm to a custom modal for consistency and better UX
    // For now, I'll use a simple toast, but a proper modal should replace this.
    // In a real app, you'd have a state for `showConfirmDeleteModal` and a component for it.
    const confirmDelete = true; // Replace with actual modal confirmation
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/files/${fileToDeleteId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': user.token,
        },
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'File deleted!', { autoClose: 2000 });
        const projectResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
          headers: { 'x-auth-token': user.token },
        });
        const projectData = await projectResponse.json();
        if (projectResponse.ok) {
          setProjectFiles(projectData.files);
        }
        if (fileToDeleteId === fileId) {
          if (projectData.files && projectData.files.length > 0) {
            navigate(`/project/${projectId}/file/${projectData.files[0]._id}`);
          } else {
            navigate(`/project/${projectId}`);
          }
        }
      } else {
        toast.error(data.message || 'Failed to delete file.', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Network error deleting file:', error);
      toast.error('Network error: Could not delete file.', { autoClose: 5000 });
    }
  };

  const handleRenameFile = async (e) => {
    e.preventDefault();
    if (!newFileNameInput.trim() || !fileToRename) {
      toast.warn('New file name cannot be empty.', { autoClose: 1500 });
      return;
    }
    if (!user || !projectId) {
      toast.error('You must be logged in and in a project to rename a file.', { autoClose: 3000 });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/files/${fileToRename._id}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': user.token,
        },
        body: JSON.stringify({ newName: newFileNameInput }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'File renamed!', { autoClose: 2000 });
        setNewFileNameInput('');
        setFileToRename(null);
        setShowRenameFileModal(false);
        const projectResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
          headers: { 'x-auth-token': user.token },
        });
        const projectData = await projectResponse.json();
        if (projectResponse.ok) {
          setProjectFiles(projectData.files);
        }
      } else {
        toast.error(data.message || 'Failed to rename file.', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Network error renaming file:', error);
      toast.error('Network error: Could not rename file.', { autoClose: 5000 });
    }
  };


  return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col font-sans text-gray-100 p-0">
      <style>
        {`
        /* Ensure html and body take full height and width */
        html, body, #root {
          height: 100%;
          width: 100%;
          margin: 0;
          overflow: hidden; /* Prevent body scrollbars */
        }

        .remote-cursor-line {
          position: absolute;
          width: 2px !important;
          height: 100% !important;
          z-index: 1000;
          animation: blink 1s step-end infinite;
        }

        .remote-cursor-label {
            position: absolute;
            top: -1.5em;
            left: 0;
            color: white;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 0.75em;
            white-space: nowrap;
            z-index: 1001;
            transform: translateX(-50%);
        }

        .remote-selection-background {
          opacity: 0.3;
          border-radius: 3px;
        }

        @keyframes blink {
          from, to { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Comment-related styles */
        .comment-line-active {
            background-color: rgba(255, 165, 0, 0.1);
            border-left: 3px solid orange;
        }
        .comment-line-resolved {
            background-color: rgba(144, 238, 144, 0.1);
            border-left: 3px solid lightgreen;
            opacity: 0.7;
        }
        .comment-glyph-active {
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="orange" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM7 4h2v5H7zM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>');
            background-repeat: no-repeat;
            background-position: center;
            background-size: 16px;
        }
        .comment-glyph-resolved {
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="lightgreen" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.707 5.293a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6 9.586l4.293-4.293a1 1 0 0 1 1.414 0z"/></svg>');
            background-repeat: no-repeat;
            background-position: center;
            background-size: 16px;
        }
        .comment-line-decoration-active {
            border-left: 3px solid orange;
        }
        .comment-line-decoration-resolved {
            border-left: 3px solid lightgreen;
        }

        /* Modal styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }
        .modal-content {
            background-color: #2d3748;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            width: 90%;
            max-width: 500px;
            z-index: 2001;
            color: #e2e8f0;
            border: 1px solid #4a5568;
        }
        `}
      </style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      {/* Removed: <script src="https://cdn.tailwindcss.com"></script> */}

      <div className="min-h-screen w-full bg-gray-900 flex flex-col p-0 font-sans text-gray-100">
        <div className="bg-gray-800 rounded-none shadow-none p-0 w-full flex-grow flex flex-col lg:flex-row gap-0 overflow-hidden">
          {/* File Explorer Section */}
          {projectId && (
            <div className="w-full lg:w-64 bg-gray-700 rounded-none shadow-none flex flex-col p-4 border-r border-gray-600">
              <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
                Project: {projectDetails?.name || 'Loading...'}
              </h3>
              <div className="flex-1 overflow-y-auto mb-4">
                <h4 className="text-lg font-semibold text-gray-200 mb-2">Files:</h4>
                <ul className="space-y-1">
                  {projectFiles.map(file => (
                    <li key={file._id} className="flex items-center justify-between group">
                      <Link
                        to={`/project/${projectId}/file/${file._id}`}
                        className={`block flex-1 p-2 rounded-md transition duration-150 ease-in-out
                          ${file._id === fileId ? 'bg-blue-600 text-white shadow-md' : 'text-gray-200 hover:bg-gray-600 hover:text-white'}`}
                      >
                        {file.name}
                      </Link>
                      {file._id === fileId ? (
                        <div className="flex items-center ml-2">
                          <button
                            onClick={() => { setFileToRename(file); setNewFileNameInput(file.name); setShowRenameFileModal(true); }}
                            className="p-1 text-gray-400 hover:text-blue-400 transition-colors duration-150"
                            title="Rename File"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.38-2.828-2.828z" />
                            </svg>
                          </button>
                          {projectFiles.length > 1 && (
                            <button
                              onClick={() => handleDeleteFile(file._id)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-150"
                              title="Delete File"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteFile(file._id)}
                          className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-in-out shadow-md hover:shadow-lg"
                          title="Delete File"
                        >
                          X
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setShowCreateFileModal(true)}
                className="w-full px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-200 ease-in-out transform hover:-translate-y-0.5"
              >
                + New File
              </button>
            </div>
          )}


          <div className="flex-1 flex flex-col p-4">
            <h1 className="text-3xl font-bold text-white mb-4 text-center">
              Collaborative Code Editor
            </h1>
            <div className="flex flex-wrap justify-center items-center gap-4 mb-4 text-gray-300">
              <p>
                Status: <span className={`font-semibold ${socket && socket.connected ? 'text-green-400' : 'text-red-400'}`}>
                  {socket && socket.connected ? 'Connected' : 'Disconnected'}
                </span>
              </p>
              {user ? (
                <p>
                  Logged in as: <span className="font-semibold text-purple-400">{user.username}</span>
                  <button
                    onClick={logout}
                    className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 ease-in-out transform hover:-translate-y-0.5"
                  >
                    Logout
                  </button>
                </p>
              ) : (
                <p className="text-gray-600">
                  Not logged in. <Link to="/login" className="text-blue-400 hover:underline">Login</Link> or <Link to="/register" className="text-blue-400 hover:underline">Register</Link>
                </p>
              )}
            </div>

            {fileId && (
              <div className="text-center mb-4 text-gray-300">
                <p className="mb-2">
                  File ID: <span className="font-semibold text-blue-400">{fileId}</span>
                </p>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 ease-in-out transform hover:-translate-y-0.5"
                >
                  Copy Link
                </button>
                {user && (
                  <button
                    onClick={handleSaveVersion}
                    className="ml-2 px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 ease-in-out transform hover:-translate-y-0.5"
                  >
                    Save Version
                  </button>
                )}
                {versions.length > 0 && (
                  <button
                    onClick={() => setShowVersionHistoryModal(true)}
                    className="ml-2 px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 ease-in-out transform hover:-translate-y-0.5"
                  >
                    View Versions ({versions.length})
                  </button>
                )}
              </div>
            )}
            {!projectId && (
              <div className="text-center mb-4">
                <p className="text-gray-400 text-center text-lg font-semibold">
                  Please go to your <Link to="/dashboard" className="text-blue-400 hover:underline">Project Dashboard</Link> to create or open a project.
                </p>
              </div>
            )}

            {serverMessage && (
              <p className="text-gray-300 text-center mb-6">
                Server Test Message: <span className="font-semibold text-blue-400">{serverMessage}</span>
              </p>
            )}

            {/* Online Users List */}
            {fileId && onlineUsers.length > 0 && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg shadow-inner border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-2">Online Collaborators:</h3>
                <ul className="flex flex-wrap gap-2">
                  {onlineUsers.map(onlineUser => (
                    <li key={onlineUser.id} className="flex items-center text-sm font-medium text-gray-200">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: onlineUser.color }}
                      ></span>
                      {onlineUser.username || `${onlineUser.id.substring(0, 8)}...`}
                      {onlineUser.id === (socket ? socket.id : null) ? ' (You)' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Language Selector */}
            {fileId && (
              <div className="mb-4 flex items-center justify-center">
                <label htmlFor="language-select" className="mr-2 text-gray-300 font-medium">Language:</label>
                <select
                  id="language-select"
                  value={language}
                  onChange={handleLanguageChange}
                  className="px-3 py-1 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                >
                  {supportedLanguages.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="border border-gray-700 rounded-xl overflow-hidden shadow-lg flex-grow h-full">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                language={language}
                value={code}
                onMount={handleEditorDidMount}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'Fira Code, monospace',
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Chat and Comments Section */}
          {fileId && (
            <div className="w-full lg:w-96 bg-gray-700 rounded-xl shadow-lg flex flex-col border border-gray-600 h-full">
              {/* Chat Section */}
              <div className="flex-1 flex flex-col border-b border-gray-600">
                <h3 className="text-xl font-bold text-white p-4">Chat</h3>
                <div className="flex-1 p-4 overflow-y-auto text-gray-200" style={{ maxHeight: 'calc(50% - 60px)' }}>
                  {chatMessages.length === 0 ? (
                    <p className="text-gray-400 text-center">No messages yet. Start chatting!</p>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div key={index} className="mb-2">
                        <p className="text-sm font-semibold" style={{ color: msg.senderColor }}>
                          {msg.senderUsername}
                          <span className="text-gray-500 text-xs ml-2">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                        <p className="text-gray-100 text-sm break-words">{msg.message}</p>
                      </div>
                    ))
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-600">
                  <input
                    type="text"
                    name="chatMessage"
                    placeholder="Type your message..."
                    className="w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                    disabled={!socket || !socket.connected}
                  />
                  <button
                    type="submit"
                    className="mt-2 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
                    disabled={!socket || !socket.connected}
                  >
                    Send
                  </button>
                </form>
              </div>

              {/* Comments Section */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white p-4 border-b border-gray-600">Comments</h3>
                <div className="flex-1 p-4 overflow-y-auto text-gray-200" style={{ maxHeight: 'calc(100vh / 2 - 120px)' }}>
                  {comments.length === 0 ? (
                    <p className="text-gray-400 text-center">No comments yet. Right-click on a line to add one!</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment._id} className={`mb-3 p-3 rounded-lg ${comment.resolved ? 'bg-green-800' : 'bg-yellow-800'} shadow-sm border ${comment.resolved ? 'border-green-700' : 'border-yellow-700'}`}>
                        <p className="text-sm font-semibold text-white mb-1">
                          Line {comment.line} by {comment.username}
                          <span className="text-gray-400 text-xs ml-2">
                            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                        <p className="text-gray-100 text-sm mb-2 break-words">{comment.text}</p>
                        <div className="flex justify-end items-center">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${comment.resolved ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
                            {comment.resolved ? 'Resolved' : 'Active'}
                          </span>
                          {user && (
                            <button
                              onClick={() => handleResolveComment(comment._id, comment.resolved)}
                              className={`ml-2 px-3 py-1 text-xs rounded-md ${comment.resolved ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'} transition duration-150 ease-in-out shadow-sm hover:shadow-md`}
                            >
                              {comment.resolved ? 'Unresolve' : 'Resolve'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="text-gray-500 text-sm w-full p-4 text-center">
          Built with React, Monaco Editor, Socket.IO, Node.js & Express
        </footer>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-2xl font-bold mb-4 text-white">Add Comment to Line {selectedLine}</h2>
            <form onSubmit={handleAddComment}>
              <textarea
                className="w-full p-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-gray-700 text-white"
                rows="4"
                placeholder="Enter your comment here..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                required
              ></textarea>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCommentModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
                >
                  Add Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Version Modal */}
      {showSaveVersionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-2xl font-bold mb-4 text-white">Save Current Version</h2>
            <form onSubmit={handleSubmitVersion}>
              <div className="mb-4">
                <label htmlFor="version-message" className="block text-gray-300 text-sm font-bold mb-2">
                  Version Message (e.g., "Added login logic")
                </label>
                <input
                  type="text"
                  id="version-message"
                  className="shadow-inner appearance-none border border-gray-600 rounded-lg w-full py-2 px-3 text-white bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={versionMessage}
                  onChange={(e) => setVersionMessage(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-gray-400 mt-1">Optional. Max 200 characters.</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSaveVersionModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
                >
                  Save Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-2xl font-bold mb-4 text-white">Version History for File {fileId?.substring(0, 8)}...</h2>
            {versions.length === 0 ? (
              <p className="text-gray-400">No versions saved yet.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto border border-gray-600 rounded-md p-2 bg-gray-700">
                {versions.map(version => (
                  <div key={version._id} className="mb-3 p-3 border-b border-gray-600 last:border-b-0">
                    <p className="text-sm font-semibold text-gray-200">
                      {new Date(version.timestamp).toLocaleString()}
                      <span className="ml-2 text-gray-400">by {version.savedByUsername}</span>
                      <span className="ml-2 text-gray-400 text-xs">({version.language})</span>
                    </p>
                    <p className="text-gray-100 text-sm mb-2 break-words">{version.message || 'No message'}</p>
                    <button
                      onClick={() => handleLoadVersion(version._id)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out shadow-sm hover:shadow-md"
                    >
                      Load Version
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowVersionHistoryModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create File Modal */}
      {showCreateFileModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-2xl font-bold mb-4 text-white">Create New File in {projectDetails?.name}</h2>
            <form onSubmit={handleCreateFile}>
              <div className="mb-4">
                <label htmlFor="newFileName" className="block text-gray-300 text-sm font-bold mb-2">
                  File Name
                </label>
                <input
                  type="text"
                  id="newFileName"
                  className="shadow-inner appearance-none border border-gray-600 rounded-lg w-full py-2 px-3 text-white bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="newFileLanguage" className="block text-gray-300 text-sm font-bold mb-2">
                  Language
                </label>
                <select
                  id="newFileLanguage"
                  value={newFileLanguage}
                  onChange={(e) => setNewFileLanguage(e.target.value)}
                  className="px-3 py-1 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-gray-700 text-white"
                >
                  {supportedLanguages.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateFileModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename File Modal */}
      {showRenameFileModal && fileToRename && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-2xl font-bold mb-4 text-white">Rename File: {fileToRename.name}</h2>
            <form onSubmit={handleRenameFile}>
              <div className="mb-4">
                <label htmlFor="renameFileName" className="block text-gray-300 text-sm font-bold mb-2">
                  New File Name
                </label>
                <input
                  type="text"
                  id="renameFileName"
                  className="shadow-inner appearance-none border border-gray-600 rounded-lg w-full py-2 px-3 text-white bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newFileNameInput}
                  onChange={(e) => setNewFileNameInput(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowRenameFileModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
                >
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App component to handle routing and AuthProvider
function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-900">
        <div className="text-blue-400 text-xl font-semibold">Loading authentication...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* New Landing Page Route */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* Changed the dashboard route to /dashboard or similar if you want the landing page as root */}
        <Route path="/dashboard" element={<ProjectDashboard />} />
        <Route path="/project/:projectId" element={<CodeEditor />} />
        <Route path="/project/:projectId/file/:fileId" element={<CodeEditor />} />
      </Routes>
    </Router>
  );
}

// Wrap the App component with AuthProvider and SocketProvider
function RootApp() {
  return (
    <AuthProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </AuthProvider>
  );
}

export default RootApp;
