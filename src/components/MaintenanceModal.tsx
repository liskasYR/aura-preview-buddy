import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const MaintenanceModal = ({ isOpen, onClose }: MaintenanceModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border" dir="rtl">
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          
          <h2 className="text-xl font-bold text-foreground">
            הבינה המלאכותית בתחזוקה
          </h2>
          
          <p className="text-muted-foreground max-w-sm">
            אנחנו עובדים על שיפורים חשובים. השירות יחזור לפעול בקרוב.
          </p>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>תחזוקה בתהליך...</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceModal;
