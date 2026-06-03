import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import CurrencyIcon from '@/components/CurrencyIcon';
import { readWishlist, writeWishlist, WISHLIST_CHANGED, type WishlistItem } from '@/lib/wishlist';
import { cartVariantKey } from '@/lib/productSaleModes';
import { CartProductImage } from '@/components/CartProductImage';
import { CATALOG_IMAGES_HYDRATED_EVENT, prefetchCartProductImages } from '@/lib/catalogImages';
import { CATALOG_CHANGED_EVENT } from '@/lib/catalogEvents';

const Wishlist = () => {
  const { language } = useLanguage();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const load = () => setItems(readWishlist());

  useEffect(() => {
    load();
    const onChanged = () => load();
    window.addEventListener(WISHLIST_CHANGED, onChanged);
    window.addEventListener(CATALOG_CHANGED_EVENT, onChanged);
    window.addEventListener(CATALOG_IMAGES_HYDRATED_EVENT, onChanged);
    return () => {
      window.removeEventListener(WISHLIST_CHANGED, onChanged);
      window.removeEventListener(CATALOG_CHANGED_EVENT, onChanged);
      window.removeEventListener(CATALOG_IMAGES_HYDRATED_EVENT, onChanged);
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    void prefetchCartProductImages(items.map((i) => i.id));
  }, [items]);

  const remove = (id: number) => {
    const next = readWishlist().filter((w) => w.id !== id);
    writeWishlist(next);
    setItems(next);
  };

  return (
    <div className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto w-full pb-8">
        <h1 className="text-3xl font-semibold mb-6">{language==='en'?'Wishlist':'المفضلة'}</h1>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">{language==='en'?'Your wishlist is empty.':'قائمة المفضلة فارغة.'}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => (
              <Card key={p.id} className="luxury-card flex h-full min-h-0 flex-col overflow-hidden border">
                <Link to={`/product/${p.id}`} className="block">
                  <CartProductImage
                    productId={p.id}
                    image={p.image}
                    alt={p.name[language]}
                    allowPlaceholder={false}
                    className="h-48 w-full bg-muted object-cover"
                  />
                </Link>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                  <div className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold sm:text-base">{p.name[language]}</div>
                  <div className="text-primary font-bold inline-flex items-center gap-1">
                    {p.price} <CurrencyIcon className="h-4 w-4" title={language === 'ar' ? 'دينار أردني' : 'Jordanian Dinar'} />
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button
                      className="btn-primary h-10 w-full"
                      onClick={() => {
                        addToCart({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category, variantName: cartVariantKey('box') }, 1);
                        navigate('/checkout');
                      }}
                    >
                      {language==='en'?'Buy Now':'اشترِ الآن'}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 w-full"
                      onClick={() => addToCart({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category, variantName: cartVariantKey('box') }, 1)}
                    >
                      {language==='en'?'Add to Cart':'أضف للسلة'}
                    </Button>
                    <Button variant="destructive" className="col-span-2 h-10 w-full" onClick={() => remove(p.id)}>
                      {language==='en'?'Remove':'إزالة'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
