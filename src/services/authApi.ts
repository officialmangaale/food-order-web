import { httpRequest, userServiceUrl } from './http';
import { unwrapApiResponse } from '@/utils/apiAdapters';
import type {
  CustomerUser,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@/types/auth';

const SEND_OTP_PATH = '/customers/auth/send-otp';
const VERIFY_OTP_PATH = '/customers/auth/verify-otp';

/** Send OTP to phone number */
export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const payload: SendOtpRequest = { phone };
  const raw = await httpRequest<unknown>(userServiceUrl(SEND_OTP_PATH), {
    method: 'POST',
    body: payload,
  });
  const data = unwrapApiResponse<Record<string, unknown>>(raw);

  return {
    message: (data.message as string | undefined) ?? 'OTP sent successfully',
    success: inferSuccess(data),
    status: data.status as string | undefined,
  };
}

/** Verify OTP and get JWT token */
export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  const payload: VerifyOtpRequest = { phone, otp };
  const raw = await httpRequest<unknown>(userServiceUrl(VERIFY_OTP_PATH), {
    method: 'POST',
    body: payload,
  });
  return normalizeVerifyOtpResponse(raw, phone);
}

function normalizeVerifyOtpResponse(raw: unknown, phone: string): VerifyOtpResponse {
  const data = unwrapApiResponse<Record<string, unknown>>(raw);
  const root = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const authToken =
    (data.authToken as string | undefined) ??
    (data.token as string | undefined) ??
    (root.authToken as string | undefined) ??
    (root.token as string | undefined) ??
    '';
  const rawUser =
    data.user && typeof data.user === 'object'
      ? (data.user as Record<string, unknown>)
      : root.user && typeof root.user === 'object'
        ? (root.user as Record<string, unknown>)
        : undefined;
  const user: CustomerUser = {
    id: (rawUser?.id ?? rawUser?.user_id) as number | undefined,
    user_id: rawUser?.user_id as number | undefined,
    name: rawUser?.name as string | undefined,
    phone: (rawUser?.phone as string | undefined) ?? phone,
    email: rawUser?.email as string | undefined,
  };

  return {
    authToken,
    token: authToken,
    user,
    message: (data.message as string | undefined) ?? (root.message as string | undefined),
    success: inferSuccess(data, root),
    status: (data.status as string | undefined) ?? (root.status as string | undefined),
  };
}

function inferSuccess(data: Record<string, unknown>, root?: Record<string, unknown>) {
  if (typeof data.success === 'boolean') return data.success;
  if (typeof root?.success === 'boolean') return root.success;
  const status = (data.status ?? root?.status) as string | undefined;
  return status ? status === 'success' : true;
}
