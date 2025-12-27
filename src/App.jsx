import React, { useState, useEffect } from 'react';
import { Coins, Zap, Users, Settings, Gift, CheckCircle, XCircle, Clock, MessageSquare, TrendingUp, DollarSign, AlertCircle, Globe } from 'lucide-react';
import { supabase } from './supabaseClient';
import TadsAd from './TadsAd';

// TRADUZIONI
const translations = {
  en: {
    welcome: 'Welcome to CoinDrop!',
    startEarning: 'Start earning CDC today',
    referralCode: 'Referral Code (Optional)',
    referralPlaceholder: 'REF123456',
    referralHint: 'If a friend invited you, enter their code',
    start: 'Start',
    startWithReferral: 'Start with Referral',
    loading: 'Loading...',
    accessDenied: 'Access Denied',
    telegramOnly: 'This app only works inside Telegram.',
    openInTelegram: 'Open in Telegram',
    yourBalance: 'Your Balance',
    powerPlant: 'Power Plant',
    currentLevel: 'Current Level',
    production: 'Production',
    startProduction: 'Start Production',
    upgrade: 'Upgrade',
    upgradePlant: 'Upgrade Plant',
    availableTasks: 'Available Tasks',
    completed: 'Completed',
    complete: 'Complete',
    withdrawUSDT: 'Withdraw USDT',
    exchangeRate: 'Exchange Rate',
    amountUSDT: 'USDT Amount',
    cost: 'Cost',
    walletTRC20: 'TRC20 Wallet',
    requestWithdrawal: 'Request Withdrawal',
    referralProgram: 'Referral Program',
    invited: 'Invited',
    earned: 'Earned',
    yourReferralCode: 'Your referral code',
    copyCode: 'Copy Code',
    shareCode: 'Share this code with your friends!',
    earn5percent: 'Earn 5% on all your referrals earnings!',
    account: 'Account',
    telegramID: 'Telegram ID',
    username: 'Username',
    memberSince: 'Member since',
    withdrawalHistory: 'Withdrawal History',
    status: 'Status',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    noWithdrawals: 'No withdrawals yet',
    language: 'Language',
    home: 'Home',
    tasks: 'Tasks',
    withdraw: 'Withdraw',
    referral: 'Referral',
    insufficientBalance: 'Insufficient balance!',
    withdrawalSent: 'Withdrawal request sent!',
    fillAllFields: 'Fill all fields!',
    invalidWallet: 'Invalid TRC20 wallet address! Must start with T',
    copiedToClipboard: 'Copied to clipboard!',
    referralEarnings: 'Referral Earnings',
    totalEarned: 'Total earned from referrals',
    watchAd: 'Watch an Ad',
    watchAdDesc: 'Watch a video advertisement',
    rewardPending: 'Reward pending! Check your balance in a few seconds.'
  },
  it: {
    welcome: 'Benvenuto in CoinDrop!',
    startEarning: 'Inizia a guadagnare CDC oggi',
    referralCode: 'Codice Referral (Facoltativo)',
    referralPlaceholder: 'REF123456',
    referralHint: 'Se un amico ti ha invitato, inserisci il suo codice',
    start: 'Inizia',
    startWithReferral: 'Inizia con Referral',
    loading: 'Caricamento...',
    accessDenied: 'Accesso Negato',
    telegramOnly: 'Questa app funziona solo in Telegram.',
    openInTelegram: 'Apri in Telegram',
    yourBalance: 'Il tuo saldo',
    powerPlant: 'Centrale Energetica',
    currentLevel: 'Livello Attuale',
    production: 'Produzione',
    startProduction: 'Avvia Produzione',
    upgrade: 'Upgrade',
    upgradePlant: 'Potenzia Centrale',
    availableTasks: 'Task Disponibili',
    completed: 'Completato',
    complete: 'Completa',
    withdrawUSDT: 'Preleva USDT',
    exchangeRate: 'Tasso di Cambio',
    amountUSDT: 'Importo USDT',
    cost: 'Costo',
    walletTRC20: 'Wallet TRC20',
    requestWithdrawal: 'Richiedi Prelievo',
    referralProgram: 'Programma Referral',
    invited: 'Invitati',
    earned: 'Guadagnati',
    yourReferralCode: 'Il tuo codice referral',
    copyCode: 'Copia Codice',
    shareCode: 'Condividi questo codice con i tuoi amici!',
    earn5percent: 'Guadagna il 5% su tutti i guadagni dei tuoi referral!',
    account: 'Account',
    telegramID: 'ID Telegram',
    username: 'Username',
    memberSince: 'Membro dal',
    withdrawalHistory: 'Storico Prelievi',
    status: 'Stato',
    pending: 'In Attesa',
    approved: 'Approvato',
    rejected: 'Rifiutato',
    noWithdrawals: 'Nessun prelievo ancora',
    language: 'Lingua',
    home: 'Home',
    tasks: 'Task',
    withdraw: 'Preleva',
    referral: 'Referral',
    insufficientBalance: 'Saldo insufficiente!',
    withdrawalSent: 'Richiesta di prelievo inviata!',
    fillAllFields: 'Compila tutti i campi!',
    invalidWallet: 'Indirizzo wallet TRC20 non valido! Deve iniziare con T',
    copiedToClipboard: 'Copiato negli appunti!',
    referralEarnings: 'Guadagni Referral',
    totalEarned: 'Totale guadagnato dai referral',
    watchAd: 'Guarda un Annuncio',
    watchAdDesc: 'Guarda un video pubblicitario',
    rewardPending: 'Ricompensa in arrivo! Controlla il saldo tra qualche secondo.'
  },
  es: {
    welcome: '¡Bienvenido a CoinDrop!',
    startEarning: 'Comienza a ganar CDC hoy',
    referralCode: 'Código de Referido (Opcional)',
    referralPlaceholder: 'REF123456',
    referralHint: 'Si un amigo te invitó, ingresa su código',
    start: 'Comenzar',
    startWithReferral: 'Comenzar con Referido',
    loading: 'Cargando...',
    accessDenied: 'Acceso Denegado',
    telegramOnly: 'Esta app solo funciona en Telegram.',
    openInTelegram: 'Abrir en Telegram',
    yourBalance: 'Tu Saldo',
    powerPlant: 'Planta de Energía',
    currentLevel: 'Nivel Actual',
    production: 'Producción',
    startProduction: 'Iniciar Producción',
    upgrade: 'Mejorar',
    upgradePlant: 'Mejorar Planta',
    availableTasks: 'Tareas Disponibles',
    completed: 'Completado',
    complete: 'Completar',
    withdrawUSDT: 'Retirar USDT',
    exchangeRate: 'Tasa de Cambio',
    amountUSDT: 'Cantidad USDT',
    cost: 'Costo',
    walletTRC20: 'Wallet TRC20',
    requestWithdrawal: 'Solicitar Retiro',
    referralProgram: 'Programa de Referidos',
    invited: 'Invitados',
    earned: 'Ganado',
    yourReferralCode: 'Tu código de referido',
    copyCode: 'Copiar Código',
    shareCode: '¡Comparte este código con tus amigos!',
    earn5percent: '¡Gana el 5% de todas las ganancias de tus referidos!',
    account: 'Cuenta',
    telegramID: 'ID de Telegram',
    username: 'Usuario',
    memberSince: 'Miembro desde',
    withdrawalHistory: 'Historial de Retiros',
    status: 'Estado',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    noWithdrawals: 'Aún no hay retiros',
    language: 'Idioma',
    home: 'Inicio',
    tasks: 'Tareas',
    withdraw: 'Retirar',
    referral: 'Referido',
    insufficientBalance: '¡Saldo insuficiente!',
    withdrawalSent: '¡Solicitud de retiro enviada!',
    fillAllFields: '¡Completa todos los campos!',
    invalidWallet: '¡Dirección de wallet TRC20 inválida! Debe comenzar con T',
    copiedToClipboard: '¡Copiado al portapapeles!',
    referralEarnings: 'Ganancias de Referidos',
    totalEarned: 'Total ganado de referidos',
    watchAd: 'Ver un Anuncio',
    watchAdDesc: 'Mira un video publicitario',
    rewardPending: '¡Recompensa pendiente! Revisa tu saldo en unos segundos.'
  },
  ru: {
    welcome: 'Добро пожаловать в CoinDrop!',
    startEarning: 'Начните зарабатывать CDC сегодня',
    referralCode: 'Реферальный Код (Необязательно)',
    referralPlaceholder: 'REF123456',
    referralHint: 'Если вас пригласил друг, введите его код',
    start: 'Начать',
    startWithReferral: 'Начать с Рефералом',
    loading: 'Загрузка...',
    accessDenied: 'Доступ Запрещен',
    telegramOnly: 'Это приложение работает только в Telegram.',
    openInTelegram: 'Открыть в Telegram',
    yourBalance: 'Ваш Баланс',
    powerPlant: 'Электростанция',
    currentLevel: 'Текущий Уровень',
    production: 'Производство',
    startProduction: 'Начать Производство',
    upgrade: 'Улучшить',
    upgradePlant: 'Улучшить Станцию',
    availableTasks: 'Доступные Задания',
    completed: 'Выполнено',
    complete: 'Выполнить',
    withdrawUSDT: 'Вывести USDT',
    exchangeRate: 'Курс Обмена',
    amountUSDT: 'Сумма USDT',
    cost: 'Стоимость',
    walletTRC20: 'Кошелек TRC20',
    requestWithdrawal: 'Запросить Вывод',
    referralProgram: 'Реферальная Программа',
    invited: 'Приглашено',
    earned: 'Заработано',
    yourReferralCode: 'Ваш реферальный код',
    copyCode: 'Копировать Код',
    shareCode: 'Поделитесь этим кодом с друзьями!',
    earn5percent: 'Зарабатывайте 5% от всех доходов рефералов!',
    account: 'Аккаунт',
    telegramID: 'ID Telegram',
    username: 'Имя пользователя',
    memberSince: 'Участник с',
    withdrawalHistory: 'История Выводов',
    status: 'Статус',
    pending: 'Ожидает',
    approved: 'Одобрено',
    rejected: 'Отклонено',
    noWithdrawals: 'Пока нет выводов',
    language: 'Язык',
    home: 'Главная',
    tasks: 'Задания',
    withdraw: 'Вывести',
    referral: 'Реферал',
    insufficientBalance: 'Недостаточно средств!',
    withdrawalSent: 'Запрос на вывод отправлен!',
    fillAllFields: 'Заполните все поля!',
    invalidWallet: 'Неверный адрес кошелька TRC20! Должен начинаться с T',
    copiedToClipboard: 'Скопировано в буфер обмена!',
    referralEarnings: 'Доход от Рефералов',
    totalEarned: 'Всего заработано с рефералов',
    watchAd: 'Смотреть Рекламу',
    watchAdDesc: 'Посмотрите видео рекламу',
    rewardPending: 'Награда ожидается! Проверьте баланс через несколько секунд.'
  },
  zh: {
    welcome: '欢迎来到CoinDrop！',
    startEarning: '今天开始赚取CDC',
    referralCode: '推荐码（可选）',
    referralPlaceholder: 'REF123456',
    referralHint: '如果朋友邀请了您，请输入他们的代码',
    start: '开始',
    startWithReferral: '使用推荐开始',
    loading: '加载中...',
    accessDenied: '访问被拒绝',
    telegramOnly: '此应用仅在Telegram中工作。',
    openInTelegram: '在Telegram中打开',
    yourBalance: '您的余额',
    powerPlant: '发电厂',
    currentLevel: '当前等级',
    production: '生产',
    startProduction: '开始生产',
    upgrade: '升级',
    upgradePlant: '升级发电厂',
    availableTasks: '可用任务',
    completed: '已完成',
    complete: '完成',
    withdrawUSDT: '提取USDT',
    exchangeRate: '汇率',
    amountUSDT: 'USDT金额',
    cost: '费用',
    walletTRC20: 'TRC20钱包',
    requestWithdrawal: '请求提现',
    referralProgram: '推荐计划',
    invited: '已邀请',
    earned: '已赚取',
    yourReferralCode: '您的推荐码',
    copyCode: '复制代码',
    shareCode: '与您的朋友分享此代码！',
    earn5percent: '从所有推荐人的收入中赚取5％！',
    account: '账户',
    telegramID: 'Telegram ID',
    username: '用户名',
    memberSince: '会员自',
    withdrawalHistory: '提现历史',
    status: '状态',
    pending: '待处理',
    approved: '已批准',
    rejected: '已拒绝',
    noWithdrawals: '还没有提现',
    language: '语言',
    home: '首页',
    tasks: '任务',
    withdraw: '提现',
    referral: '推荐',
    insufficientBalance: '余额不足！',
    withdrawalSent: '提现请求已发送！',
    fillAllFields: '填写所有字段！',
    invalidWallet: 'TRC20钱包地址无效！必须以T开头',
    copiedToClipboard: '已复制到剪贴板！',
    referralEarnings: '推荐收入',
    totalEarned: '推荐总收入',
    watchAd: '观看广告',
    watchAdDesc: '观看视频广告',
    rewardPending: '奖励待处理！几秒钟后检查您的余额。'
  }
};

const CoinDropApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [isTelegram, setIsTelegram] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en');

  const t = translations[lang] || translations.en;

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
        setLang(user.language || 'en');
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
      join_date: Date.now(),
      language: 'en'
    };

    const { data } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (data) {
      setCurrentUser(data);
      setShowReferralInput(false);
      window.tempUserData = null;
    }
  };

  const updateUser = async (updates) => {
    const { data } = await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUser.id)
      .select()
      .single();

    if (data) {
      setCurrentUser(data);
    }
  };

  const changeLanguage = async (newLang) => {
    setLang(newLang);
    if (currentUser) {
      await updateUser({ language: newLang });
    }
  };

  const validateTRC20Wallet = (address) => {
    return address.startsWith('T') && address.length === 34;
  };

  const getTotalCoins = async () => {
    const { data } = await supabase.from('users').select('balance');
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
    if (!validateTRC20Wallet(walletAddress)) {
      alert(t.invalidWallet);
      return false;
    }

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

  // UI COMPONENTS
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
            <h2 className="text-2xl font-bold">{t.yourBalance}</h2>
            <Coins className="w-8 h-8" />
          </div>
          <div className="text-4xl font-bold mb-2">{currentUser.balance.toLocaleString()} CDC</div>
          <div className="text-sm opacity-90">≈ ${(currentUser.balance * rate).toFixed(2)} USDT</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold">{t.powerPlant}</h3>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-1">{t.currentLevel}</div>
            <div className="text-lg font-bold text-blue-600">{currentLevel.name}</div>
            <div className="text-sm text-gray-500">{t.production}: {currentLevel.minCoins}-{currentLevel.maxCoins} CDC</div>
          </div>

          <button onClick={produceCDC} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg py-4 font-bold text-lg hover:shadow-lg transition-all">
            {t.startProduction}
          </button>

          {nextLevel && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{t.upgrade}: {nextLevel.name}</span>
                <span className="text-blue-600 font-bold">{nextLevel.cost} CDC</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">{t.production}: {nextLevel.minCoins}-{nextLevel.maxCoins} CDC</div>
              <button onClick={upgradePowerPlant} disabled={currentUser.balance < nextLevel.cost} className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">
                {t.upgradePlant}
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

    const handleAdReward = (message) => {
      alert(t.rewardPending);
      // Ricarica il saldo dopo 3 secondi per vedere l'aggiornamento dal webhook
      setTimeout(() => {
        initApp();
      }, 3000);
    };

    return (
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-4">{t.availableTasks}</h2>
        
        {/* ANNUNCIO TADS REWARDED */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-start gap-4 mb-3">
            <Gift className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-lg">{t.watchAd}</h3>
              <p className="text-sm text-gray-600 mb-2">{t.watchAdDesc}</p>
              <span className="text-green-600 font-bold">+10 CDC</span>
            </div>
          </div>
          <TadsAd 
            type="rewarded" 
            userId={currentUser.id}
            onReward={handleAdReward}
            onError={(err) => console.error('Ad error:', err)}
          />
        </div>

        {/* ALTRI TASK NORMALI */}
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
                <button 
                  onClick={() => { 
                    if (task.link) window.open(task.link, '_blank'); 
                    completeTask(task.id); 
                  }} 
                  disabled={completed && !task.repeatable} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 hover:bg-blue-700 whitespace-nowrap"
                >
                  {completed && !task.repeatable ? t.completed : t.complete}
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
    const [myWithdrawals, setMyWithdrawals] = useState([]);

    useEffect(() => {
      getExchangeRate().then(setRate);
      loadMyWithdrawals();
    }, []);
    
    const loadMyWithdrawals = async () => {
      const { data } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });
      setMyWithdrawals(data || []);
    };

    const cdcNeeded = amount ? Math.ceil(parseFloat(amount) / rate) : 0;

    const handleSubmit = async () => {
      if (!amount || !wallet) {
        alert(t.fillAllFields);
        return;
      }
      const success = await requestWithdrawal(parseFloat(amount), wallet);
      if (success) {
        alert(t.withdrawalSent);
        setAmount('');
        setWallet('');
        loadMyWithdrawals();
      } else {
        alert(t.insufficientBalance);
      }
    };

    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">{t.withdrawUSDT}</h2>
        
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-sm text-gray-600">{t.exchangeRate}</div>
          <div className="text-2xl font-bold text-blue-600">1 CDC = ${rate.toFixed(6)} USDT</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">{t.amountUSDT}</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded-lg p-3" placeholder="0.00" />
            {amount && <div className="text-sm text-gray-600 mt-1">{t.cost}: {cdcNeeded.toLocaleString()} CDC</div>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">{t.walletTRC20}</label>
            <input type="text" value={wallet} onChange={(e) => setWallet(e.target.value)} className="w-full border rounded-lg p-3" placeholder="TxxxxxxxxxxxxxxxxxxxxxxxxxxxxX" />
          </div>
          <button onClick={handleSubmit} className="w-full bg-green-600 text-white rounded-lg py-3 font-bold hover:bg-green-700">
            {t.requestWithdrawal}
          </button>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">{t.withdrawalHistory}</h3>
          {myWithdrawals.length === 0 ? (
            <div className="text-center text-gray-500 py-8">{t.noWithdrawals}</div>
          ) : (
            <div className="space-y-3">
              {myWithdrawals.map(w => (
                <div key={w.id} className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg">${w.usdt_amount} USDT</div>
                      <div className="text-sm text-gray-600">{w.cdc_amount.toLocaleString()} CDC</div>
                      <div className="text-xs text-gray-500 mt-1 break-all">{w.wallet_address}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(w.date).toLocaleString()}</div>
                    </div>
                    <div>
                      {w.status === 'pending' && (
                        <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg text-sm font-semibold">
                          <Clock className="w-4 h-4" /> {t.pending}
                        </span>
                      )}
                      {w.status === 'approved' && (
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-lg text-sm font-semibold">
                          <CheckCircle className="w-4 h-4" /> {t.approved}
                        </span>
                      )}
                      {w.status === 'rejected' && (
                        <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-lg text-sm font-semibold">
                          <XCircle className="w-4 h-4" /> {t.rejected}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const ReferralPage = () => (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">{t.referralProgram}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="text-3xl font-bold mb-2">{currentUser.referrals.length}</div>
          <div className="text-sm opacity-90">{t.invited}</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="text-3xl font-bold mb-2">{(currentUser.referral_earnings || 0).toLocaleString()}</div>
          <div className="text-sm opacity-90">{t.earned}</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-bold mb-3">{t.yourReferralCode}</h3>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 mb-3 text-center">
          <div className="text-3xl font-bold text-white tracking-wider">{currentUser.referral_code}</div>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(currentUser.referral_code); alert(t.copiedToClipboard); }} className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700">
          {t.copyCode}
        </button>
        <p className="text-xs text-gray-500 mt-3 text-center">{t.shareCode}</p>
      </div>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <p className="text-sm"><strong>{t.earn5percent}</strong></p>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-bold mb-3">{t.referralEarnings}</h3>
        <div className="text-3xl font-bold text-green-600 mb-2">{(currentUser.referral_earnings || 0).toLocaleString()} CDC</div>
        <p className="text-sm text-gray-600">{t.totalEarned}</p>
      </div>
    </div>
  );

  const SettingsPage = () => {
    const languages = [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'zh', name: '中文', flag: '🇨🇳' }
    ];

    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">{t.account}</h2>
        
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div><div className="text-sm text-gray-600 mb-1">{t.telegramID}</div><div className="text-lg font-bold">{currentUser.id}</div></div>
          <div><div className="text-sm text-gray-600 mb-1">{t.username}</div><div className="text-lg font-bold">@{currentUser.username}</div></div>
          <div><div className="text-sm text-gray-600 mb-1">{t.referralCode}</div><div className="text-lg font-bold">{currentUser.referral_code}</div></div>
          <div><div className="text-sm text-gray-600 mb-1">{t.memberSince}</div><div className="text-lg font-bold">{new Date(currentUser.join_date).toLocaleDateString()}</div></div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-blue-600" />
            <h3 className="font-bold text-lg">{t.language}</h3>
          </div>
          <div className="space-y-2">
            {languages.map(l => (
              <button
                key={l.code}
                onClick={() => changeLanguage(l.code)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  lang === l.code 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">{l.flag}</span>
                <span className="font-semibold">{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <Coins className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold">CoinDrop</h1>
          <p className="mt-2">{t.loading}</p>
        </div>
      </div>
    );
  }

  // NOT TELEGRAM
  if (!isTelegram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{t.accessDenied}</h1>
          <p className="text-gray-600 mb-6">{t.telegramOnly}</p>
          <a href="https://t.me/YOUR_BOT_USERNAME" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
            {t.openInTelegram}
          </a>
        </div>
      </div>
    );
  }

  // REFERRAL INPUT
  if (showReferralInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Coins className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">{t.welcome}</h1>
            <p className="text-gray-600 mt-2">{t.startEarning}</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">{t.referralCode}</label>
              <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder={t.referralPlaceholder} className="w-full border-2 rounded-lg p-3 text-center text-lg font-mono tracking-wider uppercase" />
              <p className="text-xs text-gray-500 mt-2 text-center">{t.referralHint}</p>
            </div>
            <button onClick={completeRegistration} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg py-4 font-bold text-lg hover:shadow-lg transition-all">
              {referralCode ? t.startWithReferral : t.start}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP
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
          { id: 'home', icon: Zap, label: t.home },
          { id: 'tasks', icon: Gift, label: t.tasks },
          { id: 'withdrawal', icon: DollarSign, label: t.withdraw },
          { id: 'referral', icon: Users, label: t.referral },
          { id: 'settings', icon: Settings, label: t.account }
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
