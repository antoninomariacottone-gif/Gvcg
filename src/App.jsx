import React, { useState, useEffect } from 'react';
import { Coins, Zap, Users, Settings, TrendingUp, Gift, LogOut, DollarSign, Shield, BarChart3, CheckCircle, XCircle, Clock, Search, Plus, Minus, Edit, Trash2, MessageSquare, AlertCircle } from 'lucide-react';

const CoinDropApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [isTelegram, setIsTelegram] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  
  // Sistema di storage
  const storage = {
    get: async (key, shared = false) => {
      try {
        const result = await window.storage.get(key, shared);
        return result ? JSON.parse(result.value) : null;
      } catch {
        return null;
      }
    },
    set: async (key, value, shared = false) => {
      try {
        await window.storage.set(key, JSON.stringify(value), shared);
        return true;
      } catch {
        return false;
      }
    },
    list: async (prefix, shared = false) => {
      try {
        const result = await window.storage.list(prefix, shared);
        return result ? result.keys : [];
      } catch {
        return [];
      }
    },
    delete: async (key, shared = false) => {
      try {
        await window.storage.delete(key, shared);
        return true;
      } catch {
        return false;
      }
    }
  };

  // Inizializzazione app
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    // Verifica se siamo in Telegram
    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user) {
      setIsTelegram(false);
      return;
    }

    setIsTelegram(true);
    const telegramUser = tg.initDataUnsafe.user;
    
    // Controlla se l'utente esiste già
    let user = await storage.get(`user:${telegramUser.id}`, true);
    
    if (!user) {
      // Nuovo utente - mostra input referral
      setShowReferralInput(true);
      
      // Salva temporaneamente i dati Telegram
      window.tempUserData = {
        id: telegramUser.id,
        username: telegramUser.username || `user${telegramUser.id}`
      };
      return;
    }

    setCurrentUser(user);
    
    // Inizializza sistema se non esiste
    const system = await storage.get('system', true);
    if (!system) {
      await storage.set('system', {
        totalFunds: 10000,
        powerPlantLevels: [
          { name: 'Base', cost: 0, minCoins: 10, maxCoins: 50 },
          { name: 'Potenziata', cost: 500, minCoins: 50, maxCoins: 150 },
          { name: 'Avanzata', cost: 2000, minCoins: 150, maxCoins: 400 },
          { name: 'Super', cost: 10000, minCoins: 400, maxCoins: 1000 }
        ]
      }, true);
    }

    // Inizializza task di default
    const taskKeys = await storage.list('task:', true);
    if (taskKeys.length === 0) {
      const defaultTasks = [
        { id: 1, title: 'Unisciti al canale Telegram', description: 'Unisciti alla community', link: 'https://t.me/coindrop', reward: 100, active: true },
        { id: 2, title: 'Seguici su X', description: 'Seguici su Twitter', link: 'https://twitter.com/coindrop', reward: 50, active: true },
        { id: 3, title: 'Guarda un annuncio', description: 'Guarda un video pubblicitario', link: '', reward: 10, active: true, repeatable: true }
      ];
      for (const task of defaultTasks) {
        await storage.set(`task:${task.id}`, task, true);
      }
    }
  };

  const completeRegistration = async () => {
    const tempData = window.tempUserData;
    if (!tempData) return;

    let referrerId = null;
    
    // Verifica codice referral
    if (referralCode.trim()) {
      const userKeys = await storage.list('user:', true);
      for (const key of userKeys) {
        const u = await storage.get(key, true);
        if (u && u.referralCode === referralCode.trim()) {
          referrerId = u.id;
          // Aggiungi questo utente ai referral
          u.referrals.push(tempData.id);
          await storage.set(`user:${u.id}`, u, true);
          break;
        }
      }
    }

    // Crea nuovo utente
    const user = {
      id: tempData.id,
      username: tempData.username,
      balance: 0,
      powerPlantLevel: 0,
      referralCode: `REF${tempData.id}`,
      referredBy: referrerId,
      referrals: [],
      referralEarnings: 0,
      completedTasks: [],
      joinDate: Date.now()
    };
    
    await storage.set(`user:${tempData.id}`, user, true);
    setCurrentUser(user);
    setShowReferralInput(false);
    window.tempUserData = null;
  };

  const updateUser = async (updates) => {
    const updated = { ...currentUser, ...updates };
    await storage.set(`user:${currentUser.id}`, updated, true);
    setCurrentUser(updated);
  };

  const getTotalCoins = async () => {
    const userKeys = await storage.list('user:', true);
    let total = 0;
    for (const key of userKeys) {
      const user = await storage.get(key, true);
      if (user) total += user.balance;
    }
    return total;
  };

  const getExchangeRate = async () => {
    const system = await storage.get('system', true);
    const totalCoins = await getTotalCoins();
    if (totalCoins === 0) return 0.01;
    return system.totalFunds / totalCoins;
  };

  // Funzioni utente
  const produceCDC = async () => {
    const system = await storage.get('system', true);
    const level = system.powerPlantLevels[currentUser.powerPlantLevel];
    const coins = Math.floor(Math.random() * (level.maxCoins - level.minCoins + 1)) + level.minCoins;
    
    await updateUser({ balance: currentUser.balance + coins });

    // Bonus referral
    if (currentUser.referredBy) {
      const referrer = await storage.get(`user:${currentUser.referredBy}`, true);
      if (referrer) {
        const bonus = Math.floor(coins * 0.05);
        referrer.balance += bonus;
        referrer.referralEarnings = (referrer.referralEarnings || 0) + bonus;
        await storage.set(`user:${currentUser.referredBy}`, referrer, true);
      }
    }
  };

  const upgradePowerPlant = async () => {
    const system = await storage.get('system', true);
    const nextLevel = currentUser.powerPlantLevel + 1;
    
    if (nextLevel >= system.powerPlantLevels.length) return;
    
    const cost = system.powerPlantLevels[nextLevel].cost;
    if (currentUser.balance < cost) return;

    await updateUser({ 
      balance: currentUser.balance - cost,
      powerPlantLevel: nextLevel
    });
  };

  const completeTask = async (taskId) => {
    if (currentUser.completedTasks.includes(taskId)) return;

    const task = await storage.get(`task:${taskId}`, true);
    if (!task || !task.active) return;

    await updateUser({ 
      balance: currentUser.balance + task.reward,
      completedTasks: task.repeatable ? currentUser.completedTasks : [...currentUser.completedTasks, taskId]
    });
  };

  const requestWithdrawal = async (usdtAmount, walletAddress) => {
    const rate = await getExchangeRate();
    const cdcAmount = Math.ceil(usdtAmount / rate);

    if (currentUser.balance < cdcAmount) return false;

    const withdrawal = {
      id: Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      usdtAmount,
      cdcAmount,
      walletAddress,
      status: 'pending',
      date: Date.now()
    };
    
    await storage.set(`withdrawal:${withdrawal.id}`, withdrawal, true);
    await updateUser({ balance: currentUser.balance - cdcAmount });
    return true;
  };

  // Componenti UI Utente
  const HomePage = () => {
    const [system, setSystem] = useState(null);
    const [rate, setRate] = useState(0);

    useEffect(() => {
      const load = async () => {
        const sys = await storage.get('system', true);
        const r = await getExchangeRate();
        setSystem(sys);
        setRate(r);
      };
      load();
    }, []);

    if (!system) return <div className="p-4">Caricamento...</div>;

    const currentLevel = system.powerPlantLevels[currentUser.powerPlantLevel];
    const nextLevel = system.powerPlantLevels[currentUser.powerPlantLevel + 1];

    return (
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Il tuo saldo</h2>
            <Coins className="w-8 h-8" />
          </div>
          <div className="text-4xl font-bold mb-2">{currentUser.balance.toLocaleString()} CDC</div>
          <div className="text-sm opacity-90">≈ ${(currentUser.balance * rate).toFixed(2)} USDT</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold">Centrale Energetica</h3>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-1">Livello Attuale</div>
            <div className="text-lg font-bold text-blue-600">{currentLevel.name}</div>
            <div className="text-sm text-gray-500">Produzione: {currentLevel.minCoins}-{currentLevel.maxCoins} CDC</div>
          </div>

          <button
            onClick={produceCDC}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg py-4 font-bold text-lg hover:shadow-lg transition-all"
          >
            Avvia Produzione
          </button>

          {nextLevel && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Upgrade: {nextLevel.name}</span>
                <span className="text-blue-600 font-bold">{nextLevel.cost} CDC</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Produzione: {nextLevel.minCoins}-{nextLevel.maxCoins} CDC
              </div>
              <button
                onClick={upgradePowerPlant}
                disabled={currentUser.balance < nextLevel.cost}
                className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Potenzia Centrale
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const TasksPage = () => {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
      loadTasks();
    }, []);

    const loadTasks = async () => {
      const keys = await storage.list('task:', true);
      const taskList = [];
      for (const key of keys) {
        const task = await storage.get(key, true);
        if (task && task.active) taskList.push(task);
      }
      setTasks(taskList);
    };

    return (
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-4">Task Disponibili</h2>
        {tasks.length === 0 && (
          <div className="text-center text-gray-500 py-8">Nessun task disponibile</div>
        )}
        {tasks.map(task => {
          const completed = currentUser.completedTasks.includes(task.id);
          return (
            <div key={task.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-start gap-4">
                <Gift className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{task.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">+{task.reward} CDC</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (task.link) window.open(task.link, '_blank');
                    completeTask(task.id);
                  }}
                  disabled={completed && !task.repeatable}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  {completed && !task.repeatable ? 'Completato' : 'Completa'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const WithdrawalPage = () => {
    const [amount, setAmount] = useState('');
    const [wallet, setWallet] = useState('');
    const [rate, setRate] = useState(0);

    useEffect(() => {
      const load = async () => {
        const r = await getExchangeRate();
        setRate(r);
      };
      load();
    }, []);

    const handleSubmit = (e) => {
      e.preventDefault();
      const submitWithdrawal = async () => {
        const success = await requestWithdrawal(parseFloat(amount), wallet);
        if (success) {
          alert('Richiesta di prelievo inviata!');
          setAmount('');
          setWallet('');
        } else {
          alert('Saldo insufficiente!');
        }
      };
      submitWithdrawal();
    };

    const cdcNeeded = amount ? Math.ceil(parseFloat(amount) / rate) : 0;

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Gestione Task</h2>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="font-bold mb-4">Crea Nuovo Task</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="Titolo"
              className="w-full border rounded-lg p-2"
            />
            <input
              type="text"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              placeholder="Descrizione"
              className="w-full border rounded-lg p-2"
            />
            <input
              type="text"
              value={newTask.link}
              onChange={(e) => setNewTask({...newTask, link: e.target.value})}
              placeholder="Link (opzionale)"
              className="w-full border rounded-lg p-2"
            />
            <input
              type="number"
              value={newTask.reward}
              onChange={(e) => setNewTask({...newTask, reward: e.target.value})}
              placeholder="Ricompensa CDC"
              className="w-full border rounded-lg p-2"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newTask.repeatable}
                onChange={(e) => setNewTask({...newTask, repeatable: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm">Task ripetibile</span>
            </label>
            <button
              onClick={saveTask}
              className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700"
            >
              Crea Task
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold text-lg">{task.title}</div>
                  <div className="text-sm text-gray-600">{task.description}</div>
                  <div className="text-sm mt-1">
                    <span className="text-green-600 font-bold">+{task.reward} CDC</span>
                    {task.repeatable && <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">Ripetibile</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleTask(task)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      task.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {task.active ? 'Attivo' : 'Disattivo'}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);

    const loadWithdrawals = async () => {
      const keys = await storage.list('withdrawal:', true);
      const list = [];
      for (const key of keys) {
        const w = await storage.get(key, true);
        if (w) list.push(w);
      }
      setWithdrawals(list.sort((a, b) => b.date - a.date));
    };

    useEffect(() => {
      loadWithdrawals();
    }, []);

    const handleApprove = async (withdrawal) => {
      withdrawal.status = 'approved';
      await storage.set(`withdrawal:${withdrawal.id}`, withdrawal, true);
      loadWithdrawals();
    };

    const handleReject = async (withdrawal) => {
      withdrawal.status = 'rejected';
      await storage.set(`withdrawal:${withdrawal.id}`, withdrawal, true);
      
      const user = await storage.get(`user:${withdrawal.userId}`, true);
      if (user) {
        user.balance += withdrawal.cdcAmount;
        await storage.set(`user:${withdrawal.userId}`, user, true);
      }
      loadWithdrawals();
    };
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Gestione Prelievi</h2>
        <div className="space-y-3">
          {withdrawals.map(w => (
            <div key={w.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold">@{w.username}</div>
                  <div className="text-sm text-gray-600">${w.usdtAmount} USDT ({w.cdcAmount} CDC)</div>
                  <div className="text-xs text-gray-500 mt-1 break-all">{w.walletAddress}</div>
                  <div className="text-xs text-gray-400">{new Date(w.date).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  {w.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(w)}
                        className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReject(w)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {w.status === 'approved' && (
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Approvato
                    </span>
                  )}
                  {w.status === 'rejected' && (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Rifiutato
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AdminSettings = () => {
    const [funds, setFunds] = useState('');

    useEffect(() => {
      const load = async () => {
        const sys = await storage.get('system', true);
        setFunds(sys.totalFunds.toString());
      };
      load();
    }, []);

    const handleUpdate = (e) => {
      e.preventDefault();
      const update = async () => {
        const sys = await storage.get('system', true);
        sys.totalFunds = parseFloat(funds);
        await storage.set('system', sys, true);
        alert('Fondi aggiornati!');
      };
      update();
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Impostazioni Sistema</h2>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <label className="block text-sm font-semibold mb-2">Fondi Totali (USDT)</label>
          <input
            type="number"
            step="0.01"
            value={funds}
            onChange={(e) => setFunds(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
          />
          <button
            onClick={handleUpdate}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-bold hover:bg-blue-700 transition-colors"
          >
            Aggiorna Fondi
          </button>
        </div>
      </div>
    );
  };

  // Schermata richiesta referral
  if (showReferralInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Coins className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Benvenuto in CoinDrop!</h1>
            <p className="text-gray-600 mt-2">Inizia a guadagnare CDC oggi</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Hai un codice referral? (Opzionale)
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="REF123456"
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se sei stato invitato da qualcuno, inserisci il suo codice
              </p>
            </div>

            <button
              onClick={completeRegistration}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg py-4 font-bold text-lg hover:shadow-lg transition-all"
            >
              Inizia
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Schermata non Telegram
  if (!isTelegram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Accesso non autorizzato</h1>
          <p className="text-gray-600 mb-6">
            Questa app può essere aperta solo all'interno di Telegram.
          </p>
          <a
            href="https://t.me/YOUR_BOT_USERNAME"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Apri in Telegram
          </a>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
        <div className="text-white text-center">
          <Coins className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold">CoinDrop</h1>
          <p className="mt-2">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 pb-20">
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <button onClick={() => setIsAdmin(false)} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>

        <div className="flex border-b bg-white overflow-x-auto">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'users', icon: Users, label: 'Utenti' },
            { id: 'tasks', icon: Gift, label: 'Task' },
            { id: 'withdrawals', icon: DollarSign, label: 'Prelievi' },
            { id: 'settings', icon: Settings, label: 'Impostazioni' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                adminTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {adminTab === 'dashboard' && <AdminDashboard />}
        {adminTab === 'users' && <AdminUsers />}
        {adminTab === 'tasks' && <AdminTasks />}
        {adminTab === 'withdrawals' && <AdminWithdrawals />}
        {adminTab === 'settings' && <AdminSettings />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">CoinDrop</h1>
            <p className="text-sm opacity-90">@{currentUser.username}</p>
          </div>
          <button
            onClick={() => setIsAdmin(true)}
            className="bg-white/20 p-2 rounded-lg"
          >
            <Shield className="w-6 h-6" />
          </button>
        </div>
      </div>

      {activeTab === 'home' && <HomePage />}
      {activeTab === 'tasks' && <TasksPage />}
      {activeTab === 'withdrawal' && <WithdrawalPage />}
      {activeTab === 'referral' && <ReferralPage />}
      {activeTab === 'settings' && <SettingsPage />}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
        {[
          { id: 'home', icon: Zap, label: 'Home' },
          { id: 'tasks', icon: Gift, label: 'Task' },
          { id: 'withdrawal', icon: DollarSign, label: 'Preleva' },
          { id: 'referral', icon: Users, label: 'Referral' },
          { id: 'settings', icon: Settings, label: 'Account' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-2 ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CoinDropApp;Preleva USDT</h2>
        
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="text-sm text-gray-600">Tasso di Cambio Attuale</div>
          <div className="text-2xl font-bold text-blue-600">1 CDC = ${rate.toFixed(6)} USDT</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Importo USDT</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded-lg p-3"
              placeholder="0.00"
            />
            {amount && (
              <div className="text-sm text-gray-600 mt-1">
                Costo: {cdcNeeded.toLocaleString()} CDC
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Indirizzo Wallet TRC20</label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full border rounded-lg p-3"
              placeholder="TxxxxxxxxxxxxxxxxxxxxxxxxxxxxX"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white rounded-lg py-3 font-bold hover:bg-green-700 transition-colors"
          >
            Richiedi Prelievo
          </button>
        </div>
      </div>
    );
  };

  const ReferralPage = () => {
    const referralLink = `https://t.me/@Testhusdhe_bot?start=${currentUser.referralCode}`;

    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">Programma Referral</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
            <div className="text-3xl font-bold mb-2">{currentUser.referrals.length}</div>
            <div className="text-sm opacity-90">Utenti Invitati</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="text-3xl font-bold mb-2">{(currentUser.referralEarnings || 0).toLocaleString()}</div>
            <div className="text-sm opacity-90">CDC Guadagnati</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold mb-3">Il tuo link di riferimento</h3>
          <div className="bg-gray-100 rounded-lg p-3 mb-3 break-all text-sm">
            {referralLink}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(referralLink)}
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition-colors"
          >
            Copia Link
          </button>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-sm">
            <strong>Guadagna il 5%</strong> su tutti i guadagni futuri dei tuoi referral!
          </p>
        </div>
      </div>
    );
  };

  const SettingsPage = () => {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">Impostazioni Account</h2>
        
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">ID Utente</div>
            <div className="text-lg font-bold">{currentUser.id}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Username</div>
            <div className="text-lg font-bold">@{currentUser.username}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Codice Referral</div>
            <div className="text-lg font-bold">{currentUser.referralCode}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Membro dal</div>
            <div className="text-lg font-bold">{new Date(currentUser.joinDate).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold mb-4">Community</h3>
          <div className="space-y-3">
            <a href="https://t.me/coindrop" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Telegram</span>
            </a>
            <a href="https://twitter.com/coindrop" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors">
              <TrendingUp className="w-5 h-5 text-sky-600" />
              <span className="font-semibold">Twitter / X</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Componenti Admin
  const AdminDashboard = () => {
    const [stats, setStats] = useState({ users: 0, totalCoins: 0, pendingWithdrawals: 0, rate: 0 });

    useEffect(() => {
      const load = async () => {
        const userKeys = await storage.list('user:', true);
        const total = await getTotalCoins();
        const rate = await getExchangeRate();
        const withdrawalKeys = await storage.list('withdrawal:', true);
        let pending = 0;
        for (const key of withdrawalKeys) {
          const w = await storage.get(key, true);
          if (w && w.status === 'pending') pending++;
        }
        setStats({ users: userKeys.length, totalCoins: total, pendingWithdrawals: pending, rate });
      };
      load();
    }, []);

    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">Dashboard Amministratore</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-500 text-white rounded-xl p-6">
            <div className="text-3xl font-bold">{stats.users}</div>
            <div className="text-sm opacity-90">Utenti Totali</div>
          </div>
          <div className="bg-green-500 text-white rounded-xl p-6">
            <div className="text-3xl font-bold">{stats.totalCoins.toLocaleString()}</div>
            <div className="text-sm opacity-90">CDC in Circolazione</div>
          </div>
          <div className="bg-yellow-500 text-white rounded-xl p-6">
            <div className="text-3xl font-bold">{stats.pendingWithdrawals}</div>
            <div className="text-sm opacity-90">Prelievi in Attesa</div>
          </div>
          <div className="bg-purple-500 text-white rounded-xl p-6">
            <div className="text-3xl font-bold">${stats.rate.toFixed(6)}</div>
            <div className="text-sm opacity-90">Tasso CDC/USDT</div>
          </div>
        </div>
      </div>
    );
  };

  const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [adjustAmount, setAdjustAmount] = useState('');

    useEffect(() => {
      loadUsers();
    }, []);

    const loadUsers = async () => {
      const keys = await storage.list('user:', true);
      const list = [];
      for (const key of keys) {
        const user = await storage.get(key, true);
        if (user) list.push(user);
      }
      setUsers(list);
    };

    const filteredUsers = users.filter(u => 
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toString().includes(search)
    );

    const adjustBalance = async (amount) => {
      if (!selectedUser) return;
      const user = await storage.get(`user:${selectedUser.id}`, true);
      user.balance = Math.max(0, user.balance + amount);
      await storage.set(`user:${selectedUser.id}`, user, true);
      loadUsers();
      setSelectedUser(user);
      setAdjustAmount('');
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Gestione Utenti</h2>
        
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per username o ID..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredUsers.map(user => (
            <div 
              key={user.id} 
              onClick={() => setSelectedUser(user)}
              className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all ${
                selectedUser?.id === user.id ? 'ring-2 ring-blue-500' : ''
              }`}
              >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-lg">@{user.username}</div>
                  <div className="text-sm text-gray-600">ID: {user.id}</div>
                  <div className="text-sm text-gray-600">Referral: {user.referrals.length}</div>
                  <div className="text-sm text-green-600">Guadagni Referral: {user.referralEarnings || 0} CDC</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{user.balance.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">CDC</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedUser && (
          <div className="fixed bottom-20 left-0 right-0 bg-white border-t shadow-lg p-4">
            <h3 className="font-bold mb-3">Modifica Saldo: @{selectedUser.username}</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Importo"
                className="flex-1 border rounded-lg p-2"
              />
              <button
                onClick={() => adjustBalance(parseFloat(adjustAmount))}
                className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => adjustBalance(-parseFloat(adjustAmount))}
                className="bg-red-600 text-white px-4 rounded-lg hover:bg-red-700"
              >
                <Minus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AdminTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({ title: '', description: '', link: '', reward: '', repeatable: false });

    useEffect(() => {
      loadTasks();
    }, []);

    const loadTasks = async () => {
      const keys = await storage.list('task:', true);
      const list = [];
      for (const key of keys) {
        const task = await storage.get(key, true);
        if (task) list.push(task);
      }
      setTasks(list);
    };

    const saveTask = async () => {
      if (!newTask.title || !newTask.reward) return;
      const task = {
        id: Date.now(),
        title: newTask.title,
        description: newTask.description,
        link: newTask.link,
        reward: parseInt(newTask.reward),
        repeatable: newTask.repeatable,
        active: true
      };
      await storage.set(`task:${task.id}`, task, true);
      setNewTask({ title: '', description: '', link: '', reward: '', repeatable: false });
      loadTasks();
    };

    const toggleTask = async (task) => {
      task.active = !task.active;
      await storage.set(`task:${task.id}`, task, true);
      loadTasks();
    };

    const deleteTask = async (taskId) => {
      if (confirm('Sei sicuro di voler eliminare questo task?')) {
        await storage.delete(`task:${taskId}`, true);
        loadTasks();
      }
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">
