import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import EditForm from '@/components/personalizerPrice/editForm';
import { useAppContext } from '@/context/AppContext';

import { fetchPersonalizerPrice, updatePersonalizerPrice } from './api';

const initialForm = {
    minimum_size: '',
    maximum_size: '',
    price: '',
};

export default function EditPersonalizerPrice() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setPageTitle } = useAppContext();

    const [form, setForm] = useState(initialForm);
    const [personalizerPrice, setPersonalizerPrice] = useState(null);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        setPageTitle('Edit Personalizer Price');
    }, [setPageTitle]);

    useEffect(() => {
        let ignore = false;

        async function loadData() {
            setIsLoading(true);
            setLoadError('');

            try {
                const data = await fetchPersonalizerPrice(id);

                if (!ignore) {
                    setPersonalizerPrice(data);
                    setForm({
                        minimum_size: data?.minimum_size ?? '',
                        maximum_size: data?.maximum_size ?? '',
                        price: data?.price ?? '',
                    });
                }
            } catch (error) {
                if (!ignore) {
                    setLoadError(error.message || 'Failed to load personalizer price.');
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        loadData();

        return () => {
            ignore = true;
        };
    }, [id]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
        setErrors((previous) => {
            if (!previous[name]) return previous;
            const next = { ...previous };
            delete next[name];
            return next;
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (form.minimum_size === '' || form.minimum_size === null) {
            setErrors({ minimum_size: ['The minimum size field is required.'] });
            return;
        }

        if (form.maximum_size === '' || form.maximum_size === null) {
            setErrors({ maximum_size: ['The maximum size field is required.'] });
            return;
        }

        if (Number(form.minimum_size) > Number(form.maximum_size)) {
            setErrors({
                maximum_size: ['The maximum size must be greater than or equal to the minimum size.'],
            });
            return;
        }

        if (form.price === '' || form.price === null || Number(form.price) < 0) {
            setErrors({ price: ['The price field is required and must be 0 or greater.'] });
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        setLoadError('');

        try {
            await updatePersonalizerPrice(id, {
                minimum_size: form.minimum_size,
                maximum_size: form.maximum_size,
                price: form.price,
            });

            toast.success('Personalizer price updated successfully.', {
                style: { color: '#16a34a' },
            });
            navigate('/admin/personalizer-prices');
        } catch (error) {
            setErrors(error.payload?.errors || {});
            if (!error.payload?.errors) {
                const message = error.message || 'Failed to update personalizer price.';
                setLoadError(message);
                toast.error(message, { style: { color: '#dc2626' } });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading personalizer price...</p>;
    }

    return (
        <div className="space-y-4">
            {loadError && <p className="text-sm text-destructive">{loadError}</p>}

            <EditForm
                form={form}
                personalizerPrice={personalizerPrice}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/admin/personalizer-prices')}
                isSubmitting={isSubmitting}
                errors={errors}
            />
        </div>
    );
}
