"use client";

import { useCartStore } from "@/hooks/useCartStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function TenantSwitchDialog() {
  const pendingItem = useCartStore((s) => s.pendingItem);
  const confirmTenantSwitch = useCartStore((s) => s.confirmTenantSwitch);
  const cancelTenantSwitch = useCartStore((s) => s.cancelTenantSwitch);

  return (
    <Dialog open={!!pendingItem} onOpenChange={(open) => !open && cancelTenantSwitch()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Ganti stan?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Keranjang kamu berisi pesanan dari stan lain. Ganti ke stan{" "}
            <span className="font-bold text-foreground">
              {pendingItem?.tenantName}
            </span>
            ? Pesanan sebelumnya akan dihapus.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={cancelTenantSwitch}
          >
            Batal
          </Button>
          <Button
            className="flex-1 rounded-full"
            onClick={confirmTenantSwitch}
          >
            Ya, Ganti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
