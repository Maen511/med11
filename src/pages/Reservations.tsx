import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/formatNumbers';

type Reservation = { id: number; time: number; name?: { en: string; ar: string }; image?: string; description?: { en: string; ar: string }; price?: number };
type SaleWatch = { id: number; time: number; name?: { en: string; ar: string }; image?: string; description?: { en: string; ar: string }; price?: number };

const Reservations = () => {
  const { language, setLanguage } = useLanguage();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [saleWatches, setSaleWatches] = useState<SaleWatch[]>([]);

  useEffect(() => {
    try { setReservations(JSON.parse(localStorage.getItem('med-reservations') || '[]')); } catch {}
    try { setSaleWatches(JSON.parse(localStorage.getItem('med-sale-watches') || '[]')); } catch {}
  }, []);

  const removeReservation = (id: number) => {
    try {
      const key = 'med-reservations';
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const next = current.filter((r: any) => r.id !== id);
      localStorage.setItem(key, JSON.stringify(next));
      setReservations(next);
    } catch {}
  };

  const removeSaleWatch = (id: number) => {
    try {
      const key = 'med-sale-watches';
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const next = current.filter((r: any) => r.id !== id);
      localStorage.setItem(key, JSON.stringify(next));
      setSaleWatches(next);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <h1 className="text-3xl font-semibold mb-6">{language==='ar'?'الحجوزات وتنبيهات العروض':'Reservations & sale alerts'}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium mb-3">{language==='ar'?'الحجوزات':'Reservations'}</h2>
            {reservations.length === 0 ? (
              <div className="text-sm text-muted-foreground">{language==='ar'?'لا توجد حجوزات.':'No reservations.'}</div>
            ) : (
              <div className="space-y-4">
                {reservations.map(r => (
                  <Card key={r.id} className="border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <button className="hover:text-primary" onClick={()=>{ window.location.href = `/product/${r.id}`; }}>{r.name?.[language] || ('#'+r.id)}</button>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(r.time, language, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                      {r.image && <img src={r.image} alt={r.name?.[language]||''} className="w-16 h-16 object-cover rounded border" />}
                      <div className="text-sm text-muted-foreground flex-1">{r.description?.[language]||''}</div>
                      <div className="flex items-center gap-2">
                        {r.price ? <span className="text-sm font-medium">{r.price}</span> : null}
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={()=>removeReservation(r.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-medium mb-3">{language==='ar'?'تنبيهات العروض':'Sale alerts'}</h2>
            {saleWatches.length === 0 ? (
              <div className="text-sm text-muted-foreground">{language==='ar'?'لا توجد تنبيهات.':'No alerts.'}</div>
            ) : (
              <div className="space-y-4">
                {saleWatches.map(s => (
                  <Card key={s.id} className="border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <button className="hover:text-primary" onClick={()=>{ window.location.href = `/product/${s.id}`; }}>{s.name?.[language] || ('#'+s.id)}</button>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(s.time, language, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                      {s.image && <img src={s.image} alt={s.name?.[language]||''} className="w-16 h-16 object-cover rounded border" />}
                      <div className="text-sm text-muted-foreground flex-1">{s.description?.[language]||''}</div>
                      <div className="flex items-center gap-2">
                        {s.price ? <span className="text-sm font-medium">{s.price}</span> : null}
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={()=>removeSaleWatch(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Reservations;


