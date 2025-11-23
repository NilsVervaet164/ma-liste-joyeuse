import { FolderKanban } from "lucide-react";
import ProjetsTab from "../projets/ProjetsTab";

const SettingsTab = () => {
  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <FolderKanban className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">Projets</h2>
        </div>
        <ProjetsTab />
      </div>
    </div>
  );
};

export default SettingsTab;
