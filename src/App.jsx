import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { 
  Users, Calendar, MapPin, CreditCard, ShieldCheck, 
  Plus, Trash2, LogOut, Settings, CheckCircle2, AlertCircle, Edit, UserPlus, X 
} from 'lucide-react';

const SUPABASE_URL = 'https://pyxdzptkuaqumuocaknw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ns5fITsygkDyXevC44oj6g_ljvgkSha';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  // Pomocná funkce pro české formátování data
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

  // Výpočet ceny pro zadaný seznam lidí, zvíře a dopravu
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

  // Dynamický QR kód pro účastníka
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

  // Uložení údajů účastníka
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

  // Uložení detailu účastníka z Admin modálu
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

  // Přidání doprovodu v Admin modálu
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

        {/* 1. Osobní údaje účastníka pro ubytování */}
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

        {/* 2. Kdo pojede s vámi (Doprovod) */}
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

        {/* 3. Volby zvířete a dopravy */}
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

        {/* 4. Vyúčtování a QR platba */}
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

  // --- RENDEROVÁNÍ: ADMIN ---
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

        {/* 1. Účastníci */}
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

        {/* 2. Globální nastavení akce */}
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

            {/* Kalendář pro výběr termínu (OD - DO) */}
            <div className="md:col-span-1">
              <label className="block text-xs text-slate-500 mb-1 font-medium flex items-center gap-1">
                <Calendar size={13} /> Termín akce (Od – Do)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute -top-1.5 left-2 bg-white px-1 text-[9px] text-slate-400 font-semibold">OD</span>
                  <input 
                    type="date" 
                    value={adminForm.date_start || ''} 
                    onChange={e => {
                      const newStart = e.target.value;
                      setAdminForm({
                        ...adminForm, 
                        date_start: newStart,
                        date_end: (adminForm.date_end && adminForm.date_end < newStart) ? newStart : adminForm.date_end
                      });
                    }} 
                    className="w-full p-2.5 pt-2 border rounded-xl bg-white text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                  />
                </div>
                <div className="relative">
                  <span className="absolute -top-1.5 left-2 bg-white px-1 text-[9px] text-slate-400 font-semibold">DO</span>
                  <input 
                    type="date" 
                    min={adminForm.date_start || ''}
                    value={adminForm.date_end || ''} 
                    onChange={e => setAdminForm({...adminForm, date_end: e.target.value})} 
                    className="w-full p-2.5 pt-2 border rounded-xl bg-white text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Číslo účtu (pro lidi)</label>
              <input type="text" value={adminForm.bank_account || ''} onChange={e => setAdminForm({...adminForm, bank_account: e.target.value})} className="w-full p
