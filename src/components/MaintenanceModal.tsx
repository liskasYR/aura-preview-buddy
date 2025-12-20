import { Dialog, DialogContent } from "@/components/ui/dialog";
import detaLogo from "@/assets/deta-logo.png";

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const MaintenanceModal = ({ isOpen, onClose }: MaintenanceModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border" dir="rtl">
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          {/* Rotating Deta Logo */}
          <div className="flex flex-col items-center gap-2">
            <img 
              src={detaLogo} 
              alt="Deta Logo" 
              className="w-16 h-16 animate-spin"
              style={{ animationDuration: '3s' }}
            />
            <span className="text-lg font-bold text-foreground">Deta</span>
          </div>
          
          <h2 className="text-xl font-bold text-foreground">
            נגמר ה-AI Balance!
          </h2>
          
          <p className="text-muted-foreground max-w-sm leading-relaxed">
            יצאנו לחופשה בינתיים, אבל אנחנו חוזרים עם המודל החדש <span className="font-bold text-primary">LPT-5.5</span> שתגידו "לא היינו"
          </p>
          
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>אנחנו תמיד פה 💜</span>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            חוזרים ב-1/1/26
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceModal;
