import { useRef, useState } from 'react';
import { Check, FileSpreadsheet, Save, Send, Trash2, X } from 'lucide-react';
import { readSheet } from 'read-excel-file/browser';
import { Button } from '../ui/Button';
import {
  sendBulkEmail,
} from '../../services/mailService';
import { useAppStore } from '../../store/useAppStore';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MATCH_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export const ComposerView = () => {
  const {
    composer,
    setComposerField,
    resetComposer,
    saveAsDraft,
    currentUser,
    recordSentMessages,
    showToast,
    setSmtpReady,
  } = useAppStore();

  const fileInputRef = useRef(null);
  const [importedRecipients, setImportedRecipients] = useState([]);
  const [xlsxEmailCount, setXlsxEmailCount] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [hasConfirmedOptIn, setHasConfirmedOptIn] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const manualRecipientEntries = composer.recipient
    .split(/[,\s;]+/)
    .map((recipient) => recipient.trim())
    .filter(Boolean);
  const invalidManualRecipients = manualRecipientEntries.filter(
    (recipient) => !EMAIL_PATTERN.test(recipient),
  );
  const recipients = [
    ...new Map(
      [
        ...manualRecipientEntries.filter((recipient) => EMAIL_PATTERN.test(recipient)),
        ...importedRecipients,
      ].map((recipient) => [recipient.toLowerCase(), recipient.toLowerCase()]),
    ).values(),
  ];

  const wordCount = composer.message.trim()
    ? composer.message.trim().split(/\s+/).length
    : 0;
  const charCount = composer.message.length;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImportedRecipients([]);
    setXlsxEmailCount(0);
    setSelectedFileName('');
    setFileError('');
    setHasConfirmedOptIn(false);

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setFileError('Choose an .xlsx workbook.');
      return;
    }

    try {
      const rows = await readSheet(file);
      const extractedEmails = rows.flatMap((row) =>
        row.flatMap((cell) => String(cell ?? '').match(EMAIL_MATCH_PATTERN) || []),
      );
      const uniqueEmails = [
        ...new Map(
          extractedEmails
            .filter((email) => EMAIL_PATTERN.test(email))
            .map((email) => [email.toLowerCase(), email.toLowerCase()]),
        ).values(),
      ];
      const emailCount = extractedEmails.filter((email) => EMAIL_PATTERN.test(email)).length;

      if (uniqueEmails.length === 0) {
        throw new Error('No valid email addresses were found in the first worksheet.');
      }

      setImportedRecipients(uniqueEmails);
      setXlsxEmailCount(emailCount);
      setSelectedFileName(file.name);
    } catch (error) {
      setImportedRecipients([]);
      setXlsxEmailCount(0);
      setSelectedFileName('');
      setFileError(error.message || 'The workbook could not be read.');
    }
  };

  const handleRemoveWorkbook = () => {
    setImportedRecipients([]);
    setXlsxEmailCount(0);
    setSelectedFileName('');
    setFileError('');
    setHasConfirmedOptIn(false);
  };

  const handleSend = async () => {
    if (invalidManualRecipients.length > 0) {
      showToast('error', 'Invalid recipient', 'Remove or correct the invalid email address(es).');
      return;
    }

    if (recipients.length === 0) {
      showToast('error', 'Recipient required', 'Enter at least one address or choose an .xlsx file.');
      return;
    }

    if (!hasConfirmedOptIn) {
      showToast('error', 'Confirmation required', 'Confirm that the recipients agreed to receive this email.');
      return;
    }

    setIsSending(true);

    try {
      const result = await sendBulkEmail({
        recipients,
        subject: composer.subject,
        message: composer.message,
        confirmedOptIn: hasConfirmedOptIn,
      });

      const sentRecipients = result.sentRecipients || [];
      const failedRecipients = result.failedRecipients || [];
      recordSentMessages(result.sentMessages || []);

      if (failedRecipients.length > 0) {
        setComposerField('recipient', failedRecipients.join(', '));
        setImportedRecipients([]);
        setXlsxEmailCount(0);
        setSelectedFileName('');
        setFileError('');
        setHasConfirmedOptIn(false);
        showToast(
          'error',
          'Some messages were not sent',
          `${sentRecipients.length} sent; ${failedRecipients.length} failed. Review the remaining recipients before retrying.`,
        );
        return;
      }

      resetComposer();
      setImportedRecipients([]);
      setXlsxEmailCount(0);
      setSelectedFileName('');
      setFileError('');
      setHasConfirmedOptIn(false);
      showToast('success', 'Messages sent', result.message);
    } catch (error) {
      if (error.status === 428) setSmtpReady(false);
      showToast('error', 'Send failed', error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDiscard = () => {
    resetComposer();
    setImportedRecipients([]);
    setXlsxEmailCount(0);
    setSelectedFileName('');
    setFileError('');
    setHasConfirmedOptIn(false);
  };

  const handleSaveDraft = () => {
    const recipient = [composer.recipient.trim(), ...importedRecipients]
      .filter(Boolean)
      .join(', ');
    saveAsDraft(recipient);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fbff] p-4 md:p-8 overflow-y-auto">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B2CC1]" />
            <h2 className="text-2xl font-bold text-[#091540] tracking-tight">
              New Message
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Compose and dispatch communications securely
          </p>
        </div>

        {/* Manual Save status */}
        <div className="flex items-center gap-3">
          {composer.lastSaved && (
            <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Saved at {composer.lastSaved}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={Save}
            onClick={handleSaveDraft}
          >
            Save as Draft
          </Button>
        </div>
      </div>

      {/* Main Composer Card */}
      <div className="max-w-4xl mx-auto w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-[#ABD2FA]/15 flex flex-col overflow-hidden">
        {/* Fields Container */}
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
          {/* Strictly locked "From" row */}
          <div className="flex items-center gap-3">
            <label className="w-16 text-xs font-bold uppercase tracking-wider text-slate-400">
              From
            </label>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ABD2FA]/20 border border-[#7692FF]/20 select-none">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7692FF] text-[10px] font-semibold text-white">
                {currentUser.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-xs font-semibold text-[#091540]">
                {currentUser.name}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                &lt;{currentUser.email}&gt;
              </span>
            </div>
          </div>

          <div className="h-1.5 bg-slate-100 w-full" />

          {/* Recipient ("To") */}
          <div className="flex items-start gap-3">
            <label className="w-16 text-xs font-bold uppercase tracking-wider text-slate-400">
              To
            </label>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="recipient@organization.com (separate addresses with commas)"
                  value={composer.recipient}
                  onChange={(e) => {
                    setComposerField('recipient', e.target.value);
                    setHasConfirmedOptIn(false);
                  }}
                  className="flex-1 min-w-0 text-sm font-medium text-[#091540] placeholder:text-slate-400 border-none bg-transparent focus:outline-none focus:ring-0 p-0"
                  aria-label="Email recipients"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Choose an XLSX recipient list"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-[#091540] hover:bg-slate-50 transition-colors"
                  title="Upload an XLSX file with email addresses"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">XLSX</span>
                </button>
              </div>
              {selectedFileName && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate">{selectedFileName}</span>
                  <button
                    type="button"
                    onClick={handleRemoveWorkbook}
                    className="rounded p-0.5 hover:bg-slate-100"
                    aria-label="Remove uploaded workbook"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {fileError && <p className="mt-2 text-xs text-rose-600">{fileError}</p>}
              {invalidManualRecipients.length > 0 && (
                <p className="mt-2 text-xs text-rose-600">
                  {invalidManualRecipients.length} invalid address(es) in the To field.
                </p>
              )}
              {recipients.length > 0 && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  {selectedFileName && (
                    <p className="font-semibold text-[#091540]">
                      {xlsxEmailCount} email ID{xlsxEmailCount === 1 ? '' : 's'} found in XLSX
                    </p>
                  )}
                  <label className="mt-3 flex items-start gap-2 leading-5">
                    <input
                      type="checkbox"
                      checked={hasConfirmedOptIn}
                      onChange={(event) => setHasConfirmedOptIn(event.target.checked)}
                      className="mt-1 accent-[#1B2CC1]"
                    />
                    <span>I confirm these recipients agreed to receive this email.</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="h-1.5 bg-slate-100 w-full" />

          {/* Subject Field */}
          <div className="flex items-center gap-3">
            <label className="w-16 text-xs font-bold uppercase tracking-wider text-slate-400">
              Subject
            </label>
            <input
              type="text"
              placeholder="Brief summary of your message topic"
              value={composer.subject}
              onChange={(e) => setComposerField('subject', e.target.value)}
              className="flex-1 text-sm font-semibold text-[#091540] placeholder:text-slate-400 border-none bg-transparent focus:outline-none focus:ring-0 p-0"
            />
          </div>
        </div>

        {/* Text Styling Bar */}
        <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-end flex-wrap gap-2">
          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} characters</span>
          </div>
        </div>

        {/* Spacious Textarea */}
        <div className="p-6 flex-1 min-h-3.5">
          <textarea
            rows={14}
            value={composer.message}
            onChange={(e) => setComposerField('message', e.target.value)}
            placeholder="Type your message here..."
            className="w-full h-full text-base leading-relaxed text-[#091540] placeholder:text-slate-400 bg-transparent resize-none border-none focus:outline-none focus:ring-0 p-0"
          />
        </div>

        {/* Action Bar Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              icon={Send}
              onClick={handleSend}
              disabled={isSending}
              className="w-full sm:w-auto shadow-lg shadow-[#1B2CC1]/25"
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              icon={Save}
              onClick={handleSaveDraft}
              className="w-full sm:w-auto"
            >
              Save as Draft
            </Button>
          </div>

          <div className="flex items-center justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDiscard}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Discard draft"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
