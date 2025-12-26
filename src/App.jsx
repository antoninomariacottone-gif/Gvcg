import React, { useState, useEffect } from 'react';
import { Coins, Zap, Users, Settings, Gift, Shield, BarChart3, CheckCircle, XCircle, Search, Plus, Minus, Trash2, MessageSquare, AlertCircle, DollarSign, LogOut, TrendingUp } from 'lucide-react';

const CoinDropApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [users, setUsers] = useState({});
  const [tasks, setTasks] = useState({});
  const [withdrawals, setWithdrawals] = useState({});
  const [system, setSystem] = useState({
    totalFunds: 10000,
    powerPlantLevels: [
      { name: 'Base', cost: 0, minCoins: 10, maxCoins: 50 },
      { name: 'Potenziata', cost: 500, minCoins: 50, maxCoins: 150 },
      { name: 'Avanzata', cost: 2000, minCoins: 150, maxCoins: 400 },
      { name: 'Super', cost: 10000, minCoins: 400, maxCoins: 1000 }
    ]
  });

  useEffect(() => {
    initApp();
  }, []);

  const initApp = () => {
    const tg = window.Telegram?.WebApp;
    const telegramUser = tg?.initDataUnsafe?.user || {
      id: Math.floor(Math.random() * 1000000),
      username: `user${Math.floor(Math.random() * 10000)}`
    };

    if (Object.keys(tasks).length === 0) {
      setTasks({
        1: { id: 1, title: 'Unisciti al canale Telegram', description: 'Unisciti alla community', link: 'https://t.me/coindrop', reward: 100, active: true },
        2: { id: 2, title: 'Seguici su X', description: 'Seguici su Twitter', link: 'https://twitter.com/coindrop', reward: 50, active: true },
        3: { id: 3, title: 'Guarda un annuncio', description: 'Guarda un video pubblicitario', link: '', reward: 10, active: true, repeatable: true }
      });
    }

    if (!users[telegramUser.id]) {
      setShowReferralInput(true);
      window.tempUserData = telegramUser;
    } else {
      setCurrentUser(users[telegramUser.id]);
    }
  };

  const completeRegistration = () => {
    const tempData = window.tempUserData;
    if (!tempData) return;

    let referrerId = null;
    if (referralCode.trim()) {
      Object.values(users).forEach(u => {
        if (u.referralCode === referralCode.trim()) {
          referrerId = u.id;
          u.referrals.push(tempData.id);
          setUsers({...users, [u.id]: u});
        }
      });
    }

    const newUser = {
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

    setUsers({...users, [newUser.id]: newUser});
    setCurrentUser(newUser);
    setShowReferralInput(false);
    window.tempUserData = null;
  };

  const updateUser = (updates) => {
    const updated = { ...currentUser, ...updates };
    setUsers({...users, [currentUser.id]: updated});
    setCurrentUser(updated);
  };

  const getTotalCoins = () => {
    return Object.values(users).reduce((sum, u) => sum + u.balance, 0);
  };

  const getExchangeRate = () => {
    const totalCoins = getTotalCoins();
    if (totalCoins === 0) return 0.01;
    return system.totalFunds / totalCoins;
  };

  const produceCDC = () => {
    const level = system.powerPlantLevels[currentUser.powerPlantLevel];
    const coins = Math.floor(Math.random() * (level.maxCoins - level.minCoins + 1)) + level.minCoins;
    updateUser({ balance: currentUser.balance + coins });

    if (currentUser.referredBy && users[currentUser.referredBy]) {
      const referrer = users[currentUser.referredBy];
      const bonus = Math.floor(coins * 0.05);
      referrer.balance += bonus;
      referrer.referralEarnings = (referrer.referralEarnings || 0) + bonus;
      setUsers({...users, [referrer.id]: referrer});
    }
  };

  const upgradePowerPlant = () => {
    const nextLevel = currentUser.powerPlantLevel + 1;
    if (nextLevel >= system.powerPlantLevels.length) return;
    const cost = system.powerPlantLevels[nextLevel].cost;
    if (currentUser.balance < cost) return;
    updateUser({ balance: currentUser.balance - cost, powerPlantLevel: nextLevel });
  };

  const completeTask = (taskId) => {
    if (currentUser.completedTasks.includes(taskId)) return;
    const task = tasks[taskId];
    if (!task || !task.active) return;
    updateUser({ 
      balance: currentUser.balance + task.reward,
      completedTasks: task.repeatable ? currentUser.completedTasks : [...currentUser.completedTasks, taskId]
    });
  };

  const requestWithdrawal = (usdtAmount, walletAddress) => {
    const rate = getExchangeRate();
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

    setWithdrawals({...withdrawals, [withdrawal.id]: withdrawal});
    updateUser({ balance: currentUser.balance - cdcAmount });
    return true;
  };

  const HomePage = () => {
    const rate = getExchangeRate();
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

          <button onClick={produceCDC} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg py-4 font-bold text-lg hover:shadow-lg transition-all">
            Avvia Produzione
          </button>

          {nextLevel && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Upgrade: {nextLevel.name}</span>
                <span className="text-blue-600 font-bold">{nextLevel.cost} CDC</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">Produzione: {nextLevel.minCoins}-{nextLevel.maxCoins} CDC</div>
              <button onClick={upgradePowerPlant} disabled={currentUser.balance < nextLevel.cost} className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">
                Potenzia Centrale
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const TasksPage = () => (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Task Disponibili</h2>
      {Object.values(tasks).filter(t => t.active).map(task => {
        const completed = currentUser.completedTasks.includes(task.id);
        return (
          <div key={task.id} className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-start gap-4">
              <Gift className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{task.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                <span className="text-green-600 font-bold">+{task.reward} CDC</span>
              </div>
              <button onClick={() => { if (task.link) window.open(task.link, '_blank'); completeTask(task.id); }} disabled={completed && !task.repeatable} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 hover:bg-blue-700">
                {completed && !task.repeatable ? 'Completato' : 'Completa'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const WithdrawalPage = () => {
    const [amount, setAmount] = useState('');
    const [wallet, setWallet] = useState('');
    const rate = getExchangeRate();
    const cdcNeeded = amount ? Math.ceil(parseFloat(amount) / rate) : 0;

    const handleSubmit = () => {
      const success = requestWithdrawal(parseFloat(amount), wallet);
      if (success) {
        alert('Richiesta di prelievo inviata!');
        setAmount('');
        setWallet('');
      } else {
        alert('Saldo insufficiente!');
      }
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Preleva USDT</h2>
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="text-sm text-gray-600">Tasso di Cambio Attuale</div>
          <div className="text-2xl font-bold text-blue-600">1 CDC = ${rate.toFixed(6)} USDT</div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Importo USDT</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded-lg p-3" placeholder="0.00" />
            {amount && <div className="text-sm text-gray-600 mt-1">Costo: {cdcNeeded.toLocaleString()} CDC</div>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Indirizzo Wallet TRC20</label>
            <input type="text" value={wallet} onChange={(e) => setWallet(e.target.value)} className="w-full border rounded-lg p-3" placeholder="TxxxxxxxxxxxxxxxxxxxxxxxxxxxxX" />
          </div>
          <button onClick={handleSubmit} className="w-full bg-green-600 text-white rounded-lg py-3 font-bold hover:bg-green-700">
            Richiedi Prelievo
          </button>
        </div>
      </div>
    );
  };

  const ReferralPage = () => {
    const referralLink = `https://t.me/YOUR_BOT_NAME?start=${currentUser.referralCode}`;
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
          <div className="bg-gray-100 rounded-lg p-3 mb-3 break-all text-sm">{referralLink}</div>
          <button onClick={() => navigator.clipboard.writeText(referralLink)} className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700">
            Copia Link
          </button>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-sm"><strong>Guadagna il 5%</strong> su tutti i guadagni futuri dei tuoi referral!</p>
        </div>
      </div>
    );
  };

  const SettingsPage = () => (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Impostazioni Account</h2>
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div><div className="text-sm text-gray-600 mb-1">ID Utente</div><div className="text-lg font-bold">{currentUser.id}</div></div>
        <div><div className="text-sm text-gray-600 mb-1">Username</div><div className="text-lg font-bold">@{currentUser.username}</div></div>
        <div><div className="text-sm text-gray-600 mb-1">Codice Referral</div><div className="text-lg font-bold">{currentUser.referralCode}</div></div>
        <div><div className="text-sm text-gray-600 mb-1">Membro dal</div><div className="text-lg font-bold">{new Date(currentUser.joinDate).toLocaleDateString()}</div></div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-bold mb-4">Community</h3>
        <div className="space-y-3">
          <a href="https://t.me/coindrop" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100">
            <MessageSquare className="w-5 h-5 text-blue-600" /><span className="font-semibold">Telegram</span>
          </a>
          <a href="https://twitter.com/coindrop" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg hover:bg-sky-100">
            <TrendingUp className="w-5 h-5 text-sky-600" /><span className="font-semibold">Twitter / X</span>
          </a>
        </div>
      </div>
    </div>
  );

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
              <label className="block text-sm font-semibold mb-2 text-gray-700">Hai un codice referral? (Opzionale)</label>
              <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="REF123456" className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none" />
              <p className="text-xs text-gray-500 mt-1">Se sei stato invitato da qualcuno, inserisci il suo codice</p>
            </div>
            <button onClick={completeRegistration} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg py-4 font-bold text-lg hover:shadow-lg transition-all">
              Inizia
            </button>
          </div>
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">CoinDrop</h1>
            <p className="text-sm opacity-90">@{currentUser.username}</p>
          </div>
          <button onClick={() => setIsAdmin(!isAdmin)} className="bg-white/20 p-2 rounded-lg">
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
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 px-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`}>
            <tab.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CoinDropApp;
