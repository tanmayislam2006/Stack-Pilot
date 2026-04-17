'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Terminal as TerminalIcon, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface TerminalProps {
  serviceId: string;
}

export default function Terminal({ serviceId }: TerminalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Scroll to bottom whenever logs change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    socketRef.current = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      // Subscribe to this specific service's logs
      socket.emit('subscribe', { serviceId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('log', (data: { serviceId: string; log: string }) => {
      if (data.serviceId === serviceId) {
        setLogs((prev) => [...prev, data.log]);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('log');
      socket.disconnect();
    };
  }, [serviceId]);

  return (
    <div className="rounded-xl border border-border bg-[#0a0a0a] overflow-hidden flex flex-col h-[500px]">
      {/* Terminal Header */}
      <div className="bg-[#1a1a1a] px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Deployment Logs</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
          <span className={clsx(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
          )} />
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
            {!isConnected ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Connecting to log stream...</p>
              </>
            ) : (
              <p>Waiting for logs...</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-gray-300 break-words whitespace-pre-wrap">
                {log}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
