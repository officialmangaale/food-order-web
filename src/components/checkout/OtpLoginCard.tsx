'use client';

import { useState } from 'react';
import { Phone, Shield } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { sendOtp, verifyOtp } from '@/services/authApi';
import { getErrorMessage } from '@/services/http';
import { useToast } from '@/components/ui/Toast';

interface Props { onVerified: () => void; }

export function OtpLoginCard({ onVerified }: Props) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const setPhoneStore = useAuthStore((s) => s.setPhone);
  const { toast } = useToast();

  const handleSendOtp = async () => {
    if (phone.length < 10) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true); setError('');
    try {
      await sendOtp(phone);
      setPhoneStore(phone);
      setStep('otp');
      toast('OTP sent to your phone', 'success');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) { setError('Enter the OTP sent to your phone'); return; }
    setLoading(true); setError('');
    try {
      const res = await verifyOtp(phone, otp);
      setAuth(res.authToken, res.user ?? phone);
      toast('Phone verified!', 'success');
      onVerified();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cherry-50 flex items-center justify-center">
          <Shield className="w-5 h-5 text-cherry-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Verify your phone</h3>
          <p className="text-xs text-gray-500">Required to place your order</p>
        </div>
      </div>

      {step === 'phone' ? (
        <div className="space-y-3">
          <Input label="Phone number" type="tel" placeholder="9876543210" maxLength={10}
            leftIcon={<Phone className="w-4 h-4" />}
            value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            error={error} />
          <Button fullWidth onClick={handleSendOtp} loading={loading}>Send OTP</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">OTP sent to <span className="font-semibold">+91 {phone}</span></p>
          <Input label="Enter OTP" type="text" placeholder="••••••" maxLength={6}
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            error={error} />
          <Button fullWidth onClick={handleVerifyOtp} loading={loading}>Verify &amp; Continue</Button>
          <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
            className="text-sm text-cherry-600 font-medium w-full text-center">Change number</button>
        </div>
      )}
    </div>
  );
}
