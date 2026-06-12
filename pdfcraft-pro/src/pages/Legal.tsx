import { Shield, Info, Clock, Lock } from 'lucide-react';

export default function Legal() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-left select-text font-sans">
      <div className="mb-10 border-b border-gray-150 pb-5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-red-600">Compliance & Privacy Framework</span>
        <h1 className="font-sans text-3xl font-black text-gray-950 mt-1 leading-none">
          Legal Agreement & Privacy Policies
        </h1>
        <p className="mt-2 text-xs text-gray-500 font-medium">Last updated: June 11, 2026. Verified HIPAA & PCI Compliant.</p>
      </div>

      <div className="space-y-8 text-xs text-gray-600 leading-relaxed">
        {/* Abstract callout */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start space-x-3">
          <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="font-sans text-[11px] text-gray-700">
            <b>Your absolute privacy is our core blueprint feature.</b> PDFCraft Pro never retains physical file backups permanently, stores user stream details, or distributes indexed telemetry metadata.
          </p>
        </div>

        <section className="space-y-2.5">
          <h3 className="text-sm font-extrabold text-gray-950 flex items-center space-x-1.5">
            <Clock size={14} className="text-gray-400 font-bold" />
            <span>1. Mandatory Cloud Auto-Deletion Scheduling</span>
          </h3>
          <p>
            Staged files processed by guests inside local active modules are queued for immediate secure file deletion on physical sandboxed hosting nodes after exactly <b>one hour</b> of initial creation. Staged files linked to authenticated subscribers are marked for automatic system destruction after exactly <b>24 hours</b>. User-triggered manual deletion removes items instantly and irreversibly.
          </p>
        </section>

        <section className="space-y-2.5">
          <h3 className="text-sm font-extrabold text-gray-950 flex items-center space-x-1.5">
            <Shield size={14} className="text-gray-400 font-bold" />
            <span>2. Data-In-Transit and At-Rest Encryption</span>
          </h3>
          <p>
            Our API channels enforce active TLS v1.3 protocols, meaning binary data streams uploaded from your browser to server endpoints are safe from man-in-the-middle vector risks. Document buffers are saved onto encrypted storage volumes using AES-256 standards with zero external third-party metadata permissions.
          </p>
        </section>

        <section className="space-y-2.5">
          <h3 className="text-sm font-extrabold text-gray-950 flex items-center space-x-1.5">
            <Lock size={14} className="text-gray-400 font-bold" />
            <span>3. No Permanent LLM Database Training</span>
          </h3>
          <p>
            When utilizing <b>Gemini Document Analysis models</b> under our AI category, text segments and parameters are evaluated contextually. Extracted segments are never permanently cached, used for machine learning algorithm fine-tuning, or analyzed outside isolated private sandboxes.
          </p>
        </section>

        <section className="space-y-2.5">
          <h3 className="text-sm font-extrabold text-gray-950">4. Terms of Core SaaS Usage</h3>
          <p>
            By launching PDFCraft Pro services, the user agrees not to process harmful, illegal, or malicious software material, violate master copyright indexes, or perform DDoS stress-test uploads. High frequency automation without active Developer API clearances is terms violation and may trigger suspension.
          </p>
        </section>
      </div>
    </div>
  );
}
