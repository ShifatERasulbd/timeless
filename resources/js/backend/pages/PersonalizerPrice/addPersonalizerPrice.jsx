import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import AddForm from '@/components/personalizerPrice/addForm';
import { useAppContext } from '@/context/AppContext';

import { createPersonalizerPrice } from './api';

const initialForm = {
    minimum_size: '',
    maximum_size: '',
    price: '',
};

function validateForm(form) {
    const errors = {};

    if (form.minimum_size === '' || form.minimum_size === null) {
        errors.minimum_size = ['The minimum size field is required.'];
    }

    if (form.maximum_size === '' || form.maximum_size === null) {
        errors.maximum_size = ['The maximum size field is required.'];
    }

    if (
        form.minimum_size !== '' &&
        form.maximum_size !== '' &&
        Number(form.minimum_size) > Number(form.maximum_size)
    ) {
        errors.maximum_size = ['The maximum size must be greater than or equal to the minimum size.'];
    }

    if (form.price === '' || form.price === null) {
        errors.price = ['The price field is required.'];
    } else if (Number(form.price) < 0) {
        errors.price = ['The price must be greater than or equal to 0.'];
    }

    return errors;
}

export default function AddPersonalizerPrice() {
    const navigate = useNavigate();
    const { setPageTitle } = useAppContext();

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestError, setRequestError] = useState('');

    useEffect(() => {
        setPageTitle('Add Personalizer Price');
    }, [setPageTitle]);

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

        const validationErrors = validateForm(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setRequestError('');
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        setRequestError('');

        try {
            await createPersonalizerPrice({
                minimum_size: form.minimum_size,
                maximum_size: form.maximum_size,
                price: form.price,
            });

            toast.success('Personalizer price created successfully.', {
                style: { color: '#16a34a' },
            });
            navigate('/admin/personalizer-prices');
        } catch (error) {
            setErrors(error.payload?.errors || {});
            if (!error.payload?.errors) {
                const message = error.message || 'Failed to create personalizer price.';
                setRequestError(message);
                toast.error(message, { style: { color: '#dc2626' } });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            {requestError && <p className="text-sm text-destructive">{requestError}</p>}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
                <AddForm
                    form={form}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate('/admin/personalizer-prices')}
                    isSubmitting={isSubmitting}
                    errors={errors}
                />
            </div>
        </div>
    );
}
