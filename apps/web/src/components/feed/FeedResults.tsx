import type { FeedRation } from '@istock/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeedResultsProps {
  result: FeedRation | null;
}

export function FeedResults({ result }: FeedResultsProps) {
  if (!result) {
    return null;
  }

  return (
    <Card className="mt-6 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold">Optimization Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-5 shadow-sm">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Total Cost per Unit:
            </span>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              ${result.cost.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4 text-foreground">Ration Breakdown</h3>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rations.map((ration, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {ration.ingredientName}
                  </TableCell>
                  <TableCell className="text-right">
                    {ration.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

