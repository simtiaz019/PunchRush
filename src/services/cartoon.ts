import type { CartoonStyle } from '../types'

export interface CartoonProvider { transform(source: string, style: CartoonStyle): Promise<string> }
const colors: Record<CartoonStyle, string> = { classic: '#ffe63b', comic: '#ff7433', bobble: '#a88cff', pixel: '#48e4e0', monster: '#8cf168' }
function cropSquare(img: HTMLImageElement, style: CartoonStyle) {
  const size = 512, c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d')!;
  const min = Math.min(img.width, img.height), sx = (img.width - min) / 2, sy = (img.height - min) / 2;
  x.fillStyle = colors[style]; x.fillRect(0, 0, size, size);
  x.save(); x.beginPath(); x.arc(256, 260, 218, 0, Math.PI * 2); x.clip();
  x.filter = style === 'pixel' ? 'contrast(1.35) saturate(.7)' : 'contrast(1.2) saturate(1.45)';
  x.drawImage(img, sx, sy, min, min, 18, 22, 476, 476); x.restore(); x.filter = 'none';
  x.lineWidth = style === 'comic' ? 20 : 13; x.strokeStyle = '#1b1039'; x.beginPath(); x.arc(256, 260, 218, 0, Math.PI * 2); x.stroke();
  if (style === 'pixel') { x.fillStyle = 'rgba(20,10,48,.28)'; for (let i=0;i<512;i+=16) for(let j=0;j<512;j+=16) x.fillRect(i,j,2,2) }
  if (style === 'monster') { x.fillStyle = '#fff'; x.beginPath(); x.arc(125,122,48,0,7); x.arc(386,122,48,0,7); x.fill(); x.fillStyle='#1b1039'; x.beginPath(); x.arc(130,130,18,0,7);x.arc(380,130,18,0,7);x.fill() }
  return c.toDataURL('image/jpeg', .88)
}
export class BrowserCartoonProvider implements CartoonProvider {
  async transform(source: string, style: CartoonStyle) { const img = new Image(); img.src = source; await img.decode(); return cropSquare(img, style) }
}
export class ComfyUICartoonProvider implements CartoonProvider {
  constructor(private endpoint: string) {}
  async transform(source: string, style: CartoonStyle) { const res = await fetch(this.endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ image: source, style }) }); if (!res.ok) throw new Error('Optional cartoon service unavailable'); return (await res.json()).image }
}
export const makeDefaultAvatar = (style: CartoonStyle) => {
  const c = document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d')!, bg=colors[style];
  x.fillStyle=bg; x.fillRect(0,0,512,512); x.fillStyle='#ffbf8c'; x.beginPath(); x.arc(256,260,190,0,7);x.fill(); x.lineWidth=14;x.strokeStyle='#1b1039';x.stroke();
  x.fillStyle='#1b1039';x.beginPath();x.arc(180,230,18,0,7);x.arc(332,230,18,0,7);x.fill();x.lineWidth=12;x.beginPath();x.arc(256,286,54,0,Math.PI);x.stroke();
  x.fillStyle='#1b1039';x.beginPath();x.arc(256,102,187,Math.PI,0);x.lineTo(443,165);x.lineTo(69,165);x.fill(); return c.toDataURL('image/png')
}
