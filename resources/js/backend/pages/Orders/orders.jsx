import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAppContext } from '@/context/AppContext';

import { fetchOrders } from './api';
import {
    ORDER_STATUSES,
    StatusBadge,
    customerName,
    formatCurrency,
    formatDate,
    selectClass,
} from './shared';

function matchesSearch(order, term) {
    if (!term) return true;

    return [order.order_number, customerName(order), order.email, order.phone, order.company_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
}

export default function Orders() {
    const navigate = useNavigate();
    const { setPageTitle } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        setPageTitle('Orders');
    }, [setPageTitle]);

    useEffect(() => {
        let ignore = false;

        fetchOrders()
            .then((data) => {
                if (!ignore) setOrders(data);
            })
            .catch((error) => {
                if (!ignore) setErrorMessage(error.message || 'Failed to load orders.');
            })
            .finally(() => {
                if (!ignore) setIsLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, []);

    const statusCounts = useMemo(() => (
        orders.reduce((counts, order) => ({ ...counts, [order.status]: (counts[order.status] || 0) + 1 }), {})
    ), [orders]);

    const visibleOrders = useMemo(() => {
        const term = search.trim().toLowerCase();
        return orders.filter((order) => (!statusFilter || order.status === statusFilter) && matchesSearch(order, term));
    }, [orders, search, statusFilter]);

    return (
        <div className="space-y-5">
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

            <Card>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative sm:max-w-sm sm:flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search order #, customer, email, phone"
                                aria-label="Search orders"
                                className="pl-9"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            aria-label="Filter by status"
                            className={`${selectClass} sm:w-52`}
                        >
                            <option value="">All statuses ({orders.length})</option>
                            {ORDER_STATUSES.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label} ({statusCounts[status.value] || 0})
                                </option>
                            ))}
                        </select>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Placed</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        Loading orders...
                                    </TableCell>
                                </TableRow>
                            ) : visibleOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        {orders.length === 0 ? 'No orders yet.' : 'No orders match your filters.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visibleOrders.map((order) => (
                                    <TableRow
                                        key={order.id}
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                                    >
                                        <TableCell className="font-medium">{order.order_number}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{customerName(order)}</div>
                                            <div className="text-xs text-muted-foreground">{order.email || order.phone}</div>
                                        </TableCell>
                                        <TableCell>
                                            {order.units} {order.units === 1 ? 'unit' : 'units'}
                                            <span className="text-muted-foreground"> · {order.items.length} {order.items.length === 1 ? 'line' : 'lines'}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium tabular-nums">{formatCurrency(order.total)}</TableCell>
                                        <TableCell><StatusBadge status={order.status} /></TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        navigate(`/admin/orders/${order.id}`);
                                                    }}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        navigate(`/admin/orders/${order.id}/edit`);
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
