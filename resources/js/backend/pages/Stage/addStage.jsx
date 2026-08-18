import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import AddForm from '@/components/stage/addForm';
import { useAppContext } from '@/context/AppContext';

import { createStage } from './api';

const initialForm = {
    minimum_quantity: '',
    maximum_quantity: '',
};

function validateForm(form) {
    const errors = {};

    if (form.minimum_quantity === '' || form.minimum_quantity === null) {
        errors.minimum_quantity = ['The minimum quantity field is required.'];
    }

    if (form.maximum_quantity === '' || form.maximum_quantity === null) {
        errors.maximum_quantity = ['The maximum quantity field is required.'];
    }

    if (
        form.minimum_quantity !== '' &&
        form.maximum_quantity !== '' &&
        Number(form.minimum_quantity) > Number(form.maximum_quantity)
    ) {
        errors.maximum_quantity = ['The maximum quantity must be greater than or equal to the minimum quantity.'];
    }

    return errors;
}

export default function AddStage() {
    const navigate = useNavigate();
    const { setPageTitle } = useAppContext();

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestError, setRequestError] = useState('');

    useEffect(() => {
        setPageTitle('Add Stage');
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
            await createStage({
                minimum_quantity: form.minimum_quantity,
                maximum_quantity: form.maximum_quantity,
            });

            toast.success('Stage created successfully.', {
                style: { color: '#16a34a' },
            });
            navigate('/admin/stages');
        } catch (error) {
            setErrors(error.payload?.errors || {});
            if (!error.payload?.errors) {
                const message = error.message || 'Failed to create stage.';
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
                    onCancel={() => navigate('/admin/stages')}
                    isSubmitting={isSubmitting}
                    errors={errors}
                />
            </div>
        </div>
    );
}