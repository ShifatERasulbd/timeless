import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAppContext } from '@/context/AppContext';

import { fetchOrder, updateOrder } from './api';
import {
    ORDER_STATUSES,
    firstFieldErrors,
    formatCurrency,
    selectClass,
    textareaClass,
    variantSummary,
} from './shared';

const CUSTOMER_FIELDS = [
    { name: 'first_name', label: 'First name', required: true },
    { name: 'last_name', label: 'Last name', required: true },
    { name: 'company_name', label: 'Company name' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'tel', required: true },
];

const ADDRESS_FIELDS = [
    { name: 'street_address', label: 'Street address', required: true, wide: true },
    { name: 'apartment', label: 'Apartment, suite, unit', wide: true },
    { name: 'city', label: 'Town / City', required: true },
    { name: 'state', label: 'State', required: true },
    { name: 'zip', label: 'ZIP code', required: true },
    { name: 'country', label: 'Country / Region', required: true },
];

function toForm(order) {
    const text = (value) => value ?? '';

    return {
        status: order.status || 'pending',
        ...Object.fromEntries([...CUSTOMER_FIELDS, ...ADDRESS_FIELDS].map(({ name }) => [name, text(order[name])])),
        notes: text(order.notes),
        admin_notes: text(order.admin_notes),
        shipping: String(order.shipping ?? 0),
        items: order.items.map((item) => ({
            ...item,
            color: text(item.color),
            size: text(item.size),
            price: String(item.price),
            quantity: String(item.quantity),
        })),
    };
}

// Same arithmetic as Order::calculateTotals() so the preview matches what gets saved.
function previewTotals(items, shippingValue, taxRate) {
    const subtotal = Number(items.reduce((sum, item) => (
        sum + Math.round((Number(item.price) || 0) * 100) / 100 * (parseInt(item.quantity, 10) || 0)
    ), 0).toFixed(2));
    const shipping = Number(shippingValue) || 0;
    const tax = Number((subtotal * taxRate).toFixed(2));
    const total = subtotal > 0 ? subtotal + shipping + tax : 0;

    return { subtotal, shipping, tax, total };
}

function FieldError({ message }) {
    return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function TextField({ field, value, error, onChange }) {
    const id = `order-${field.name}`;

    return (
        <div className={`space-y-2 ${field.wide ? 'sm:col-span-2' : ''}`}>
            <Label htmlFor={id}>
                {field.label} {field.required ? <span className="text-destructive">*</span> : null}
            </Label>
            <Input
                id={id}
                name={field.name}
                type={field.type || 'text'}
                value={value}
                required={field.required}
                aria-invalid={error ? 'true' : undefined}
                onChange={(event) => onChange(field.name, event.target.value)}
            />
            <FieldError message={error} />
        </div>
    );
}

export default function EditOrder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setPageTitle } = useAppContext();

    const [order, setOrder] = useState(null);
    const [form, setForm] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setPageTitle('Edit Order');
    }, [setPageTitle]);

    useEffect(() => {
        let ignore = false;

        setIsLoading(true);
        fetchOrder(id)
            .then((data) => {
                if (ignore) return;
                setOrder(data);
                setForm(toForm(data));
            })
            .catch((error) => {
                if (!ignore) setErrorMessage(error.message || 'Failed to load order.');
            })
            .finally(() => {
                if (!ignore) setIsLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, [id]);

    const taxRate = Number(order?.tax_rate ?? 0.1);
    const totals = useMemo(
        () => (form ? previewTotals(form.items, form.shipping, taxRate) : null),
        [form, taxRate]
    );

    function setField(name, value) {
        setForm((previous) => ({ ...previous, [name]: value }));
    }

    function setItemField(index, name, value) {
        setForm((previous) => ({
            ...previous,
            items: previous.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [name]: value } : item)),
        }));
    }

    function removeItem(index) {
        setForm((previous) => ({ ...previous, items: previous.items.filter((_, itemIndex) => itemIndex !== index) }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setIsSubmitting(true);
        setErrorMessage('');
        setErrors({});

        const { items, shipping, ...fields } = form;

        try {
            await updateOrder(id, {
                ...fields,
                shipping: Math.max(0, Number(shipping) || 0),
                items: items.map((item) => ({
                    id: item.id,
                    color: item.color,
                    size: item.size,
                    price: Math.max(0, Number(item.price) || 0),
                    quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
                })),
            });

            toast.success('Order updated successfully.', { style: { color: '#16a34a' } });
            navigate(`/admin/orders/${id}`);
        } catch (error) {
            setErrors(firstFieldErrors(error));
            const message = error.status === 422 ? 'Please fix the highlighted fields.' : error.message || 'Failed to update order.';
            setErrorMessage(message);
            toast.error(message, { style: { color: '#dc2626' } });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading order...</p>;
    }

    if (!form) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-destructive">{errorMessage || 'Order not found.'}</p>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/orders')}>
                    Back to Orders
                </Button>
            </div>
        );
    }

    const removedCount = order.items.length - form.items.length;

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold">Edit Order {order.order_number}</h2>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => navigate(`/admin/orders/${id}`)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Update Order'}
                    </Button>
                </div>
            </div>

            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-5">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {CUSTOMER_FIELDS.map((field) => (
                                <TextField key={field.name} field={field} value={form[field.name]} error={errors[field.name]} onChange={setField} />
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {ADDRESS_FIELDS.map((field) => (
                                <TextField key={field.name} field={field} value={form[field.name]} error={errors[field.name]} onChange={setField} />
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="w-28">Colour</TableHead>
                                        <TableHead className="w-24">Size</TableHead>
                                        <TableHead className="w-28">Unit Price</TableHead>
                                        <TableHead className="w-24">Qty</TableHead>
                                        <TableHead className="text-right">Line Total</TableHead>
                                        <TableHead className="w-12"><span className="sr-only">Remove</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.items.map((item, index) => {
                                        const lineTotal = (Number(item.price) || 0) * (parseInt(item.quantity, 10) || 0);
                                        const lineError = errors[`items.${index}.price`] || errors[`items.${index}.quantity`]
                                            || errors[`items.${index}.color`] || errors[`items.${index}.size`];

                                        return (
                                            <TableRow key={item.id} className="align-top">
                                                <TableCell className="whitespace-normal">
                                                    <div className="flex items-center gap-3">
                                                        {item.image ? (
                                                            <img src={item.image} alt="" className="h-12 w-10 shrink-0 rounded border object-cover" />
                                                        ) : null}
                                                        <div className="min-w-0">
                                                            <div className="font-medium">{item.name}</div>
                                                            {item.design ? (
                                                                <div className="text-xs text-muted-foreground">{variantSummary({ design: item.design })}</div>
                                                            ) : null}
                                                            <FieldError message={lineError} />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        aria-label={`Colour for ${item.name}`}
                                                        value={item.color}
                                                        onChange={(event) => setItemField(index, 'color', event.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        aria-label={`Size for ${item.name}`}
                                                        value={item.size}
                                                        onChange={(event) => setItemField(index, 'size', event.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        aria-label={`Unit price for ${item.name}`}
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        required
                                                        value={item.price}
                                                        onChange={(event) => setItemField(index, 'price', event.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        aria-label={`Quantity for ${item.name}`}
                                                        type="number"
                                                        min={1}
                                                        step={1}
                                                        required
                                                        value={item.quantity}
                                                        onChange={(event) => setItemField(index, 'quantity', event.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="pt-4 text-right font-medium tabular-nums">{formatCurrency(lineTotal)}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Remove ${item.name}`}
                                                        title={form.items.length === 1 ? 'An order needs at least one item' : `Remove ${item.name}`}
                                                        disabled={form.items.length === 1}
                                                        onClick={() => removeItem(index)}
                                                        className="text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            {removedCount > 0 ? (
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    <span>
                                        {removedCount} {removedCount === 1 ? 'item' : 'items'} will be removed when you save.
                                    </span>
                                    <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setField('items', toForm(order).items)}>
                                        Undo
                                    </Button>
                                </div>
                            ) : null}
                            <FieldError message={errors.items} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-5">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Label htmlFor="order-status">Order status</Label>
                            <select
                                id="order-status"
                                value={form.status}
                                onChange={(event) => setField('status', event.target.value)}
                                className={selectClass}
                            >
                                {ORDER_STATUSES.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <FieldError message={errors.status} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Totals</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="tabular-nums">{formatCurrency(totals.subtotal)}</span>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order-shipping">Shipping</Label>
                                <Input
                                    id="order-shipping"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    required
                                    value={form.shipping}
                                    onChange={(event) => setField('shipping', event.target.value)}
                                />
                                <FieldError message={errors.shipping} />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax ({Math.round(taxRate * 100)}% of subtotal)</span>
                                <span className="tabular-nums">{formatCurrency(totals.tax)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-3 text-base font-semibold">
                                <span>Total</span>
                                <span className="tabular-nums">{formatCurrency(totals.total)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="order-notes">Customer notes</Label>
                                <textarea
                                    id="order-notes"
                                    rows={3}
                                    maxLength={2000}
                                    value={form.notes}
                                    onChange={(event) => setField('notes', event.target.value)}
                                    className={textareaClass}
                                />
                                <FieldError message={errors.notes} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order-admin-notes">Admin notes (internal)</Label>
                                <textarea
                                    id="order-admin-notes"
                                    rows={4}
                                    maxLength={5000}
                                    value={form.admin_notes}
                                    onChange={(event) => setField('admin_notes', event.target.value)}
                                    placeholder="Tracking number, payment reference, follow-ups…"
                                    className={textareaClass}
                                />
                                <FieldError message={errors.admin_notes} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
