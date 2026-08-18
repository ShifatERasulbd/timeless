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
import StageTable from '@/components/stage/table';

import { deleteStage, fetchStages } from './api';

export default function Stages() {
    const navigate = useNavigate();
    const { setPageTitle } = useAppContext();
    const [stages, setStages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [stageToDelete, setStageToDelete] = useState(null);

    useEffect(() => {
        setPageTitle('Stages');
    }, [setPageTitle]);

    useEffect(() => {
        let ignore = false;

        async function loadStages() {
            setIsLoading(true);
            setErrorMessage('');

            try {
                const data = await fetchStages();
                if (!ignore) {
                    setStages(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(error.message || 'Failed to load stages.');
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        loadStages();

        return () => {
            ignore = true;
        };
    }, []);

    const handleConfirmDelete = async () => {
        if (!stageToDelete) {
            return;
        }

        const id = stageToDelete.id;
        setDeletingId(id);
        setErrorMessage('');

        try {
            await deleteStage(id);
            setStages((previous) => previous.filter((s) => s.id !== id));
            toast.success('Stage deleted successfully.', {
                style: { color: '#16a34a' },
            });
            setStageToDelete(null);
        } catch (error) {
            const message = error.message || 'Failed to delete stage.';
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
                    <StageTable
                        stages={stages}
                        isLoading={isLoading}
                        deletingId={deletingId}
                        onAdd={() => navigate('/admin/stages/add')}
                        onEdit={(id) => navigate(`/admin/stages/${id}/edit`)}
                        onRequestDelete={setStageToDelete}
                    />
                </div>

                <AlertDialog
                    open={Boolean(stageToDelete)}
                    onOpenChange={(open) => !open && setStageToDelete(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete the stage{' '}
                                <strong>
                                    {stageToDelete?.minimum_quantity} – {stageToDelete?.maximum_quantity}
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