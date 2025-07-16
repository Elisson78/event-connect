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
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Usar configurações padrão em caso de erro
      setSettings({
        rss_feed_enabled: 'true',
        rss_feed_url: 'https://www.ge.ch/feed/evenements',
        rss_feed_max_events: '10'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const getSetting = (key, defaultValue = null) => {
    return settings[key] || defaultValue;
  };

  const isRSSEnabled = () => {
    return getSetting('rss_feed_enabled', 'true') === 'true';
  };

  const getRSSUrl = () => {
    return getSetting('rss_feed_url', 'https://www.ge.ch/feed/evenements');
  };

  const getRSSMaxEvents = () => {
    return parseInt(getSetting('rss_feed_max_events', '10'));
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