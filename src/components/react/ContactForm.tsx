import { useState } from 'react';

const SIZES = ['30坪以內', '30–50坪', '50–100坪', '100坪以上'];
const TYPES = ['預售屋', '毛胚屋', '新成屋', '透天', '商業空間'];
const TIMES = ['隨時皆可', '上午 9:00–12:00', '中午 12:00–13:00', '下午 13:00–17:00', '晚上 17:00–20:00'];

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ContactForm() {
  const [form, setForm] = useState({
    address: '', size: '', type: '', budget: '', name: '', phone: '', lineId: '', email: '', time: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = '發送失敗';
        try { msg = JSON.parse(text).error || msg; } catch { /* non-JSON response */ }
        throw new Error(msg);
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : '發送失敗，請稍後再試');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold">已收到您的詢問</h3>
        <p className="text-gray-600">我們會盡快與您聯繫，謝謝！</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-lg font-semibold text-gray-800">填寫聯絡資訊</p>

      {/* 房屋所在地 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">房屋所在地／建案名稱</label>
        <input
          type="text"
          value={form.address}
          onChange={e => set('address', e.target.value)}
          placeholder="例：台北市大安區 / 某建案"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-800 transition-colors"
        />
      </div>

      {/* 空間坪數 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">空間坪數</label>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => set('size', s)}
              className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                form.size === s
                  ? 'bg-black text-white border-black'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 空間性質 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">空間性質</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                form.type === t
                  ? 'bg-black text-white border-black'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 房屋預算 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">房屋預算</label>
        <input
          type="text"
          value={form.budget}
          onChange={e => set('budget', e.target.value)}
          placeholder="例：150萬"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-800 transition-colors"
        />
      </div>

      {/* 姓名 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          您的姓名 <span className="text-gray-400">*</span>
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-800 transition-colors"
        />
      </div>

      {/* 連絡電話 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          連絡電話 <span className="text-gray-400">*</span>
        </label>
        <input
          type="tel"
          required
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-800 transition-colors"
        />
      </div>

      {/* Line ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Line ID</label>
        <input
          type="text"
          value={form.lineId}
          onChange={e => set('lineId', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-800 transition-colors"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-800 transition-colors"
        />
      </div>

      {/* 方便聯繫時間 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">方便聯繫時間</label>
        <div className="flex flex-wrap gap-2">
          {TIMES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('time', t)}
              className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                form.time === t
                  ? 'bg-black text-white border-black'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full px-8 py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? '傳送中…' : '送出詢問'}
      </button>
    </form>
  );
}
