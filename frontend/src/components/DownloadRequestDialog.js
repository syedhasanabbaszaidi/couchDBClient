import { useEffect, useMemo, useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  DOWNLOAD_PLATFORM_OPTIONS,
  DESKTOP_RELEASE_LABEL,
  getPlatformOption,
} from '@/lib/platform';
import {
  buildDownloadRedirectUrl,
  fetchReleaseCatalog,
  submitDownloadLead,
  trackAnalyticsEvent,
} from '@/lib/analytics';

export default function DownloadRequestDialog({
  open,
  onOpenChange,
  defaultPlatform,
  entrypoint,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(defaultPlatform);
  const [submitting, setSubmitting] = useState(false);
  const [catalog, setCatalog] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedPlatform(defaultPlatform);
    void trackAnalyticsEvent(
      'download_dialog_opened',
      { selectedPlatform: defaultPlatform },
      { entrypoint }
    );

    fetchReleaseCatalog()
      .then((result) => setCatalog(result))
      .catch(() => setCatalog(null));
  }, [defaultPlatform, entrypoint, open]);

  const selectedOption = useMemo(
    () => getPlatformOption(selectedPlatform) || DOWNLOAD_PLATFORM_OPTIONS[0],
    [selectedPlatform]
  );

  const assetInfo = catalog?.assets?.[selectedPlatform] || null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await submitDownloadLead({
        name,
        email,
        selectedPlatform,
        entrypoint,
      });

      toast.success('Download is ready. Redirecting now...');
      onOpenChange(false);
      window.location.assign(
        buildDownloadRedirectUrl({
          selectedPlatform,
          leadId: result.leadId,
          entrypoint,
        })
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        'Unable to prepare your download right now. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Download CouchDB Client Desktop</DialogTitle>
          <DialogDescription>
            Enter your name and email to access the {DESKTOP_RELEASE_LABEL} desktop build for easier daily use.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="download-name">Name</Label>
              <Input
                id="download-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Hasan Abbas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="download-email">Email</Label>
              <Input
                id="download-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="hasan@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="download-platform">Desktop build</Label>
            <select
              id="download-platform"
              value={selectedPlatform}
              onChange={(event) => setSelectedPlatform(event.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              {DOWNLOAD_PLATFORM_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">{selectedOption.helperText}</p>
            {assetInfo && (
              <p className="text-xs text-slate-500 font-mono">
                Release asset: {assetInfo.assetName}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-700" />
              <div className="space-y-1">
                <p className="font-medium text-slate-900">Privacy note</p>
                <p>
                  We store your name, email, selected platform, country if available from hosting headers,
                  and anonymous web usage events so we can understand product adoption. We do not store your
                  CouchDB URLs, usernames, or passwords server-side.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Download className="mr-2 h-4 w-4" />
              {submitting ? 'Preparing download...' : 'Download desktop app'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
