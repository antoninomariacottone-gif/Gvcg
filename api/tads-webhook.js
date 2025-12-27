import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  // Solo POST come da documentazione Tads
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_id, widget_id } = req.body;

    console.log('✅ Tads Webhook ricevuto:', { telegram_id, widget_id });

    // Valida parametri
    if (!telegram_id) {
      console.error('❌ telegram_id mancante');
      return res.status(400).json({ error: 'Missing telegram_id' });
    }

    if (!widget_id) {
      console.error('❌ widget_id mancante');
      return res.status(400).json({ error: 'Missing widget_id' });
    }

    // Carica configurazione provider per determinare il tipo di widget
    const { data: provider } = await supabase
      .from('ad_providers')
      .select('config')
      .eq('name', 'Tads')
      .eq('enabled', true)
      .single();

    if (!provider) {
      console.error('❌ Provider Tads non trovato');
      return res.status(500).json({ error: 'Provider not configured' });
    }

    const config = provider.config;
    let reward = 0;
    let eventType = '';

    // Determina tipo di evento in base al widget_id
    if (widget_id === config.rewarded_widget_id) {
      // Fullscreen = visualizzazione completata
      reward = 10;
      eventType = 'ad_view';
    } else if (widget_id === config.static_widget_id) {
      // TGB/Static = click su annuncio
      reward = 5;
      eventType = 'ad_click';
    } else {
      console.warn('⚠️ Widget ID sconosciuto:', widget_id);
      reward = 10; // Default
      eventType = 'unknown';
    }

    console.log(`📊 Evento: ${eventType}, Reward: ${reward} CDC`);

    // Carica l'utente dal database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', telegram_id)
      .single();

    if (userError || !user) {
      console.error('❌ Utente non trovato:', telegram_id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`👤 Utente trovato: @${user.username} (${user.id})`);

    // Aggiorna saldo utente
    const newBalance = user.balance + reward;
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', telegram_id);

    if (updateError) {
      console.error('❌ Errore aggiornamento saldo:', updateError);
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    console.log(`💰 Saldo aggiornato: ${user.balance} → ${newBalance} CDC`);

    // Gestisci bonus referral (5% al referente)
    if (user.referred_by) {
      const bonus = Math.floor(reward * 0.05);
      
      const { data: referrer } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.referred_by)
        .single();

      if (referrer) {
        await supabase
          .from('users')
          .update({
            balance: referrer.balance + bonus,
            referral_earnings: (referrer.referral_earnings || 0) + bonus
          })
          .eq('id', referrer.id);

        console.log(`🎁 Bonus referral: ${bonus} CDC a @${referrer.username}`);
      }
    }

    // Log successo finale
    console.log(`
╔════════════════════════════════════╗
║  ✅ RICOMPENSA ASSEGNATA          ║
╠════════════════════════════════════╣
║  Utente: @${user.username}        
║  Telegram ID: ${telegram_id}
║  Evento: ${eventType}
║  Widget: ${widget_id}
║  Ricompensa: ${reward} CDC
║  Nuovo Saldo: ${newBalance} CDC
╚════════════════════════════════════╝
    `);

    // Risposta per Tads
    return res.status(200).json({
      success: true,
      status: 'ok',
      telegram_id: telegram_id,
      reward: reward,
      new_balance: newBalance
    });

  } catch (error) {
    console.error('❌ ERRORE WEBHOOK:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
        }
