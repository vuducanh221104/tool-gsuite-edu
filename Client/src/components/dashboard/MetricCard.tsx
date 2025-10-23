import { Card, CardContent, CardHeader, CardTitle } from '@Client/components/ui/card';

type Props = {
  title: string;
  value: string;
  delta?: string;
  subtitle?: string;
};

export function MetricCard({ title, value, delta, subtitle }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {delta && <div className="text-xs text-muted-foreground mt-1">{delta}</div>}
        {subtitle && <div className="text-xs text-muted-foreground mt-2">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}


