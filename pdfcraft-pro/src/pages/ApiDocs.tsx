import { Code, Terminal, Laptop, HelpCircle } from 'lucide-react';

export default function ApiDocs() {
  const APIS = [
    {
      method: 'POST',
      path: '/api/files/upload',
      description: 'Upload multipart raw file streams (binary). Max limit fits plan boundaries.',
      curl: `curl -X POST https://pdfcraftpro.com/api/files/upload \\
  -H "x-user-id: YOUR_USER_ID" \\
  -F "files=@/path/to/document.pdf"`
    },
    {
      method: 'POST',
      path: '/api/pdf/merge',
      description: 'Assemble multiple previously staged file IDs into a single consolidated output stream.',
      curl: `curl -X POST https://pdfcraftpro.com/api/pdf/merge \\
  -H "Content-Type: application/json" \\
  -H "x-user-id: YOUR_USER_ID" \\
  -d '{
    "fileIds": ["f-1a2b3c", "f-4d5e6f"]
  }'`
    },
    {
      method: 'POST',
      path: '/api/pdf/watermark',
      description: 'Overlay custom watermark text or credentials onto custom pages indexes.',
      curl: `curl -X POST https://pdfcraftpro.com/api/pdf/watermark \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileId": "f-1a2b3c",
    "text": "CONFIDENTIAL",
    "opacity": 0.45,
    "position": "center",
    "color": "red"
  }'`
    }
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-left select-text">
      <div className="mb-10">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">Developer API Integrations</span>
        <h1 className="font-sans text-3xl font-black text-gray-950 mt-1 leading-none">
          PDFCraft Engine SDK
        </h1>
        <p className="mt-3 text-xs text-gray-500 leading-relaxed max-w-xl">
          Programmatically trigger high-fidelity mergers, security locks, compression configurations, and Gemini AI analysis models through REST API.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-start space-x-3 shadow-sm">
          <Terminal size={16} className="text-gray-400 mt-1" />
          <div>
            <h4 className="font-sans text-xs font-bold text-gray-800">CURL Friendly</h4>
            <p className="font-sans text-[11px] text-gray-500 leading-normal mt-0.5">Compatible with any standard node, python, or shell structure.</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-start space-x-3 shadow-sm">
          <Code size={16} className="text-blue-600 mt-1" />
          <div>
            <h4 className="font-sans text-xs font-bold text-gray-800">TLS Protection</h4>
            <p className="font-sans text-[11px] text-gray-500 leading-normal mt-0.5">Every request is isolated under strict military encryption rules.</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-start space-x-3 shadow-sm">
          <Laptop size={16} className="text-red-600 mt-1" />
          <div>
            <h4 className="font-sans text-xs font-bold text-gray-800">99.9% Queue Uptime</h4>
            <p className="font-sans text-[11px] text-gray-500 leading-normal mt-0.5">High power dedicated node threads isolate resource computation.</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">REST Specification Table</h3>
        
        {APIS.map((api, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-wrap items-center space-x-3 mb-3">
              <span className={`px-2 py-0.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider ${
                api.method === 'POST' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-green-50 text-green-700'
              }`}>
                {api.method}
              </span>
              <span className="font-mono text-xs font-extrabold text-gray-900">{api.path}</span>
            </div>
            
            <p className="font-sans text-xs text-gray-500 leading-relaxed mb-4">
              {api.description}
            </p>

            <div className="relative">
              <pre className="overflow-x-auto bg-gray-900 text-gray-100 p-4 rounded-xl font-mono text-[10.5px] leading-relaxed shadow-inner">
                <code>{api.curl}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
