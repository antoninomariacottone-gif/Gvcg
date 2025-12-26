import React, { useState, useEffect } from 'react';
import { Coins, Zap, Users, Settings, Gift, AlertCircle, DollarSign } from 'lucide-react';
import { supabase } from './supabaseClient';

const CoinDropApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [isTelegram, setIsTelegram] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    const tg = window.Telegram?.WebApp;
    
    if (!tg || !tg.initDataUnsafe?.user) {
      setIsTelegram(false);
      setLoading(false);
      return;
    }

    setIsTelegram(true);
    const telegramUser = tg.initDataUnsafe.user;

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', telegramUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        setShowReferralInput(true);
        window.tempUserData = telegramUser;
      } else if (user) {
        setCurrentUser(user);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    
    setLoading(false);
  };

  const completeRegistration = async () => {
    const tempData = window.tempUserData;
    if (!tempData) return;

    let referrerId = null;
    
    if (referralCode.trim()) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id, referrals')
        .eq('referral_code', referralCode.trim())
        .single();

      if (referrer) {
        referrerId = referrer.id;
        const updatedReferrals = [...(referrer.referrals || []), tempData.id];
        await supabase
          .from('users')
          .update({ referrals: updatedReferrals })
          .eq('id', referrer.id);
      }
    }

    const newUser = {
      id: tempData.id,
      username: tempData.username || `user${tempData.id}`,
      balance: 0,
      power_plant_level: 0,
      referral_code: `REF${tempData.id}`,
      referred_by: referrerId,
      referrals: [],
      referral_earnings: 0,
      completed_tasks: [],
      join_date: Date.now()
    };

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (!error) {
      setCurrentUser(data);
      setShowReferralInput(false);
      window.tempUserData = null;
    }
  };

  const updateUser = async (updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUser.id)
      .select()
      .single();

    if (!error) {
      setCurrentUser(data);
    }
  };

  const getTotalCoins = async () => {
    const { data } = await supabase
      .from('users')
      .select('balance');
    
    return data ? data.reduce((sum, u) => sum + u.balance, 0) : 0;
  };

  const getExchangeRate = async () => {
    const { data: system } = await supabase
      .from('system')
      .select('total_funds')
      .eq('id', 1)
      .single();

    const totalCoins = await getTotalCoins();
    if (totalCoins === 0) return 0.01;
    return system.total_funds / totalCoins;
  };

  const produceCDC = async () => {
    const { data: system } = await supabase
      .from('system')
      .select('*')
      .eq('id', 1)
      .single();

    const powerPlantLevels = [
      { name: 'Base', cost: 0, minCoins: 10, maxCoins: 50 },
      { name: 'Potenziata', cost: 500, minCoins: 50, maxCoins: 150 },
      { name: 'Avanzata', cost: 2000, minCoins: 150, maxCoins: 400 },
      { name: 'Super', cost: 10000, minCoins: 400, maxCoins: 1000 }
    ];

    const level = powerPlantLevels[currentUser.power_plant_level];
    const coins = Math.floor(Math.random() * (level.maxCoins - level.minCoins + 1)) + level.minCoins;
    
    await updateUser({ balance: currentUser.balance + coins });

    if (currentUser.referred_by) {
      const { data: referrer } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.referred_by)
        .single();

      if (referrer) {
        const bonus = Math.floor(coins * 0.05);
        await supabase
          .from('users')
          .update({ 
            balance: referrer.balance + bonus,
            referral_earnings: (referrer.referral_earnings || 0) + bonus
          })
          .eq('id', referrer.id);
      }
    }
  };

  const upgradePowerPlant = async () => {
    const powerPlantLevels = [
      { name: 'Base', cost: 0, minCoins: 10, maxCoins: 50 },
      { name: 'Potenziata', cost: 500, minCoins: 50, maxCoins: 150 },
      { name: 'Avanzata', cost: 2000, minCoins: 150, maxCoins: 400 },
      { name: 'Super', cost: 10000, minCoins: 400, maxCoins: 1000 }
    ];

    const nextLevel = currentUser.power_plant_level + 1;
    if (nextLevel >= powerPlantLevels.length) return;
    
    const cost = powerPlantLevels[nextLevel].cost;
    if (currentUser.balance < cost) return;

    await updateUser({ 
      balance: currentUser.balance - cost,
      power_plant_level: nextLevel
    });
  };
  
  const completeTask = async (taskId) => {
    if (currentUser.completed_tasks.includes(taskId)) return;

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task || !task.active) return;

    const newCompletedTasks = task.repeatable 
      ? currentUser.completed_tasks 
      : [...currentUser.completed_tasks, taskId];

    await updateUser({ 
      balance: currentUser.balance + task.reward,
      completed_tasks: newCompletedTasks
    });
  };

  const requestWithdrawal = async (usdtAmount, walletAddress) => {
    const rate = await getExchangeRate();
    const cdcAmount = Math.ceil(usdtAmount / rate);
    
    if (currentUser.balance < cdcAmount) return false;

    await supabase
      .from('withdrawals')
      .insert([{
        user_id: currentUser.id,
        username: currentUser.username,
        usdt_amount: usdtAmount,
        cdc_amount: cdcAmount,
        wallet_address: walletAddress,
        status: 'pending',
        date: Date.now()
      }]);

    await updateUser({ balance: currentUser.balance - cdcAmount });
    return true;
  };

  // UI Components
  const HomePage = () => {
    const [rate, setRate] = useState(0);
    const powerPlantLevels = [
      { name: 'Base', cost: 0, minCoins: 10, maxCoins: 50 },
      { name: 'Potenziata', cost: 500, minCoins: 50, maxCoins: 150 },
      { name: 'Avanzata', cost: 2000, minCoins: 150, maxCoins: 400 },
      { name: 'Super', cost: 10000, minCoins: 400, maxCoins: 1000 }
    ];

    useEffect(() => {
      getExchangeRate().then(setRate);
    }, []);

    const currentLevel = powerPlantLevels[currentUser.power_plant_level];
    const nextLevel = powerPlantLevels[currentUser.power_plant_level + 1];

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
              <button onClick={upgradePowerPlant} disabled={currentUser.balance < nextLevel.cost} className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
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
      const loadTasks = async () => {
        const { data } = await supabase
          .from('tasks')
          .select('*')
          .eq('active', true);
        setTasks(data || []);
      };
      loadTasks();
    }, []);

    return (
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-4">Task Disponibili</h2>
        {tasks.map(task => {
          const completed = currentUser.completed_tasks.includes(task.id);
          return (
            <div key={task.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-start gap-4">
                <Gift className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{task.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  <span className="text-green-600 font-bold">+{task.reward} CDC</span>
                </div>
                <button onClick={() => { if (task.link) window.open(task.link, '_blank'); completeTask(task.id); }} disabled={completed && !task.repeatable} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                  {completed && !task.repeatable ? 'Fatto' : 'Completa'}
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
      getExchangeRate().then(setRate);
    }, []);

    const cdcNeeded = amount ? Math.ceil(parseFloat(amount) / rate) : 0;

    const handleSubmit = async () => {
      if (!amount || !wallet) {
        alert('Compila tutti i campi!');
        return;
      }
      const success = await requestWithdrawal(parseFloat(amount), wallet);
      if (success) {
        alert('Richiesta inviata!');
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
          <div className="text-sm text-gray-600">Tasso di Cambio</div>
          <div className="text-2xl font-bold text-blue-600">1 CDC = ${rate.toFixed(6)} USDT</div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Importo USDT</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded-lg p-3" placeholder="0.00" />
            {amount && <div className="text-sm text-gray-600 mt-1">Costo: {cdcNeeded.toLocaleString()} CDC</div>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Wallet TRC20</label>
            <input type="text" value={wallet} onChange={(e) => setWallet(e.target.value)} className="w-full border rounded-lg p-3" placeholder="TxxxxxxxxxxxxxxxxxxxxxxxxxxxxX" />
          </div>
          <button onClick={handleSubmit} className="w-full bg-green-600 text-white rounded-lg py-3 font-bold hover:bg-green-700">
            Richiedi Prelievo
          </button>
        </div>
      </div>
    );
  };

  const ReferralPage = () => (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Programma Referral</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="text-3xl font-bold mb-2">{currentUser.referrals.length}</div>
          <div className="text-sm opacity-90">Invitati</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="text-3xl font-bold mb-2">{(currentUser.referral_earnings || 0).toLocaleString()}</div>
          <div className="text-sm opacity-90">CDC Guadagnati</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-bold mb-3">Il tuo codice referral</h3>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 mb-3 text-center">
          <div className="text-3xl font-bold text-white tracking-wider">{currentUser.referral_code}</div>
        </div>
        <button onClick={() => navigator.clipboard.writeText(currentUser.referral_code)} className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700">
          Copia Codice
        </button>
        <p className="text-xs text-gray-500 mt-3 text-center">Condividi questo codice con i tuoi amici!</p>
      </div>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <p className="text-sm"><strong>Guadagna il 5%</strong> su tutti i guadagni dei tuoi referral!</p>
      </div>
    </div>
  );

  const SettingsPage = () => (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Account</h2>
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div><div className="text-sm text-gray-600 mb-1">ID Telegram</div><div className="text-lg font-bold">{currentUser.id}</div></div>
        <div><div className="text-sm text-gray-600 mb-1">Username</div><div className="text-lg font-bold">@{currentUser.username}</div></div>
        <div><div className="text-sm text-gray-600 mb-1">Codice Referral</div><div className="text-lg font-bold">{currentUser.referral_code}</div></div>
        <div><div className="text-sm text-gray-600 mb-1">Membro dal</div><div className="text-lg font-bold">{new Date(currentUser.join_date).toLocaleDateString()}</div></div>
      </div>
    </div>
  );

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <Coins className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold">CoinDrop</h1>
          <p className="mt-2">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Not Telegram Screen
  if (!isTelegram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Accesso Negato</h1>
          <p className="text-gray-600 mb-6">Questa app funziona solo all'interno di Telegram.</p>
          <a href="https://t.me/YOUR_BOT_USERNAME" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
            Apri in Telegram
          </a>
        </div>
      </div>
    );
  }

  // Referral Input Screen
  if (showReferralInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Coins className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Benvenuto!</h1>
            <p className="text-gray-600 mt-2">Inizia a guadagnare CDC</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Hai un codice referral? (Opzionale)</label>
              <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="REF123456" className="w-full border-2 rounded-lg p-3 text-center text-lg" />
              <p className="text-xs text-gray-500 mt-2 text-center">Se un amico ti ha invitato, inserisci il suo codice</p>
            </div>
            <button onClick={completeRegistration} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg py-4 font-bold text-lg hover:shadow-lg transition-all">
              {referralCode ? 'Inizia con Referral' : 'Inizia'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main App (solo utenti)
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">CoinDrop</h1>
            <p className="text-sm opacity-90">@{currentUser.username}</p>
          </div>
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
