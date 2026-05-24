import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

// Force xterm colors to not be overridden by parent CSS
const terminalStyles = `
  .terminal-wrapper,
  .terminal-wrapper * {
    color: #e2e8f0 !important;
  }
  .terminal-wrapper .xterm {
    padding: 8px;
  }
  .terminal-wrapper .xterm-viewport {
    background-color: #0f172a !important;
  }
  .terminal-wrapper .xterm-screen {
    background-color: #0f172a !important;
  }
`;

const Terminal = ({ challengeId }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    // Inject style overrides
    const styleEl = document.createElement('style');
    styleEl.textContent = terminalStyles;
    document.head.appendChild(styleEl);

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#e2e8f0',
        selectionBackground: '#334155',
      },
      fontFamily: '"Fira Code", "Courier New", monospace',
      fontSize: 14,
      cols: 80,
      rows: 24,
      allowTransparency: false,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[33mConnecting to secure terminal...\x1b[0m');

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    
    let token = '';
    const tokenString = localStorage.getItem('token');
    if (tokenString) {
      try {
        const parsed = JSON.parse(tokenString);
        token = parsed.access || '';
      } catch (e) {
        console.error('Failed to parse token from localStorage');
      }
    }
    
    const wsUrl = `${protocol}//${host}/ws/terminal/${challengeId}/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln('\x1b[32mConnected. Waiting for shell...\x1b[0m');
      ws.send(JSON.stringify({
        resize: { cols: term.cols, rows: term.rows }
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.output) {
        term.write(data.output);
      } else if (data.error) {
        term.writeln(`\r\n\x1b[31mError: ${data.error}\x1b[0m`);
      }
    };

    ws.onclose = () => {
      term.writeln('\x1b[31m\r\nConnection closed.\x1b[0m');
    };

    ws.onerror = () => {
      term.writeln('\x1b[31m\r\nWebSocket error occurred.\x1b[0m');
    };

    // Handle user input
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ input: data }));
      }
    });

    // Delay fit to ensure DOM is rendered
    setTimeout(() => {
      fitAddon.fit();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          resize: { cols: term.cols, rows: term.rows }
        }));
      }
    }, 200);

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          resize: { cols: term.cols, rows: term.rows }
        }));
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.head.removeChild(styleEl);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, [challengeId]);

  return (
    <div
      className="terminal-wrapper"
      style={{
        width: '100%',
        height: '400px',
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default Terminal;
