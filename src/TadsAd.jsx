import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

const sanitizeId = (s = '') => String(s).replace(/[^a-zA-Z0-9-_:.]/g, '-');

const TadsAd = ({ type = 'rewarded', userId, onReward, onError }) => {
  const [adController, setAdController] = useState(null);
  const [loading, setLoading] = useState(false);
  const [widgetId, setWidgetId] = useState(null);
  const [status, setStatus] = useState('Inizializzazione...');
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (userId) {
      initAd();
    } else {
      // reset if userId becomes falsy
      setAdController(null);
      setWidgetId(null);
      setStatus('Inizializzazione...');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, type]);

  const safeSet = (setter) => (value) => {
    if (mounted.current) setter(value);
  };
  const sSetStatus = safeSet(setStatus);
  const sSetError = safeSet((v) => {
    setError(v);
    if (onError) onError(v);
  });
  const sSetAdController = safeSet(setAdController);
  const sSetWidgetId = safeSet(setWidgetId);

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      if (!src) return reject(new Error('No script src'));
      // if already loaded
      const exists = Array.from(document.getElementsByTagName('script')).find(
        (s) => s.src === src
      );
      if (exists) {
        if (window.tads) return resolve();
        // otherwise wait a bit
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (e) => reject(new Error('Script load error: ' + src));
      document.head.appendChild(script);
    });

  const waitForTads = (timeoutMs = 10000, interval = 100) =>
    new Promise((resolve, reject) => {
      const maxAttempts = Math.ceil(timeoutMs / interval);
      let attempts = 0;
      const id = setInterval(() => {
        attempts++;
        if (window.tads) {
          clearInterval(id);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(id);
          reject(new Error('SDK timeout'));
        }
      }, interval);
    });

  const initAd = async () => {
    try {
      sSetError(null);
      sSetStatus('Caricamento configurazione...');

      // Carica configurazione provider da Supabase
      const { data: provider, error: dbError } = await supabase
        .from('ad_providers')
        .select('config')
        .eq('name', 'Tads')
        .eq('enabled', true)
        .single();

      if (dbError || !provider) {
        console.debug('Supabase error or missing provider', dbError, provider);
        sSetError('Provider non trovato');
        sSetStatus('Errore: Provider non disponibile');
        return;
      }

      const config = provider.config || {};
      const wId =
        type === 'rewarded' ? config.rewarded_widget_id : config.static_widget_id;

      if (!wId) {
        console.debug('Missing widget id in config', config);
        sSetError('Widget ID mancante');
        sSetStatus('Errore: Widget non configurato');
        return;
      }

      sSetWidgetId(wId);
      sSetStatus(`Widget trovato: ${String(wId).substring(0, 8)}...`);

      // Se config contiene sdk_url, caricalo dinamicamente
      if (!window.tads && config.sdk_url) {
        sSetStatus('Caricamento SDK...');
        try {
          await loadScript(config.sdk_url);
          console.debug('SDK script caricato da', config.sdk_url);
        } catch (err) {
          console.error('Errore caricamento script SDK', err);
          sSetError('Errore caricamento SDK');
          sSetStatus('Errore: SDK non caricato');
          return;
        }
      }

      // Attendi che window.tads sia pronto (più tempo)
      try {
        await waitForTads(10000, 100);
      } catch (err) {
        console.error('waitForTads failed', err);
        sSetError('SDK timeout');
        sSetStatus('Errore: SDK non caricato dopo 10 sec');
        return;
      }

      sSetStatus('SDK pronto');

      // Inizializza il tipo corretto
      if (type === 'rewarded') {
        await initRewardedAd(wId);
      } else {
        await initStaticAd(wId);
      }
    } catch (err) {
      console.error('initAd catch', err);
      sSetError(err?.message || String(err));
      sSetStatus('Errore: ' + (err?.message || String(err)));
    }
  };

  const initRewardedAd = async (wId) => {
    try {
      console.debug('initRewardedAd', { wId });
      const controller = window.tads.init({
        widgetId: wId,
        type: 'fullscreen',
        debug: false,
        onShowReward: (result) => {
          sSetStatus('Annuncio completato! ✅');
          if (onReward) {
            onReward('Ricompensa in arrivo tra qualche secondo!');
          }
        },
        onClickReward: (adId) => {
          console.debug('onClickReward', adId);
        },
        onAdsNotFound: () => {
          sSetStatus('Nessun annuncio disponibile ⚠️');
          sSetError('No ads');
        },
        onError: (err) => {
          console.error('tads onError', err);
          sSetError('SDK error: ' + (err?.message || String(err)));
        }
      });

      sSetAdController(controller);

      // Alcuni SDK richiedono loadAd() per il rewarded: proviamo a caricarlo se disponibile
      if (typeof controller.loadAd === 'function') {
        sSetStatus('Caricamento annuncio...');
        try {
          await controller.loadAd();
          sSetStatus('Pronto! Clicca il pulsante');
          sSetError(null);
        } catch (err) {
          console.warn('loadAd failed for rewarded', err);
          // non blocchiamo totalmente: permettiamo comunque showAd ma segnaliamo
          sSetStatus('Annuncio non caricato, prova ad aprire comunque');
          sSetError('Load failed: ' + (err?.message || String(err)));
        }
      } else {
        sSetStatus('Pronto! Clicca il pulsante');
        sSetError(null);
      }
    } catch (err) {
      console.error('initRewardedAd error', err);
      sSetError('Errore init: ' + (err?.message || String(err)));
      sSetStatus('Errore inizializzazione');
    }
  };

  const initStaticAd = async (wId) => {
    try {
      console.debug('initStaticAd', { wId });
      const containerId = `tads-container-${sanitizeId(wId)}`;
      const controller = window.tads.init({
        widgetId: wId,
        type: 'static',
        container: containerId, // passiamo il container al provider se richiesto
        debug: false,
        onClickReward: (adId) => {
          console.debug('static onClickReward', adId);
        },
        onAdsNotFound: () => {
          sSetStatus('Nessun banner');
        },
        onError: (err) => {
          console.error('tads static onError', err);
          sSetError('SDK error: ' + (err?.message || String(err)));
        }
      });

      sSetAdController(controller);

      if (typeof controller.loadAd === 'function') {
        try {
          await controller.loadAd();
          // solo dopo load mostriamo
          if (typeof controller.showAd === 'function') {
            controller.showAd();
          }
          sSetStatus('Banner caricato');
          sSetError(null);
        } catch (err) {
          console.error('static loadAd error', err);
          sSetError('Load failed: ' + (err?.message || String(err)));
          sSetStatus('Errore caricamento banner');
        }
      } else {
        // se non c'è loadAd proviamo solo showAd
        if (typeof controller.showAd === 'function') {
          controller.showAd();
          sSetStatus('Banner mostrato');
        } else {
          sSetStatus('Banner pronto (SDK non ha loadAd/showAd)');
        }
      }
    } catch (err) {
      console.error('initStaticAd error', err);
      sSetError('Errore static: ' + (err?.message || String(err)));
    }
  };

  const showAd = async () => {
    if (!adController) {
      sSetError('Controller non pronto');
      alert('Annuncio non ancora pronto, attendi qualche secondo');
      return;
    }

    setLoading(true);
    sSetStatus('Apertura annuncio...');

    try {
      // Se esiste una funzione asincrona showAd (promessa), gestiscila
      if (typeof adController.showAd === 'function') {
        const res = adController.showAd();
        if (res && typeof res.then === 'function') {
          await res;
        }
        sSetStatus('Annuncio aperto');
      } else {
        // fallback: qualche SDK usa open() o play()
        sSetStatus('SDK non espone showAd()');
        console.warn('adController has no showAd', adController);
      }
    } catch (err) {
      console.error('showAd error', err);
      sSetError('Show error: ' + (err?.message || String(err)));
      sSetStatus('Errore apertura annuncio');
      alert('Errore: ' + (err?.message || 'Sconosciuto'));
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  // Rendering per tipo static
  if (type === 'static') {
    const containerId = `tads-container-${sanitizeId(widgetId)}`;
    return (
      <div className="w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
        <div
          id={containerId}
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
      <div className="mb-2 text-xs text-gray-500 text-center">{status}</div>

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
