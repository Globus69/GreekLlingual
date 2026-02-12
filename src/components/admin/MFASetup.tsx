'use client';

import { useState, useEffect } from 'react';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { supabase } from '@/db/supabase';

interface MFASetupProps {
  userId: string;
  userEmail: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function MFASetup({ userId, userEmail, onComplete, onCancel }: MFASetupProps) {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'setup' | 'verify'>('setup');

  useEffect(() => {
    generateMFASecret();
  }, []);

  const generateMFASecret = async () => {
    // TOTP-Secret generieren
    const totp = new OTPAuth.TOTP({
      issuer: 'GreekLingua',
      label: userEmail,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromLatin1(generateRandomSecret())
    });

    const secretBase32 = totp.secret.base32;
    setSecret(secretBase32);

    // QR-Code erstellen
    const uri = totp.toString();
    const qrDataURL = await QRCode.toDataURL(uri);
    setQrCode(qrDataURL);

    // Recovery-Codes generieren (10 Stück)
    const codes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    setRecoveryCodes(codes);
  };

  const generateRandomSecret = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }

    // TOTP validieren
    const totp = new OTPAuth.TOTP({
      issuer: 'GreekLingua',
      label: userEmail,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    });

    const delta = totp.validate({ token: verifyCode, window: 1 });

    if (delta === null) {
      setError('Invalid code - please try again');
      return;
    }

    // Secret in DB speichern
    const { data, error: saveError } = await supabase.rpc('save_admin_mfa_secret', {
      p_user_id: userId,
      p_secret: secret,
      p_recovery_codes: recoveryCodes
    });

    if (saveError || !data?.success) {
      setError('Failed to save MFA secret');
      console.error(saveError);
      return;
    }

    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#1a1f3a]/95 to-[#2a1f3a]/95 p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-white">
          {step === 'setup' ? '🔐 Setup 2FA' : '✅ Verify Code'}
        </h2>

        {step === 'setup' && (
          <>
            <p className="text-gray-300 mb-4">
              Scan this QR code with your Authenticator app (Google Authenticator, Authy, etc.)
            </p>

            {qrCode && (
              <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">
                Manual Entry (Base32 Secret):
              </label>
              <code className="text-xs bg-black/30 p-2 rounded block break-all text-blue-300">
                {secret}
              </code>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">
                🔑 Recovery Codes (Save these!)
              </h3>
              <p className="text-sm text-gray-400 mb-2">
                Use these codes if you lose access to your authenticator app.
              </p>
              <div className="bg-black/30 p-3 rounded grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {recoveryCodes.map((code, i) => (
                  <code key={i} className="text-xs text-green-300">
                    {i + 1}. {code}
                  </code>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
            >
              Next: Verify Code
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <p className="text-gray-300 mb-4">
              Enter the 6-digit code from your authenticator app:
            </p>

            <input
              type="text"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/20 text-white text-center text-2xl tracking-widest mb-4 focus:outline-none focus:border-blue-500"
              autoFocus
            />

            {error && (
              <p className="text-red-400 text-sm mb-4 text-center">❌ {error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('setup')}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition"
              >
                Verify & Enable
              </button>
            </div>
          </>
        )}

        <button
          onClick={onCancel}
          className="w-full mt-4 text-gray-400 hover:text-white transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
