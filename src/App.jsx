import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Stethoscope, 
  ShieldCheck, 
  Wrench, 
  Trash2, 
  UserCircle2,
  Send,
  Activity,
  LayoutDashboard,
  Bell,
  ShieldAlert,
  Sparkles,
  Volume2,
  PencilLine,
  User,
  Check,
  DoorOpen,
  Gauge,
  Camera,
  Play,
  Box,
  Users,
  Video,
  ListRestart,
  ScanEye,
  Clock4,
  Hourglass,
  Mic,
  MicOff,
  Battery,
  LogOut,
  FileText,
  Lock,
  AlertTriangle,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Grid,
  XCircle
} from 'lucide-react';

// --- VIDEO SOURCE CONFIGURATION ---
const VIDEO_SOURCE = "/Final OR Friction Tracker (1).mp4"; 

const ROLES = [
  { id: 'nurse', label: 'Nurse', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50', team: 'Surgery', theme: 'blue' },
  { id: 'surgeon', label: 'Surgeon', icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50', team: 'Surgery', theme: 'blue' },
  { id: 'anesthesia', label: 'Anesthesia', icon: Activity, color: 'text-red-600', bg: 'bg-red-50', team: 'Surgery', theme: 'blue' },
  { id: 'ora', label: 'ORA', icon: Trash2, color: 'text-emerald-600', bg: 'bg-emerald-50', team: 'Cleaning', theme: 'emerald' },
  { id: 'biomed', label: 'Biomed', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50', team: 'Biomed', theme: 'orange' },
];

const ROOMS = ['OR #1', 'OR #2', 'OR #3', 'OR #4', 'OR #5'];

const ROOMS_DATA = [
  { id: 'OR #1', status: 'In Surgery', color: 'bg-blue-500' },
  { id: 'OR #2', status: 'Cleaning', color: 'bg-orange-500' },
  { id: 'OR #3', status: 'Ready', color: 'bg-emerald-500' },
  { id: 'OR #4', status: 'In Surgery', color: 'bg-blue-500' },
  { id: 'OR #5', status: 'Turnover', color: 'bg-orange-500' },
];

const WORKFLOW_STAGES = [
  { id: 'terminal_clean', label: 'Terminal Cleaning', owner: 'Cleaning' },
  { id: 'staging', label: 'Morning Staging', owner: 'Biomed' },
  { id: 'case_setup', label: 'First Case Setup', owner: 'Surgery' },
  { id: 'active_case', label: 'Surgery in Progress', owner: 'Surgery' },
  { id: 'turnover', label: 'Turnover & Cleanup', owner: 'Cleaning' },
];

const TIME_OPTIONS = [
  { label: '< 15m', fullLabel: 'Less than 15 minutes', color: 'bg-green-600', icon: Activity },
  { label: '< 60m', fullLabel: 'Under 60 minutes', color: 'bg-yellow-500', icon: Clock4 },
  { label: '< 2h', fullLabel: 'Under 2 hours', color: 'bg-orange-500', icon: Hourglass },
];

const App = () => {
  const [appState, setAppState] = useState('login'); 
  const [currentUser, setCurrentUser] = useState({ id: '', password: '', name: '', role: '', room: '', team: '', theme: 'blue' });
  const [activeTab, setActiveTab] = useState('workflow'); 
  const [chatChannel, setChatChannel] = useState('all_or');
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [batterySaver, setBatterySaver] = useState(false);
  const [hdAudio, setHdAudio] = useState(true);
  const [statusNote, setStatusNote] = useState('');
  const [notification, setNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [aiSummary, setAiSummary] = useState(null);
  
  // Interface States
  const [isScanning, setIsScanning] = useState(false);
  const [aiMilestone, setAiMilestone] = useState("Cleaning In Progress");
  const [readyFlash, setReadyFlash] = useState(false);
  const [showFrictionReport, setShowFrictionReport] = useState(false);
  
  const [messages, setMessages] = useState([
    { id: 1, from: 'System', text: 'Workflow Intelligence Hub Synchronized.', type: 'broadcast', timestamp: '08:00 AM' },
  ]);
  
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const audioCtx = useRef(null);

  // Sound Generator for Code Blue Siren
  const playEmergencySound = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, audioCtx.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.current.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.start();
    osc.stop(audioCtx.current.currentTime + 0.4);
  };

  useEffect(() => {
    let interval;
    if (emergencyActive) { interval = setInterval(playEmergencySound, 800); }
    return () => clearInterval(interval);
  }, [emergencyActive]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const triggerNotification = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

  const pushMessage = (newMsg) => {
    setMessages(prev => [newMsg, ...prev]);
    if (activeTab !== 'chat') setUnreadCount(prev => prev + 1);
  };

  const toggleScanning = () => {
    const nextState = !isScanning;
    setIsScanning(nextState);
    if (nextState) {
        triggerNotification("OR Vision Stream Active");
    } else {
        triggerNotification("Vision Stream Offline");
    }
  };

  const toggleEmergency = () => {
    const newState = !emergencyActive;
    setEmergencyActive(newState);
    if (newState) {
      pushMessage({ 
        id: Date.now(), 
        from: currentUser.name || "Staff", 
        text: `🚨 CODE BLUE ALERT in ${currentUser.room || "Assigned Room"}! Immediate assistance required.`, 
        type: 'emergency', 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      });
      triggerNotification("CODE BLUE BROADCASTED");
      setActiveTab('chat');
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      pushMessage({ 
        id: Date.now(), 
        from: currentUser.name, 
        text: `🎤 Voice Note (${hdAudio ? 'HD' : 'Standard'} Audio) - ${recordingTime}s`, 
        type: 'voice', 
        timestamp: timeStr 
      });
      triggerNotification("Voice message sent");
    }
    setIsRecording(!isRecording);
  };

  const handleTimeAlert = (opt) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    pushMessage({ id: Date.now(), from: currentUser.name, text: `STATUS UPDATE: Team confirms ${opt.fullLabel} until turnover.`, type: 'time_alert', color: opt.color, timestamp: timeStr });
    triggerNotification(`Updated: ${opt.label}`);
  };

  const handleNoteSend = () => {
    if (!statusNote.trim()) return;
    pushMessage({ id: Date.now(), from: currentUser.name, text: `CONTEXT NOTE: ${statusNote}`, type: 'status_note', timestamp: 'Now' });
    setStatusNote('');
    triggerNotification("Note synced to hub");
  };

  const generateAiSummary = () => {
    setAiSummary("Processing current workflow status and unit communication logs...");
    setTimeout(() => {
      setAiSummary(`AI Summary: ${currentUser.room} is currently undergoing turnover. Turnover cleaning is approximately 70% complete. Friction score currently stable at 42/100.`);
    }, 1500);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'chat') setUnreadCount(0);
  };

  const startSession = () => {
    if (currentUser.id && currentUser.password && currentUser.role && currentUser.room) {
      const sel = ROLES.find(r => r.id === currentUser.role);
      setCurrentUser(prev => ({ 
        ...prev, 
        name: `${sel.label} #${prev.id}`, 
        team: sel.team, 
        theme: sel.theme 
      }));
      setChatChannel(sel.team.toLowerCase());
      setAppState('main');
    } else {
        triggerNotification("Check credentials");
    }
  };

  const getTeamColorClass = (type = 'bg') => {
    if (currentUser.theme === 'blue') return type === 'bg' ? 'bg-blue-600' : 'text-blue-600';
    if (currentUser.theme === 'emerald') return type === 'bg' ? 'bg-emerald-600' : 'text-emerald-600';
    if (currentUser.theme === 'orange') return type === 'bg' ? 'bg-orange-600' : 'text-orange-600';
    return type === 'bg' ? 'bg-blue-600' : 'text-blue-600';
  };

  if (appState === 'login') return (
    <div className="h-screen bg-slate-900 flex flex-col p-8 justify-center items-center text-white text-center">
      <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20">
        <ScanEye size={40} />
      </div>
      <h1 className="text-5xl font-black tracking-tighter mb-1 italic uppercase">Streamline</h1>
      <p className="text-slate-400 text-sm mb-10 uppercase tracking-widest font-bold">clear communication</p>
      
      <div className="w-full max-w-xs space-y-4">
        <div className="relative">
          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Hospital ID" className="w-full bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={currentUser.id} onChange={(e) => setCurrentUser({...currentUser, id: e.target.value})} />
        </div>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="password" placeholder="Password" className="w-full bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={currentUser.password} onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})} />
        </div>
        <button onClick={() => setAppState('selection')} className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl active:scale-95 transition-all shadow-lg mt-2 uppercase tracking-widest text-[10px]">Verify Credentials</button>
      </div>
      <p className="mt-8 text-[10px] text-slate-500 uppercase tracking-widest font-black opacity-50">Enterprise Secure Link v2.4</p>
    </div>
  );

  if (appState === 'selection') return (
    <div className="h-screen bg-white flex flex-col p-8">
      <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tighter italic">Anonymous Tagging</h2>
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {ROLES.map((role) => (
          <button key={role.id} onClick={() => setCurrentUser({...currentUser, role: role.id})} className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all ${currentUser.role === role.id ? 'border-blue-600 bg-blue-50 scale-[1.02]' : 'border-slate-100 opacity-60'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role.bg} ${role.color}`}><role.icon size={24} /></div>
            <div className="text-left"><p className="font-bold text-base">{role.label}</p><p className="text-[10px] font-black uppercase text-slate-400">{role.team} Assignment</p></div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {ROOMS.map((room) => (
          <button key={room} onClick={() => setCurrentUser({...currentUser, room})} className={`py-4 rounded-2xl border-2 font-black text-xs ${currentUser.room === room ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'border-slate-100 text-slate-500'}`}>{room}</button>
        ))}
      </div>
      <button disabled={!currentUser.role || !currentUser.room} onClick={startSession} className="w-full bg-slate-900 text-white font-bold py-5 rounded-3xl mt-6 shadow-xl active:scale-95 uppercase tracking-widest text-[10px]">Link Suite Hub</button>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen font-sans text-slate-900 overflow-hidden ${readyFlash ? 'bg-emerald-500 transition-colors duration-300' : (batterySaver ? 'bg-slate-100' : 'bg-slate-50')}`}>
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md">
            <Check size={14} className="text-emerald-500" strokeWidth={4}/>
            <p className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{notification}</p>
          </div>
        </div>
      )}

      {emergencyActive && (
        <div className="fixed inset-0 z-[250] bg-red-600/30 backdrop-blur-sm pointer-events-none animate-pulse"></div>
      )}

      <header className="h-16 px-4 flex items-center justify-between bg-slate-900 text-white shadow-xl z-50 shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={24} className="text-blue-400" />
          <div>
            <h1 className="font-black text-lg tracking-tight italic uppercase leading-none">Streamline</h1>
            <p className={`text-[8px] font-black uppercase tracking-widest ${getTeamColorClass('text')}`}>{currentUser.team} UNIT</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleEmergency} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 transition-all shadow-lg ${emergencyActive ? 'bg-white text-red-600 animate-pulse' : 'bg-red-600 text-white'}`}>
            <ShieldAlert size={14} /> CODE BLUE
          </button>
          <button onClick={() => handleTabChange('profile')} className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
            <UserCircle2 size={24} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 px-4 pt-4">
        <div className="max-w-md mx-auto space-y-4">
          {activeTab === 'workflow' && (
            <>
              {/* OR ROOM CLEANING ALERT REMOVED AS REQUESTED */}

              <div className={`${readyFlash ? 'bg-white/90 scale-105 shadow-xl' : 'bg-white'} p-8 rounded-[3rem] text-center shadow-sm border border-slate-200 transition-all duration-300 relative`}>
                <div className={`absolute top-4 right-8 ${getTeamColorClass('bg')} text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest`}>
                    MY TEAM
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status: {aiMilestone}</p>
                <h2 className="text-7xl font-black text-slate-900 tracking-tighter italic uppercase">{currentUser.room}</h2>
              </div>

              {/* OR VISION HUB */}
              <div className="bg-slate-900 rounded-[2.5rem] text-white shadow-2xl overflow-hidden relative border border-white/5">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}></div>
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Vision Analysis Stream</h3>
                  </div>
                  
                  <button onClick={toggleScanning} className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase transition-all shadow-lg flex items-center gap-2 ${isScanning ? 'bg-red-500' : 'bg-blue-600'}`}>
                    {isScanning ? <Camera size={14}/> : <Play size={14}/>}
                    {isScanning ? 'Stop Feed' : 'Start Feed'}
                  </button>
                </div>
                
                <div className="relative w-full overflow-hidden bg-black aspect-video transition-all border-b border-white/5">
                  {!isScanning ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-4 bg-slate-950/80">
                       <Video size={56} strokeWidth={1} className="opacity-10 animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 text-center">Vision Bridge Standby</span>
                    </div>
                  ) : (
                    <video 
                      ref={videoRef} 
                      src={VIDEO_SOURCE} 
                      autoPlay playsInline muted loop 
                      className="w-full h-full object-cover" 
                    />
                  )}
                </div>

                {/* HIDDEN REPORT TOGGLE BUTTON */}
                <div className="p-4 bg-slate-950 flex justify-center">
                   <button 
                      onClick={() => setShowFrictionReport(!showFrictionReport)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showFrictionReport ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                   >
                      <BarChart3 size={14}/>
                      {showFrictionReport ? 'Hide Friction Metrics' : 'Generate Friction Analytics'}
                      {showFrictionReport ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                   </button>
                </div>

                {/* OR FRICTION REPORT CARD (TOGGLEABLE) */}
                {showFrictionReport && (
                  <div className="p-6 bg-slate-900 border-t border-white/10 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2">
                          <TrendingDown size={14}/> Session Performance
                        </h4>
                        <div className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Phase 2 AI Analysis</div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                          <p className="text-[8px] text-slate-500 uppercase font-black mb-1">OR Friction Score</p>
                          <p className="text-3xl font-black text-blue-400 italic tracking-tighter">42/100</p>
                        </div>
                        <div className="flex flex-col justify-center">
                          <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Total Cleaning Time</p>
                          <p className="text-xl font-black text-white">91.59 <span className="text-[10px] text-slate-400 uppercase font-bold tracking-normal">sec</span></p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-black flex items-center gap-2 mb-1">
                              <DoorOpen size={10} className="text-orange-400"/> Distractions
                            </p>
                            <p className="text-lg font-black text-white tracking-tighter">29 <span className="text-[10px] text-slate-400 uppercase font-bold tracking-normal">Door Openings</span></p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-black flex items-center gap-2 mb-1">
                              <Users size={10} className="text-red-400"/> Max Staff
                            </p>
                            <p className="text-lg font-black text-white italic tracking-tighter">5 <span className="text-[10px] text-slate-400 uppercase font-bold tracking-normal">In Room</span></p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Comms Lag</p>
                            <p className="text-lg font-black text-slate-600 italic tracking-tighter">N/A</p>
                          </div>
                          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                            <p className="text-[8px] text-emerald-500/70 uppercase font-black mb-1">Anesthesia prep</p>
                            <p className="text-sm font-black text-emerald-400 flex items-center gap-1 tracking-widest leading-none"><Check size={14}/> TOUCHED: YES</p>
                          </div>
                        </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 px-2">
                   <div className="h-[1px] flex-1 bg-slate-200"></div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Manual Milestones</p>
                   <div className="h-[1px] flex-1 bg-slate-200"></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {TIME_OPTIONS.map((opt) => (
                    <button key={opt.label} onClick={() => handleTimeAlert(opt)} className={`${opt.color} text-white p-5 rounded-[2rem] font-bold shadow-lg flex flex-col items-center gap-1 active:scale-95 transition-all`}>
                      <opt.icon size={28} />
                      <span className="text-sm font-black uppercase tracking-tighter">{opt.label}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm flex gap-3">
                   <div className="flex-1 relative">
                      <PencilLine size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Add situational note..." value={statusNote} onChange={e => setStatusNote(e.target.value)} className="w-full bg-slate-50 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"/>
                   </div>
                   <button onClick={handleNoteSend} className="bg-slate-900 text-white px-6 rounded-2xl active:scale-90 transition-all shadow-xl"><Send size={20}/></button>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">Workflow Tracking</h3>
                <div className="space-y-4">
                  {WORKFLOW_STAGES.map((stage, idx) => {
                    const isMyResponsibility = stage.owner === currentUser.team;
                    return (
                      <div key={stage.id} className={`flex gap-4 items-center p-3 rounded-2xl transition-all ${isMyResponsibility ? 'bg-blue-50 ring-1 ring-blue-100 shadow-sm' : 'opacity-60'}`}>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-xs ${isMyResponsibility ? getTeamColorClass('bg') : 'bg-slate-100'} ${isMyResponsibility ? 'text-white' : 'text-slate-400'}`}>{idx + 1}</div>
                        <div className="flex-1">
                          <p className={`font-black text-sm uppercase tracking-tighter ${isMyResponsibility ? 'text-slate-900' : 'text-slate-400'}`}>{stage.label}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{stage.owner} Task</p>
                        </div>
                        <Clock size={18} className="text-slate-200" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'hub' && (
            <div className="space-y-4 pb-4 animate-in slide-in-from-bottom-4 duration-300">
               <div className="flex justify-between items-center px-4">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global OR Status Map</h3>
                 <span className="bg-emerald-100 text-emerald-600 text-[8px] px-2 py-1 rounded font-black uppercase">Live Link Active</span>
               </div>
               <div className="grid grid-cols-1 gap-3">
                 {ROOMS_DATA.map(r => (
                  <div key={r.id} className={`p-6 rounded-[2.5rem] flex items-center justify-between shadow-md transition-all ${r.id === currentUser.room ? 'bg-slate-900 text-white ring-4 ring-blue-500/20' : 'bg-white text-slate-800 border border-slate-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${r.id === currentUser.room ? 'bg-blue-600' : 'bg-slate-100 shadow-inner'}`}>
                        <LayoutDashboard size={28} className={r.id === currentUser.room ? 'text-white' : 'text-slate-400'}/>
                      </div>
                      <div>
                        <p className="text-2xl font-black italic tracking-tighter uppercase leading-none">{r.id}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                           <div className={`w-2 h-2 rounded-full ${r.color}`}></div>
                           <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{r.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
               </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-[75vh] bg-white rounded-[3.5rem] shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 p-1 flex gap-1 shrink-0 overflow-x-auto no-scrollbar">
                {[
                  { id: 'cleaning', label: 'Cleaning Unit' },
                  { id: 'biomed', label: 'Biomed Unit' },
                  { id: 'surgery', label: 'Surgery Unit' },
                  { id: 'all_or', label: 'Department' }
                ].map(c => (
                  <button key={c.id} onClick={() => setChatChannel(c.id)} className={`flex-1 min-w-[100px] py-4 rounded-[2rem] text-[8px] font-black uppercase transition-all ${chatChannel === c.id ? getTeamColorClass('bg') : 'text-slate-500 hover:text-white'} ${chatChannel === c.id ? 'text-white shadow-lg' : ''}`}>{c.label}</button>
                ))}
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 relative">
                {aiSummary && (
                  <div className="bg-blue-50 border-2 border-blue-100 p-5 rounded-[2rem] mb-4 animate-in fade-in zoom-in">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1"><Sparkles size={12}/> AI Status Briefing</span>
                       <button onClick={() => setAiSummary(null)} className="text-blue-300 hover:text-blue-600"><Trash2 size={12}/></button>
                    </div>
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">{aiSummary}</p>
                  </div>
                )}
                
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.from === currentUser.name ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-[1.8rem] text-sm shadow-sm ${msg.from === currentUser.name ? `${getTeamColorClass('bg')} text-white rounded-tr-none` : (msg.type === 'emergency' ? 'bg-red-600 text-white rounded-tl-none animate-pulse shadow-lg' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100')}`}>
                      <div className="flex justify-between items-center gap-4 mb-1">
                        <span className="text-[8px] font-black uppercase opacity-60 tracking-widest">{msg.from}</span>
                        <span className="text-[8px] opacity-30">{msg.timestamp}</span>
                      </div>
                      <p className="font-bold leading-snug">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-slate-100 space-y-3 shrink-0">
                <div className="flex gap-2">
                  <button onClick={generateAiSummary} className="flex-1 py-4 rounded-2xl bg-slate-900 text-white text-[9px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 shadow-md"><Sparkles size={14}/> AI Summary</button>
                  <button className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 text-[9px] font-black uppercase flex items-center justify-center gap-2"><FileText size={14}/> Protocols</button>
                </div>
                
                {isRecording ? (
                  <div className="flex items-center gap-3 bg-red-50 p-3 rounded-2xl border border-red-100 animate-pulse">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <span className="flex-1 text-sm font-black text-red-600 uppercase tracking-tighter">HD Audio Recording... {recordingTime}s</span>
                    <button onClick={handleVoiceRecord} className="bg-red-600 text-white p-2 rounded-xl"><MicOff size={18}/></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleVoiceRecord} className="w-12 h-12 shrink-0 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all"><Mic size={22} /></button>
                    <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder={`Message Unit...`} className="flex-1 bg-slate-100 rounded-[1.5rem] px-5 text-sm outline-none font-bold" />
                    <button onClick={() => { if(!inputText.trim()) return; pushMessage({ id: Date.now(), from: currentUser.name, text: inputText, timestamp: 'Now' }); setInputText(''); }} className={`w-12 h-12 shrink-0 ${getTeamColorClass('bg')} text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all`}><Send size={22} /></button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className={`bg-white p-10 rounded-[4rem] shadow-sm border-2 ${currentUser.theme === 'blue' ? 'border-blue-500' : (currentUser.theme === 'emerald' ? 'border-emerald-500' : 'border-orange-500')} text-center`}>
                <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 text-blue-600 relative border-4 border-white shadow-xl">
                  <UserCircle2 size={64} />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl border-4 border-white flex items-center justify-center text-white"><Check size={14} strokeWidth={4}/></div>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{currentUser.name}</h2>
                <p className={`text-xs font-black uppercase tracking-widest mt-1 ${getTeamColorClass('text')}`}>{currentUser.team} Specialist</p>
              </div>

              <div className="bg-white rounded-[3rem] p-8 space-y-6 border border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Optimization Tools</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl">
                    <div className="flex items-center gap-4 text-slate-700">
                      <Battery size={20} className={batterySaver ? 'text-emerald-500' : 'text-slate-400'}/>
                      <span className="text-sm font-black uppercase tracking-tighter">Battery Saver</span>
                    </div>
                    <button onClick={() => setBatterySaver(!batterySaver)} className={`w-12 h-6 rounded-full p-1 transition-all ${batterySaver ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`bg-white w-4 h-4 rounded-full transition-all ${batterySaver ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                  </div>
                </div>
                <button onClick={() => setAppState('login')} className="w-full py-5 rounded-[2rem] border-2 border-red-50 text-red-600 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"><LogOut size={16} /> De-Sync Station</button>
              </div>
            </div>
          )}
        </div>
      </main>

      <nav className={`h-24 border-t border-slate-200 bg-white flex items-center justify-around px-8 pb-8 sticky bottom-0 z-50 shrink-0 ${batterySaver ? 'bg-slate-100' : 'bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)]'}`}>
        {[ 
          { id: 'workflow', label: 'Home', icon: LayoutDashboard }, 
          { id: 'chat', label: 'Chat', icon: MessageSquare }, 
          { id: 'hub', label: 'Rooms', icon: Grid },
          { id: 'profile', label: 'Profile', icon: UserCircle2 }
        ].map((item) => (
          <button key={item.id} onClick={() => handleTabChange(item.id)} className={`flex flex-col items-center gap-1.5 px-4 transition-all relative ${activeTab === item.id ? getTeamColorClass('text') : 'text-slate-300'} ${activeTab === item.id ? 'scale-125' : ''}`}>
            {item.id === 'chat' && unreadCount > 0 && (
              <div className="absolute -top-1 -right-0.5 bg-red-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md shadow-red-500/20">{unreadCount}</div>
            )}
            <item.icon size={26} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;