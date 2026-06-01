import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CurrencyIcon from '@/components/CurrencyIcon';
import ProductSaleModePicker from '@/components/ProductSaleModePicker';
import {
  canSellByUnit,
  getPriceForMode,
  saleModeLabel,
  type ProductSaleInfo,
  type SaleMode,
} from '@/lib/productSaleModes';

type Props = {
  product: ProductSaleInfo & { id: number; inStock?: boolean };
  language: 'en' | 'ar';
  onAddToCart: (product: ProductSaleInfo & { id: number }, mode: SaleMode) => void;
  extraActions?: React.ReactNode;
};

const ProductCatalogCardFooter = ({ product, language, onAddToCart, extraActions }: Props) => {
  const [saleMode, setSaleMode] = useState<SaleMode>('box');
  const price = getPriceForMode(product, saleMode);
  const soldOut = product.inStock === false;

  return (
    <div
      className="mt-auto flex min-h-[5.75rem] shrink-0 flex-col justify-end gap-2.5 border-t border-border/40 pt-3"
      dir="ltr"
    >
      <div className="flex min-h-[2rem] items-end">
        <ProductSaleModePicker
          product={product}
          language={language}
          value={saleMode}
          onChange={setSaleMode}
          compact
          className="w-full"
        />
      </div>

      <motion.div className="flex min-h-[2.25rem] items-center justify-between gap-2">
        <motion.div className="text-xl font-semibold leading-none text-primary md:text-lg" whileHover={{ scale: 1.03 }}>
          <span className="inline-flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1">
              {price}
              <CurrencyIcon
                className="mx-1 inline-block h-4 w-4"
                title={language === 'ar' ? 'دينار أردني' : 'Jordanian Dinar'}
              />
            </span>
            {canSellByUnit(product) && (
              <span className="text-[10px] font-normal text-muted-foreground">
                / {saleModeLabel(saleMode, language)}
              </span>
            )}
          </span>
        </motion.div>

        <div className="flex shrink-0 items-center gap-2">
          {extraActions}
          {!soldOut && (
            <Button
              type="button"
              size="sm"
              className="btn-primary h-8 gap-1.5 px-2.5 text-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(product, saleMode);
              }}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProductCatalogCardFooter;
