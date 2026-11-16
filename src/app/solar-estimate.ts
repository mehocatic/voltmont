export const PANEL_MODELS = [
  { name: 'REC TwinPeak 4', code: 'REC375TP4', watts: 375, area: 1.755 * 1.040,
    specs: 'https://www.recgroup.com/sites/default/files/2024-11/im_rec_panels_iec_rev_l.en_.pdf#page=23' },
  { name: 'REC Alpha Pure-RX', code: 'REC470AA Pure-RX', watts: 470, area: 1.728 * 1.205,
    specs: 'https://www.recgroup.com/en/downloads/product-downloads/product-specifications-rec-alpha-pure-rx' },
] as const;

export function estimateSolar(monthlyKwh: number, usableArea: number, yieldPerKwp: number) {
  const demand = monthlyKwh * 12;
  const options = PANEL_MODELS.map(model => {
    const panelYield = model.watts / 1000 * yieldPerKwp;
    const capacity = Math.floor(usableArea / model.area);
    const count = Math.min(capacity, Math.round(demand / panelYield));
    const kwp = count * model.watts / 1000;
    const production = kwp * yieldPerKwp;
    return { model, count, kwp, production, footprint: count * model.area,
      maxAnnual: capacity * panelYield, difference: Math.abs(demand - production) };
  });
  options.sort((a, b) => a.difference - b.difference || a.count - b.count);
  return { ...options[0], demand, roofLimited: options.every(option => option.maxAnnual < demand) };
}
