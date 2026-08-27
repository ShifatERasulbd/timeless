import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function formatPrice(price) {
    const numeric = Number(price || 0);
    return `$${numeric.toFixed(2)}`;
}

export default function PersonalizerPriceTable({
    personalizerPrices = [],
    onAdd,
    onEdit,
    onRequestDelete,
    deletingId,
    isLoading,
}) {
    const [search, setSearch] = useState('');

    const filtered = personalizerPrices.filter((item) => {
        const q = search.trim();
        if (!q) return true;
        return (
            String(item.minimum_size).includes(q) ||
            String(item.maximum_size).includes(q) ||
            String(item.price).includes(q)
        );
    });

    return (
        <>
            <div className="flex items-center gap-3 justify-between">
                <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search personalizer prices..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9"
                    />
                </div>
                <Button className="gap-2" onClick={onAdd}>
                    <Plus />
                    Add Price
                </Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">SL No</TableHead>
                            <TableHead>Area Range (sq in)</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    Loading personalizer prices...
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading && personalizerPrices.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No personalizer prices found.
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading && filtered.length === 0 && personalizerPrices.length > 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No personalizer prices match your search.
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading &&
                            filtered.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{item.minimum_size}-{item.maximum_size} in²</TableCell>
                                    <TableCell>{formatPrice(item.price)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Edit personalizer price ${item.id}`}
                                                onClick={() => onEdit?.(item.id)}
                                            >
                                                <Pencil />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Delete personalizer price ${item.id}`}
                                                onClick={() => onRequestDelete?.(item)}
                                                disabled={deletingId === item.id}
                                            >
                                                <Trash2 className="text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </Card>
        </>
    );
}
