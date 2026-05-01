import { useState } from 'react';
import { Download, Info, Menu, Settings, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DownloadRequestDialog from '@/components/DownloadRequestDialog';
import { DESKTOP_RELEASE_LABEL, detectRecommendedDownloadPlatform } from '@/lib/platform';
import { isDesktopRuntime } from '@/lib/runtime';

export default function ProductActions({ entrypointPrefix, compact = false }) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadPlatform, setDownloadPlatform] = useState(detectRecommendedDownloadPlatform());
  const desktopRuntime = isDesktopRuntime();

  const openDownload = (platform = detectRecommendedDownloadPlatform()) => {
    setDownloadPlatform(platform);
    setDownloadOpen(true);
  };

  return (
    <>
      {!desktopRuntime && (
        <Button
          variant="outline"
          size={compact ? 'sm' : 'default'}
          onClick={() => openDownload()}
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        >
          <Download className="mr-2 h-4 w-4" />
          Download App
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={compact ? 'sm' : 'default'}
            className="text-slate-600 hover:text-slate-900"
          >
            <Menu className="mr-2 h-4 w-4" />
            Menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {!desktopRuntime && (
            <DropdownMenuItem onSelect={() => openDownload()}>
              <Download className="h-4 w-4" />
              Download Desktop App
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setAboutOpen(true)}>
            <Info className="h-4 w-4" />
            About
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setAboutOpen(true)} className="text-slate-500">
            Built by Hasan Abbas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading">About CouchDB Client</DialogTitle>
            <DialogDescription>
              A focused CouchDB workspace for browsing databases, searching documents, and editing JSON with less friction.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-slate-600">
            <p>
              CouchDB Client is designed and built by <span className="font-medium text-slate-900">Hasan Abbas</span>.
              The web app gives you instant access in the browser, while the desktop apps provide easier repeat access
              on macOS and Windows.
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Desktop release</p>
              <p className="mt-1">Current desktop release: {DESKTOP_RELEASE_LABEL}</p>
              {!desktopRuntime && (
                <p className="mt-2">
                  If you are already working in the web app, use the <span className="font-medium">Download App</span>
                  button for quicker daily access on your machine.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Settings & Privacy</DialogTitle>
            <DialogDescription>
              Browser-side preferences and the product settings that matter for this release.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Local data</p>
              <p className="mt-1">
                Saved connections, recent databases, and recent documents stay in your browser through IndexedDB so you can
                get back to work quickly.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-700" />
                <div>
                  <p className="font-medium text-slate-900">Usage analytics</p>
                  <p className="mt-1">
                    {desktopRuntime
                      ? 'This local desktop build does not send usage analytics. Saved connections, recent items, and tab state stay on this machine.'
                      : 'The web app records minimal events such as page visits, download requests, and anonymous connection outcomes. It does not store CouchDB credentials or server URLs in backend analytics.'}
                  </p>
                </div>
              </div>
            </div>

            {!desktopRuntime && (
              <p>
                Prefer a dedicated desktop workflow? Use the <span className="font-medium">Download App</span> button from
                this menu for Apple Silicon Mac, Intel Mac, or Windows builds.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {!desktopRuntime && (
        <DownloadRequestDialog
          open={downloadOpen}
          onOpenChange={setDownloadOpen}
          defaultPlatform={downloadPlatform}
          entrypoint={`${entrypointPrefix}-download`}
        />
      )}
    </>
  );
}
