import { useEffect, useState } from 'react';

import { CART_UPDATED_EVENT, getCartCount, readCart } from '../../utils/cart';

export default function useCartCount() {
    const [count, setCount] = useState(() => getCartCount(readCart()));

    useEffect(() => {
        function updateCount() {
            setCount(getCartCount(readCart()));
        }

        window.addEventListener(CART_UPDATED_EVENT, updateCount);
        window.addEventListener('storage', updateCount);

        return () => {
            window.removeEventListener(CART_UPDATED_EVENT, updateCount);
            window.removeEventListener('storage', updateCount);
        };
    }, []);

    return count;
}
