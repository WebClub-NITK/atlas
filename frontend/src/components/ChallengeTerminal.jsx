import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { API_URL } from '../api/config';

// Close codes sent by the backend terminal proxy (see consumers.py)
const CLOSE_MESSAGES = {
  4401: 'Session expired — please log in again.',
  4403: 'Your team has been banned.',
  4404: 'No running container found — start the challenge first.',
  4502: 'Could not reach the challenge container — try restarting the challenge.',
};

const buildTerminalUrl = (challengeId) => {
  const tokenString = localStorage.getItem('token');
  const access = tokenString ? JSON.parse(tokenString).access : '';
  const wsBase = API_URL.replace(/^http/, 'ws'); // http -> ws, https -> wss
  return `${wsBase}/ws/terminal/${challengeId}/?token=${encodeURIComponent(access)}`;
};

/**
 * Browser terminal for SSH challenges.
 *
 * Speaks the proxy's wire protocol: binary WebSocket frames carry raw
 * terminal bytes, text frames carry JSON control messages such as
 * {"type": "resize", "cols": 120, "rows": 32}.
 */
function ChallengeTerminal({ challengeId }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('connecting'); // connecting | connected | closed
  const [closeMessage, setCloseMessage] = useState('');
  const [session, setSession] = useState(0); // bump to reconnect

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    setStatus('connecting');
    setCloseMessage('');

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#c0caf5',
        cursorAccent: '#1a1b26',
        selectionBackground: '#33467c',
        black: '#15161e',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
        brightBlack: '#414868',
        brightRed: '#f7768e',
        brightGreen: '#9ece6a',
        brightYellow: '#e0af68',
        brightBlue: '#7aa2f7',
        brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff',
        brightWhite: '#c0caf5',
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(node);
    fitAddon.fit();

    const ws = new WebSocket(buildTerminalUrl(challengeId));
    ws.binaryType = 'arraybuffer';
    const encoder = new TextEncoder();

    const sendResize = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };

    ws.onopen = () => {
      setStatus('connected');
      sendResize();
      term.focus();
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        term.write(event.data);
      } else {
        term.write(new Uint8Array(event.data));
      }
    };

    ws.onclose = (event) => {
      setStatus('closed');
      setCloseMessage(CLOSE_MESSAGES[event.code] || 'Connection closed.');
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(encoder.encode(data));
      }
    });

    // Legacy binary input (e.g. some mouse protocols): one byte per char code
    term.onBinary((data) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const bytes = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i += 1) {
        bytes[i] = data.charCodeAt(i) & 0xff;
      }
      ws.send(bytes);
    });

    term.onResize(sendResize);

    // Refit on layout changes; fit() fires term.onResize -> server resize_pty
    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
      // Silence callbacks during deliberate teardown so nothing touches the
      // disposed terminal or flashes the "closed" overlay.
      ws.onclose = null;
      ws.onmessage = null;
      ws.close();
      term.dispose();
    };
  }, [challengeId, session]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-96 w-full overflow-hidden rounded-lg bg-[#1a1b26] p-2" />
      {status !== 'connected' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/70 text-white">
          {status === 'connecting' ? (
            <p>Connecting to challenge…</p>
          ) : (
            <>
              <p className="mb-3 px-4 text-center">{closeMessage}</p>
              <button
                type="button"
                onClick={() => setSession((n) => n + 1)}
                className="rounded bg-blue-500 px-4 py-2 transition-colors hover:bg-blue-600"
              >
                Reconnect
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

ChallengeTerminal.propTypes = {
  challengeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default ChallengeTerminal;
