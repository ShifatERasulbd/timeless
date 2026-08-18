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
    stage = null,
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
                    <CardTitle>Edit Stage</CardTitle>
                    <CardDescription>Update the quantity range for this stage.</CardDescription>
                </div>
                {stage?.id && (
                    <Badge variant="secondary" className="shrink-0">
                        ID #{stage.id}
                    </Badge>
                )}
            </CardHeader>
            <Separator />

            <form onSubmit={onSubmit}>
                <CardContent className="space-y-6 pt-6">
                    {stage && (
                        <p className="text-sm text-muted-foreground">
                            Current range:{' '}
                            <span className="font-medium text-foreground">
                                {stage.minimum_quantity} – {stage.maximum_quantity}
                            </span>
                        </p>
                    )}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="stage-minimum-quantity">
                                Minimum Quantity <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="stage-minimum-quantity"
                                name="minimum_quantity"
                                type="number"
                                min={0}
                                value={form.minimum_quantity ?? ''}
                                onChange={onChange}
                                placeholder="e.g. 1"
                            />
                            {errors.minimum_quantity && (
                                <p className="text-xs text-destructive">{errors.minimum_quantity[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stage-maximum-quantity">
                                Maximum Quantity <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="stage-maximum-quantity"
                                name="maximum_quantity"
                                type="number"
                                min={0}
                                value={form.maximum_quantity ?? ''}
                                onChange={onChange}
                                placeholder="e.g. 10"
                            />
                            {errors.maximum_quantity && (
                                <p className="text-xs text-destructive">{errors.maximum_quantity[0]}</p>
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
                        {isSubmitting ? 'Updating...' : 'Update Stage'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}