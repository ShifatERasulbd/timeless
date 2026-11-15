import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAppContext } from '@/context/AppContext';

import { fetchOrder, updateOrder } from './api';
import {
    ORDER_STATUSES,
    StatusBadge,
    customerName,
    formatCurrency,
    formatDate,
    selectClass,
    variantSummary,
} from './shared';

function DetailRow({ label, children }) {
    return (
        <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium break-words">{children || '-'}</span>
        </div>
    );
}

export default function ViewOrder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setPageTitle } = useAppContext();

    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [status, setStatus] = useState('');
    const [isSavingStatus, setIsSavingStatus] = useState(false);

    useEffect(() => {
        setPageTitle('View Order');
    }, [setPageTitle]);

    useEffect(() => {
        let ignore = false;

        setIsLoading(true);
        fetchOrder(id)
            .then((data) => {
                if (ignore) return;
                setOrder(data);
                setStatus(data?.status || 'pending');
            })
            .catch((error) => {
                if (!ignore) setErrorMessage(error.message || 'Failed to load order details.');
            })
            .finally(() => {
                if (!ignore) setIsLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, [id]);

    async function saveStatus() {
        setIsSavingStatus(true);

        try {
            const updated = await updateOrder(id, { status });
            setOrder(updated);
            toast.success('Order status updated.', { style: { color: '#16a34a' } });
        } catch (error) {
            toast.error(error.message || 'Failed to update status.', { style: { color: '#dc2626' } });
        } finally {
            setIsSavingStatus(false);
        }
    }

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading order details...</p>;
    }

    if (!order) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-destructive">{errorMessage || 'Order not found.'}</p>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/orders')}>
                    Back to Orders
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">Order {order.order_number}</h2>
                        <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Placed {formatDate(order.created_at)} · Last updated {formatDate(order.updated_at)}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/orders')}>
                        Back
                    </Button>
                    <Button type="button" onClick={() => navigate(`/admin/orders/${order.id}/edit`)}>
                        Edit Order
                    </Button>
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Label htmlFor="order-quick-status">Order status</Label>
                        <select
                            id="order-quick-status"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            disabled={isSavingStatus}
                            className={selectClass}
                        >
                            {ORDER_STATUSES.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <Button
                            type="button"
                            className="w-full"
                            onClick={saveStatus}
                            disabled={isSavingStatus || status === order.status}
                        >
                            {isSavingStatus ? 'Saving...' : 'Update Status'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Customer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <DetailRow label="Name">{customerName(order)}</DetailRow>
                        <DetailRow label="Company">{order.company_name}</DetailRow>
                        <DetailRow label="Email">
                            {order.email ? <a href={`mailto:${order.email}`} className="underline-offset-4 hover:underline">{order.email}</a> : null}
                        </DetailRow>
                        <DetailRow label="Phone">
                            {order.phone ? <a href={`tel:${order.phone}`} className="underline-offset-4 hover:underline">{order.phone}</a> : null}
                        </DetailRow>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <address className="text-sm leading-relaxed not-italic">
                            {customerName(order)}
                            {order.company_name ? <><br />{order.company_name}</> : null}
                            <br />
                            {order.street_address}
                            {order.apartment ? `, ${order.apartment}` : ''}
                            <br />
                            {order.city}, {order.state} {order.zip}
                            <br />
                            {order.country}
                        </address>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Image</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Line Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="h-14 w-12 rounded-md border object-cover" />
                                        ) : (
                                            <div className="h-14 w-12 rounded-md border bg-muted" />
                                        )}
                                    </TableCell>
                                    <TableCell className="whitespace-normal">
                                        <div className="font-medium">{item.name}</div>
                                        {variantSummary(item) ? (
                                            <div className="text-xs text-muted-foreground">{variantSummary(item)}</div>
                                        ) : null}
                                        {item.design?.unit_price ? (
                                            <div className="text-xs text-muted-foreground">
                                                Includes {formatCurrency(item.design.unit_price)} / unit design charge
                                            </div>
                                        ) : null}
                                        {item.product_id ? (
                                            <div className="text-xs text-muted-foreground">Product ID: {item.product_id}</div>
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(item.line_total)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={4} className="text-right text-muted-foreground">Subtotal</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCurrency(order.subtotal)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={4} className="text-right text-muted-foreground">Shipping</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCurrency(order.shipping)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={4} className="text-right text-muted-foreground">Tax</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCurrency(order.tax)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={4} className="text-right font-semibold">Total</TableCell>
                                <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(order.total)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-line text-muted-foreground">{order.notes || 'No notes from the customer.'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Admin Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-line text-muted-foreground">{order.admin_notes || 'No internal notes yet.'}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
