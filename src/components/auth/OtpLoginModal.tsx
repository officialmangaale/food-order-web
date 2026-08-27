'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
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
    if (!open || resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [open, resendIn]);

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
    <Sheet
      open={open}
      onClose={handleClose}
      title="Sign in"
      description={
        step === 'phone'
          ? 'We will text you a one-time code to confirm your number.'
          : `Enter the code sent to +91 ${phone}.`
      }
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 'phone' ? (
          <>
            <Input
              data-dialog-initial-focus
              label="Phone number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="9876543210"
              maxLength={10}
              leftIcon={<Phone className="h-4 w-4" />}
              value={phone}
              error={error || undefined}
              onChange={(event) => {
                setPhone(event.target.value.replace(/\D/g, ''));
                setError('');
              }}
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Send code
            </Button>
          </>
        ) : (
          <>
            <Input
              data-dialog-initial-focus
              label="One-time code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="0000"
              maxLength={6}
              value={otp}
              error={error || undefined}
              className="text-center text-xl tracking-[0.4em]"
              onChange={(event) => {
                setOtp(event.target.value.replace(/\D/g, ''));
                setError('');
              }}
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Verify and continue
            </Button>
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                }}
              >
                Change number
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSendOtp}
                disabled={resendIn > 0 || loading}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Sheet>
  );
}
