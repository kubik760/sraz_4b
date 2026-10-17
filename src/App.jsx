import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { 
  Users, Calendar, MapPin, CreditCard, ShieldCheck, 
  Plus, Trash2, LogOut, Settings, CheckCircle2, AlertCircle, Edit, UserPlus, X,
  ChevronLeft, ChevronRight, Check, KeyRound, Lock, Eye, Menu, Camera, User, Home
} from 'lucide-react';

const SUPABASE_URL = 'https://pyxdzptkuaqumuocaknw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ns5fITsygkDyXevC44oj6g_ljvgkSha';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

const PHONE_PREFIXES = [
  { code: '+420', label: 'CZ (+420)' },
  { code: '+421', label: 'SK (+421)' },
  { code: '+49',  label: 'DE (+49)' },
  { code: '+43',  label: 'AT (+43)' },
  { code: '+48',  label: 'PL (+48)' },
  { code: '+44',  label: 'UK (+44)' }
];

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

// Komprese a úprava JPG fotografie
const processJpgFile = (file) => {
  return new Promise((resolve, reject) => {
    if (file.type !== 'image/jpeg') {
      reject(new Error('Povoleny jsou pouze obrázky ve formátu JPG (.jpg, .jpeg)'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Validace síly hesla
const validatePasswordStrength = (pwd) => {
  if (pwd.length < 8) return 'Heslo musí mít alespoň 8 znaků.';
  if (!/[A-Z]/.test(pwd)) return 'Heslo musí obsahovat alespoň jedno velké písmeno.';
  if (!/[a-z]/.test(pwd)) return 'Heslo musí obsahovat alespoň jedno malé písmeno.';
  if (!/[0-9]/.test(pwd)) return 'Heslo musí obsahovat alespoň jednu číslici.';
  if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(pwd)) return 'Heslo musí obsahovat alespoň jeden speciální znak (!@#$%...).';
  return null;
};

// Kontrola, zda jde o hlavního správce akce
const isSuperAdmin = (email, username) => {
  const e = (email || '').toLowerCase().trim();
  const u = (username || '').toLowerCase().trim();
  return e === 'kubik.horak@gmail.com' || u === 'spidys';
};

// --- MODÁLNÍ KALENDÁŘ PRO ROZSAH TERMÍNU (OD - DO) ---
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
      if (!isNaN(d.getTime())) setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [startDate, endDate, isOpen]);

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

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Termín akce</h3>
                <p className="text-[11px] text-slate-400">1. klepnutí začátek, 2. klepnutí konec</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl mb-4 text-center border border-slate-100">
              <span className="text-xs font-semibold text-slate-700">
                {tempStart ? formatCZ(tempStart) : 'Od'} {'  —  '} {tempEnd ? formatCZ(tempEnd) : 'Do'}
              </span>
            </div>

            <div className="flex justify-between items-center mb-3 px-1">
              <button type="button" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-700 active:bg-slate-200">
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold text-slate-800">
                {MONTH_NAMES[month]} {year}
              </span>
              <button type="button" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-700 active:bg-slate-200">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-2">
              <span>Po</span><span>Út</span><span>St</span><span>Čt</span><span>Pá</span><span>So</span><span>Ne</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-6">
              {days.map((day, idx) => {
                if (!day) return <div key={'empty_' + idx} className="h-10" />;
                const dTime = new Date(day).setHours(0, 0, 0, 0);
                const isStart = sTime && dTime === sTime;
                const isEnd = eTime && dTime === eTime;
                const inRange = sTime && eTime && dTime > sTime && dTime < eTime;

                let cellClass = "h-10 text-xs flex items-center justify-center font-medium rounded-xl transition cursor-pointer ";
                if (isStart || isEnd) cellClass += "bg-blue-600 text-white font-bold shadow-md ";
                else if (inRange) cellClass += "bg-blue-100 text-blue-800 ";
                else cellClass += "text-slate-700 hover:bg-slate-100 active:bg-slate-200 ";

                return (
                  <button type="button" key={idx} onClick={() => handleDaySelect(day)} className={cellClass}>
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button type="button" onClick={() => { setTempStart(''); setTempEnd(''); }} className="px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 rounded-xl font-medium">
                Vymazat
              </button>
              <button type="button" onClick={handleConfirm} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5">
                <Check size={16} /> Potvrdit termín
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MODÁLNÍ KALENDÁŘ PRO DATUM NAROZENÍ (S VÝBĚREM ROKU) ---
function BirthDatePickerModal({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || '');
  const [currentYear, setCurrentYear] = useState(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.getFullYear();
    }
    return 1990;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.getMonth();
    }
    return 0;
  });

  useEffect(() => {
    setSelectedDate(value || '');
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value, isOpen]);

  const handleSelect = (day) => {
    const d = new Date(currentYear, currentMonth, day);
    const iso = toIso(d);
    setSelectedDate(iso);
    onChange(iso);
    setIsOpen(false);
  };

  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const selTime = selectedDate ? new Date(selectedDate).setHours(0, 0, 0, 0) : null;
  const yearsList = [];
  const maxYear = new Date().getFullYear();
  for (let y = maxYear; y >= 1930; y--) yearsList.push(y);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full p-2.5 border rounded-xl bg-white text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-blue-500 transition text-left"
      >
        <span className={selectedDate ? 'font-medium text-slate-800' : 'text-slate-400'}>
          {formatCZ(selectedDate) || 'Zvolte datum narození'}
        </span>
        <Calendar size={16} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-800">Datum narození</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                className="p-2 border rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 outline-none"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                className="p-2 border rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 outline-none"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
              <span>Po</span><span>Út</span><span>St</span><span>Čt</span><span>Pá</span><span>So</span><span>Ne</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {days.map((day, idx) => {
                if (!day) return <div key={'empty_' + idx} className="h-9" />;
                const dTime = new Date(currentYear, currentMonth, day).setHours(0, 0, 0, 0);
                const isSelected = selTime && dTime === selTime;

                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleSelect(day)}
                    className={`h-9 text-xs flex items-center justify-center font-medium rounded-xl transition ${
                      isSelected ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className="text-xs text-red-500 hover:underline py-1"
            >
              Vymazat datum
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- HLAVNÍ APLIKACE ---
export default function App() {
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'verify' | 'forgot' | 'reset'
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Navigace
  const [activeScreen, setActiveScreen] = useState('welcome'); // 'welcome' | 'profile' | 'trip' | 'admin'
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Přihlašovací stav (E-mail + Heslo)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Reset hesla
  const [forgotEmail, setForgotEmail] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');

  // Registrační stav
  const [regData, setRegData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    street: '',
    city: '',
    zip: '',
    phone_prefix: '+420',
    phone_number: '',
    email: '',
    password: '',
    photo_url: ''
  });
  const [verifyEmail, setVerifyEmail] = useState('');
  const [otpPin, setOtpPin] = useState('');

  // Profil & Výlet
  const [profileForm, setProfileForm] = useState({});
  const [attendees, setAttendees] = useState([]);
  const [newAttFirst, setNewAttFirst] = useState('');
  const [newAttLast, setNewAttLast] = useState('');
  const [newAttYear, setNewAttYear] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Admin
  const [allParticipants, setAllParticipants] = useState([]);
  const [allAttendees, setAllAttendees] = useState([]);
  const [adminForm, setAdminForm] = useState({});

  useEffect(() => {
    loadSettings();

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('reset');
      }
    });
  }, []);

  async function loadSettings() {
    const { data } = await supabase.from('event_settings').select('*').eq('id', 1).single();
    if (data) {
      setSettings(data);
      setAdminForm(data);
    }
  }

  async function loadAllData() {
    const { data: parts } = await supabase.from('participants').select('*').order('variable_symbol');
    const { data: atts } = await supabase.from('attendees').select('*');
    setAllParticipants(parts || []);
    setAllAttendees(atts || []);
  }

  const parsePhone = (fullPhone) => {
    if (!fullPhone) return { prefix: '+420', number: '' };
    for (let p of PHONE_PREFIXES) {
      if (fullPhone.startsWith(p.code)) {
        return { prefix: p.code, number: fullPhone.slice(p.code.length).trim() };
      }
    }
    return { prefix: '+420', number: fullPhone };
  };

  // 1. PŘIHLÁŠENÍ (E-mail + Heslo)
  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = loginEmail.trim().toLowerCase();

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('email', cleanEmail)
      .eq('pin', loginPin.trim())
      .single();

    if (error || !data) {
      setErrorMsg('Neplatný e-mail nebo heslo.');
      return;
    }

    if (!data.is_verified) {
      setVerifyEmail(data.email);
      setAuthView('verify');
      setInfoMsg('Účet ještě nebyl ověřen. Zadejte PIN z vašeho e-mailu.');
      return;
    }

    // Striktní kontrola role: Pouze kubik.horak@gmail.com je automaticky admin
    if (isSuperAdmin(data.email, data.username)) {
      data.role = 'admin';
    } else {
      // Pokud to není superadmin a v DB měl náhodou admin, zkontrolujeme načtenou hodnotu
      data.role = data.role === 'admin' ? 'admin' : 'user';
    }

    const parsed = parsePhone(data.phone);
    setCurrentUser(data);
    setProfileForm({ 
      ...data, 
      phone_prefix: parsed.prefix, 
      phone_number: parsed.number 
    });
    loadParticipantAttendees(data.id);
    loadAllData();
    setActiveScreen('welcome');
  }

  async function loadParticipantAttendees(id) {
    const { data } = await supabase.from('attendees').select('*').eq('participant_id', id);
    setAttendees(data || []);
  }

  // 2. REGISTRACE (Každý nový uživatel dostane VŽDY 'user')
  async function handleRegister(e) {
    e.preventDefault();
    setErrorMsg('');

    const reqFields = ['first_name', 'last_name', 'birth_date', 'street', 'city', 'zip', 'phone_number', 'email', 'password'];
    for (let f of reqFields) {
      if (!regData[f] || !regData[f].trim()) {
        setErrorMsg('Všechna povinná pole musí být vyplněna.');
        return;
      }
    }

    const pwdErr = validatePasswordStrength(regData.password);
    if (pwdErr) {
      setErrorMsg(pwdErr);
      return;
    }

    const cleanEmail = regData.email.trim().toLowerCase();

    const { data: existingUser } = await supabase
      .from('participants')
      .select('id')
      .eq('email', cleanEmail)
      .single();

    if (existingUser) {
      setErrorMsg('Účet s tímto e-mailem již existuje.');
      return;
    }

    const { data: vsData } = await supabase.rpc('get_next_variable_symbol');
    const newVS = vsData || (1000 + Math.floor(Math.random() * 8000)).toString();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: regData.password.trim()
    });

    if (authError) {
      setErrorMsg('Chyba při odesílání ověření: ' + authError.message);
      return;
    }

    const fullName = `${regData.first_name.trim()} ${regData.last_name.trim()}`;
    
    // ZDE: Nový uživatel je VŽDY 'user', jedině kubik.horak@gmail.com je admin
    const initialRole = cleanEmail === 'kubik.horak@gmail.com' ? 'admin' : 'user';
    const fullPhone = `${regData.phone_prefix} ${regData.phone_number.trim()}`;

    const { error: insertErr } = await supabase.from('participants').insert({
      auth_id: authData?.user?.id || null,
      username: cleanEmail,
      pin: regData.password.trim(),
      role: initialRole, // striktně user
      variable_symbol: newVS,
      first_name: regData.first_name.trim(),
      last_name: regData.last_name.trim(),
      full_name: fullName,
      birth_date: regData.birth_date,
      street: regData.street.trim(),
      city: regData.city.trim(),
      zip: regData.zip.trim(),
      phone: fullPhone,
      email: cleanEmail,
      photo_url: regData.photo_url || '',
      is_verified: false
    });

    if (insertErr) {
      setErrorMsg('Chyba při ukládání registrace: ' + insertErr.message);
      return;
    }

    setVerifyEmail(cleanEmail);
    setAuthView('verify');
    setInfoMsg(`Na adresu ${cleanEmail} byl odeslán 6místný ověřovací PIN.`);
  }

  // 3. OVĚŘENÍ PINu
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const { error } = await supabase.auth.verifyOtp({
      email: verifyEmail,
      token: otpPin.trim(),
      type: 'signup'
    });

    if (error) {
      setErrorMsg('Neplatný nebo prošlý PIN.');
      return;
    }

    await supabase.from('participants').update({ is_verified: true }).eq('email', verifyEmail);
    const { data: userProfile } = await supabase.from('participants').select('*').eq('email', verifyEmail).single();

    if (userProfile) {
      // Ujistíme se, že má správnou roli
      if (!isSuperAdmin(userProfile.email, userProfile.username) && userProfile.role !== 'admin') {
        userProfile.role = 'user';
      }
      const parsed = parsePhone(userProfile.phone);
      setCurrentUser(userProfile);
      setProfileForm({ 
        ...userProfile, 
        phone_prefix: parsed.prefix, 
        phone_number: parsed.number 
      });
      loadParticipantAttendees(userProfile.id);
      loadAllData();
      setActiveScreen('welcome');
      alert('Registrace byla úspěšně ověřena!');
    } else {
      setAuthView('login');
      alert('Ověřeno! Nyní se můžete přihlásit.');
    }
  }

  // 4. RESET HESLA
  async function handleForgotPassword(e) {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = forgotEmail.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin
    });

    if (error) {
      setErrorMsg('Chyba při odesílání: ' + error.message);
      return;
    }

    setInfoMsg(`Odkaz pro nastavení nového hesla byl odeslán na ${cleanEmail}. Zkontrolujte si příchozí poštu.`);
  }

  // 5. NASTAVENÍ NOVÉHO HESLA
  async function handleUpdatePassword(e) {
    e.preventDefault();
    setErrorMsg('');

    const pwdErr = validatePasswordStrength(newResetPassword);
    if (pwdErr) {
      setErrorMsg(pwdErr);
      return;
    }

    const { data: authUser, error: authErr } = await supabase.auth.updateUser({
      password: newResetPassword.trim()
    });

    if (authErr) {
      setErrorMsg('Chyba při změně hesla: ' + authErr.message);
      return;
    }

    if (authUser?.user?.email) {
      await supabase.from('participants').update({ pin: newResetPassword.trim() }).eq('email', authUser.user.email);
    }

    alert('Vaše heslo bylo úspěšně změněno! Nyní se můžete přihlásit.');
    setAuthView('login');
  }

  // Fotka
  const handlePhotoUpload = async (e, target) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const base64Jpg = await processJpgFile(file);
      if (target === 'register') setRegData({ ...regData, photo_url: base64Jpg });
      else if (target === 'profile') setProfileForm({ ...profileForm, photo_url: base64Jpg });
    } catch (err) {
      alert(err.message);
    }
  };

  // Uložení profilu
  async function handleSaveProfile() {
    if (profileForm.password && profileForm.password !== currentUser.pin) {
      const pwdErr = validatePasswordStrength(profileForm.password);
      if (pwdErr) {
        alert(pwdErr);
        return;
      }
    }

    const fullPhone = `${profileForm.phone_prefix || '+420'} ${(profileForm.phone_number || '').trim()}`.trim();

    const payload = {
      phone: fullPhone,
      email: profileForm.email || '',
      street: profileForm.street || '',
      city: profileForm.city || '',
      zip: profileForm.zip || '',
      photo_url: profileForm.photo_url || '',
      pin: profileForm.password ? profileForm.password.trim() : currentUser.pin
    };

    await supabase.from('participants').update(payload).eq('id', currentUser.id);
    const updated = { ...currentUser, ...payload, phone: fullPhone };
    setCurrentUser(updated);
    setProfileForm({ ...updated, phone_prefix: profileForm.phone_prefix, phone_number: profileForm.phone_number });
    loadAllData();
    alert('Profil byl v pořádku aktualizován.');
  }

  // Výpočet ceny
  const calculatePricingFor = (attList, petType, transportType) => {
    if (!settings) return { total: 0, deposit: 0 };
    let total = 0;
    const currentYear = new Date().getFullYear();

    attList.forEach(a => {
      const birthYear = parseInt(a.birth_year, 10) || (currentYear - (parseInt(a.age, 10) || 30));
      const age = Math.max(0, currentYear - birthYear);

      if (age <= settings.child_infant_max_age) total += Number(settings.price_child_infant);
      else if (age <= settings.child_junior_max_age) total += Number(settings.price_child_junior);
      else total += Number(settings.price_adult);

      if (transportType === 'shared') total += Number(settings.price_transport);
    });

    if (petType && petType !== 'none') total += Number(settings.price_pet);
    const deposit = Math.round((total * Number(settings.deposit_percentage)) / 100);
    return { total, deposit };
  };

  // QR kód
  useEffect(() => {
    if (currentUser && settings) {
      const { deposit } = calculatePricingFor(attendees, profileForm.pet_type, profileForm.transport_type);
      if (deposit > 0 && settings.iban) {
        const cleanIban = settings.iban.replace(/\s+/g, '').toUpperCase();
        const vs = currentUser.variable_symbol;
        const displayName = `${currentUser.first_name || currentUser.full_name || currentUser.email}`;
        const cleanMsg = `Zaloha vylet ${displayName}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const spayd = `SPD*1.0*ACC:${cleanIban}*AM:${deposit.toFixed(2)}*CC:CZK*X-VS:${vs}*MSG:${cleanMsg}`;

        QRCode.toDataURL(spayd, { width: 220, margin: 1 }, (err, url) => {
          if (!err) setQrDataUrl(url);
        });
      } else {
        setQrDataUrl('');
      }
    }
  }, [currentUser, attendees, profileForm.pet_type, profileForm.transport_type, settings]);

  // --- 1. AUTENTIZACE ---
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-slate-50 py-12">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-slate-100">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">{settings?.event_title || 'Společný výlet'}</h1>
            <p className="text-xs text-slate-500 mt-1">
              {authView === 'login' && 'Přihlášení ke svému účtu'}
              {authView === 'register' && 'Nová registrace účastníka'}
              {authView === 'verify' && 'Ověření e-mailu pomocí PINu'}
              {authView === 'forgot' && 'Obnova zapomenutého hesla'}
              {authView === 'reset' && 'Nastavení nového hesla'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-2xl flex items-center gap-2">
              <CheckCircle2 size={16} /> {infoMsg}
            </div>
          )}

          {/* A. PŘIHLÁŠENÍ */}
          {authView === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">E-mail</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="vas@email.cz"
                  className="w-full px-4 py-2.5 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Heslo</label>
                  <button
                    type="button"
                    onClick={() => { setAuthView('forgot'); setErrorMsg(''); setInfoMsg(''); }}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Zapomněl(a) jsem heslo
                  </button>
                </div>
                <input
                  type="password"
                  value={loginPin}
                  onChange={e => setLoginPin(e.target.value)}
                  placeholder="Zadejte heslo"
                  className="w-full px-4 py-2.5 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition shadow-md text-sm"
              >
                Přihlásit se
              </button>

              <div className="text-center pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Ještě nemáte účet?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthView('register'); setErrorMsg(''); setInfoMsg(''); }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Zaregistrujte se
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* B. ZAPOMENUTÉ HESLO */}
          {authView === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-600">
                Zadejte svůj e-mail, kterým se přihlašujete. Pošleme vám odkaz pro nastavení nového hesla.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Váš E-mail</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="vas@email.cz"
                  className="w-full px-4 py-2.5 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition shadow-md text-sm"
              >
                Odeslat odkaz na e-mail
              </button>
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthView('login'); setErrorMsg(''); setInfoMsg(''); }}
                  className="text-xs text-slate-400 hover:underline"
                >
                  Zpět na přihlášení
                </button>
              </div>
            </form>
          )}

          {/* C. RESET HESLA */}
          {authView === 'reset' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <p className="text-xs text-slate-600">
                Zadejte své nové silné heslo (min. 8 znaků, velká/malá písmena, číslo a speciální znak).
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nové heslo</label>
                <input
                  type="password"
                  value={newResetPassword}
                  onChange={e => setNewResetPassword(e.target.value)}
                  placeholder="Zadejte nové heslo"
                  className="w-full px-4 py-2.5 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition shadow-md text-sm"
              >
                Uložit nové heslo a přihlásit se
              </button>
            </form>
          )}

          {/* D. REGISTRACE */}
          {authView === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                  {regData.photo_url ? (
                    <img src={regData.photo_url} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Profilová fotografie</label>
                  <span className="text-[10px] text-slate-400 block mb-1">Pouze JPG (automatické zmenšení)</span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                    <Camera size={14} /> Vybrat JPG
                    <input type="file" accept="image/jpeg" onChange={e => handlePhotoUpload(e, 'register')} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Jméno *</label>
                  <input type="text" value={regData.first_name} onChange={e => setRegData({...regData, first_name: e.target.value})} className="w-full p-2.5 border rounded-xl" required />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Příjmení *</label>
                  <input type="text" value={regData.last_name} onChange={e => setRegData({...regData, last_name: e.target.value})} className="w-full p-2.5 border rounded-xl" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1 font-semibold">Datum narození *</label>
                  <BirthDatePickerModal value={regData.birth_date} onChange={d => setRegData({...regData, birth_date: d})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1 font-semibold">Ulice a číslo popisné *</label>
                  <input type="text" value={regData.street} onChange={e => setRegData({...regData, street: e.target.value})} className="w-full p-2.5 border rounded-xl" required />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Město *</label>
                  <input type="text" value={regData.city} onChange={e => setRegData({...regData, city: e.target.value})} className="w-full p-2.5 border rounded-xl" required />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">PSČ *</label>
                  <input type="text" value={regData.zip} onChange={e => setRegData({...regData, zip: e.target.value})} className="w-full p-2.5 border rounded-xl" required />
                </div>

                {/* Telefon s předvolbou */}
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1 font-semibold">Telefon *</label>
                  <div className="flex gap-2">
                    <select
                      value={regData.phone_prefix}
                      onChange={e => setRegData({...regData, phone_prefix: e.target.value})}
                      className="p-2.5 border rounded-xl bg-slate-50 font-semibold text-xs outline-none w-28"
                    >
                      {PHONE_PREFIXES.map(p => (
                        <option key={p.code} value={p.code}>{p.label}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={regData.phone_number}
                      onChange={e => setRegData({...regData, phone_number: e.target.value})}
                      placeholder="777 123 456"
                      className="w-full p-2.5 border rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1 font-semibold">E-mail (váš login) *</label>
                  <input type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} placeholder="vas@email.cz" className="w-full p-2.5 border rounded-xl" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1 font-semibold">Silné heslo *</label>
                  <input type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} placeholder="Min. 8 znaků, A-Z, a-z, 0-9, znak" className="w-full p-2.5 border rounded-xl" required />
                </div>
              </div>

              <p className="text-[10px] text-slate-400">* Jméno, příjmení, datum narození a variabilní symbol po registraci nelze měnit.</p>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition shadow-md text-sm"
              >
                Odeslat registraci a zaslat PIN
              </button>

              <div className="text-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setAuthView('login'); setErrorMsg(''); setInfoMsg(''); }}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Zpět na přihlášení
                </button>
              </div>
            </form>
          )}

          {/* E. VERIFIKACE PINu */}
          {authView === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-xs text-slate-600 text-center">
                Zadejte 6místný kód, který byl zaslán na: <strong className="text-slate-800">{verifyEmail}</strong>
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 text-center">Ověřovací PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpPin}
                  onChange={e => setOtpPin(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 border-2 border-blue-500 rounded-2xl text-center text-2xl font-mono tracking-widest outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition shadow-md text-sm"
              >
                Ověřit a vstoupit
              </button>
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthView('login'); setErrorMsg(''); }}
                  className="text-xs text-slate-400 hover:underline"
                >
                  Zpět na přihlášení
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- 2. PŘIHLÁŠENÉ ROZHRANÍ ---
  const isUserSuperAdmin = isSuperAdmin(currentUser.email, currentUser.username);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* HORNÍ LIŠTA */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base sm:text-lg text-slate-800">{settings?.event_title || 'Společný výlet'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            currentUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {currentUser.role === 'admin' ? 'Správce' : 'Uživatel'}
          </span>
        </div>

        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-700 transition"
          aria-label="Menu"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* BOČNÍ MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="relative w-80 bg-white h-full shadow-2xl p-6 flex flex-col justify-between z-10">
            <div>
              <div className="flex justify-between items-center mb-6 border-b pb-3">
                <span className="font-bold text-slate-800 text-sm">Navigace</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => { setActiveScreen('welcome'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeScreen === 'welcome' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Home size={18} /> Úvodní přehled
                </button>

                <button
                  onClick={() => { setActiveScreen('trip'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeScreen === 'trip' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Users size={18} /> Společný výlet & Účastníci
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => { setActiveScreen('admin'); setIsMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      activeScreen === 'admin' ? 'bg-purple-50 text-purple-700' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Settings size={18} /> Správa akce (Admin)
                  </button>
                )}
              </div>
            </div>

            {/* DOLE V MENU: PROFILOVÁ KARTA */}
            <div className="border-t pt-4">
              <div 
                onClick={() => { setActiveScreen('profile'); setIsMenuOpen(false); }}
                className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition mb-3"
              >
                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border-2 border-white shadow flex-shrink-0">
                  {currentUser.photo_url ? (
                    <img src={currentUser.photo_url} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-slate-400" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-xs text-slate-800 truncate">{currentUser.first_name} {currentUser.last_name}</p>
                  <p className="text-[10px] text-blue-600 font-semibold">Otevřít můj profil</p>
                </div>
              </div>

              <button
                onClick={() => { setCurrentUser(null); setIsMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                <LogOut size={16} /> Odhlásit se
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OBSAH OBRAZOVKY */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
        {/* 1. UVÍTÁNÍ */}
        {activeScreen === 'welcome' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-md">
              <h2 className="text-2xl font-bold mb-2">Vítej, {currentUser.first_name}! 👋</h2>
              <p className="text-sm text-blue-100 mb-6">
                Vítej v klientském portálu společného výletu. Tady najdeš veškeré informace o akci, možnost přihlásit další členy rodiny, platební údaje i přehled ostatních účastníků.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-blue-200">
                {settings?.location && <span className="flex items-center gap-1.5"><MapPin size={16} /> {settings.location}</span>}
                {(settings?.date_start || settings?.date_end) && (
                  <span className="flex items-center gap-1.5"><Calendar size={16} /> {formatCZ(settings.date_start)} – {formatCZ(settings.date_end)}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => setActiveScreen('trip')}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-300 transition cursor-pointer"
              >
                <Users className="text-blue-600 mb-2" size={28} />
                <h3 className="font-bold text-sm text-slate-800">Moje registrace & Výlet</h3>
                <p className="text-xs text-slate-400 mt-1">Nastav si doprovod, dopravu, zvíře a zkontroluj stav platby zálohy.</p>
              </div>

              <div 
                onClick={() => setActiveScreen('profile')}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-300 transition cursor-pointer"
              >
                <User className="text-indigo-600 mb-2" size={28} />
                <h3 className="font-bold text-sm text-slate-800">Můj profil</h3>
                <p className="text-xs text-slate-400 mt-1">Uprav své kontaktní údaje, telefon s předvolbou, adresu nebo fotografii.</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. OSOBNÍ PROFIL */}
        {activeScreen === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Můj osobní profil</h2>
            <p className="text-xs text-slate-400 mb-6">Šedivě označená pole (jméno, příjmení, datum narození, role a variabilní symbol) jsou v profilu trvale uzamčena.</p>

            <div className="flex items-center gap-6 mb-6 pb-6 border-b">
              <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-2 border-blue-500 shadow-md flex-shrink-0">
                {profileForm.photo_url ? (
                  <img src={profileForm.photo_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-slate-400" />
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition">
                  <Camera size={15} /> Nahrát novou fotku (JPG)
                  <input type="file" accept="image/jpeg" onChange={e => handlePhotoUpload(e, 'profile')} className="hidden" />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">Pouze formát JPG, velikost se optimalizuje automaticky.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                  Jméno <Lock size={12} />
                </label>
                <input
                  type="text"
                  value={profileForm.first_name || ''}
                  disabled
                  className="w-full p-2.5 border rounded-xl bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                  Příjmení <Lock size={12} />
                </label>
                <input
                  type="text"
                  value={profileForm.last_name || ''}
                  disabled
                  className="w-full p-2.5 border rounded-xl bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                  Datum narození <Lock size={12} />
                </label>
                <input
                  type="text"
                  value={formatCZ(profileForm.birth_date) || '–'}
                  disabled
                  className="w-full p-2.5 border rounded-xl bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                  Variabilní symbol (trvalý) <Lock size={12} />
                </label>
                <input
                  type="text"
                  value={profileForm.variable_symbol || ''}
                  disabled
                  className="w-full p-2.5 border rounded-xl bg-slate-100 text-slate-700 font-mono font-bold cursor-not-allowed"
                />
              </div>

              {/* ROLE V SYSTÉMU - V profilu vždy zablokovaná pro všechny */}
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                  Role v systému <Lock size={12} />
                </label>
                {isUserSuperAdmin ? (
                  <input
                    type="text"
                    value="Hlavní administrátor (systémově neměnné)"
                    disabled
                    className="w-full p-2.5 border rounded-xl bg-purple-50 text-purple-800 font-bold cursor-not-allowed"
                  />
                ) : currentUser.role === 'admin' ? (
                  <input
                    type="text"
                    value="Administrátor"
                    disabled
                    className="w-full p-2.5 border rounded-xl bg-purple-50 text-purple-700 font-semibold cursor-not-allowed"
                  />
                ) : (
                  <input
                    type="text"
                    value="Uživatel (roli může změnit pouze administrátor)"
                    disabled
                    className="w-full p-2.5 border rounded-xl bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                  />
                )}
              </div>

              {/* EDITOVATELNÉ KONTAKTNÍ ÚDAJE */}
              <div className="col-span-2 pt-3 border-t">
                <span className="font-bold text-slate-700">Kontaktní údaje a adresa (můžete upravovat):</span>
              </div>

              {/* Telefon s předvolbou */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-600 mb-1 font-semibold">Telefon</label>
                <div className="flex gap-2">
                  <select
                    value={profileForm.phone_prefix || '+420'}
                    onChange={e => setProfileForm({...profileForm, phone_prefix: e.target.value})}
                    className="p-2.5 border rounded-xl bg-slate-50 font-semibold text-xs outline-none w-28"
                  >
                    {PHONE_PREFIXES.map(p => (
                      <option key={p.code} value={p.code}>{p.label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={profileForm.phone_number || ''}
                    onChange={e => setProfileForm({...profileForm, phone_number: e.target.value})}
                    placeholder="777 123 456"
                    className="w-full p-2.5 border rounded-xl bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">E-mail (přihlašovací jméno)</label>
                <input
                  type="email"
                  value={profileForm.email || ''}
                  onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Ulice a číslo popisné</label>
                <input
                  type="text"
                  value={profileForm.street || ''}
                  onChange={e => setProfileForm({...profileForm, street: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Město</label>
                <input
                  type="text"
                  value={profileForm.city || ''}
                  onChange={e => setProfileForm({...profileForm, city: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">PSČ</label>
                <input
                  type="text"
                  value={profileForm.zip || ''}
                  onChange={e => setProfileForm({...profileForm, zip: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Změna hesla (vyplňte jen při změně)</label>
                <input
                  type="password"
                  value={profileForm.password || ''}
                  onChange={e => setProfileForm({...profileForm, password: e.target.value})}
                  placeholder="Nové silné heslo..."
                  className="w-full p-2.5 border rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow"
              >
                Uložit změny v profilu
              </button>
            </div>
          </div>
        )}

        {/* 3. VÝLET A REGISTRACE */}
        {activeScreen === 'trip' && (
          <div className="space-y-6">
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              currentUser.deposit_paid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {currentUser.deposit_paid ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              <div>
                <p className="font-semibold text-xs sm:text-sm">{currentUser.deposit_paid ? 'Záloha byla v pořádku přijata!' : 'Záloha čeká na úhradu'}</p>
                <p className="text-[11px] opacity-80">
                  {currentUser.deposit_paid ? 'Děkujeme, rezervace je potvrzena.' : `Splatnost zálohy: ${formatCZ(settings?.deposit_deadline) || 'dle domluvy'}`}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Users size={18} /> Osoby jedoucí se mnou ({attendees.length})
              </h3>

              <div className="space-y-2 mb-4">
                {attendees.map(a => (
                  <div key={a.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="font-medium text-slate-800">{a.first_name} {a.last_name}</span>
                      <span className="text-slate-400 ml-2">(rok {a.birth_year})</span>
                    </div>
                    <button onClick={async () => {
                      await supabase.from('attendees').delete().eq('id', a.id);
                      setAttendees(attendees.filter(item => item.id !== a.id));
                      loadAllData();
                    }} className="text-slate-400 hover:text-red-500 p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newAttFirst || !newAttYear) return;
                const { data } = await supabase.from('attendees').insert({
                  participant_id: currentUser.id,
                  first_name: newAttFirst.trim(),
                  last_name: newAttLast.trim() || currentUser.last_name,
                  birth_year: newAttYear.trim(),
                  name: `${newAttFirst.trim()} ${newAttLast.trim()}`.trim(),
                  age: Math.max(0, new Date().getFullYear() - parseInt(newAttYear, 10))
                }).select().single();
                if (data) {
                  setAttendees([...attendees, data]);
                  setNewAttFirst('');
                  setNewAttLast('');
                  setNewAttYear('');
                  loadAllData();
                }
              }} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" placeholder="Jméno" value={newAttFirst} onChange={e => setNewAttFirst(e.target.value)} className="p-2 border rounded-xl text-xs" required />
                <input type="text" placeholder="Příjmení" value={newAttLast} onChange={e => setNewAttLast(e.target.value)} className="p-2 border rounded-xl text-xs" />
                <div className="flex gap-2">
                  <input type="number" placeholder="Rok nar." value={newAttYear} onChange={e => setNewAttYear(e.target.value)} className="w-full p-2 border rounded-xl text-xs" required />
                  <button type="submit" className="px-3 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700">
                    <Plus size={16} />
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm mb-3">Zvíře a Doprava</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Domácí mazlíček</label>
                  <select
                    value={profileForm.pet_type || 'none'}
                    onChange={e => setProfileForm({...profileForm, pet_type: e.target.value})}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="none">Žádný</option>
                    <option value="dog">Pes</option>
                    <option value="cat">Kočka</option>
                    <option value="other">Jiné zvíře</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Způsob dopravy</label>
                  <select
                    value={profileForm.transport_type || 'own'}
                    onChange={e => setProfileForm({...profileForm, transport_type: e.target.value})}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="own">Vlastní doprava</option>
                    <option value="shared">Společná doprava</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vyúčtování a QR platba */}
            {(() => {
              const { total, deposit } = calculatePricingFor(attendees, profileForm.pet_type, profileForm.transport_type);
              return (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                    <CreditCard size={18} /> Vyúčtování & Platba zálohy
                  </h3>

                  <div className="space-y-2 mb-6 border-b pb-4 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Celková cena ({attendees.length} osob):</span>
                      <span className="font-semibold text-slate-800">{total} Kč</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-blue-600">
                      <span>Záloha k úhradě ({settings?.deposit_percentage}%):</span>
                      <span>{deposit} Kč</span>
                    </div>
                  </div>

                  {!currentUser.deposit_paid && deposit > 0 && (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {qrDataUrl && (
                        <div className="border p-2 rounded-2xl bg-white shadow-sm flex flex-col items-center">
                          <img src={qrDataUrl} alt="QR Platba" className="w-44 h-44" />
                          <span className="text-[10px] text-slate-400 font-mono mt-1">SPAYD QR Platba</span>
                        </div>
                      )}
                      <div className="text-xs space-y-1.5 text-slate-600">
                        <p><strong className="text-slate-800">Účet:</strong> {settings?.bank_account || '–'}</p>
                        <p><strong className="text-slate-800">IBAN:</strong> {settings?.iban || '–'}</p>
                        <p><strong className="text-slate-800">Variabilní symbol:</strong> {currentUser.variable_symbol}</p>
                        <p><strong className="text-slate-800">Částka zálohy:</strong> {deposit} Kč</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm mb-3">Seznam přihlášených účastníků ({allParticipants.length})</h3>
              <div className="divide-y divide-slate-100">
                {allParticipants.map(p => {
                  const pAtts = allAttendees.filter(a => a.participant_id === p.id);
                  return (
                    <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {p.photo_url ? (
                            <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} className="text-slate-400" />
                          )}
                        </div>
                        <span className="font-medium text-slate-800">{p.first_name} {p.last_name}</span>
                      </div>
                      <span className="text-slate-400 font-medium">+{pAtts.length} osob</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. SPRÁVA AKCE (ADMIN) */}
        {activeScreen === 'admin' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Správa všech účastníků ({allParticipants.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-slate-400 font-semibold uppercase">
                      <th className="p-2">Role</th>
                      <th className="p-2">VS</th>
                      <th className="p-2">Jméno</th>
                      <th className="p-2">E-mail</th>
                      <th className="p-2">Osob</th>
                      <th className="p-2">Cena</th>
                      <th className="p-2">Stav</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allParticipants.map(p => {
                      const pAtts = allAttendees.filter(a => a.participant_id === p.id);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          {/* ZDE: ZMĚNA ROLE POUZE ADMINISTRÁTOREM V TABULCE */}
                          <td className="p-2">
                            {isSuperAdmin(p.email, p.username) ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                                Hlavní Admin
                              </span>
                            ) : (
                              <select
                                value={p.role || 'user'}
                                onChange={async (e) => {
                                  const newRole = e.target.value;
                                  await supabase.from('participants').update({ role: newRole }).eq('id', p.id);
                                  loadAllData();
                                }}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border outline-none cursor-pointer ${
                                  p.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <option value="user">Uživatel</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-700">{p.variable_symbol}</td>
                          <td className="p-2 font-medium text-slate-900">{p.first_name} {p.last_name}</td>
                          <td className="p-2 font-mono text-slate-500">{p.email}</td>
                          <td className="p-2">{pAtts.length} os.</td>
                          <td className="p-2 font-bold text-slate-800">{p.total_price || 0} Kč</td>
                          <td className="p-2">
                            <button
                              onClick={async () => {
                                await supabase.from('participants').update({ deposit_paid: !p.deposit_paid }).eq('id', p.id);
                                loadAllData();
                              }}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
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

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Globální nastavení akce a banky</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                await supabase.from('event_settings').update(adminForm).eq('id', 1);
                setSettings(adminForm);
                alert('Nastavení akce uloženo!');
              }} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Název akce</label>
                  <input type="text" value={adminForm.event_title || ''} onChange={e => setAdminForm({...adminForm, event_title: e.target.value})} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Místo</label>
                  <input type="text" value={adminForm.location || ''} onChange={e => setAdminForm({...adminForm, location: e.target.value})} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Termín akce (od – do)</label>
                  <DateRangePickerModal
                    startDate={adminForm.date_start}
                    endDate={adminForm.date_end}
                    onChange={(s, end) => setAdminForm({...adminForm, date_start: s, date_end: end})}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Číslo účtu</label>
                  <input type="text" value={adminForm.bank_account || ''} onChange={e => setAdminForm({...adminForm, bank_account: e.target.value})} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">IBAN</label>
                  <input type="text" value={adminForm.iban || ''} onChange={e => setAdminForm({...adminForm, iban: e.target.value})} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Splatnost zálohy do</label>
                  <input type="date" value={adminForm.deposit_deadline || ''} onChange={e => setAdminForm({...adminForm, deposit_deadline: e.target.value})} className="w-full p-2.5 border rounded-xl bg-white" />
                </div>
                <div className="md:col-span-3">
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow">
                    Uložit nastavení akce
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
