// frontend/components/defend/AIProductConfigModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { updateAIProductConfig, getCompanyProfile } from '@/lib/api';
import { AIProductConfig } from '@/types';
import {
  X,
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  Server,
  Key,
  Sliders,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface AIProductConfigModalProps {
  scanId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export default function AIProductConfigModal({
  scanId,
  isOpen,
  onClose,
  onConfigSaved
}: AIProductConfigModalProps) {
  const [endpoint, setEndpoint] = useState<string>('');
  const [productType, setProductType] = useState<string>('customer_chatbot');
  const [authHeaderName, setAuthHeaderName] = useState<string>('Authorization');
  const [authScheme, setAuthScheme] = useState<string>('Bearer');
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState<boolean>(false);
  const [responseFieldPath, setResponseFieldPath] = useState<string>('response.text');
  const [consent, setConsent] = useState<boolean>(false);

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getCompanyProfile(scanId)
        .then((prof: any) => {
          if (prof) {
            setEndpoint(prof.ai_product_endpoint || '');
            setProductType(prof.ai_product_type || 'customer_chatbot');
            setAuthHeaderName(prof.auth_header_name || 'Authorization');
            setAuthScheme(prof.auth_scheme || 'Bearer');
            setResponseFieldPath(prof.response_field_path || 'response.text');
            setConsent(Boolean(prof.testing_consent));
            setIsApiKeyConfigured(Boolean(prof.api_key_configured));
          }
        })
        .catch((err) => {
          console.warn("Failed to load profile config:", err);
        });
    }
  }, [scanId, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: AIProductConfig = {
        ai_product_endpoint: endpoint.trim(),
        ai_product_type: productType,
        auth_header_name: authHeaderName.trim(),
        auth_scheme: authScheme.trim(),
        api_key_plain: apiKey ? apiKey.trim() : undefined,
        response_field_path: responseFieldPath.trim(),
        testing_consent: consent
      };

      await updateAIProductConfig(scanId, payload);
      setSaving(false);
      onConfigSaved();
      onClose();
    } catch (e: any) {
      console.error("Save config error:", e);
      setError(e.message || "Failed to save AI product configuration.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden space-y-0 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#30363D] bg-[#0D1117]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7C3AED]/20 border border-[#7C3AED]/40 rounded-xl text-[#7C3AED]">
              <Server size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#E6EDF3]">
                AI Product Endpoint Settings
              </h3>
              <p className="text-xs text-[#8B949E]">
                Configure your target AI application for Autonomous Red Teaming
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-[#E84040]/10 border border-[#E84040]/30 rounded-xl flex items-center gap-2 text-xs text-[#E84040]">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Endpoint URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#E6EDF3] block">
              AI Product Endpoint URL <span className="text-[#E84040]">*</span>
            </label>
            <input
              type="url"
              placeholder="https://api.yourcompany.com/v1/chat"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl p-3 text-xs text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-[#7C3AED] font-mono"
            />
            <p className="text-[11px] text-[#8B949E]">
              The HTTPS POST endpoint of your live chatbot, API, assistant, or document workflow.
            </p>
          </div>

          {/* Product Type Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#E6EDF3] block">
              AI Product Architecture Type
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl p-3 text-xs text-[#E6EDF3] focus:outline-none focus:border-[#7C3AED]"
            >
              <option value="customer_chatbot">Customer-Facing Chatbot</option>
              <option value="internal_assistant">Internal Enterprise Assistant</option>
              <option value="content_generation_api">Content Generation API</option>
              <option value="recommendation_system">Recommendation System</option>
              <option value="document_analysis">Document Analysis Pipeline</option>
              <option value="other">Other AI Application</option>
            </select>
          </div>

          {/* API Key (Write-Only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#E6EDF3] flex items-center gap-1.5">
                <Key size={14} className="text-[#F0A500]" /> API Authentication Key
              </label>
              {isApiKeyConfigured && (
                <span className="text-[10px] text-[#00C896] font-mono flex items-center gap-1">
                  <CheckCircle2 size={12} /> Key Encrypted at Rest
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder={isApiKeyConfigured ? '•••••••••••••••• (Leave blank to keep current key)' : 'sk_live_...'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl p-3 text-xs text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-[#7C3AED] font-mono"
            />
            <p className="text-[11px] text-[#8B949E]">
              Stored encrypted at rest with AES-256 equivalent symmetric key. Never returned in plain text.
            </p>
          </div>

          {/* Collapsible Advanced Section */}
          <div className="border border-[#30363D] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3.5 bg-[#0D1117] hover:bg-[#21262D] text-left text-xs font-bold text-[#8B949E] flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2 text-[#E6EDF3]">
                <Sliders size={14} /> Advanced Protocol & Response Field Path
              </span>
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAdvanced && (
              <div className="p-4 bg-[#161B22] border-t border-[#30363D] space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#8B949E] block mb-1 font-semibold">Auth Header Name</label>
                    <input
                      type="text"
                      value={authHeaderName}
                      onChange={(e) => setAuthHeaderName(e.target.value)}
                      placeholder="Authorization"
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-2.5 text-[#E6EDF3] font-mono focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="text-[#8B949E] block mb-1 font-semibold">Auth Scheme</label>
                    <input
                      type="text"
                      value={authScheme}
                      onChange={(e) => setAuthScheme(e.target.value)}
                      placeholder="Bearer"
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-2.5 text-[#E6EDF3] font-mono focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#8B949E] block mb-1 font-semibold">
                    Response JSON Text Field Path
                  </label>
                  <input
                    type="text"
                    value={responseFieldPath}
                    onChange={(e) => setResponseFieldPath(e.target.value)}
                    placeholder="response.text or data.reply"
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-2.5 text-[#E6EDF3] font-mono focus:outline-none focus:border-[#7C3AED]"
                  />
                  <p className="text-[10px] text-[#8B949E] mt-1">
                    Dotted path where target reply text lives in response JSON (e.g. <code>choices.0.message.content</code>).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Hard Consent Checkbox Gate */}
          <div className="bg-[#0D1117] border border-[#7C3AED]/40 rounded-xl p-4 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#7C3AED] rounded shrink-0"
              />
              <span className="text-xs text-[#E6EDF3] leading-relaxed font-semibold">
                I confirm I own this system or have explicit written authorization to security-test it.
              </span>
            </label>
            <p className="text-[11px] text-[#8B949E] pl-7">
              Required for external Red Team execution. Backend independently verifies consent before running probes.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#30363D] bg-[#0D1117] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[#21262D] hover:bg-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] text-xs font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
