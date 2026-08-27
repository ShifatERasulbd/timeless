import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function EditForm({
    form = {},
    personalizerPrice = null,
    onChange,
    onSubmit,
    onCancel,
    isSubmitting = false,
    errors = {},
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                    <CardTitle>Edit Personalizer Price</CardTitle>
                    <CardDescription>Update the design-element area range (in square inches, width × height) and price for this tier.</CardDescription>
                </div>
                {personalizerPrice?.id && (
                    <Badge variant="secondary" className="shrink-0">
                        ID #{personalizerPrice.id}
                    </Badge>
                )}
            </CardHeader>
            <Separator />

            <form onSubmit={onSubmit}>
                <CardContent className="space-y-6 pt-6">
                    {personalizerPrice && (
                        <p className="text-sm text-muted-foreground">
                            Current range:{' '}
                            <span className="font-medium text-foreground">
                                {personalizerPrice.minimum_size}-{personalizerPrice.maximum_size} in²
                            </span>
                            {' '}at{' '}
                            <span className="font-medium text-foreground">
                                ${Number(personalizerPrice.price || 0).toFixed(2)}
                            </span>
                        </p>
                    )}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="personalizer-price-minimum-size">
                                Minimum Area (sq in) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="personalizer-price-minimum-size"
                                name="minimum_size"
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.minimum_size ?? ''}
                                onChange={onChange}
                                placeholder="e.g. 0"
                            />
                            {errors.minimum_size && (
                                <p className="text-xs text-destructive">{errors.minimum_size[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="personalizer-price-maximum-size">
                                Maximum Area (sq in) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="personalizer-price-maximum-size"
                                name="maximum_size"
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.maximum_size ?? ''}
                                onChange={onChange}
                                placeholder="e.g. 2"
                            />
                            {errors.maximum_size && (
                                <p className="text-xs text-destructive">{errors.maximum_size[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="personalizer-price-price">
                                Price <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="personalizer-price-price"
                                name="price"
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.price ?? ''}
                                onChange={onChange}
                                placeholder="e.g. 10.00"
                            />
                            {errors.price && (
                                <p className="text-xs text-destructive">{errors.price[0]}</p>
                            )}
                        </div>
                    </div>
                </CardContent>

                <Separator />

                <CardFooter className="flex justify-end gap-3 pt-6">
                    <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Updating...' : 'Update Price'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
