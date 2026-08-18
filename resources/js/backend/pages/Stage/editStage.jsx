import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import EditForm from '@/components/stage/editForm';
import { useAppContext } from '@/context/AppContext';

import { fetchStage, updateStage } from './api';

const initialForm = {
    minimum_quantity: '',
    maximum_quantity: '',
};

export default function EditStage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setPageTitle } = useAppContext();

    const [form, setForm] = useState(initialForm);
    const [stage, setStage] = useState(null);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        setPageTitle('Edit Stage');
    }, [setPageTitle]);

    useEffect(() => {
        let ignore = false;

        async function loadData() {
            setIsLoading(true);
            setLoadError('');

            try {
                const data = await fetchStage(id);

                if (!ignore) {
                    setStage(data);
                    setForm({
                        minimum_quantity: data?.minimum_quantity ?? '',
                        maximum_quantity: data?.maximum_quantity ?? '',
                    });
                }
            } catch (error) {
                if (!ignore) {
                    setLoadError(error.message || 'Failed to load stage.');
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

        if (form.minimum_quantity === '' || form.minimum_quantity === null) {
            setErrors({ minimum_quantity: ['The minimum quantity field is required.'] });
            return;
        }

        if (form.maximum_quantity === '' || form.maximum_quantity === null) {
            setErrors({ maximum_quantity: ['The maximum quantity field is required.'] });
            return;
        }

        if (Number(form.minimum_quantity) > Number(form.maximum_quantity)) {
            setErrors({
                maximum_quantity: ['The maximum quantity must be greater than or equal to the minimum quantity.'],
            });
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        setLoadError('');

        try {
            await updateStage(id, {
                minimum_quantity: form.minimum_quantity,
                maximum_quantity: form.maximum_quantity,
            });

            toast.success('Stage updated successfully.', {
                style: { color: '#16a34a' },
            });
            navigate('/admin/stages');
        } catch (error) {
            setErrors(error.payload?.errors || {});
            if (!error.payload?.errors) {
                const message = error.message || 'Failed to update stage.';
                setLoadError(message);
                toast.error(message, { style: { color: '#dc2626' } });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading stage...</p>;
    }

    return (
        <div className="space-y-4">
            {loadError && <p className="text-sm text-destructive">{loadError}</p>}

            <EditForm
                form={form}
                stage={stage}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/admin/stages')}
                isSubmitting={isSubmitting}
                errors={errors}
            />
        </div>
    );
}