import { useEffect, useState } from 'react';
import { ConfiguratorCore, ConfiguratorEventType, Events, WORKTOP_FINISHES } from 'three-configurator';

export default function WorktopPanel({ core }: { core?: ConfiguratorCore }) {
  const [settings, setSettings] = useState<ReturnType<ConfiguratorCore['getSelectedWorktop']>>(null);
  const [error, setError] = useState('');
  const [finish, setFinish] = useState('ALABASTER');
  useEffect(() => {
    const refresh = () => {
      setSettings(core?.getSelectedWorktop() ?? null);
      setFinish(core?.getWorktopFinish() ?? 'ALABASTER');
    };
    refresh();
    Events.on(ConfiguratorEventType.MODEL_SELECTED, refresh);
    Events.on(ConfiguratorEventType.WORKTOP_UPDATED, refresh);
    return () => { Events.off(ConfiguratorEventType.MODEL_SELECTED, refresh); Events.off(ConfiguratorEventType.WORKTOP_UPDATED, refresh); };
  }, [core]);
  const update = (value: { depthMm?: 600 | 900; finish?: string }) => {
    const success = core?.setSelectedWorktop(value);
    setError(success ? '' : 'Requires clear space behind the cabinet.');
    setSettings(core?.getSelectedWorktop() ?? null);
  };
  return <section aria-label="Worktop settings" className="space-y-2" onPointerDown={e => e.stopPropagation()}>
    {settings ? <>
    <label className="block text-sm mb-1" htmlFor="worktop-depth">Selected cabinet depth</label>
    <select id="worktop-depth" className="w-full rounded border p-2 mb-3" value={settings.depthMm} onChange={e => update({ depthMm: Number(e.target.value) as 600 | 900 })}>
      <option value={600}>Standard — 600 mm</option>
      <option value={900} disabled={!settings.breakfastBarAvailable}>Breakfast bar — 900 mm</option>
    </select>
    {!settings.breakfastBarAvailable && <p className="text-xs mb-3">Breakfast bar requires 300 mm clear space behind a 580 mm cabinet.</p>}
    </> : <p className="text-xs">Select a Floor cupboard to change its worktop depth.</p>}
    <label className="block text-sm mb-1" htmlFor="worktop-finish">Color for all worktops</label>
    <div className="flex gap-2 items-center">
      <span className="w-7 h-7 rounded border shrink-0" style={{ backgroundColor: WORKTOP_FINISHES.find(f => f.name === finish)?.color }} />
      <select id="worktop-finish" className="min-w-0 w-full rounded border p-2 bg-content1 text-foreground" value={finish} onChange={e => {
        if (core?.setWorktopFinish(e.target.value)) { setFinish(e.target.value); setError(''); }
      }}>
        {WORKTOP_FINISHES.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
      </select>
    </div>
    <p className="text-xs text-zinc-500 mt-3">15 mm thickness · Representative colors</p>
    {error && <p role="alert" className="text-xs text-red-700 mt-2">{error}</p>}
  </section>;
}
