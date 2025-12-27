import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const TadsAd = ({ type = 'rewarded', userId, onReward, onError }) => {
  const [adController, setAdController] = useState(null);
  const [loading, setLoading] = useState(false);
  const [widgetId, setWidgetId] = useState(null);
  const [status, setStatus] = useState('Inizializzazione...');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      initAd();
    }
  }, [userId]);

  const initAd = async () => {
    try {
      setStatus('Caricamento configurazione...');
      
      // Carica configurazione provider da Supabase
      const { data: provider, error: dbError } = await supabase
        .from('ad_providers')
        .select('config')
        .eq('name', 'Tads')
        .eq('enabled', true)
        .single();

      if (dbError || !provider) {
        setError('Provider non trovato');
        setStatus('Errore: Provider non disponibile');
        return;
      }

      const config = provider.config;
      const wId = type === 'rewarded' 
        ? config.rewarded_widget_id 
        : config.static_widget_id;

      if (!wId) {
        setError('Widget ID mancante');
        setStatus('Errore: Widget non configurato');
        return;
      }

      setWidgetId(wId);
      setStatus(`Widget trovato: ${wId.substring(0, 8)}...`);

      // Attendi che window.tads sia pronto
      let attempts = 0;
      const waitForTads = setInterval(() => {
        attempts++;
        if (window.tads) {
          clearInterval(waitForTads);
          setStatus('SDK pronto');
          
          // Inizializza il tipo corretto
          if (type === 'rewarded') {
            initRewardedAd(wId);
          } else {
            initStaticAd(wId);
          }
        } else if (attempts > 50) {
          clearInterval(waitForTads);
          setError('SDK timeout');
          setStatus('Errore: SDK non caricato dopo 5 sec');
        }
      }, 100);

    } catch (err) {
      setError(err.message);
      setStatus('Errore: ' + err.message);
    }
  };

  const initRewardedAd = (wId) => {
    try {
      const controller = window.tads.init({
        widgetId: wId,
        type: 'fullscreen',
        debug: false,
        onShowReward: (result) => {
          setStatus('Annuncio completato! ✅');
          if (onReward) {
            onReward('Ricompensa in arrivo tra qualche secondo!');
          }
        },
        onClickReward: (adId) => {
          // Solo log
        },
        onAdsNotFound: () => {
          setStatus('Nessun annuncio disponibile ⚠️');
          setError('No ads');
        }
      });
      setAdController(controller);
      setStatus('Pronto! Clicca il pulsante');
      setError(null);
    } catch (err) {
      setError('Errore init: ' + err.message);
      setStatus('Errore inizializzazione');
    }
  };

  const initStaticAd = (wId) => {
    try {
      const controller = window.tads.init({
        widgetId: wId,
        type: 'static',
        debug: false,
        onClickReward: (adId) => {
          // Solo log
        },
        onAdsNotFound: () => {
          setStatus('Nessun banner');
        }
      });

      controller.loadAd()
        .then(() => {
          controller.showAd();
          setStatus('Banner caricato');
        })
        .catch((err) => {
          setError('Load failed: ' + err.message);
        });

      setAdController(controller);
    } catch (err) {
      setError('Errore static: ' + err.message);
    }
  };

  const showAd = () => {
    if (!adController) {
      setError('Controller non pronto');
      alert('Annuncio non ancora pronto, attendi qualche secondo');
      return;
    }

    setLoading(true);
    setStatus('Apertura annuncio...');
    
    try {
      // Tads showAd() NON è asincrono, chiamalo direttamente
      adController.showAd();
      setStatus('Annuncio aperto');
      setLoading(false);
    } catch (err) {
      setError('Show error: ' + (err?.message || 'Unknown'));
      setStatus('Errore apertura annuncio');
      alert('Errore: ' + (err?.message || 'Sconosciuto'));
      setLoading(false);
    }
  };

  // Rendering per tipo static
  if (type === 'static') {
    return (
      <div className="w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
        <div 
          id={`tads-container-${widgetId}`}
          className="w-full min-h-[100px] flex items-center justify-center bg-gray-50 rounded-lg"
        >
          {!widgetId && <span className="text-xs text-gray-400">{status}</span>}
        </div>
      </div>
    );
  }

  // Rendering per tipo rewarded
  return (
    <div className="w-full">
      {/* Status indicator */}
      <div className="mb-2 text-xs text-gray-500 text-center">
        {status}
      </div>
      
      {/* Error indicator */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
          <p className="text-xs text-red-600 text-center">{error}</p>
        </div>
      )}
      
      {/* Button */}
      <button
        onClick={showAd}
        disabled={loading || !adController}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg py-3 font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Caricamento...' : !adController ? 'Preparazione...' : '📺 Guarda Annuncio (+10 CDC)'}
      </button>
    </div>
  );
};

export default TadsAd;
