import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ListTodo, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const StatsTab = () => {
  const [stats, setStats] = useState({
    active: 0,
    today: 0,
    thisMonth: 0,
    thisYear: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    // Active tasks
    const { count: active } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('completed', false);

    // Completed today
    const { count: today } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true)
      .gte('completed_at', startOfDay);

    // Completed this month
    const { count: thisMonth } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true)
      .gte('completed_at', startOfMonth);

    // Completed this year
    const { count: thisYear } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true)
      .gte('completed_at', startOfYear);

    setStats({
      active: active || 0,
      today: today || 0,
      thisMonth: thisMonth || 0,
      thisYear: thisYear || 0,
    });

    // Prepare chart data
    setChartData([
      { name: "Aujourd'hui", value: today || 0 },
      { name: "Ce mois", value: thisMonth || 0 },
      { name: "Cette année", value: thisYear || 0 },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-soft border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches actives</CardTitle>
            <ListTodo className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="card-soft border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complétées aujourd'hui</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.today}</div>
          </CardContent>
        </Card>

        <Card className="card-soft border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
            <Calendar className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.thisMonth}</div>
          </CardContent>
        </Card>

        <Card className="card-soft border-l-4 border-l-sky">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette année</CardTitle>
            <TrendingUp className="h-4 w-4 text-sky" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky">{stats.thisYear}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-soft">
        <CardHeader>
          <CardTitle>Tâches complétées</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsTab;
