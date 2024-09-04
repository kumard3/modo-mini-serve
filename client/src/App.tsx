import React, { useState, useEffect, useRef } from 'react';

interface LogMessage {
  type: 'log' | 'status' | 'error';
  message: string;
  lightStatus?: boolean;
}

const App: React.FC = () => {
  const [lightStatus, setLightStatus] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data: LogMessage = JSON.parse(event.data);
      setLogs(prevLogs => [...prevLogs, data]);
      if (data.type === 'status' && data.lightStatus !== undefined) {
        setLightStatus(data.lightStatus);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const toggleLight = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send('toggleLight');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-4 text-center text-blue-600">Loxone Light Control</h1>
        <p className="text-lg mb-2">
          Connection Status: <span className={`font-semibold ${connected ? 'text-green-600' : 'text-red-600'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </p>
        <p className="text-lg mb-4">
          Light Status: <span className={`font-semibold ${lightStatus ? 'text-yellow-500' : 'text-gray-600'}`}>
            {lightStatus ? 'On' : 'Off'}
          </span>
        </p>
        <button 
          onClick={toggleLight} 
          disabled={!connected}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
            connected ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Toggle Light
        </button>
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Server Logs</h2>
          <div className="bg-gray-100 p-4 rounded-md h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <p key={index} className={`mb-1 ${
                log.type === 'error' ? 'text-red-600' : 
                log.type === 'status' ? 'text-green-600' : 'text-gray-800'
              }`}>
                {log.message}
              </p>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;