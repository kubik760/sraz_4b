import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { 
  Users, Calendar, MapPin, CreditCard, ShieldCheck, 
  Plus, Trash2, LogOut, Settings, CheckCircle2, AlertCircle, Edit, UserPlus, X,
  ChevronLeft, ChevronRight, Check
} from 'lucide-react';

const SUPABASE_URL = 'https://pyxdzptkuaqumuocaknw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ns5fITsygkDyXevC44oj6g_ljvgkSha';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- MODÁLNÍ KALENDÁŘ (100% FUNKČNÍ NA IPADU A MOBILU) ---
function DateRangePickerModal({ startDate, endDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate || '');
  const [tempEnd, setTempEnd] = useState(endDate || '');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    setTempStart(startDate || '');
    setTempEnd(endDate || '');
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
  }, [startDate, endDate, isOpen]);

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

  const handleDaySelect = (dayDate) => {
    const iso = toIso(dayDate);
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(iso);
      setTempEnd('');
    } else if (tempStart && !tempEnd) {
      if (new Date(iso) < new Date(tempStart)) {
        setTempStart(iso);
      } else {
        setTempEnd(iso);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempStart, tempEnd);
    setIsOpen(false);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

  const sTime = tempStart ? new Date(tempStart).setHours(0, 0, 0, 0) : null;
  const eTime = tempEnd ? new Date(tempEnd).setHours(0, 0, 0, 0) : null;

  const displayValue = startDate && endDate 
    ? `${formatCZ(startDate)} – ${formatCZ(endDate)}` 
    : startDate 
    ? `${formatCZ(startDate)}` 
    : '';

  return (
    <div>
      {/* Tlačítko pro otevření */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full p-2.5 border-2 border-slate-200 hover:border-blue-500 rounded-xl bg-white text-xs text-slate-800 flex items-center justify-between cursor-pointer transition shadow-sm text-left active:bg-slate-50"
      >
        <span className={displayValue ? 'font-semibold text-blue-600' : 'text-slate-400'}>
          {displayValue || 'Klepnutím vyberte termín akce'}
        </span>
        <Calendar size={18} className="text-blue-500 ml-2 flex-shrink-0" />
      </button>

      {/* Vyskakovací okno na iPadu přes střed obrazovky */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Termín akce</h3>
                <p className="text-[11px] text-slate-400">1. klepnutí začátek, 2. klepnutí konec</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Náhled výběru */}
            <div className="bg-slate-50 p-3 rounded-2xl mb-4 text-center border border-slate-100">
              <span className="text-xs font-semibold text-slate-700">
                {tempStart ? formatCZ(tempStart) : 'Od'} 
                {'  —  '} 
                {tempEnd ? formatCZ(tempEnd) : 'Do'}
              </span>
            </div>

            {/* Přepínání měsíců */}
            <div className="flex justify-between items-center mb-3 px-1">
              <button 
                type="button"
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-700 active:bg-slate-200"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold text-slate-800">
                {monthNames[month]} {year}
              </span>
              <button 
                type="button"
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-700 active:bg-slate-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Dny v týdnu */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-2">
              <span>Po</span><span>Út</span><span>St</span><span>Čt</span><span>Pá</span><span>So</span><span>Ne</span>
            </div>

            {/* Mřížka dnů */}
            <div className="grid grid-cols-7 gap-1 text-center mb-6">
              {days.map((day, idx) => {
                if (!day) return <div key={'empty_' + idx} className="h-10" />;

                const dTime = new Date(day).setHours(0, 0, 0, 0);
                const isStart = sTime && dTime === sTime;
                const isEnd = eTime && dTime === eTime;
                const inRange = sTime && eTime && dTime > sTime && dTime < eTime;

                let cellClass = "h-10 text-xs flex items-center justify-center font-medium rounded-xl transition cursor-pointer ";

                if (isStart || isEnd) {
                  cellClass += "bg-blue-600 text-white font-bold shadow-md ";
                } else if (inRange) {
                  cellClass += "bg-blue-100 text-blue-800 ";
                } else {
                  cellClass += "text-slate-700 hover:bg-slate-100 active:bg-slate-200 ";
                }

                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleDaySelect(day)}
                    className={cellClass}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Tlačítka dole */}
            <div className="flex gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setTempStart('');
                  setTempEnd('');
                }}
                className="px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 rounded-xl font-medium"
              >
                Vymazat
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                <Check size={16} /> Potvrdit termín
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- HLAVNÍ APLIKACE ---
export default function App() {
  const [mode, setMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [loginUser, setLoginUser] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [adminPinInput, setAdminPinInput] = useState('');

  const [attendees, setAttendees] = useState([]);
  const [newAttFirst, setNewAttFirst] = useState('');
  const [newAttLast, setNewAttLast] = useState('');
  const [newAttYear, setNewAttYear] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const [pFormData, setPFormData] = useState({});

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

  // --- LOGIN ---
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

  // --- ÚČASTNÍK ---
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

        {/* Údaje účastníka */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 space-y-4">
          <h3 className="font-semibold text-slate-800 text-base">Vaše kontaktní údaje (pro ubytovatele)</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Jméno</label>
              <input type="text" value={pFormData.first_name} onChange={e => setPFormData({...pFormData, first_name: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Příjmení</label>
              <input type="text" value={pFormData.last_name} onChange={e => setPFormData({...pFormData, last_name: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Telefon</label>
              <input type="tel" value={pFormData.phone} onChange={e => setPFormData({...pFormData, phone: e.target.value})} className="w-full p-2.5 border rounded-xl" placeholder="+420..." />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">E-mail</label>
              <input type="email" value={pFormData.email} onChange={e => setPFormData({...pFormData, email: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Datum narození</label>
              <input type="date" value={pFormData.birth_date} onChange={e => setPFormData({...pFormData, birth_date: e.target.value})} className="w-full p-2.5 border rounded-xl bg-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Ulice a č.p.</label>
              <input type="text" value={pFormData.street} onChange={e => setPFormData({...pFormData, street: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Město</label>
              <input type="text" value={pFormData.city} onChange={e => setPFormData({...pFormData, city: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">PSČ</label>
              <input type="text" value={pFormData.zip} onChange={e => setPFormData({...pFormData, zip: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
          </div>
        </div>

        {/* Kdo jede */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users size={18} /> Další osoby s vámi ({attendees.length})
          </h3>

          <div className="space-y-2 mb-4">
            {attendees.map(a => (
              <div key={a.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                <div>
                  <span className="font-medium text-slate-800">{a.first_name || a.name} {a.last_name || ''}</span>
                  <span className="text-xs text-slate-500 ml-2">(rok {a.birth_year || (new Date().getFullYear() - a.age)})</span>
                </div>
                <button onClick={() => removeAttendee(a.id)} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={addAttendee} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Jméno"
              value={newAttFirst}
              onChange={e => setNewAttFirst(e.target.value)}
              className="px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Příjmení"
              value={newAttLast}
              onChange={e => setNewAttLast(e.target.value)}
              className="px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Rok narození"
                value={newAttYear}
                onChange={e => setNewAttYear(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 flex items-center gap-1">
                <Plus size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Zvíře a Doprava */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 space-y-4">
          <h3 className="font-semibold text-slate-800 text-base">Zvíře a Doprava</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Domácí mazlíček</label>
              <select
                value={pFormData.pet_type}
                onChange={e => setPFormData({...pFormData, pet_type: e.target.value})}
                className="w-full p-2.5 border rounded-xl bg-white"
              >
                <option value="none">Žádný</option>
                <option value="dog">Pes</option>
                <option value="cat">Kočka</option>
                <option value="other">Jiné zvíře</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Doprava</label>
              <select
                value={pFormData.transport_type}
                onChange={e => setPFormData({...pFormData, transport_type: e.target.value})}
                className="w-full p-2.5 border rounded-xl bg-white"
              >
                <option value="own">Vlastní doprava</option>
                <option value="shared">Společná doprava</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">Poznámka / dietní požadavky</label>
            <textarea
              value={pFormData.notes}
              onChange={e => setPFormData({...pFormData, notes: e.target.value})}
              placeholder="např. bezlepková dieta, vegetarián..."
              className="w-full p-3 border rounded-xl text-sm outline-none"
              rows={2}
            />
          </div>

          <button 
            onClick={saveParticipantData}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow transition"
          >
            Uložit mé údaje
          </button>
        </div>

        {/* Vyúčtování */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard size={18} /> Vyúčtování a platba zálohy
          </h3>

          <div className="space-y-2 mb-6 border-b pb-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Celková cena ({attendees.length} osob):</span>
              <span className="font-semibold text-slate-800">{total} Kč</span>
            </div>
            <div className="flex justify-between text-base font-bold text-blue-600">
              <span>Záloha k úhradě ({settings?.deposit_percentage}%):</span>
              <span>{deposit} Kč</span>
            </div>
          </div>

          {!currentUser.deposit_paid && deposit > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {qrDataUrl && (
                <div className="border p-2 rounded-2xl bg-white shadow-sm flex flex-col items-center">
                  <img src={qrDataUrl} alt="QR Platba" className="w-48 h-48" />
                  <span className="text-[10px] text-slate-400 font-mono mt-1">SPAYD QR Platba</span>
                </div>
              )}

              <div className="text-xs space-y-1.5 text-slate-600">
                <p><strong className="text-slate-800">Účet:</strong> {settings?.bank_account || '–'}</p>
                <p><strong className="text-slate-800">IBAN:</strong> {settings?.iban || '–'}</p>
                <p><strong className="text-slate-800">Variabilní symbol:</strong> {currentUser.variable_symbol}</p>
                <p><strong className="text-slate-800">Částka zálohy:</strong> {deposit} Kč</p>
                <p className="text-[11px] text-slate-400 pt-2">
                  Otevřete své mobilní bankovnictví a naskenujte QR kód.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- ADMIN PANEL ---
  if (mode === 'admin') {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-24">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings /> Správa výletu (Admin)
          </h1>
          <button onClick={() => setMode('login')} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-semibold">
            Odhlásit
          </button>
        </header>

        {/* Přehled účastníků */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Účastníci ({allParticipants.length})</h2>
              <p className="text-xs text-slate-400">Klikni na Upravit pro změnu údajů, hesel, osob nebo cen.</p>
            </div>
            <button 
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow"
            >
              <UserPlus size={16} /> Přidat nového účastníka
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-slate-400 font-semibold uppercase">
                  <th className="p-2.5">VS</th>
                  <th className="p-2.5">Jméno a Příjmení</th>
                  <th className="p-2.5">Login / Heslo</th>
                  <th className="p-2.5">Osob</th>
                  <th className="p-2.5">Zvíře</th>
                  <th className="p-2.5">Doprava</th>
                  <th className="p-2.5">Cena celkem</th>
                  <th className="p-2.5">Záloha</th>
                  <th className="p-2.5">Stav</th>
                  <th className="p-2.5 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allParticipants.map(p => {
                  const pAtts = allAttendees.filter(a => a.participant_id === p.id);
                  const petLabel = { none: '–', dog: 'Pes', cat: 'Kočka', other: 'Jiné' }[p.pet_type || 'none'];
                  const transLabel = { own: 'Vlastní', shared: 'Společná' }[p.transport_type || 'own'];

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-mono font-bold text-slate-700">{p.variable_symbol}</td>
                      <td className="p-2.5 font-medium text-slate-900">
                        {p.first_name || p.last_name ? `${p.first_name} ${p.last_name}` : p.full_name}
                      </td>
                      <td className="p-2.5 font-mono text-slate-500">
                        {p.username} / <span className="text-slate-800">{p.pin}</span>
                      </td>
                      <td className="p-2.5">{pAtts.length} os.</td>
                      <td className="p-2.5">{petLabel}</td>
                      <td className="p-2.5">{transLabel}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{p.total_price || 0} Kč</td>
                      <td className="p-2.5 font-semibold text-blue-600">{p.deposit_amount || 0} Kč</td>
                      <td className="p-2.5">
                        <button 
                          onClick={() => toggleDeposit(p.id, p.deposit_paid)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            p.deposit_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {p.deposit_paid ? 'Zaplaceno' : 'Čeká'}
                        </button>
                      </td>
                      <td className="p-2.5 text-right">
                        <button 
                          onClick={() => openEditModal(p)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition"
                          title="Upravit účastníka"
                        >
                          <Edit size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Globální nastavení */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold mb-4 text-slate-800">Globální nastavení akce, cen a banky</h2>
          <form onSubmit={handleAdminSave} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Název akce</label>
              <input type="text" value={adminForm.event_title || ''} onChange={e => setAdminForm({...adminForm, event_title: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Místo</label>
              <input type="text" value={adminForm.location || ''} onChange={e => setAdminForm({...adminForm, location: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>

            {/* MODÁLNÍ VÝBĚR TERMÍNU (OD - DO) */}
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium flex items-center gap-1">
                <Calendar size={13} /> Termín akce (od – do)
              </label>
              <DateRangePickerModal 
                startDate={adminForm.date_start} 
                endDate={adminForm.date_end} 
                onChange={(start, end) => setAdminForm({ ...adminForm, date_start: start, date_end: end })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Číslo účtu (pro lidi)</label>
              <input type="text" value={adminForm.bank_account || ''} onChange={e => setAdminForm({...adminForm, bank_account: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">IBAN (nutný pro QR kód)</label>
              <input type="text" value={adminForm.iban || ''} onChange={e => setAdminForm({...adminForm, iban: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium flex items-center gap-1">
                <Calendar size={13} /> Splatnost zálohy do
              </label>
              <input 
                type="date" 
                value={adminForm.deposit_deadline || ''} 
                onChange={e => setAdminForm({...adminForm, deposit_deadline: e.target.value})} 
                className="w-full p-2.5 border rounded-xl bg-white text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Cena dospělý (Kč)</label>
              <input type="number" value={adminForm.price_adult || 0} onChange={e => setAdminForm({...adminForm, price_adult: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Cena junior / dítě (Kč)</label>
              <input type="number" value={adminForm.price_child_junior || 0} onChange={e => setAdminForm({...adminForm, price_child_junior: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Výše zálohy (%)</label>
              <input type="number" value={adminForm.deposit_percentage || 50} onChange={e => setAdminForm({...adminForm, deposit_percentage: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Poplatek za zvíře (Kč)</label>
              <input type="number" value={adminForm.price_pet || 0} onChange={e => setAdminForm({...adminForm, price_pet: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Doprava za osobu (Kč)</label>
              <input type="number" value={adminForm.price_transport || 0} onChange={e => setAdminForm({...adminForm, price_transport: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Admin PIN</label>
              <input type="text" value={adminForm.admin_pin || ''} onChange={e => setAdminForm({...adminForm, admin_pin: e.target.value})} className="w-full p-2.5 border rounded-xl" />
            </div>

            <div className="md:col-span-3">
              <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow">
                Uložit nastavení akce
              </button>
            </div>
          </form>
        </div>

        {/* Modál pro editaci účastníka */}
        {editingParticipant && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingParticipant.isNew ? 'Nový účastník' : `Editace: ${editingParticipant.full_name || editingParticipant.username}`}
                </h3>
                <button onClick={() => setEditingParticipant(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveModalParticipant} className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Přístup a párování</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Uživatelské jméno</label>
                      <input 
                        type="text" 
                        value={editingParticipant.username} 
                        onChange={e => setEditingParticipant({...editingParticipant, username: e.target.value})} 
                        className="w-full p-2 border rounded-xl bg-white" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Heslo / PIN</label>
                      <input 
                        type="text" 
                        value={editingParticipant.pin} 
                        onChange={e => setEditingParticipant({...editingParticipant, pin: e.target.value})} 
                        className="w-full p-2 border rounded-xl bg-white" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Variabilní symbol</label>
                      <input 
                        type="text" 
                        value={editingParticipant.variable_symbol} 
                        onChange={e => setEditingParticipant({...editingParticipant, variable_symbol: e.target.value})} 
                        className="w-full p-2 border rounded-xl bg-white" 
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Osobní údaje a adresa</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Jméno</label>
                      <input type="text" value={editingParticipant.first_name || ''} onChange={e => setEditingParticipant({...editingParticipant, first_name: e.target.value})} className="w-full p-2 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Příjmení</label>
                      <input type="text" value={editingParticipant.last_name || ''} onChange={e => setEditingParticipant({...editingParticipant, last_name: e.target.value})} className="w-full p-2 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Datum narození</label>
                      <input type="date" value={editingParticipant.birth_date || ''} onChange={e => setEditingParticipant({...editingParticipant, birth_date: e.target.value})} className="w-full p-2 border rounded-xl bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Telefon</label>
                      <input type="text" value={editingParticipant.phone || ''} onChange={e => setEditingParticipant({...editingParticipant, phone: e.target.value})} className="w-full p-2 border rounded-xl" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">E-mail</label>
                      <input type="email" value={editingParticipant.email || ''} onChange={e => setEditingParticipant({...editingParticipant, email: e.target.value})} className="w-full p-2 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Ulice a č.p.</label>
                      <input type="text" value={editingParticipant.street || ''} onChange={e => setEditingParticipant({...editingParticipant, street: e.target.value})} className="w-full p-2 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Město</label>
                      <input type="text" value={editingParticipant.city || ''} onChange={e => setEditingParticipant({...editingParticipant, city: e.target.value})} className="w-full p-2 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">PSČ</label>
                      <input type="text" value={editingParticipant.zip || ''} onChange={e => setEditingParticipant({...editingParticipant, zip: e.target.value})} className="w-full p-2 border rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm border-t pt-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Zvíře</label>
                    <select 
                      value={editingParticipant.pet_type || 'none'} 
                      onChange={e => setEditingParticipant({...editingParticipant, pet_type: e.target.value})}
                      className="w-full p-2 border rounded-xl bg-white"
                    >
                      <option value="none">Žádné</option>
                      <option value="dog">Pes</option>
                      <option value="cat">Kočka</option>
                      <option value="other">Jiné</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Doprava</label>
                    <select 
                      value={editingParticipant.transport_type || 'own'} 
                      onChange={e => setEditingParticipant({...editingParticipant, transport_type: e.target.value})}
                      className="w-full p-2 border rounded-xl bg-white"
                    >
                      <option value="own">Vlastní</option>
                      <option value="shared">Společná</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Stav zálohy</label>
                    <select 
                      value={editingParticipant.deposit_paid ? 'true' : 'false'} 
                      onChange={e => setEditingParticipant({...editingParticipant, deposit_paid: e.target.value === 'true'})}
                      className="w-full p-2 border rounded-xl bg-white font-semibold"
                    >
                      <option value="false">Čeká na úhradu</option>
                      <option value="true">Záloha zaplacena</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold uppercase text-slate-500">
                      Doprovázející osoby ({modalAttendees.length})
                    </h4>
                    {!editingParticipant.isNew && (
                      <button 
                        type="button" 
                        onClick={addModalAttendee}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <Plus size={14} /> Přidat osobu
                      </button>
                    )}
                  </div>

                  {editingParticipant.isNew && (
                    <p className="text-xs text-amber-600 mb-2">
                      * Doprovázející osoby můžete přidat po prvním uložení účastníka.
                    </p>
                  )}

                  <div className="space-y-2">
                    {modalAttendees.map(a => (
                      <div key={a.id} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl text-sm">
                        <input 
                          type="text" 
                          value={a.first_name || ''} 
                          placeholder="Jméno"
                          onChange={e => updateModalAttendee(a.id, 'first_name', e.target.value)}
                          className="w-1/3 p-1.5 border rounded-lg bg-white"
                        />
                        <input 
                          type="text" 
                          value={a.last_name || ''} 
                          placeholder="Příjmení"
                          onChange={e => updateModalAttendee(a.id, 'last_name', e.target.value)}
                          className="w-1/3 p-1.5 border rounded-lg bg-white"
                        />
                        <input 
                          type="number" 
                          value={a.birth_year || ''} 
                          placeholder="Rok narození"
                          onChange={e => updateModalAttendee(a.id, 'birth_year', e.target.value)}
                          className="w-24 p-1.5 border rounded-lg bg-white"
                        />
                        <button 
                          type="button" 
                          onClick={() => saveModalAttendeeRow(a)} 
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                        >
                          Uložit
                        </button>
                        <button 
                          type="button" 
                          onClick={() => removeModalAttendeeRow(a.id)} 
                          className="p-1.5 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                  {!editingParticipant.isNew ? (
                    <button 
                      type="button" 
                      onClick={() => deleteParticipant(editingParticipant.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-semibold transition"
                    >
                      Smazat účastníka
                    </button>
                  ) : <div />}

                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setEditingParticipant(null)}
                      className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-medium"
                    >
                      Zrušit
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-semibold shadow"
                    >
                      Uložit změny účastníka
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
