import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const TadsAd = ({ type = 'rewarded', userId, onReward, onError }) => {
  const [adController, setAdController] = useState(null);
  const [loading, setLoading] = useState(false);
  const [widgetId, setWidgetId] = useState(null);

  useEffect(() => {
    if (userId) {
      initAd();
    }
  }, [userId]);

  const initAd = async () => {
    try {
      // Carica configurazione provider da Supabase
      const { data: provider } = await supabase
        .from('ad_providers')
        .select('config')
        .eq('name', 'Tads')
        .eq('enabled', true)
        .single();

      if (!provider) {
        console.error('Tads provider non trovato');
        if (onError) onError('Provider non disponibile');
        return;
      }

      const config = provider.config;
      const wId = type === 'rewarded' 
        ? config.rewarded_widget_id 
        : config.static_widget_id;

      if (!wId) {
        console.error('Widget ID non configurato');
        if (onError) onError('Widget non configurato');
        return;
      }

      setWidgetId(wId);

      // Attendi che window.tads sia pronto
      if (!window.tads) {
        setTimeout(() => initAd(), 100);
        return;
      }

      // Inizializza il tipo corretto
      if (type === 'rewarded') {
        initRewardedAd(wId);
      } else {
        initStaticAd(wId);
      }
    } catch (err) {
      console.error('Errore inizializzazione ad:', err);
      if (onError) onError(err);
    }
  };

  const initRewardedAd = (wId) => {
    const controller = window.tads.init({
      widgetId: wId,
      type: 'fullscreen',
      debug: false,
      // I callback sono SOLO per feedback UI, NON danno monete!
      // Le monete vengono aggiunte dal webhook server-side
      onShowReward: (result) => {
        console.log('🎉 Annuncio completato (UI feedback):', result);
        // Solo messaggio all'utente
        if (onReward) {
          onReward('Complimenti! Il tuo saldo verrà aggiornato tra qualche secondo.');
        }
      },
      onClickReward: (adId) => {
        console.log('👆 Click sull\'annuncio (UI feedback):', adId);
        // NON dare monete, il webhook lo farà
      },
      onAdsNotFound: () => {
        console.log('❌ Nessun annuncio disponibile');
        if (onError) onError('Nessun annuncio disponibile al momento');
      }
    });
    setAdController(controller);
  };

  const initStaticAd = (wId) => {
    const controller = window.tads.init({
      widgetId: wId,
      type: 'static',
      debug: false,
      onClickReward: (adId) => {
        console.log('👆 Banner cliccato (UI feedback):', adId);
        // NON dare monete, solo log
      },
      onAdsNotFound: () => {
        console.log('❌ Nessun banner disponibile');
      }
    });

    // Carica automaticamente per static ads
    controller.loadAd()
      .then(() => controller.showAd())
      .catch((err) => {
        console.error('Errore caricamento banner:', err);
      });

    setAdController(controller);
  };

  const showAd = async () => {
    if (!adController) {
      console.error('Controller non pronto');
      return;
    }

    setLoading(true);
    try {
      await adController.showAd();
    } catch (err) {
      console.error('Errore mostra ad:', err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  // Rendering per tipo static
  if (type === 'static') {
    return (
      <div className="w-full">
        <div 
          id={`tads-container-${widgetId}`}
          className="w-full min-h-[100px] flex items-center justify-center bg-gray-50 rounded-lg"
        />
      </div>
    );
  }

  // Rendering per tipo rewarded
  return (
    <button
      onClick={showAd}
      disabled={loading || !adController}
      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg py-3 font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Caricamento...' : '📺 Guarda Annuncio (+10 CDC)'}
    </button>
  );
};

export default TadsAd;
