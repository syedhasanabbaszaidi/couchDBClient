import { useState } from 'react';
import { Apple, Laptop, MonitorDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DownloadRequestDialog from '@/components/DownloadRequestDialog';
import { DESKTOP_RELEASE_LABEL } from '@/lib/platform';
import { isDesktopRuntime } from '@/lib/runtime';

export default function DesktopDownloadCallout({ entrypointPrefix }) {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadPlatform, setDownloadPlatform] = useState('mac-arm64');

  if (isDesktopRuntime()) {
    return null;
  }

  const openForPlatform = (platform) => {
    setDownloadPlatform(platform);
    setDownloadOpen(true);
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-orange-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-slate-900 p-2">
            <Laptop className="h-5 w-5 text-white" />
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-semibold text-slate-900 font-heading">Prefer the desktop app?</p>
              <p className="text-sm text-slate-600">
                Download {DESKTOP_RELEASE_LABEL} for easier repeat access on macOS or Windows. Built by{' '}
                <a
                  href="https://hasanabbas.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  https://hasanabbas.in
                </a>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 bg-white"
                onClick={() => openForPlatform('mac-arm64')}
              >
                <Apple className="mr-2 h-4 w-4" />
                Download for macOS
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 bg-white"
                onClick={() => openForPlatform('windows-x64-installer')}
              >
                <MonitorDown className="mr-2 h-4 w-4" />
                Download for Windows
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              We ask for your name and email before download so we can track desktop interest and product adoption.
            </p>
          </div>
        </div>
      </div>

      <DownloadRequestDialog
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        defaultPlatform={downloadPlatform}
        entrypoint={`${entrypointPrefix}-callout`}
      />
    </>
  );
}
