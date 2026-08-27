import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppContext } from '@/context/AppContext';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PersonalizerPriceTable from '@/components/personalizerPrice/table';

import { deletePersonalizerPrice, fetchPersonalizerPrices } from './api';

export default function PersonalizerPrices() {
    const navigate = useNavigate();
    const { setPageTitle } = useAppContext();
    const [personalizerPrices, setPersonalizerPrices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [priceToDelete, setPriceToDelete] = useState(null);

    useEffect(() => {
        setPageTitle('Personalizer Prices');
    }, [setPageTitle]);

    useEffect(() => {
        let ignore = false;

        async function loadPersonalizerPrices() {
            setIsLoading(true);
            setErrorMessage('');

            try {
                const data = await fetchPersonalizerPrices();
                if (!ignore) {
                    setPersonalizerPrices(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(error.message || 'Failed to load personalizer prices.');
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        loadPersonalizerPrices();

        return () => {
            ignore = true;
        };
    }, []);

    const handleConfirmDelete = async () => {
        if (!priceToDelete) {
            return;
        }

        const id = priceToDelete.id;
        setDeletingId(id);
        setErrorMessage('');

        try {
            await deletePersonalizerPrice(id);
            setPersonalizerPrices((previous) => previous.filter((p) => p.id !== id));
            toast.success('Personalizer price deleted successfully.', {
                style: { color: '#16a34a' },
            });
            setPriceToDelete(null);
        } catch (error) {
            const message = error.message || 'Failed to delete personalizer price.';
            setErrorMessage(message);
            toast.error(message, {
                style: { color: '#dc2626' },
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <div className="space-y-5">
                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
                    <PersonalizerPriceTable
                        personalizerPrices={personalizerPrices}
                        isLoading={isLoading}
                        deletingId={deletingId}
                        onAdd={() => navigate('/admin/personalizer-prices/add')}
                        onEdit={(id) => navigate(`/admin/personalizer-prices/${id}/edit`)}
                        onRequestDelete={setPriceToDelete}
                    />
                </div>

                <AlertDialog
                    open={Boolean(priceToDelete)}
                    onOpenChange={(open) => !open && setPriceToDelete(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Personalizer Price</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete the price tier{' '}
                                <strong>
                                    {priceToDelete?.minimum_size}-{priceToDelete?.maximum_size} in²
                                </strong>
                                ? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deletingId !== null}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                disabled={deletingId !== null}
                                onClick={handleConfirmDelete}
                            >
                                {deletingId !== null ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
}
