import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { name: "Documents", value: 45, color: "hsl(160, 84%, 39%)" },
  { name: "Images", value: 25, color: "hsl(217, 91%, 60%)" },
  { name: "Vidéos", value: 15, color: "hsl(47, 96%, 53%)" },
  { name: "Autres", value: 15, color: "hsl(280, 65%, 60%)" },
];

export default function StorageChart() {
  const totalGB = 128;
  const usedGB = 78;
  const percent = Math.round((usedGB / totalGB) * 100);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Stockage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{percent}%</span>
            <span className="text-[10px] text-muted-foreground">utilisé</span>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground text-center">
          {usedGB} Go / {totalGB} Go
        </p>
      </CardContent>
    </Card>
  );
}
