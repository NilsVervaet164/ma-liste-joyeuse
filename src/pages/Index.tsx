import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListTodo, BarChart3, Settings, Network } from "lucide-react";
import TasksTab from "@/components/tasks/TasksTab";
import StatsTab from "@/components/stats/StatsTab";
import SettingsTab from "@/components/settings/SettingsTab";
import { CanvasTab } from "@/components/canvas/CanvasTab";

const Index = () => {
  const [activeTab, setActiveTab] = useState("tasks");

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            Visual todo
          </h1>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-card shadow-[0_2px_8px_-1px_hsl(262_60%_70%_/_0.1)] p-1 rounded-xl">
            <TabsTrigger 
              value="tasks" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
            >
              <ListTodo className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Tâches</span>
            </TabsTrigger>
            <TabsTrigger 
              value="canvas" 
              className="data-[state=active]:bg-coral data-[state=active]:text-foreground rounded-lg transition-all"
            >
              <Network className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Canvas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="data-[state=active]:bg-sky data-[state=active]:text-foreground rounded-lg transition-all"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground rounded-lg transition-all"
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" forceMount className="data-[state=inactive]:hidden">
            <TasksTab />
          </TabsContent>

          <TabsContent value="canvas" forceMount className="data-[state=inactive]:hidden">
            <CanvasTab />
          </TabsContent>

          <TabsContent value="stats" forceMount className="data-[state=inactive]:hidden">
            <StatsTab />
          </TabsContent>

          <TabsContent value="settings" forceMount className="data-[state=inactive]:hidden">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
