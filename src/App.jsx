import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { 
  Users, Calendar, MapPin, CreditCard, ShieldCheck, 
  Plus, Trash2, LogOut, Settings, CheckCircle2, AlertCircle 
} from 'lucide-react';

// Nahraď svými klíči z Supabase -> Settings -> API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pyxdzptkuaqumuocaknw.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Ns5fITsygkDyXevC44oj6g_ljvgkSha';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [mode, setMode] = useState('login'); // 'login', 'participant', 'admin'
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Login form states
  const [loginUser, setLoginUser] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [adminPinInput, setAdminPinInput] = useState('');

  // Data pro uživatele
  const [attendees, setAttendees] = useState([]);
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeAge, setNewAttendeeAge] = useState('');
  const [petsCount, setPetsCount] = useState(0);
  const [transportNeeded, setTransportNeeded] = useState(false);
  const [notes, setNotes] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Data pro Admin
  const [allParticipants, setAllParticipants] = useState([]);
  const [allAttendees, setAllAttendees] = useState([]);
  const [adminForm, setAdminForm] = useState({});

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
    setPetsCount(data.pets_count || 0);
    setTransportNeeded(data.transport_needed || false);
    setNotes(data.notes || '');
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
    const { data: parts } = await supabase.from('participants').select('*').order('username');
    const { data: atts } = await supabase.from('attendees').select('*');
    setAllParticipants(parts || []);
    setAllAttendees(atts || []);
  }

  // Výpočet cen
  const calculatePricing = () => {
    if (!settings) return { total: 0, deposit: 0 };
    let total = 0;
    
    // Spočítat za účastníky
    attendees.forEach(a => {
      const age = parseInt(a.age) || 0;
      if (age <= settings.child_infant_max_age) {
        total += Number(settings.price_child_infant);
      } else if (age <= settings.child_junior_max_age) {
        total += Number(settings.price_child_junior);
      } else {
        total += Number(settings.price_adult);
      }
      if (transportNeeded) {
        total += Number(settings.price_transport);
      }
    });

    // Zvířata
    total += (petsCount * Number(settings.price_pet));

    const deposit = Math.round((total * Number(settings.deposit_percentage)) / 100);
    return { total, deposit };
  };

  // Generování SPAYD QR kódu
  useEffect(() => {
    if (mode === 'participant' && currentUser && settings) {
      const { deposit } = calculatePricing();
      if (deposit > 0 && settings.iban) {
        // Český formát SPAYD: SPD*1.0*ACC:CZ...*AM:1500.00*CC:CZK*X-VS:1001*MSG:...
        const cleanIban = settings.iban.replace(/\s+/g, '').toUpperCase();
        const vs = currentUser.variable_symbol;
        const msg = `Zaloha vylet ${currentUser.full_name}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const spayd = `SPD*1.0*ACC:${cleanIban}*AM:${deposit.toFixed(2)}*CC:CZK*X-VS:${vs}*MSG:${msg}`;

        QRCode.toDataURL(spayd, { width: 220, margin: 1 }, (err, url) => {
          if (!err) setQrDataUrl(url);
        });
      } else {
        setQrDataUrl('');
      }
    }
  }, [mode, attendees, petsCount, transportNeeded, settings, currentUser]);

  // Uložení změn účastníka
  async function saveParticipantData() {
    const { total, deposit } = calculatePricing();
    await supabase.from('participants').update({
      pets_count: petsCount,
      transport_needed: transportNeeded,
      notes: notes,
      total_price: total,
      deposit_amount: deposit
    }).eq('id', currentUser.id);
    alert('Údaje byly úspěšně uloženy!');
  }

  // Přidání doprovodu
  async function addAttendee(e) {
    e.preventDefault();
    if (!newAttendeeName || !newAttendeeAge) return;

    const { data } = await supabase.from('attendees').insert({
      participant_id: currentUser.id,
      name: newAttendeeName.trim(),
      age: parseInt(newAttendeeAge)
    }).select().single();

    if (data) {
      setAttendees([...attendees, data]);
      setNewAttendeeName('');
      setNewAttendeeAge('');
    }
  }

  // Smazání doprovodu
  async function removeAttendee(id) {
    await supabase.from('attendees').delete().eq('id', id);
    setAttendees(attendees.filter(a => a.id !== id));
  }

  // Uložení nastavení admina
  async function handleAdminSave(e) {
    e.preventDefault();
    await supabase.from('event_settings').update(adminForm).eq('id', 1);
    setSettings(adminForm);
    alert('Nastavení uloženo!');
  }

  // Přepnutí stavu zaplacení zálohy
  async function toggleDeposit(id, currentStatus) {
    await supabase.from('participants').update({ deposit_paid: !currentStatus }).eq('id', id);
    setAllParticipants(allParticipants.map(p => p.id === id ? { ...p, deposit_paid: !currentStatus } : p));
  }

  const { total, deposit } = calculatePricing();

  // --- RENDEROVÁNÍ: PŘIHLAŠOVACÍ OBRAZOVKA ---
  if (mode === 'login') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">{settings?.event_title || 'Společný výlet'}</h1>
            <p className="text-sm text-slate-500 mt-1">Zadej své přihlašovací údaje</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-2">
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
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">PIN</label>
              <input
                type="password"
                placeholder="Čtyřmístný PIN"
                value={loginPin}
                onChange={e => setLoginPin(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow"
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
                  className="w-full px-3 py-1.5 border rounded-lg text-slate-700 text-xs outline-none"
                />
                <button type="submit" className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium">
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
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-20">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{currentUser.full_name}</h1>
            <p className="text-xs text-slate-500">Variabilní symbol: <span className="font-semibold text-slate-700">{currentUser.variable_symbol}</span></p>
          </div>
          <button 
            onClick={() => setMode('login')} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* Informace o akci */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-2">{settings?.event_title}</h2>
          <div className="space-y-1 text-sm text-blue-100">
            {settings?.location && <p className="flex items-center gap-2"><MapPin size={16} /> {settings.location}</p>}
            {(settings?.date_start || settings?.date_end) && (
              <p className="flex items-center gap-2"><Calendar size={16} /> {settings.date_start} – {settings.date_end}</p>
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
              {currentUser.deposit_paid ? 'Děkujeme, těšíme se na vás.' : `Splatnost zálohy: ${settings?.deposit_deadline || 'dle domluvy'}`}
            </p>
          </div>
        </div>

        {/* Nahlášení účastníci */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users size={18} /> Kdo s vámi pojede? ({attendees.length})
          </h3>

          <div className="space-y-2 mb-4">
            {attendees.map(a => (
              <div key={a.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="font-medium text-slate-800">{a.name}</span>
                  <span className="text-xs text-slate-500 ml-2">({a.age} let)</span>
                </div>
                <button onClick={() => removeAttendee(a.id)} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={addAttendee} className="flex gap-2">
            <input
              type="text"
              placeholder="Jméno a příjmení"
              value={newAttendeeName}
              onChange={e => setNewAttendeeName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              placeholder="Věk"
              value={newAttendeeAge}
              onChange={e => setNewAttendeeAge(e.target.value)}
              className="w-20 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 flex items-center gap-1">
              <Plus size={16} /> Přidat
            </button>
          </form>
        </div>

        {/* Doplňující volby */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6 space-y-4">
          <h3 className="font-semibold text-slate-800 mb-2">Doplňující služby</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Počet domácích mazlíčků (pes/kočka):</span>
            <input
              type="number"
              min="0"
              value={petsCount}
              onChange={e => setPetsCount(parseInt(e.target.value) || 0)}
              className="w-20 px-3 py-1.5 border rounded-xl text-sm text-center"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Máme zájem o společnou dopravu:</span>
            <input
              type="checkbox"
              checked={transportNeeded}
              onChange={e => setTransportNeeded(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Poznámka / dietní omezení:</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="např. bezlepková dieta, vegetarián..."
              className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <button 
            onClick={saveParticipantData}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition"
          >
            Uložit změny
          </button>
        </div>

        {/* Vyúčtování a QR platba */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard size={18} /> Vyúčtování a platba zálohy
          </h3>

          <div className="space-y-2 mb-6 border-b pb-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Celková předpokládaná cena:</span>
              <span className="font-semibold text-slate-800">{total} Kč</span>
            </div>
            <div className="flex justify-between text-base font-bold text-blue-600">
              <span>Záloha ({settings?.deposit_percentage}%):</span>
              <span>{deposit} Kč</span>
            </div>
          </div>

          {!currentUser.deposit_paid && deposit > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {qrDataUrl ? (
                <div className="border p-2 rounded-2xl bg-white shadow-sm flex flex-col items-center">
                  <img src={qrDataUrl} alt="QR Platba" className="w-48 h-48" />
                  <span className="text-[10px] text-slate-400 font-mono mt-1">SPAYD QR Platba</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 text-center p-4 border rounded-xl">
                  {settings?.iban ? 'Generuji QR kód...' : 'V administraci zatím není nastaven IBAN bankovního účtu.'}
                </div>
              )}

              <div className="text-xs space-y-1.5 text-slate-600">
                <p><strong className="text-slate-800">Účet:</strong> {settings?.bank_account || '–'}</p>
                <p><strong className="text-slate-800">IBAN:</strong> {settings?.iban || '–'}</p>
                <p><strong className="text-slate-800">Variabilní symbol:</strong> {currentUser.variable_symbol}</p>
                <p><strong className="text-slate-800">Částka zálohy:</strong> {deposit} Kč</p>
                <p className="text-[11px] text-slate-400 pt-2">
                  Naskenujte QR kód v mobilním bankovnictví vaší banky (Air Bank, ČSOB, KB, Fio, Spořitelna apod.).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDEROVÁNÍ: ADMIN NÁSTĚNKA ---
  if (mode === 'admin') {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-20">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings /> Správa výletu (Admin)
          </h1>
          <button onClick={() => setMode('login')} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold">
            Odhlásit
          </button>
        </header>

        {/* Nastavení akce */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
          <h2 className="text-lg font-semibold mb-4">Nastavení akce, cen a banky</h2>
          <form onSubmit={handleAdminSave} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Název akce</label>
              <input type="text" value={adminForm.event_title || ''} onChange={e => setAdminForm({...adminForm, event_title: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Místo</label>
              <input type="text" value={adminForm.location || ''} onChange={e => setAdminForm({...adminForm, location: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Termín (od - do)</label>
              <input type="text" value={adminForm.date_start || ''} onChange={e => setAdminForm({...adminForm, date_start: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="10. 7. - 15. 7." />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Číslo účtu (pro lidi)</label>
              <input type="text" value={adminForm.bank_account || ''} onChange={e => setAdminForm({...adminForm, bank_account: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="123456789/2010" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">IBAN (nutný pro QR kód)</label>
              <input type="text" value={adminForm.iban || ''} onChange={e => setAdminForm({...adminForm, iban: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="CZ..." />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Splatnost zálohy do</label>
              <input type="text" value={adminForm.deposit_deadline || ''} onChange={e => setAdminForm({...adminForm, deposit_deadline: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="31. 5." />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Cena dospělý (Kč)</label>
              <input type="number" value={adminForm.price_adult || 0} onChange={e => setAdminForm({...adminForm, price_adult: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Cena junior (Kč)</label>
              <input type="number" value={adminForm.price_child_junior || 0} onChange={e => setAdminForm({...adminForm, price_child_junior: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Výše zálohy (%)</label>
              <input type="number" value={adminForm.deposit_percentage || 50} onChange={e => setAdminForm({...adminForm, deposit_percentage: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Poplatek za zvíře (Kč)</label>
              <input type="number" value={adminForm.price_pet || 0} onChange={e => setAdminForm({...adminForm, price_pet: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Doprava za osobu (Kč)</label>
              <input type="number" value={adminForm.price_transport || 0} onChange={e => setAdminForm({...adminForm, price_transport: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Admin PIN</label>
              <input type="text" value={adminForm.admin_pin || ''} onChange={e => setAdminForm({...adminForm, admin_pin: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>

            <div className="md:col-span-3">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
                Uložit nastavení akce
              </button>
            </div>
          </form>
        </div>

        {/* Tabulka všech 36 rodin */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Přehled účastníků a plateb ({allParticipants.length})</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b text-slate-400 font-semibold uppercase">
                <th className="p-2">VS</th>
                <th className="p-2">Jméno</th>
                <th className="p-2">Lidí</th>
                <th className="p-2">Zvířata</th>
                <th className="p-2">Doprava</th>
                <th className="p-2">Cena celkem</th>
                <th className="p-2">Záloha</th>
                <th className="p-2">Stav zálohy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allParticipants.map(p => {
                const pAttendees = allAttendees.filter(a => a.participant_id === p.id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-2 font-mono font-semibold">{p.variable_symbol}</td>
                    <td className="p-2 font-medium text-slate-800">{p.full_name}</td>
                    <td className="p-2">{pAttendees.length} os.</td>
                    <td className="p-2">{p.pets_count || 0}</td>
                    <td className="p-2">{p.transport_needed ? 'Ano' : 'Ne'}</td>
                    <td className="p-2 font-semibold">{p.total_price || 0} Kč</td>
                    <td className="p-2 text-blue-600 font-semibold">{p.deposit_amount || 0} Kč</td>
                    <td className="p-2">
                      <button 
                        onClick={() => toggleDeposit(p.id, p.deposit_paid)}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium ${
                          p.deposit_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {p.deposit_paid ? 'Zaplaceno' : 'Čeká'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
