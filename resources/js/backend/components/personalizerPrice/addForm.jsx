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

export default function AddForm({
    form = {},
    onChange,
    onSubmit,
    onCancel,
    isSubmitting = false,
    errors = {},
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Personalizer Price Details</CardTitle>
                <CardDescription>Define the design-element area range (in square inches, width × height) and price for this tier.</CardDescription>
            </CardHeader>
            <Separator />

            <form onSubmit={onSubmit}>
                <CardContent className="space-y-6 pt-6">
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
                        {isSubmitting ? 'Saving...' : 'Create Price'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
