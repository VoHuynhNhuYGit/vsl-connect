import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, SquareSquare } from 'lucide-react';

export const GroupChatTTS: React.FC = () => {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Khắc phục lỗi Chrome tự động ngắt tiếng (Garbage Collection)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [messages, setMessages] = useState([
    { sender: 'TH', isSelf: false, text: 'Chào Minh Anh! Hôm nay mình cùng luyện chủ đề gia đình nhé.' },
    { sender: 'MA', isSelf: true, text: 'Được, mình sẽ bắt đầu bằng phần giới thiệu bản thân.' }
  ]);

  // Ép trình duyệt tải trước danh sách giọng đọc khi vừa vào trang
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    setMessages([...messages, { sender: 'MA', isSelf: true, text: text.trim() }]);
    setText(''); 
  };

  const handleSpeak = () => {
    if (!text.trim() || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Ép tìm chính xác giọng Tiếng Việt trong hệ thống
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi-VN') || v.lang.includes('vi') || v.name.includes('Vietnamese'));
    
    if (viVoice) {
      utterance.voice = viVoice;
    }
    
    utterance.lang = 'vi-VN';
    utterance.volume = 1; 
    utterance.rate = 1; // Để tốc độ 1.0 cho giọng tự nhiên nhất, không bị méo tiếng
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null; // Giải phóng bộ nhớ khi đọc xong
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    // Lưu vào ref để chống tình trạng trình duyệt tự ngắt tiếng giữa chừng
    utteranceRef.current = utterance;
    
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center p-4 border-b border-gray-50">
        <h3 className="text-lg font-bold text-gray-800">Trò chuyện nhóm</h3>
        <span className="text-xs text-gray-400 font-medium">{messages.length} tin nhắn</span>
      </div>

      <div ref={scrollRef} className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 items-start ${msg.isSelf ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${msg.isSelf ? 'bg-teal-800 text-white' : 'bg-teal-100 text-teal-700'}`}>
              {msg.sender}
            </div>
            <div className={`max-w-[75%] px-4 py-2 text-sm shadow-sm ${msg.isSelf ? 'bg-teal-50 border border-teal-100 rounded-2xl rounded-tr-sm text-teal-800' : 'bg-white border border-gray-100 rounded-2xl rounded-tl-sm text-gray-700'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-50 bg-white rounded-b-xl">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-shadow text-gray-700 placeholder-gray-400"
            placeholder="Viết tin nhắn..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            title="Gửi tin nhắn"
          >
            <Send size={20} />
          </button>

          {isSpeaking ? (
            <button
              onClick={handleStop}
              className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors shrink-0"
              title="Dừng đọc"
            >
              <SquareSquare size={20} />
            </button>
          ) : (
            <button
              onClick={handleSpeak}
              disabled={!text.trim()}
              className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              title="Nghe thử"
            >
              <Volume2 size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};