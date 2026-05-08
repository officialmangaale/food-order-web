'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Phone, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { sendOtp, verifyOtp } from '@/services/authApi';
import { getErrorMessage } from '@/services/http';
import { useAuthStore } from '@/store/authStore';

interface OtpLoginModalProps {
  open: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

export function OtpLoginModal({ open, onClose, onVerified }: OtpLoginModalProps) {
  const { toast } = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setPhoneStore = useAuthStore((s) => s.setPhone);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const handleClose = useCallback(() => {
    setError('');
    setOtp('');
    setLoading(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose, open]);

  useEffect(() => {
    if (!open || resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [open, resendIn]);

  if (!open) return null;

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await sendOtp(phone);
      setPhoneStore(phone);
      setStep('otp');
      setResendIn(30);
      toast('OTP sent to your phone', 'success');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setError('Enter the OTP sent to your phone.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(phone, otp);
      if (!res.authToken) {
        throw new Error('Login succeeded, but no auth token was returned.');
      }
      setAuth(res.authToken, res.user ?? phone);
      toast('You are signed in', 'success');
      onVerified?.();
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 'phone') void handleSendOtp();
    else void handleVerifyOtp();
  };

  return (
    <div className="fixed inset-0 z-[130]" role="dialog" aria-modal="true" aria-labelledby="otp-login-title">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/35 backdrop-blur-[2px]"
        aria-label="Close login modal"
        onClick={handleClose}
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border border-[#F0DADA] bg-[#FFF7F5] shadow-2xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[min(92vw,460px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
        <div className="flex items-start justify-between border-b border-[#E8DFDF] px-5 py-4">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#A80F15]">Secure Login</p>
              <h2 id="otp-login-title" className="mt-1 text-xl font-extrabold text-[#1F1A1A]">
                Sign in with OTP
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#4B3A3A] transition hover:bg-white hover:text-[#A80F15]"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {step === 'phone' ? (
            <>
              <Input
                label="Phone number"
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                leftIcon={<Phone className="h-4 w-4" />}
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
              />
              <Button type="submit" fullWidth loading={loading}>
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#6B5B5B]">
                OTP sent to <span className="font-extrabold text-[#1F1A1A]">+91 {phone}</span>
              </p>
              <Input
                label="Enter OTP"
                type="text"
                placeholder="0000"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
              />
              <Button type="submit" fullWidth loading={loading}>
                Verify OTP
              </Button>
              <div className="flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                  }}
                  className="font-bold text-[#A80F15]"
                >
                  Change number
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendIn > 0 || loading}
                  className="font-bold text-[#A80F15] disabled:text-[#B9A2A2]"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </form>
      </div>
    </div>
  );
}
