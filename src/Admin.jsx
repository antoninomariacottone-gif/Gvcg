import React, { useState, useEffect } from 'react';
import { Shield, BarChart3, Users, Gift, DollarSign, Settings, LogOut, Search, Plus, Minus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Controlla se già loggato
  useEffect(() => {
    const logged = sessionStorage.getItem('admin_logged');
    if (logged === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    
    // CAMBIA QUESTE CREDENZIALI!
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'coindrop2024';

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      sessionStorage.setItem('admin_logged', 'true');
      setError('');
    } else {
      setError('Credenziali non valide!');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('admin_logged');
    setUsername('');
    setPassword('');
  };

  // COMPONENTI ADMIN
  const Dashboard = () => {
    const [stats, setStats] = useState({ users: 0, totalCoins: 0, pending: 0, rate: 0 });

    useEffect(() => {
      const load = async () => {
        const { data: users } = await supabase.from('users').select('balance');
        const { data: withdrawals } = await supabase.from('withdrawals').select('*').eq('status', 'pending');
        const { data: system } = await supabase.from('system').select('total_funds').eq('id', 1).single();
        
        const totalCoins = users.reduce((sum, u) => sum + u.balance, 0);
        const rate = totalCoins > 0 ? system.total_funds / totalCoins : 0.01;
        
        setStats({ 
          users: users.length, 
          totalCoins: totalCoins, 
          pending: withdrawals.length, 
          rate 
        });
      };
      load();
    }, []);

    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">Dashboard Amministratore</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-500 text-white rounded-xl p-6">
            <div className="text-4xl font-bold mb-2">{stats.users}</div>
            <div className="text-sm opacity-90">Utenti Totali</div>
          </div>
          <div className="bg-green-500 text-white rounded-xl p-6">
            <div className="text-4xl font-bold mb-2">{stats.totalCoins.toLocaleString()}</div>
            <div className="text-sm opacity-90">CDC in Circolazione</div>
          </div>
          <div className="bg-yellow-500 text-white rounded-xl p-6">
            <div className="text-4xl font-bold mb-2">{stats.pending}</div>
            <div className="text-sm opacity-90">Prelievi in Attesa</div>
          </div>
          <div className="bg-purple-500 text-white rounded-xl p-6">
            <div className="text-3xl font-bold mb-2">${stats.rate.toFixed(6)}</div>
            <div className="text-sm opacity-90">Tasso CDC/USDT</div>
          </div>
        </div>
      </div>
    );
  };

  const UsersManager = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [amount, setAmount] = useState('');

    useEffect(() => {
      loadUsers();
    }, []);

    const loadUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('join_date', { ascending: false });
      setUsers(data || []);
    };

    const filtered = users.filter(u => 
      u.username.toLowerCase().includes(search.toLowerCase()) || 
      u.id.toString().includes(search)
    );

    const adjustBalance = async (add) => {
      if (!selected || !amount) return;
      const newBalance = Math.max(0, selected.balance + (add ? parseFloat(amount) : -parseFloat(amount)));
      
      await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', selected.id);
      
      await loadUsers();
      setSelected({...selected, balance: newBalance});
      setAmount('');
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Gestione Utenti</h2>
        
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per username o ID..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg"
          />
        </div>

        <div className="space-y-3 mb-32">
          {filtered.map(u => (
            <div 
              key={u.id} 
              onClick={() => setSelected(u)}
              className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all ${
                selected?.id === u.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-lg">@{u.username}</div>
                  <div className="text-sm text-gray-600">ID Telegram: {u.id}</div>
                  <div className="text-sm text-gray-600">Referral: {u.referrals?.length || 0} utenti</div>
                  <div className="text-sm text-green-600">Guadagni Referral: {u.referral_earnings || 0} CDC</div>
                  <div className="text-xs text-gray-400 mt-1">Membro dal: {new Date(u.join_date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{u.balance.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">CDC</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-6">
            <div className="max-w-4xl mx-auto">
              <h3 className="font-bold mb-4 text-lg">Modifica Saldo: @{selected.username}</h3>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Importo CDC"
                  className="flex-1 border rounded-lg p-3 text-lg"
                />
                <button
                  onClick={() => adjustBalance(true)}
                  className="bg-green-600 text-white px-6 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Aggiungi
                </button>
                <button
                  onClick={() => adjustBalance(false)}
                  className="bg-red-600 text-white px-6 rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Minus className="w-5 h-5" />
                  Sottrai
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TasksManager = () => {
    const [tasks, setTasks] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', link: '', reward: '', repeatable: false });

    useEffect(() => {
      loadTasks();
    }, []);

    const loadTasks = async () => {
      const { data } = await supabase.from('tasks').select('*').order('id', { ascending: false });
      setTasks(data || []);
    };

    const saveTask = async () => {
      if (!form.title || !form.reward) {
        alert('Compila titolo e ricompensa!');
        return;
      }
      
      await supabase.from('tasks').insert([{
        title: form.title,
        description: form.description,
        link: form.link,
        reward: parseInt(form.reward),
        repeatable: form.repeatable,
        active: true
      }]);

      setForm({ title: '', description: '', link: '', reward: '', repeatable: false });
      loadTasks();
    };

    const toggleTask = async (task) => {
      await supabase.from('tasks').update({ active: !task.active }).eq('id', task.id);
      loadTasks();
    };

    const deleteTask = async (id) => {
      if (confirm('Sei sicuro di voler eliminare questo task?')) {
        await supabase.from('tasks').delete().eq('id', id);
        loadTasks();
      }
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Gestione Task</h2>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">Crea Nuovo Task</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              placeholder="Titolo del task"
              className="w-full border rounded-lg p-3"
            />
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="Descrizione"
              className="w-full border rounded-lg p-3"
            />
            <input
              type="text"
              value={form.link}
              onChange={(e) => setForm({...form, link: e.target.value})}
              placeholder="Link (opzionale)"
              className="w-full border rounded-lg p-3"
            />
            <input
              type="number"
              value={form.reward}
              onChange={(e) => setForm({...form, reward: e.target.value})}
              placeholder="Ricompensa in CDC"
              className="w-full border rounded-lg p-3"
            />
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.repeatable}
                onChange={(e) => setForm({...form, repeatable: e.target.checked})}
                className="w-5 h-5"
              />
              <span className="font-medium">Task ripetibile</span>
            </label>
            <button
              onClick={saveTask}
              className="w-full bg-blue-600 text-white rounded-lg py-3 font-bold hover:bg-blue-700"
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
                  <div className="text-sm mt-2">
                    <span className="text-green-600 font-bold">+{task.reward} CDC</span>
                    {task.repeatable && (
                      <span className="ml-3 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                        Ripetibile
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleTask(task)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      task.active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {task.active ? 'Attivo' : 'Disattivato'}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const WithdrawalsManager = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
      loadWithdrawals();
    }, []);

    const loadWithdrawals = async () => {
      const { data } = await supabase
        .from('withdrawals')
        .select('*')
        .order('date', { ascending: false });
      setWithdrawals(data || []);
    };

    const filtered = withdrawals.filter(w =>
      w.username.toLowerCase().includes(search.toLowerCase()) ||
      w.user_id.toString().includes(search) ||
      w.wallet_address.toLowerCase().includes(search.toLowerCase())
    );

    const approveWithdrawal = async (w) => {
      await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', w.id);
      loadWithdrawals();
    };

    const rejectWithdrawal = async (w) => {
      await supabase.from('withdrawals').update({ status: 'rejected' }).eq('id', w.id);
      
      const { data: user } = await supabase
        .from('users')
        .select('balance')
        .eq('id', w.user_id)
        .single();
      
      if (user) {
        await supabase
          .from('users')
          .update({ balance: user.balance + w.cdc_amount })
          .eq('id', w.user_id);
      }
      
      loadWithdrawals();
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Gestione Prelievi</h2>
        
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per username, ID utente o wallet..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg"
          />
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Nessun prelievo trovato</div>
          ) : (
            filtered.map(w => (
              <div key={w.id} className="bg-white rounded-xl shadow-md p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold text-lg">@{w.username}</div>
                    <div className="text-sm text-gray-600">ID: {w.user_id}</div>
                    <div className="text-gray-700 mt-1">
                      <span className="font-semibold">${w.usdt_amount} USDT</span>
                      <span className="text-gray-500 ml-2">({w.cdc_amount.toLocaleString()} CDC)</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2 break-all">
                      <span className="font-medium">Wallet:</span> {w.wallet_address}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(w.date).toLocaleString('it-IT')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {w.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveWithdrawal(w)}
                          className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600"
                          title="Approva"
                        >
                          <CheckCircle className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => rejectWithdrawal(w)}
                          className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600"
                          title="Rifiuta"
                        >
                          <XCircle className="w-6 h-6" />
                        </button>
                      </>
                    )}
                    {w.status === 'approved' && (
                      <span className="text-green-600 font-semibold flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                        <CheckCircle className="w-5 h-5" /> Approvato
                      </span>
                    )}
                    {w.status === 'rejected' && (
                      <span className="text-red-600 font-semibold flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
                        <XCircle className="w-5 h-5" /> Rifiutato
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const SystemSettings = () => {
    const [funds, setFunds] = useState('');
    const [adProviders, setAdProviders] = useState([]);
    const [newProvider, setNewProvider] = useState({ name: '', priority: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      load();
    }, []);

    const load = async () => {
      const { data: system } = await supabase
        .from('system')
        .select('total_funds')
        .eq('id', 1)
        .single();
      setFunds(system.total_funds.toString());

      const { data: providers } = await supabase
        .from('ad_providers')
        .select('*')
        .order('priority', { ascending: true });
      setAdProviders(providers || []);
      
      setLoading(false);
    };

    const updateFunds = async () => {
      if (!funds || parseFloat(funds) <= 0) {
        alert('Inserisci un importo valido!');
        return;
      }

      await supabase
        .from('system')
        .update({ total_funds: parseFloat(funds) })
        .eq('id', 1);
      
      alert('Fondi aggiornati con successo!');
    };

    const addProvider = async () => {
      if (!newProvider.name || !newProvider.priority) {
        alert('Compila tutti i campi!');
        return;
      }

      await supabase
        .from('ad_providers')
        .insert([{
          name: newProvider.name,
          priority: parseInt(newProvider.priority),
          enabled: true
        }]);

      setNewProvider({ name: '', priority: '' });
      load();
    };

    const toggleProvider = async (provider) => {
      await supabase
        .from('ad_providers')
        .update({ enabled: !provider.enabled })
        .eq('id', provider.id);
      load();
    };

    const updatePriority = async (id, newPriority) => {
      await supabase
        .from('ad_providers')
        .update({ priority: parseInt(newPriority) })
        .eq('id', id);
      load();
    };

    const deleteProvider = async (id) => {
      if (confirm('Eliminare questo provider?')) {
        await supabase
          .from('ad_providers')
          .delete()
          .eq('id', id);
        load();
      }
    };

    if (loading) return <div className="p-6">Caricamento...</div>;

    return (
      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-6">Impostazioni Sistema</h2>
          
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Fondi Totali Pool</h3>
            <p className="text-sm text-gray-600 mb-4">
              Modifica i fondi totali in USDT del sistema. Questo influenza il tasso di cambio CDC/USDT.
            </p>
            <label className="block text-sm font-semibold mb-2">Fondi Totali (USDT)</label>
            <input
              type="number"
              step="0.01"
              value={funds}
              onChange={(e) => setFunds(e.target.value)}
              className="w-full border-2 rounded-lg p-3 mb-4 text-lg"
              placeholder="10000.00"
            />
            <button
              onClick={updateFunds}
              className="w-full bg-blue-600 text-white rounded-lg py-3 font-bold hover:bg-blue-700"
            >
              Aggiorna Fondi
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Gestione Provider Pubblicitari</h2>
          
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="font-bold text-lg mb-4">Aggiungi Nuovo Provider</h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={newProvider.name}
                onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                placeholder="Nome Provider (es. AdMob)"
                className="flex-1 border rounded-lg p-3"
              />
              <input
                type="number"
                value={newProvider.priority}
                onChange={(e) => setNewProvider({...newProvider, priority: e.target.value})}
                placeholder="Priorità (1=massima)"
                className="w-32 border rounded-lg p-3"
              />
              <button
                onClick={addProvider}
                className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Aggiungi
              </button>
            </div>
            <p className="text-xs text-gray-500">
              La priorità determina l'ordine di visualizzazione degli annunci. Priorità 1 = mostrato per primo.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
              <p className="text-sm text-blue-800">
                <strong>Come funziona:</strong> Gli annunci verranno mostrati dal provider con priorità più alta (1). Se non disponibile, si passa al successivo in ordine di priorità.
              </p>
            </div>

            {adProviders.map(provider => (
              <div key={provider.id} className="bg-white rounded-xl shadow-md p-5">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-lg">{provider.name}</div>
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        provider.enabled 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {provider.enabled ? 'Attivo' : 'Disattivo'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Creato: {new Date(provider.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-gray-700">Priorità:</label>
                      <input
                        type="number"
                        value={provider.priority}
                        onChange={(e) => updatePriority(provider.id, e.target.value)}
                        className="w-16 border rounded-lg p-2 text-center"
                        min="1"
                      />
                    </div>
                    
                    <button
                      onClick={() => toggleProvider(provider)}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        provider.enabled
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {provider.enabled ? 'Disattiva' : 'Attiva'}
                    </button>
                    
                    <button
                      onClick={() => deleteProvider(provider.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {adProviders.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                Nessun provider configurato. Aggiungine uno sopra!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-gray-600 mt-2">CoinDrop Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-red-500 focus:outline-none"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-red-500 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg py-4 font-bold text-lg hover:shadow-lg transition-all"
            >
              Accedi
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ADMIN PANEL
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-sm opacity-90">CoinDrop Management System</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'users', icon: Users, label: 'Utenti' },
            { id: 'tasks', icon: Gift, label: 'Task' },
            { id: 'withdrawals', icon: DollarSign, label: 'Prelievi' },
            { id: 'settings', icon: Settings, label: 'Impostazioni' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'users' && <UsersManager />}
        {activeTab === 'tasks' && <TasksManager />}
        {activeTab === 'withdrawals' && <WithdrawalsManager />}
        {activeTab === 'settings' && <SystemSettings />}
      </div>
    </div>
  );
};

export default AdminPanel;
