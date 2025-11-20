import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderKanban, Tag } from "lucide-react";
import ProjetsTab from "../projets/ProjetsTab";
import TypesTab from "../types/TypesTab";

const SettingsTab = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="projets" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="projets" className="gap-2">
            <FolderKanban className="w-4 h-4" />
            Projets
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-2">
            <Tag className="w-4 h-4" />
            Types
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="projets" className="mt-6">
          <ProjetsTab />
        </TabsContent>
        
        <TabsContent value="types" className="mt-6">
          <TypesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTab;
