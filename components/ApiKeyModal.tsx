
import React, { useState } from 'react';
import { Key, ShieldCheck, Zap, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  onKeySelected: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySelected }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSaveKey = () => {
    if (inputValue.trim().length < 20) {
      alert("⚠️ Vui lòng nhập API Key hợp lệ!");
      return;
    }
    localStorage.setItem('VANHAI_API_KEY', inputValue.trim());
    onKeySelected();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#001a1a]/95 backdrop-blur-2xl p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md p-8 md:p-12 text-center shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/20 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Key className="text-blue-600 w-10 h-10 animate-pulse" />
        </div>
        
        <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter leading-none">Kích hoạt AI</h2>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
          Dán mã <span className="text-blue-600 font-bold">Gemini API Key</span> của bạn vào ô dưới đây để bắt đầu trải nghiệm tính năng soạn đề thông minh.
        </p>

        <div className="space-y-6">
          <div className="relative group">
            <input 
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Dán API Key tại đây..."
              className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all font-mono text-center text-lg placeholder:text-gray-300"
            />
          </div>
          
          <button 
            onClick={handleSaveKey}
            className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl transition-all active:scale-95 shadow-2xl shadow-blue-500/30 uppercase tracking-[0.2em] text-lg flex items-center justify-center gap-3"
          >
            <Zap size={24} /> KÍCH HOẠT HỆ THỐNG
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-[10px] text-blue-500 hover:text-blue-700 font-black uppercase tracking-widest transition-colors"
          >
            LẤY KEY TẠI GOOGLE AI STUDIO <ExternalLink size={12} />
          </a>
          <div className="flex items-center justify-center gap-2 text-[9px] text-gray-300 font-bold uppercase tracking-[0.3em] mt-2">
            <ShieldCheck size={14} /> Key được bảo mật trên trình duyệt của bạn
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
