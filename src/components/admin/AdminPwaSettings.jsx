import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Switch } from '@/components/ui/switch';
import { useEvents } from '@/contexts/EventContext';

const defaultManifest = {
  name: 'Event Connect',
  short_name: 'EventConnect',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#1A73E8',
  description: 'Plataforma de eventos. Conectamos organizadores e participantes.',
};

const AdminPwaSettings = () => {
  const [icon192, setIcon192] = useState(null);
  const [icon512, setIcon512] = useState(null);
  const [manifest, setManifest] = useState(defaultManifest);
  const [preview192, setPreview192] = useState(null);
  const [preview512, setPreview512] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPwaButton, setShowPwaButton] = useState(true);
  const [showQrcodeHome, setShowQrcodeHome] = useState(true);
  const { refetchPlatformSettings, platformSettings } = useEvents();

  useEffect(() => {
    if (platformSettings) {
      setShowPwaButton(!!platformSettings.show_pwa_button);
      setShowQrcodeHome(!!platformSettings.show_qrcode_home);
    }
  }, [platformSettings]);

  const handleIconChange = (e, size) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (size === 192) {
        setPreview192(ev.target.result);
        setIcon192(file);
      } else {
        setPreview512(ev.target.result);
        setIcon512(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManifestChange = (e) => {
    setManifest({ ...manifest, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Salvar flags em platform_settings
      await supabase.from('platform_settings').update({ show_pwa_button: showPwaButton, show_qrcode_home: showQrcodeHome }).eq('id', 1);
      // Upload ícone 192x192
      if (icon192) {
        const { error } = await supabase.storage.from('eventconnect-pwa').upload('icon-192x192.png', icon192, { upsert: true, contentType: 'image/png' });
        if (error) throw new Error('Erro ao enviar ícone 192x192: ' + error.message);
      }
      // Upload ícone 512x512
      if (icon512) {
        const { error } = await supabase.storage.from('eventconnect-pwa').upload('icon-512x512.png', icon512, { upsert: true, contentType: 'image/png' });
        if (error) throw new Error('Erro ao enviar ícone 512x512: ' + error.message);
      }
      // Upload manifesto
      const manifestBlob = new Blob([JSON.stringify({
        ...manifest,
        icons: [
          {
            src: '/storage/v1/object/public/eventconnect-pwa/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/storage/v1/object/public/eventconnect-pwa/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }, null, 2)], { type: 'application/json' });
      const { error: manifestError } = await supabase.storage.from('eventconnect-pwa').upload('manifest.webmanifest', manifestBlob, { upsert: true, contentType: 'application/json' });
      if (manifestError) throw new Error('Erro ao enviar manifesto: ' + manifestError.message);
      setMessage('Configurações salvas com sucesso!');
      await refetchPlatformSettings();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Configurações do PWA</h2>
      <form className="space-y-4">
        <div className="flex items-center gap-4">
          <Switch checked={showPwaButton} onCheckedChange={setShowPwaButton} id="show-pwa-button" />
          <label htmlFor="show-pwa-button" className="font-semibold">Exibir botão de instalar app no menu</label>
        </div>
        <div className="flex items-center gap-4">
          <Switch checked={showQrcodeHome} onCheckedChange={setShowQrcodeHome} id="show-qrcode-home" />
          <label htmlFor="show-qrcode-home" className="font-semibold">Exibir QR Code e botões de loja na Home</label>
        </div>
        <div>
          <label className="block font-semibold mb-1">Ícone 192x192 PNG</label>
          <input type="file" accept="image/png" onChange={e => handleIconChange(e, 192)} />
          {preview192 && <img src={preview192} alt="Preview 192x192" className="mt-2 w-16 h-16 rounded" />}
        </div>
        <div>
          <label className="block font-semibold mb-1">Ícone 512x512 PNG</label>
          <input type="file" accept="image/png" onChange={e => handleIconChange(e, 512)} />
          {preview512 && <img src={preview512} alt="Preview 512x512" className="mt-2 w-20 h-20 rounded" />}
        </div>
        <div>
          <label className="block font-semibold mb-1">Nome do App</label>
          <input type="text" name="name" value={manifest.name} onChange={handleManifestChange} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Short Name</label>
          <input type="text" name="short_name" value={manifest.short_name} onChange={handleManifestChange} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Descrição</label>
          <input type="text" name="description" value={manifest.description} onChange={handleManifestChange} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Cor do Tema</label>
          <input type="color" name="theme_color" value={manifest.theme_color} onChange={handleManifestChange} className="w-12 h-8 p-0 border-none" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Cor de Fundo</label>
          <input type="color" name="background_color" value={manifest.background_color} onChange={handleManifestChange} className="w-12 h-8 p-0 border-none" />
        </div>
        <button type="button" onClick={handleSave} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded font-semibold" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Configurações'}</button>
      </form>
      {message && <div className={`mt-4 p-2 rounded ${message.includes('sucesso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message}</div>}
      <div className="mt-8">
        <h3 className="font-bold mb-2">Preview do Manifesto</h3>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(manifest, null, 2)}</pre>
      </div>
    </div>
  );
};

export default AdminPwaSettings; 