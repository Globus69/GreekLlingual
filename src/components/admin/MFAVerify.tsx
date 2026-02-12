'use client';

import { useState } from 'react';
import * as OTPAuth from 'otpauth';
import { supabase } from '@/lib/supabase';

interface MFAVerifyProps {
  userId: string;
  userEmail: string;
  secret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MFAVerify({ userId, userEmail, secret, onSuccess, onCancel }: MFAVerifyProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (useRecoveryCode) {
        // Recovery Code validieren
        const { data, error: rpcError } = await supabase.rpc('use_admin_recovery_code', {
          p_user_id: userId,
          p_code: code.toUpperCase()
        });

        if (rpcError || !data?.success) {
          setError(data?.error || 'Invalid recovery code');
          setIsSubmitting(false);
          return;
        }

        // Success
        onSuccess();
      } else {
        // TOTP validieren
        const totp = new OTPAuth.TOTP({
          issuer: 'GreekLingua',
          label: userEmail,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(secret)
        });

        const delta = totp.validate({ token: code, window: 1 });

        if (delta === null) {
          setError('Invalid code - please try again');
          setIsSubmitting(false);
          return;
        }

        // Success
        onSuccess();
      }
    } catch (err) {
      setError('Verification failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#1a1f3a]/95 to-[#2a1f3a]/95 p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-white">
          🔐 Two-Factor Authentication
        </h2>

        <p className="text-gray-300 mb-4">
          {useRecoveryCode
            ? 'Enter one of your recovery codes:'
            : 'Enter the 6-digit code from your authenticator app:'}
        </p>

        <input
          type="text"
          maxLength={useRecoveryCode ? 8 : 6}
          value={code}
          onChange={(e) => setCode(useRecoveryCode ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ''))}
          placeholder={useRecoveryCode ? 'ABC123XY' : '000000'}
          className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/20 text-white text-center text-2xl tracking-widest mb-4 focus:outline-none focus:border-blue-500 uppercase"
          autoFocus
          disabled={isSubmitting}
        />

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">❌ {error}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          {isSubmitting ? 'Verifying...' : 'Verify'}
        </button>

        <button
          onClick={() => setUseRecoveryCode(!useRecoveryCode)}
          className="w-full text-gray-400 hover:text-white transition mb-2 text-sm"
        >
          {useRecoveryCode ? '← Use Authenticator Code' : 'Use Recovery Code →'}
        </button>

        <button
          onClick={onCancel}
          className="w-full text-gray-400 hover:text-white transition text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
