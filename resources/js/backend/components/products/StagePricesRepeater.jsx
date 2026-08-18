import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STATUS_OPTIONS = ['User', 'Guest'];

function fieldError(errors, index, field) {
    const value = errors?.[`stage_prices.${index}.${field}`];
    return Array.isArray(value) ? value[0] : '';
}

export default function StagePricesRepeater({
    value = [],
    stages = [],
    errors = {},
    disabled = false,
    onChange,
}) {
    const rows = Array.isArray(value) ? value : [];

    function updateRows(nextRows) {
        onChange?.({ target: { name: 'stage_prices', value: nextRows } });
    }

    function updateRow(index, field, nextValue) {
        updateRows(rows.map((row, rowIndex) => (
            rowIndex === index ? { ...row, [field]: nextValue } : row
        )));
    }

    function addRow() {
        updateRows([...rows, { stage_id: '', status: 'User', price: '' }]);
    }

    return (
        <div className="space-y-3 rounded-md border bg-muted/20 p-3 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <Label className="text-sm font-semibold">Price Variations</Label>
                    <p className="text-xs text-muted-foreground">Set a price for a quantity stage and customer status.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={disabled || stages.length === 0}>
                    <Plus className="size-3.5" />
                    Add Price
                </Button>
            </div>

            {stages.length === 0 ? (
                <p className="text-xs text-muted-foreground">Create a stage before adding price variations.</p>
            ) : null}

            {Array.isArray(errors?.stage_prices) ? (
                <p className="text-xs text-destructive">{errors.stage_prices[0]}</p>
            ) : null}

            {rows.map((row, index) => {
                const duplicate = rows.some((candidate, candidateIndex) => (
                    candidateIndex !== index
                    && String(candidate.stage_id) === String(row.stage_id)
                    && candidate.status === row.status
                ));

                return (
                    <div key={index} className="grid grid-cols-1 gap-3 rounded-md border bg-background p-3 md:grid-cols-[1fr_180px_180px_auto] md:items-start">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Stage</Label>
                            <select
                                value={row.stage_id ?? ''}
                                onChange={(event) => updateRow(index, 'stage_id', event.target.value)}
                                disabled={disabled}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="">Select stage</option>
                                {stages.map((stage) => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.minimum_quantity} - {stage.maximum_quantity}
                                    </option>
                                ))}
                            </select>
                            {fieldError(errors, index, 'stage_id') ? <p className="text-xs text-destructive">{fieldError(errors, index, 'stage_id')}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Status</Label>
                            <select
                                value={row.status || 'User'}
                                onChange={(event) => updateRow(index, 'status', event.target.value)}
                                disabled={disabled}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                            {fieldError(errors, index, 'status') ? <p className="text-xs text-destructive">{fieldError(errors, index, 'status')}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Variation Price</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.price ?? ''}
                                onChange={(event) => updateRow(index, 'price', event.target.value)}
                                disabled={disabled}
                                placeholder="0.00"
                            />
                            {fieldError(errors, index, 'price') ? <p className="text-xs text-destructive">{fieldError(errors, index, 'price')}</p> : null}
                        </div>

                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => updateRows(rows.filter((_, rowIndex) => rowIndex !== index))}
                            disabled={disabled}
                            className="text-destructive hover:text-destructive md:mt-6"
                            aria-label={`Remove price variation ${index + 1}`}
                        >
                            <Trash2 className="size-4" />
                        </Button>

                        {duplicate ? <p className="text-xs text-destructive md:col-span-4">This stage and status combination is already added.</p> : null}
                    </div>
                );
            })}
        </div>
    );
}