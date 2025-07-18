import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      console.log('SettingsContext - Buscando configurações...');
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      console.log('SettingsContext - Dados recebidos:', data);

      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      console.log('SettingsContext - Settings map:', settingsMap);
      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Usar configurações padrão em caso de erro
      const defaultSettings = {
        rss_feed_enabled: 'true',
        rss_feed_url: 'https://www.ge.ch/feed/evenements',
        rss_feed_max_events: '10'
      };
      console.log('SettingsContext - Usando configurações padrão:', defaultSettings);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
      console.log('SettingsContext - Carregamento finalizado');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const getSetting = (key, defaultValue = null) => {
    return settings[key] || defaultValue;
  };

  const isRSSEnabled = () => {
    const enabled = getSetting('rss_feed_enabled', 'true') === 'true';
    console.log('SettingsContext - isRSSEnabled:', enabled);
    return enabled;
  };

  const getRSSUrl = () => {
    const url = getSetting('rss_feed_url', 'https://www.ge.ch/feed/evenements');
    console.log('SettingsContext - getRSSUrl:', url);
    return url;
  };

  const getRSSMaxEvents = () => {
    const maxEvents = parseInt(getSetting('rss_feed_max_events', '10'));
    console.log('SettingsContext - getRSSMaxEvents:', maxEvents);
    return maxEvents;
  };

  const value = {
    settings,
    loading,
    getSetting,
    isRSSEnabled,
    getRSSUrl,
    getRSSMaxEvents,
    refreshSettings: fetchSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 