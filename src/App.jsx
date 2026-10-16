import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { 
  Users, Calendar, MapPin, CreditCard, ShieldCheck, 
  Plus, Trash2, LogOut, Settings, CheckCircle2, AlertCircle, Edit, UserPlus, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const SUPABASE_URL = 'https://pyxdzptkuaqumuocaknw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ns5fITsygkDyXevC44oj6g_ljvgkSha';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- KOMPONENTA PRO VÝBĚR ROZSAHU DATUMŮ (OD - DO) ---
function DateRangePicker({ startDate, endDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date();
  });
  const [hoverDate, setHoverDate] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCZ = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
  };

  const toIso = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDayClick = (dayDate) => {
    const clickedIso = toIso(dayDate);
    if (!startDate || (startDate && endDate)) {
      // Začátek nového výběru
      onChange(clickedIso, '');
    } else if (startDate && !endDate) {
      if (new Date(clickedIso) < new Date(startDate)) {
        // Pokud kliknul na dřívější datum, nastavíme ho jako nový začátek
        onChange(clickedIso, '');
      } else {
        // Druhé datum - dokončení rozsahu
        onChange(startDate, clickedIso);
        setIsOpen(false);
      }
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Generování matice kalendáře
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Pondělí = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  const sTime = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
  const eTime = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;
  const hTime = hoverDate ? hoverDate.setHours(0, 0, 0, 0) : null;

  const displayValue = startDate && endDate 
    ? `${formatCZ(startDate)} – ${formatCZ(endDate)}`
    : startDate 
    ? `${formatCZ(startDate)} – vyberte konec...` 
    : '';

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 border rounded-xl bg-white text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-blue-400 focus:ring-2 focus:ring-blue-500 transition"
      >
        <span className={displayValue ? 'font-medium' : 'text-slate-400'}>
          {displayValue || 'Vyberte termín (kliknutím)'}
        </span>
        <Calendar size={15} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 w-72">
          {/* Hlavička měsíce a šipky */}
          <div className="flex justify-between items-center mb-3">
            <button 
              type="button" 
              onClick={prevMonth} 
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-800">
              {monthNames[month]} {year}
            </span>
            <button 
              type="button" 
              onClick={nextMonth} 
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dny v týdnu */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
            <span>Po</span><span>Út</span><span>St</span><span>Čt</span><span>Pá</span><span>So</span><span>Ne</span>
          </div>

          {/* Dny */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map((day, idx) => {
              if (!day) return <div key={'empty_' + idx} className="h-8" />;

              const dTime = new Date(day).setHours(0, 0, 0, 0);
              const isStart = sTime && dTime === sTime;
              const isEnd = eTime && dTime === eTime;
              const inRange = sTime && eTime && dTime > sTime && dTime < eTime;
              const inHoverRange = sTime && !eTime && hTime && dTime > sTime && dTime <= hTime;

              let cellClass = "h-8 text-xs flex items-center justify-center cursor-pointer transition rounded-lg ";

              if (isStart || isEnd) {
                cellClass += "bg-blue-600 text-white font-bold ";
              } else if (inRange || inHoverRange) {
                cellClass += "bg-blue-50 text-blue-700 font-medium ";
              } else {
                cellClass += "text-slate-700 hover:bg-slate-100 ";
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoverDate(day)}
                  className={cellClass}
                >
                  {day.getDate()}
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t flex justify-between items-center text-[10px] text-slate-400">
            <span>1. klik: Začátek | 2. klik: Konec</span>
            {startDate && (
              <button 
                type="button" 
                onClick={() => onChange('', '')}
                className="text-red-500 hover:underline"
              >
                Vymazat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- HLAVNÍ APLIKACE ---
export default function App() {
  const [mode, setMode] = useState('login'); // 'login', 'participant', 'admin'
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Login stavy
  const [loginUser, setLoginUser] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [adminPinInput, setAdminPinInput] = useState('');

  // Data přihlášeného účastníka
  const [attendees, setAttendees] = useState([]);
  const [newAttFirst, setNewAttFirst] = useState('');
  const [newAttLast, setNewAttLast] = useState('');
  const [newAttYear, setNewAttYear] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Formulář účastníka pro uložení
  const [pFormData, setPFormData] = useState({});

  // Data pro Admin
  const [allParticipants, setAllParticipants] = useState([]);
  const [allAttendees, setAllAttendees] = useState([]);
  const [adminForm, setAdminForm] = useState({});
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [modalAttendees, setModalAttendees] = useState([]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase.from('event_settings').select('*').eq('id', 1).single();
    if (data) {
      setSettings(data);
      setAdminForm(data);
    }
  }

  const formatDateCZ = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parseInt(parts[2], 10)}. ${parseInt(parts[1], 10)}. ${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Přihlášení účastníka
  async function handleParticipantLogin(e) {
    e.preventDefault();
    setErrorMsg('');
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('username', loginUser.trim().toLowerCase())
      .eq('pin', loginPin.trim())
      .single();

    if (error || !data) {
      setErrorMsg('Neplatné uživatelské jméno nebo PIN.');
      return;
    }

    setCurrentUser(data);
    setPFormData({
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      phone: data.phone || '',
      email: data.email || '',
      birth_date: data.birth_date || '',
      street: data.street || '',
      city: data.city || '',
      zip: data.zip || '',
      pet_type: data.pet_type || 'none',
      transport_type: data.transport_type || 'own',
      notes: data.notes || ''
    });
    loadParticipantAttendees(data.id);
    setMode('participant');
  }

  // Přihlášení Admina
  async function handleAdminLogin(e) {
    e.preventDefault();
    setErrorMsg('');
    if (settings && adminPinInput.trim() === settings.admin_pin) {
      setMode('admin');
      loadAdminData();
    } else {
      setErrorMsg('Nesprávný Admin PIN.');
    }
  }

  async function loadParticipantAttendees(participantId) {
    const { data } = await supabase.from('attendees').select('*').eq('participant_id', participantId);
    setAttendees(data || []);
  }

  async function loadAdminData() {
    const { data: parts } = await supabase.from('participants').select('*').order('variable_symbol');
    const { data: atts } = await supabase.from('attendees').select('*');
    setAllParticipants(parts || []);
    setAllAttendees(atts || []);
  }

  // Výpočet ceny
  const calculatePricingFor = (attList, petType, transportType) => {
    if (!settings) return { total: 0, deposit: 0 };
    let total = 0;
    const currentYear = new Date().getFullYear();

    attList.forEach(a => {
      const birthYear = parseInt(a.birth_year, 10) || (currentYear - (parseInt(a.age, 10) || 30));
      const age = Math.max(0, currentYear - birthYear);

      if (age <= settings.child_infant_max_age) {
        total += Number(settings.price_child_infant);
      } else if (age <= settings.child_junior_max_age) {
        total += Number(settings.price_child_junior);
      } else {
        total += Number(settings.price_adult);
      }

      if (transportType === 'shared') {
        total += Number(settings.price_transport);
      }
    });

    if (petType && petType !== 'none') {
      total += Number(settings.price_pet);
    }

    const deposit = Math.round((total * Number(settings.deposit_percentage)) / 100);
    return { total, deposit };
  };

  // QR Kód
  useEffect(() => {
    if (mode === 'participant' && currentUser && settings) {
      const { deposit } = calculatePricingFor(attendees, pFormData.pet_type, pFormData.transport_type);
      if (deposit > 0 && settings.iban) {
        const cleanIban = settings.iban.replace(/\s+/g, '').toUpperCase();
        const vs = currentUser.variable_symbol;
        const displayName = `${pFormData.first_name || currentUser.full_name || currentUser.username}`;
        const cleanMsg = `Zaloha vylet ${displayName}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const spayd = `SPD*1.0*ACC:${cleanIban}*AM:${deposit.toFixed(2)}*CC:CZK*X-VS:${vs}*MSG:${cleanMsg}`;

        QRCode.toDataURL(spayd, { width: 220, margin: 1 }, (err, url) => {
          if (!err) setQrDataUrl(url);
        });
      } else {
        setQrDataUrl('');
      }
    }
  }, [mode, attendees, pFormData, settings, currentUser]);

  // Uložení účastníka
  async function saveParticipantData() {
    const { total, deposit } = calculatePricingFor(attendees, pFormData.pet_type, pFormData.transport_type);
    const fullName = `${pFormData.first_name} ${pFormData.last_name}`.trim() || currentUser.full_name;

    await supabase.from('participants').update({
      ...pFormData,
      full_name: fullName,
      total_price: total,
      deposit_amount: deposit
    }).eq('id', currentUser.id);

    alert('Údaje byly úspěšně uloženy!');
  }

  // Přidání doprovodu účastníkem
  async function addAttendee(e) {
    e.preventDefault();
    if (!newAttFirst || !newAttYear) return;

    const currentYear = new Date().getFullYear();
    const { data } = await supabase.from('attendees').insert({
      participant_id: currentUser.id,
      first_name: newAttFirst.trim(),
      last_name: newAttLast.trim() || pFormData.last_name,
      birth_year: newAttYear.trim(),
      name: `${newAttFirst.trim()} ${newAttLast.trim()}`.trim(),
      age: Math.max(0, currentYear - parseInt(newAttYear, 10))
    }).select().single();

    if (data) {
      setAttendees([...attendees, data]);
      setNewAttFirst('');
      setNewAttLast('');
      setNewAttYear('');
    }
  }

  async function removeAttendee(id) {
    await supabase.from('attendees').delete().eq('id', id);
    setAttendees(attendees.filter(a => a.id !== id));
  }

  // --- ADMIN FUNKCE ---
  async function handleAdminSave(e) {
    e.preventDefault();
    await supabase.from('event_settings').update(adminForm).eq('id', 1);
    setSettings(adminForm);
    alert('Nastavení akce uloženo!');
  }

  async function toggleDeposit(id, currentStatus) {
    await supabase.from('participants').update({ deposit_paid: !currentStatus }).eq('id', id);
    setAllParticipants(allParticipants.map(p => p.id === id ? { ...p, deposit_paid: !currentStatus } : p));
  }

  function openEditModal(participant) {
    setEditingParticipant({ ...participant });
    setModalAttendees(allAttendees.filter(a => a.participant_id === participant.id));
  }

  function openCreateModal() {
    const nextVS = (1000 + allParticipants.length + 1).toString();
    setEditingParticipant({
      isNew: true,
      username: '',
      pin: '1234',
      variable_symbol: nextVS,
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      birth_date: '',
      street: '',
      city: '',
      zip: '',
      pet_type: 'none',
      transport_type: 'own',
      notes: '',
      deposit_paid: false
    });
    setModalAttendees([]);
  }

  // Uložení detailu v Admin modálu
  async function saveModalParticipant(e) {
    e.preventDefault();
    const ep = editingParticipant;
    const { total, deposit } = calculatePricingFor(modalAttendees, ep.pet_type, ep.transport_type);
    const fullName = `${ep.first_name || ''} ${ep.last_name || ''}`.trim() || ep.username;

    const payload = {
      username: ep.username.trim().toLowerCase(),
      pin: ep.pin.trim(),
      variable_symbol: ep.variable_symbol.trim(),
      first_name: ep.first_name || '',
      last_name: ep.last_name || '',
      full_name: fullName,
      phone: ep.phone || '',
      email: ep.email || '',
      birth_date: ep.birth_date || '',
      street: ep.street || '',
      city: ep.city || '',
      zip: ep.zip || '',
      pet_type: ep.pet_type || 'none',
      transport_type: ep.transport_type || 'own',
      notes: ep.notes || '',
      total_price: total,
      deposit_amount: deposit,
      deposit_paid: ep.deposit_paid || false
    };

    if (ep.isNew) {
      const { data, error } = await supabase.from('participants').insert(payload).select().single();
      if (error) {
        alert('Chyba při zakládání: ' + error.message);
        return;
      }
      setEditingParticipant(null);
      loadAdminData();
    } else {
      await supabase.from('participants').update(payload).eq('id', ep.id);
      setEditingParticipant(null);
      loadAdminData();
    }
  }

  function addModalAttendee() {
    const dummy = {
      id: 'temp_' + Date.now(),
      participant_id: editingParticipant.id,
      first_name: 'Nový',
      last_name: editingParticipant.last_name || '',
      birth_year: '2015',
      isNew: true
    };
    setModalAttendees([...modalAttendees, dummy]);
  }

  function updateModalAttendee(id, field, value) {
    setModalAttendees(modalAttendees.map(a => a.id === id ? { ...a, [field]: value } : a));
  }

  async function saveModalAttendeeRow(a) {
    const currentYear = new Date().getFullYear();
    if (a.isNew) {
      if (!editingParticipant.id) {
        alert('Nejprve uložte nového účastníka, pak přidávejte doprovod.');
        return;
      }
      const { data } = await supabase.from('attendees').insert({
        participant_id: editingParticipant.id,
        first_name: a.first_name,
        last_name: a.last_name,
        birth_year: a.birth_year,
        name: `${a.first_name} ${a.last_name}`.trim(),
        age: Math.max(0, currentYear - parseInt(a.birth_year || 2000, 10))
      }).select().single();
      if (data) {
        setModalAttendees(modalAttendees.map(item => item.id === a.id ? data : item));
        loadAdminData();
      }
    } else {
      await supabase.from('attendees').update({
        first_name: a.first_name,
        last_name: a.last_name,
        birth_year: a.birth_year,
        name: `${a.first_name} ${a.last_name}`.trim(),
        age: Math.max(0, currentYear - parseInt(a.birth_year || 2000, 10))
      }).eq('id', a.id);
      loadAdminData();
    }
  }

  async function removeModalAttendeeRow(id) {
    if (!id.toString().startsWith('temp_')) {
      await supabase.from('attendees').delete().eq('id', id);
      loadAdminData();
    }
    setModalAttendees(modalAttendees.filter(a => a.id !== id));
  }

  async function deleteParticipant(id) {
    if (confirm('Opravdu chceš smazat tohoto účastníka i se všemi nahlášenými osobami?')) {
      await supabase.from('participants').delete().eq('id', id);
      setEditingParticipant(null);
      loadAdminData();
    }
  }

  // --- RENDEROVÁNÍ: LOGIN ---
  if (mode === 'login') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">{settings?.event_title || 'Společný výlet'}</h1>
            <p className="text-sm text-slate-500 mt-1">Zadej své přihlašovací jméno a heslo/PIN</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-2xl flex items-center gap-2">
              <AlertCircle size={18} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleParticipantLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Uživatelské jméno</label>
              <input
                type="text"
                placeholder="např. novak"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Heslo / PIN</label>
              <input
                type="password"
                placeholder="Zadej svůj PIN"
                value={loginPin}
                onChange={e => setLoginPin(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition shadow-md"
            >
              Přihlásit se
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <details className="text-xs text-slate-400 cursor-pointer">
              <summary className="hover:text-slate-600 transition">Správce akce (Admin vstup)</summary>
              <form onSubmit={handleAdminLogin} className="mt-3 flex gap-2">
                <input
                  type="password"
                  placeholder="Admin PIN"
                  value={adminPinInput}
                  onChange={e => setAdminPinInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-slate-700 text-xs outline-none"
                />
                <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium">
                  Vstoupit
                </button>
              </form>
            </details>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDEROVÁNÍ: ÚČASTNÍK ---
  if (mode === 'participant') {
    const { total, deposit } = calculatePricingFor(attendees, pFormData.pet_type, pFormData.transport_type);

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {pFormData.first_name ? `${pFormData.first_name} ${pFormData.last_name}` : currentUser.full_name}
            </h1>
            <p className="text-xs text-slate-500">
              Uživatel: <span className="font-semibold text-slate-700">{currentUser.username}</span> | VS: <span className="font-semibold text-slate-700">{currentUser.variable_symbol}</span>
            </p>
          </div>
          <button onClick={() => setMode('login')} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition">
            <LogOut size={20} />
          </button>
        </header>

        {/* Informace o akci */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-2">{settings?.event_title}</h2>
          <div className="space-y-1 text-sm text-blue-100">
            {settings?.location && <p className="flex items-center gap-2"><MapPin size={16} /> {settings.location}</p>}
            {(settings?.date_start || settings?.date_end) && (
              <p className="flex items-center gap-2">
                <Calendar size={16} /> 
                {formatDateCZ(settings.date_start)}
                {settings.date_start && settings.date_end ? ' – ' : ''}
                {formatDateCZ(settings.date_end)}
              </p>
            )}
          </div>
        </div>

        {/* Stav zálohy */}
        <div className={`p-4 rounded-2xl mb-6 border flex items-center gap-3 ${
          currentUser.deposit_paid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {currentUser.deposit_paid ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <div>
            <p className="font-semibold">{currentUser.deposit_paid ? 'Záloha byla v pořádku přijata!' : 'Záloha čeká na úhradu'}</p>
            <p className="text-xs opacity-80">
              {currentUser.deposit_paid ? 'Děkujeme, rezervace je potvrzena.' : `Splatnost zálohy: ${formatDateCZ(settings?.deposit_deadline) || 'dle domluvy'}`}
            </p>
          </div>
        </div>

        
