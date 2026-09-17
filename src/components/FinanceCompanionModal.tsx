import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CompanionChatMessage, ExpenseCategory } from '../types';
import { formatCurrency } from '../utils/format';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  PlusCircle, 
  CheckCircle2, 
  Info, 
  RotateCcw,
  MessageSquare
} from 'lucide-react';

interface FinanceCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  'Where did my money go?',
  'How much did I save?',
  'Check my budget',
  'Help me save',
];

export const FinanceCompanionModal: React.FC<FinanceCompanionModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshData, showNotification } = useAuth();
  const [messages, setMessages] = useState<CompanionChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'Hi! I can help you understand your spending, budget and savings.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [addedExpenseMap, setAddedExpenseMap] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  // Speech Recognition Setup
  const handleToggleVoice = () => {
    setSpeechNotice(null);

    // Stop if currently listening
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechNotice("Voice input isn't available right now. You can type your question instead.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Default to Indian English / standard English

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechNotice(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechNotice("Voice input isn't available right now. You can type your question instead.");
        } else {
          setSpeechNotice("Voice input isn't available right now. You can type your question instead.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechNotice("Voice input isn't available right now. You can type your question instead.");
    }
  };

  // Text-To-Speech (TTS)
  const handleSpeak = (messageId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (activeSpeakingId === messageId) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setActiveSpeakingId(null);
    utterance.onerror = () => setActiveSpeakingId(null);
    setActiveSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage: CompanionChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSpeechNotice(null);
    setIsLoading(true);

    try {
      // Send conversation history (clean format)
      const historyContext = messages
        .filter((m) => m.id !== 'welcome-1')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.sendCompanionMessage(query, historyContext);

      const botMessage: CompanionChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        whatIf: res.whatIf,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMessage: CompanionChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "I'm having a little trouble connecting to your records right now. Please ask again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpenseFromWhatIf = async (messageId: string, whatIf: any) => {
    if (!whatIf || addedExpenseMap[messageId]) return;

    try {
      await api.addExpense({
        amount: whatIf.hypotheticalAmount,
        category: (whatIf.category as ExpenseCategory) || 'Other',
        date: new Date().toISOString().split('T')[0],
        note: `Via Finance Companion: ${whatIf.question}`,
      });
      await refreshData();
      setAddedExpenseMap((prev) => ({ ...prev, [messageId]: true }));
      showNotification(`Added ₹${whatIf.hypotheticalAmount.toLocaleString('en-IN')} to your real expenses.`);
    } catch {
      showNotification('Could not save this expense. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        id="finance-companion-panel"
        className="w-full sm:w-[480px] h-[90vh] sm:h-[620px] max-h-[90vh] bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Finance Companion</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Ask me about your money.
              </p>
            </div>
          </div>

          <button
            id="companion-close-btn"
            onClick={onClose}
            aria-label="Close Finance Companion"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Speech Notice (Microphone unavailable/denied) */}
        {speechNotice && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200/80 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>{speechNotice}</span>
            </div>
            <button
              onClick={() => setSpeechNotice(null)}
              className="text-amber-700 hover:text-amber-900 text-xs ml-2 cursor-pointer font-medium"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-700 text-white rounded-br-xs shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                }`}
              >
                {/* Assistant Message Header / Speaker button */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between gap-4 mb-1.5 border-b border-slate-100 pb-1">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Finance Companion
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      aria-label="Listen to message"
                      className="text-slate-400 hover:text-emerald-700 transition-colors p-0.5 rounded cursor-pointer"
                      title="Listen"
                    >
                      {activeSpeakingId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                <p className="whitespace-pre-line font-normal">{msg.content}</p>

                {/* What-If Possible Impact Card inside chat bubble */}
                {msg.whatIf && (
                  <div className="mt-3 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2 text-slate-800">
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                      <Info className="w-3 h-3 text-amber-700" />
                      <span>Possible impact</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Current planned savings:</span>
                        <strong className="font-semibold text-slate-900">
                          {formatCurrency(msg.whatIf.currentSavings)}
                        </strong>
                      </div>
                      <div className="flex justify-between text-amber-900">
                        <span>Possible purchase:</span>
                        <strong className="font-semibold">
                          - {formatCurrency(msg.whatIf.hypotheticalAmount)}
                        </strong>
                      </div>
                      <div className="flex justify-between text-emerald-800 pt-1 border-t border-amber-200/60 font-medium">
                        <span>Possible remaining savings:</span>
                        <strong>{formatCurrency(msg.whatIf.possibleRemaining)}</strong>
                      </div>
                    </div>

                    {msg.whatIf.canAddAsExpense && (
                      <div className="pt-2 border-t border-amber-200/60">
                        {addedExpenseMap[msg.id] ? (
                          <div className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Saved as real expense</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddExpenseFromWhatIf(msg.id, msg.whatIf)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Add as expense</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 px-1 mt-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3.5 py-2 w-fit shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span>Reviewing your records...</span>
            </div>
          )}

          {/* Quick Actions (shown under welcome message when conversation is young) */}
          {messages.length <= 2 && (
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-2 px-1">
                Quick questions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(action)}
                    className="text-xs px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Listening Banner */}
        {isListening && (
          <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-800 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span className="font-semibold">Listening...</span>
              <span className="text-slate-500 font-normal">Speak naturally into your microphone</span>
            </div>
            <button
              onClick={handleToggleVoice}
              className="text-emerald-800 hover:text-emerald-950 font-medium underline text-xs cursor-pointer"
            >
              Stop
            </button>
          </div>
        )}

        {/* Message Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                id="companion-chat-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask something about your money..."}
                disabled={isLoading}
                className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
              />

              {/* Voice Command Button: 🎤 */}
              <button
                id="companion-mic-btn"
                type="button"
                onClick={handleToggleVoice}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
                title={isListening ? "Listening... click to stop" : "Voice input (🎤)"}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Send Button */}
            <button
              id="companion-send-btn"
              type="submit"
              disabled={isLoading || !inputText.trim()}
              aria-label="Send question"
              className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl flex items-center justify-center shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
