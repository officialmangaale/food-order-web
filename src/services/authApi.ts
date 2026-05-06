import { httpRequest, userServiceUrl } from './http';
import { unwrapApiResponse } from '@/utils/apiAdapters';
import type { SendOtpRequest, SendOtpResponse, VerifyOtpRequest, VerifyOtpResponse } from '@/types/auth';

/**
 * TODO: Update these paths when user-service OTP endpoints are confirmed.
 * Only change these two constants — the rest of the app uses them via the functions below.
 */
const SEND_OTP_PATH = '/api/auth/send-otp';
const VERIFY_OTP_PATH = '/api/auth/verify-otp';

/** Send OTP to phone number */
export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const payload: SendOtpRequest = { phone };
  const raw = await httpRequest<unknown>(userServiceUrl(SEND_OTP_PATH), {
    method: 'POST',
    body: payload,
  });
  return unwrapApiResponse<SendOtpResponse>(raw);
}

/** Verify OTP and get JWT token */
export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  const payload: VerifyOtpRequest = { phone, otp };
  const raw = await httpRequest<unknown>(userServiceUrl(VERIFY_OTP_PATH), {
    method: 'POST',
    body: payload,
  });
  return unwrapApiResponse<VerifyOtpResponse>(raw);
}
