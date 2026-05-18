import { useState, useEffect, useRef } from 'react';

export function Chat({ messages, onSend }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSend();
  }

  return (
    <div className="chat">
      <div className="chat__header">Table Chat</div>
      <div className="chat__messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat__msg ${msg.system ? 'chat__msg--system' : ''}`}>
            {!msg.system && <span className="chat__name">{msg.name}: </span>}
            <span>{msg.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat__input">
        <input
          type="text"
          placeholder="Say something..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          maxLength={200}
        />
        <button className="btn btn--sm" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
