
import React, { useState, useRef, useEffect } from 'react';
import { Question, SpinSpeed } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Trash2, FileText, CheckCircle2, UploadCloud, Cpu, X, Wand2, Key, AlertTriangle, RefreshCcw, LogOut } from 'lucide-react';

interface SettingsModalProps {
  names: string[];
  questions: Question[];
  currentSpeed: SpinSpeed;
  onSave: (names: string[], questions: Question[], speed: SpinSpeed) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ names, questions, currentSpeed, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'questions' | 'config'>('students');
  const [namesText, setNamesText] = useState(names.join('\n'));
  
  const [topic, setTopic] = useState('');
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>(questions);
  const [attachedFile, setAttachedFile] = useState<{ data: string; mimeType: string; fileName: string; type: 'image' | 'text' | 'pdf' | 'other' } | null>(null);
  
  const [speed, setSpeed] = useState<SpinSpeed>(currentSpeed);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [errorStatus, setErrorStatus] = useState<{ message: string; isApiKeyError: boolean } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'questions' && (window as any).MathJax && previewRef.current) {
      setTimeout(() => {
        (window as any).MathJax.typesetPromise([previewRef.current]).catch((err: any) => console.log("MathJax Preview Error:", err));
      }, 100);
    }
  }, [currentQuestions, activeTab]);

  const extractJsonArray = (text: string): any[] => {
    let cleaned = text.trim();
    if (cleaned.includes('```')) {
      cleaned = cleaned.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    }
    
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed;
      for (const key in parsed) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
    } catch (e) {
      const match = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        try { return JSON.parse(match[0]); } catch (e2) {}
      }
    }
    return [];
  };

  const sanitizeQuestionData = (data: any[]): Question[] => {
    return data.map(q => {
      const fixStr = (str: any) => {
        if (typeof str !== 'string') return String(str || "");
        return str
          .replace(/\$ce\{/g, '$\\ce{')
          .replace(/([^\\$])ce\{/g, '$1\\ce{')
          .replace(/^ce\{/g, '\\ce{');
      };

      let correctIdx = 0;
      if (typeof q.correct === 'number') correctIdx = q.correct;
      else if (typeof q.correct === 'string') correctIdx = parseInt(q.correct) || 0;

      return {
        q: fixStr(q.q || q.question || ""),
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map(fixStr) : ["A", "B", "C", "D"],
        correct: Math.min(Math.max(correctIdx, 0), 3)
      };
    }).filter(q => q.q.trim().length > 0);
  };

  const handleResetKey = () => {
    localStorage.removeItem('VANHAI_API_KEY');
    window.location.reload(); // Reload để App.tsx hiện lại ApiKeyModal
  };

  const handleAiGenerate = async () => {
    if (!attachedFile && !topic.trim()) {
      return;
    }

    const savedKey = localStorage.getItem('VANHAI_API_KEY');
    if (!savedKey) {
      setErrorStatus({ message: "Không tìm thấy API Key. Vui lòng nhập Key lại.", isApiKeyError: true });
      return;
    }

    setIsGenerating(true);
    setErrorStatus(null);
    setProgressMessage(attachedFile ? "Đang đọc tài liệu..." : "Đang soạn câu hỏi...");
    
    try {
      const ai = new GoogleGenAI({ apiKey: savedKey });
      const parts: any[] = [];
      
      let prompt = "";

      if (attachedFile) {
        prompt = `BẠN LÀ CHUYÊN GIA TRÍCH XUẤT DỮ LIỆU. Quét toàn bộ câu hỏi trắc nghiệm trong tài liệu. 
        ĐỊNH DẠNG: Chỉ trả về JSON mảng: [{"q": "...", "options": ["...", "...", "...", "..."], "correct": 0-3}]. 
        LƯU Ý: Công thức hóa học bọc $\\ce{...}$, toán học bọc $...$.`;
        
        if (attachedFile.type === 'text') {
          parts.push({ text: `${prompt}\n\nTÀI LIỆU:\n${attachedFile.data}` });
        } else {
          parts.push({ text: prompt });
          parts.push({
            inlineData: {
              data: attachedFile.data,
              mimeType: attachedFile.mimeType
            }
          });
        }
      } else {
        prompt = `Tạo 15 câu hỏi trắc nghiệm tiếng Việt về: "${topic}". 
        ĐỊNH DẠNG: Chỉ trả về JSON mảng: [{"q": "...", "options": ["A", "B", "C", "D"], "correct": 0-3}]. 
        LƯU Ý: Công thức hóa học bọc $\\ce{...}$, toán học bọc $...$.`;
        parts.push({ text: prompt });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts: parts },
        config: { 
          responseMimeType: "application/json",
          temperature: attachedFile ? 0.05 : 0.4 
        }
      });

      const responseText = response.text || "";
      const rawArray = extractJsonArray(responseText);
      const sanitized = sanitizeQuestionData(rawArray);
      
      if (sanitized.length > 0) {
        if (attachedFile) {
          setCurrentQuestions(sanitized); 
        } else {
          setCurrentQuestions(prev => [...sanitized, ...prev].slice(0, 100));
        }
        setProgressMessage(`Hoàn tất! Đã nạp ${sanitized.length} câu hỏi.`);
      } else {
        throw new Error("Dữ liệu AI không đúng định dạng.");
      }

      setTimeout(() => {
        setIsGenerating(false);
        setAttachedFile(null);
        setTopic('');
      }, 1000);

    } catch (error: any) {
      console.error("AI Error:", error);
      setIsGenerating(false);
      
      const errorStr = JSON.stringify(error);
      const isQuota = errorStr.includes("429") || errorStr.toLowerCase().includes("quota");
      const isInvalid = errorStr.includes("400") || errorStr.includes("403") || errorStr.includes("INVALID");

      if (isQuota) {
        setErrorStatus({
          message: "TÀI KHOẢN HẾT LƯỢT DÙNG: API Key của bạn đã vượt quá giới hạn sử dụng miễn phí hôm nay. Hãy đợi 1 phút hoặc đổi Key khác.",
          isApiKeyError: true
        });
      } else if (isInvalid) {
        setErrorStatus({
          message: "API KEY KHÔNG HỢP LỆ: Vui lòng kiểm tra lại mã Key bạn đã nhập hoặc tạo Key mới tại Google AI Studio.",
          isApiKeyError: true
        });
      } else {
        setErrorStatus({
          message: "LỖI KẾT NỐI: " + (error.message || "Không xác định"),
          isApiKeyError: false
        });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("⚠️ File quá lớn (Tối đa 15MB)");
      return;
    }

    const reader = new FileReader();
    const mimeType = file.type || 'application/octet-stream';
    
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (mimeType.includes('text') || file.name.endsWith('.txt')) {
        setAttachedFile({ data: result, mimeType: 'text/plain', fileName: file.name, type: 'text' });
      } else {
        const base64Data = result.split(',')[1];
        setAttachedFile({ 
          data: base64Data, 
          mimeType: mimeType === 'application/pdf' ? 'application/pdf' : (mimeType.startsWith('image/') ? mimeType : 'image/jpeg'), 
          fileName: file.name, 
          type: mimeType === 'application/pdf' ? 'pdf' : 'image' 
        });
      }
    };

    if (mimeType.includes('text') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const newNames = namesText.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (newNames.length === 0) return alert("⚠️ Vui lòng nhập danh sách học sinh!");
    onSave(newNames, currentQuestions, speed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl">
      <div className="bg-white rounded-[3rem] md:rounded-[4rem] w-full max-w-3xl text-gray-800 shadow-[0_40px_120px_rgba(0,0,0,0.6)] flex flex-col h-full max-h-[92vh] overflow-hidden border border-white/20 relative">
        
        {/* Lớp phủ Trạng thái (Generating / Error) */}
        {(isGenerating || errorStatus) && (
          <div className="absolute inset-0 z-[500] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            {errorStatus ? (
              <div className="flex flex-col items-center max-w-md w-full bg-white animate-in zoom-in-95">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 text-red-500 shadow-inner">
                  <AlertTriangle size={48} className="animate-bounce" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-6 uppercase tracking-tighter">LỖI HỆ THỐNG AI</h3>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-10 w-full">
                   <p className="text-gray-600 font-bold leading-relaxed">{errorStatus.message}</p>
                </div>
                <div className="flex flex-col gap-4 w-full">
                  <button 
                    onClick={handleResetKey}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 uppercase text-lg"
                  >
                    <Key size={24} /> NHẬP LẠI API KEY
                  </button>
                  <button 
                    onClick={() => setErrorStatus(null)}
                    className="w-full bg-gray-100 text-gray-400 font-black py-4 rounded-2xl transition-all active:scale-95 uppercase"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative mb-12">
                  <div className="w-28 h-28 border-[12px] border-blue-50 border-t-blue-600 rounded-full animate-spin shadow-inner"></div>
                  <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-blue-600 w-10 h-10 animate-pulse" />
                </div>
                <h2 className="text-4xl font-black text-blue-900 mb-4 uppercase tracking-tighter">AI Đang Làm Việc</h2>
                <div className="px-10 py-5 bg-blue-50 rounded-full shadow-sm border border-blue-100">
                  <p className="text-blue-600 font-black text-lg italic animate-pulse">{progressMessage}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Header */}
        <div className="p-8 border-b flex justify-between items-center bg-gray-50/80 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-2xl md:text-4xl font-black text-blue-900 flex items-center gap-4">
              <Cpu className="text-blue-600 w-10 h-10" /> CÀI ĐẶT
            </h2>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-gray-200 rounded-full transition-all text-gray-300 hover:text-red-500">
            <X size={36} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 border-b p-2">
          {(['students', 'questions', 'config'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 md:py-6 text-[11px] font-black uppercase tracking-widest transition-all rounded-[1.5rem] ${
                activeTab === tab ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'students' ? 'Học Sinh' : tab === 'questions' ? 'Soạn Đề AI' : 'Hệ Thống'}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-8 md:p-12 flex-1 overflow-y-auto bg-white custom-scrollbar">
          {activeTab === 'students' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center px-4">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Danh sách học sinh</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-4 py-1 rounded-full font-black">Tổng: {namesText.split('\n').filter(n => n.trim()).length}</span>
              </div>
              <textarea
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                className="w-full h-[350px] p-8 border-4 border-gray-50 rounded-[3rem] focus:border-blue-500 outline-none text-2xl font-bold text-gray-700 bg-gray-50/30 shadow-inner resize-none transition-all"
                placeholder="Nhập tên học sinh (mỗi dòng một tên)..."
              />
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-8 border-4 border-blue-50 rounded-[2.5rem] focus:border-blue-500 outline-none font-black text-blue-900 text-2xl shadow-sm placeholder:text-blue-200"
                  placeholder="Nhập chủ đề muốn tạo..."
                />
              </div>

              <div className="space-y-4">
                {attachedFile ? (
                  <div className="bg-gradient-to-br from-indigo-700 to-blue-800 text-white p-8 rounded-[3rem] flex items-center justify-between shadow-lg">
                    <span className="font-black text-xl truncate px-4">{attachedFile.fileName}</span>
                    <button onClick={() => setAttachedFile(null)} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all"><Trash2 size={24} /></button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full border-4 border-dashed border-gray-100 p-12 rounded-[3.5rem] flex flex-col items-center justify-center text-gray-300 hover:border-blue-400 hover:text-blue-600 bg-gray-50/20 group transition-all shadow-inner">
                    <UploadCloud size={60} className="mb-4 group-hover:scale-110 transition-transform" />
                    <p className="font-black text-xl uppercase tracking-widest">Tải lên tài liệu PDF/Ảnh</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf,.txt" onChange={handleFileUpload} />
                  </button>
                )}
              </div>

              <button 
                onClick={handleAiGenerate}
                disabled={!topic.trim() && !attachedFile}
                className={`w-full py-8 rounded-[3rem] font-black text-2xl shadow-2xl transition active:scale-95 flex items-center justify-center gap-6 ${
                  (topic || attachedFile) ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Cpu size={32} /> TẠO ĐỀ NGAY
              </button>

              <div className="pt-12 border-t">
                <div className="flex justify-between items-center mb-6 px-2">
                   <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Ngân hàng đề hiện tại ({currentQuestions.length})</p>
                   {currentQuestions.length > 0 && <button onClick={() => setCurrentQuestions([])} className="text-red-400 font-bold hover:underline">Xóa hết</button>}
                </div>
                <div className="space-y-6 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                  {currentQuestions.map((q, idx) => (
                    <div key={idx} className="p-8 bg-white border-2 border-gray-50 rounded-[2.5rem] flex justify-between items-start shadow-sm hover:border-blue-100 transition-all">
                      <div className="flex-1 mr-10">
                        <span className="bg-blue-600 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase mb-5 inline-block">CÂU {idx + 1}</span>
                        <div className="text-xl font-bold text-gray-800 leading-snug" dangerouslySetInnerHTML={{ __html: q.q }} />
                      </div>
                      <button onClick={() => setCurrentQuestions(prev => prev.filter((_, i) => i !== idx))} className="text-gray-100 hover:text-red-500 transition-colors">
                        <Trash2 size={28} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-8 md:space-y-12 animate-in slide-in-from-bottom-4">
              <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-100">
                <h4 className="font-black text-blue-900 mb-4 uppercase tracking-widest text-lg">Quản lý API Key</h4>
                <p className="text-blue-600 font-bold text-sm leading-relaxed mb-8">Nếu bạn gặp lỗi Quota (429) hoặc API Key hết hạn, hãy nhấn nút bên dưới để đổi mã Key mới.</p>
                <button 
                  onClick={handleResetKey}
                  className="w-full flex items-center justify-between p-10 bg-white border-4 border-dashed border-blue-200 rounded-[3rem] hover:bg-blue-100 hover:border-blue-400 transition-all group"
                >
                  <div className="flex flex-col text-left">
                    <span className="font-black text-xl text-blue-600">ĐỔI API KEY GEMINI</span>
                    <span className="text-[10px] text-blue-400 mt-2 uppercase tracking-widest">Nhập lại mã kích hoạt AI</span>
                  </div>
                  <RefreshCcw size={32} className="text-blue-300 group-hover:rotate-180 transition-all duration-700" />
                </button>
              </div>

              <div className="bg-red-50 p-8 rounded-[3rem] border border-red-100">
                <h4 className="font-black text-red-900 mb-4 uppercase tracking-widest text-lg">Dữ liệu ứng dụng</h4>
                <button 
                  onClick={() => {
                     if(confirm("Xóa toàn bộ dữ liệu (Key, Danh sách, Câu hỏi)?")) {
                       localStorage.clear();
                       window.location.reload();
                     }
                  }}
                  className="w-full flex items-center justify-between p-8 bg-white border-2 border-red-200 rounded-3xl hover:bg-red-100 transition-all group"
                >
                  <span className="font-black text-red-600">XÓA TOÀN BỘ DỮ LIỆU</span>
                  <LogOut size={24} className="text-red-300" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 md:p-12 bg-gray-50/50 border-t flex gap-6 mt-auto">
          <button onClick={handleSave} className="flex-[4] bg-emerald-500 hover:bg-emerald-600 text-white font-black py-8 rounded-[2rem] text-xl shadow-2xl transition-all active:scale-95 uppercase tracking-widest">LƯU CÀI ĐẶT</button>
          <button onClick={onClose} className="flex-1 font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest text-sm">Hủy</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
